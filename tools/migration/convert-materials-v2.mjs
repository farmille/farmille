#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(
  SCRIPT_DIR,
  "legacy/migrations-v1/20260526000003_seed_products_from_ryosei_export.sql",
);
const DEFAULT_TAG_SEED = path.join(
  SCRIPT_DIR,
  "../../supabase/migrations/20260726121253_seed_masters.sql",
);
const DEFAULT_JSON_OUTPUT = path.join(SCRIPT_DIR, "materials-v2-normalized.json");
const DEFAULT_SQL_OUTPUT = path.join(SCRIPT_DIR, "materials-v2-seed.sql");
const DEFAULT_REPORT_OUTPUT = path.join(SCRIPT_DIR, "materials-v2-report.json");

const SOURCE_TABLE_FILES = [
  "products",
  "maker_profiles",
  "product_types",
  "product_images",
  "product_application_recipes",
  "product_crops",
  "crops",
  "product_benefit_relations",
  "product_benefits",
];

export const FIELD_MAPPINGS = [
  {
    target: "materials.name",
    source: "products.name",
    status: "mapped",
  },
  {
    target: "materials.manufacturer_name",
    source: "maker_profiles.company_name",
    status: "mapped",
  },
  {
    target: "material_product_types.product_type_id",
    source: "products.product_type_id → product_types.name",
    status: "mapped",
  },
  {
    target: "material_crops.crop_id",
    source: "product_crops → crops.name",
    status: "mapped_by_exact_name",
  },
  {
    target: "materials.sales_status",
    source: "products.commercial_status",
    status: "mapped",
  },
  {
    target: "materials.description",
    source: "products.expected_effects_official",
    status: "mapped",
  },
  {
    target: "materials.general_use",
    source: "products.general_purpose",
    status: "mapped",
  },
  {
    target: "materials.main_components",
    source: "products.primary_compound",
    status: "mapped",
  },
  {
    target: "materials.mechanism",
    source: "products.mode_of_action",
    status: "mapped",
  },
  {
    target: "materials.usage_text",
    source: "products.usage_summary ＋ product_application_recipes",
    status: "mapped",
  },
  {
    target: "materials.price_range",
    source: null,
    status: "null",
  },
  {
    target: "materials.official_url",
    source: null,
    status: "null",
  },
  {
    target: "materials.catalog_url",
    source: null,
    status: "null",
  },
  {
    target: "materials.seller_id",
    source: null,
    status: "null",
  },
  {
    target: "material_images.url",
    source: "product_images.url",
    status: "mapped",
  },
  {
    target: "material_images.image_type",
    source: "product_images.image_type",
    status: "mapped_with_enum_conversion",
  },
  {
    target: "material_images.sort_order",
    source: "product_images.order",
    status: "mapped",
  },
];

export const NEEDS_REVIEW_FIELDS = [
  {
    source: "product_sources",
    possible_target: "material_sources",
    handling: "リモート取得後に追補",
    reason: "リポジトリ内に元データがない",
  },
  {
    source: "products.label_url",
    possible_target: "materials.catalog_url",
    handling: "NULL",
    reason: "旧 label がカタログを指すとは一意に決まらない",
  },
  {
    source: "products.sds_url",
    possible_target: "material_evidences または material_sources",
    handling: "未投入",
    reason: "本タスクでは material_sources と material_evidences を投入しない",
  },
  {
    source:
      "products.technology_action／disease_pest_info／expected_effects_farmille／precautions／storage_shelf_life／notes",
    possible_target: null,
    handling: "未投入",
    reason: "v2 に一意な対応先カラムがない",
  },
  {
    source: "product_images.source_page_url",
    possible_target: "materials.official_url",
    handling: "NULL",
    reason: "画像の出典ページが資材の公式ページとは一意に決まらない",
  },
];

const IMAGE_TYPE_MAP = new Map([
  ["product_packaging", "package"],
  ["product_logo", "logo"],
  ["application_scene", "usage_scene"],
  ["other", "other"],
  ["package", "package"],
  ["logo", "logo"],
  ["usage_scene", "usage_scene"],
]);

function materialKey(name, manufacturerName) {
  assert.ok(name, "資材名が必要です");
  assert.ok(manufacturerName, `メーカー名が必要です：${name}`);
  return JSON.stringify([name, manufacturerName]);
}

function unquoteIdentifier(identifier) {
  return identifier.trim().replace(/^"|"$/g, "").replaceAll('""', '"');
}

export function parseSqlLiteral(token) {
  const value = token.trim();
  if (/^null$/i.test(value)) {
    return null;
  }
  if (/^true$/i.test(value)) {
    return true;
  }
  if (/^false$/i.test(value)) {
    return false;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }
  const stringMatch = value.match(/^E?'((?:''|[^'])*)'$/s);
  if (stringMatch) {
    return stringMatch[1].replaceAll("''", "'");
  }
  throw new Error(`SQLリテラルとして解釈できません：${value.slice(0, 120)}`);
}

export function splitTopLevel(input, delimiter = ",") {
  const parts = [];
  let start = 0;
  let depth = 0;
  let inString = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (inString) {
      if (character === "'" && input[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === delimiter && depth === 0) {
      parts.push(input.slice(start, index).trim());
      start = index + 1;
    }
  }

  assert.equal(inString, false, "SQL文字列が閉じられていません");
  assert.equal(depth, 0, "SQLの括弧が閉じられていません");
  parts.push(input.slice(start).trim());
  return parts;
}

export function splitSqlStatements(sql) {
  const statements = [];
  let start = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < sql.length; index += 1) {
    const character = sql[index];
    const nextCharacter = sql[index + 1];

    if (inString) {
      if (character === "'" && nextCharacter === "'") {
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (inLineComment) {
      if (character === "\n") {
        inLineComment = false;
      }
      continue;
    }
    if (inBlockComment) {
      if (character === "*" && nextCharacter === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (character === "'") {
      inString = true;
    } else if (character === "-" && nextCharacter === "-") {
      inLineComment = true;
      index += 1;
    } else if (character === "/" && nextCharacter === "*") {
      inBlockComment = true;
      index += 1;
    } else if (character === ";") {
      const statement = sql.slice(start, index + 1).trim();
      if (statement) {
        statements.push(statement);
      }
      start = index + 1;
    }
  }

  const remainder = sql.slice(start).trim();
  if (remainder) {
    statements.push(remainder);
  }
  return statements;
}

function findTopLevelKeyword(input, keyword) {
  const normalizedKeyword = keyword.toUpperCase();
  let depth = 0;
  let inString = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (inString) {
      if (character === "'" && input[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
      continue;
    }
    if (character === "(") {
      depth += 1;
      continue;
    }
    if (character === ")") {
      depth -= 1;
      continue;
    }
    if (depth !== 0) {
      continue;
    }

    const candidate = input.slice(index, index + normalizedKeyword.length).toUpperCase();
    const before = input[index - 1];
    const after = input[index + normalizedKeyword.length];
    const beforeBoundary = before === undefined || !/[A-Za-z0-9_]/.test(before);
    const afterBoundary = after === undefined || !/[A-Za-z0-9_]/.test(after);
    if (candidate === normalizedKeyword && beforeBoundary && afterBoundary) {
      return index;
    }
  }
  return -1;
}

function parseInsertSelect(statement, tableName, endKeyword) {
  const insertPattern = new RegExp(
    `INSERT\\s+INTO\\s+(?:public\\.)?${tableName}\\s*\\(([\\s\\S]*?)\\)\\s*SELECT\\s+`,
    "i",
  );
  const match = statement.match(insertPattern);
  if (!match) {
    return null;
  }

  const columns = splitTopLevel(match[1]).map(unquoteIdentifier);
  const selectStart = match.index + match[0].length;
  const remaining = statement.slice(selectStart);
  const selectEnd = findTopLevelKeyword(remaining, endKeyword);
  if (selectEnd < 0) {
    throw new Error(`${tableName} INSERTの${endKeyword}句を見つけられませんでした`);
  }
  const expressions = splitTopLevel(remaining.slice(0, selectEnd));
  assert.equal(expressions.length, columns.length, `${tableName}のカラム数と値の数が一致しません`);
  return { columns, expressions };
}

function parseStringMatch(input, pattern, label) {
  const match = input.match(pattern);
  if (!match) {
    throw new Error(`${label}をSQLから抽出できませんでした`);
  }
  return parseSqlLiteral(match[1]);
}

function extractProductReference(statement) {
  return {
    name: parseStringMatch(statement, /p\.name\s*=\s*('(?:''|[^'])*')/i, "資材名"),
    manufacturer_name: parseStringMatch(
      statement,
      /mp\.company_name\s*=\s*('(?:''|[^'])*')/i,
      "メーカー名",
    ),
  };
}

function extractPreferredProductType(expression) {
  const matches = [...expression.matchAll(/product_types\s+WHERE\s+name\s*=\s*('(?:''|[^'])*')/gi)];
  if (matches.length === 0) {
    return null;
  }
  // COALESCEの先頭は元Excelが指定した分類、後続は旧DB用のフォールバック。
  return parseSqlLiteral(matches[0][1]);
}

function createEmptyRawDataset(source) {
  return {
    source,
    sourceProducts: [],
    images: [],
    recipes: [],
    cropRelations: new Map(),
    benefitRelations: new Map(),
  };
}

function clearRelation(map, reference) {
  map.set(materialKey(reference.name, reference.manufacturer_name), new Set());
}

function addRelation(map, reference, value) {
  const key = materialKey(reference.name, reference.manufacturer_name);
  const values = map.get(key) ?? new Set();
  values.add(value);
  map.set(key, values);
}

export function parseLegacySeedSql(sql, source = "legacy seed SQL") {
  const dataset = createEmptyRawDataset(source);

  for (const statement of splitSqlStatements(sql)) {
    const productInsert = parseInsertSelect(statement, "products", "FROM");
    if (productInsert) {
      const legacy = {};
      for (let index = 0; index < productInsert.columns.length; index += 1) {
        const column = productInsert.columns[index];
        const expression = productInsert.expressions[index];
        if (column === "maker_id" || column === "product_type_id") {
          continue;
        }
        legacy[column] = parseSqlLiteral(expression);
      }
      const manufacturerName = parseStringMatch(
        statement,
        /mp\.company_name\s*=\s*('(?:''|[^'])*')/i,
        "メーカー名",
      );
      dataset.sourceProducts.push({
        source_index: dataset.sourceProducts.length,
        source_row:
          Number(statement.match(/--\s*products row\s+(\d+)\s*:/i)?.[1]) ||
          dataset.sourceProducts.length + 1,
        manufacturer_name: manufacturerName,
        product_type: extractPreferredProductType(
          productInsert.expressions[productInsert.columns.indexOf("product_type_id")],
        ),
        legacy,
      });
      continue;
    }

    if (/DELETE\s+FROM\s+product_crops\b/i.test(statement)) {
      clearRelation(dataset.cropRelations, extractProductReference(statement));
      continue;
    }
    if (/DELETE\s+FROM\s+product_benefit_relations\b/i.test(statement)) {
      clearRelation(dataset.benefitRelations, extractProductReference(statement));
      continue;
    }
    if (/DELETE\s+FROM\s+product_application_recipes\b/i.test(statement)) {
      const reference = extractProductReference(statement);
      const key = materialKey(reference.name, reference.manufacturer_name);
      dataset.recipes = dataset.recipes.filter(
        (recipe) => materialKey(recipe.name, recipe.manufacturer_name) !== key,
      );
      continue;
    }
    if (/DELETE\s+FROM\s+product_images\b/i.test(statement)) {
      const reference = extractProductReference(statement);
      const key = materialKey(reference.name, reference.manufacturer_name);
      dataset.images = dataset.images.filter(
        (image) => materialKey(image.name, image.manufacturer_name) !== key,
      );
      continue;
    }

    if (/INSERT\s+INTO\s+product_crops\b/i.test(statement)) {
      const reference = extractProductReference(statement);
      const cropName = parseStringMatch(statement, /c\.name\s*=\s*('(?:''|[^'])*')/i, "作物名");
      addRelation(dataset.cropRelations, reference, cropName);
      continue;
    }
    if (/INSERT\s+INTO\s+product_benefit_relations\b/i.test(statement)) {
      const reference = extractProductReference(statement);
      const benefitName = parseStringMatch(statement, /b\.name\s*=\s*('(?:''|[^'])*')/i, "効果名");
      addRelation(dataset.benefitRelations, reference, benefitName);
      continue;
    }

    const recipeInsert = parseInsertSelect(statement, "product_application_recipes", "WHERE");
    if (recipeInsert) {
      const reference = extractProductReference(statement);
      const recipe = { ...reference };
      for (let index = 0; index < recipeInsert.columns.length; index += 1) {
        const column = recipeInsert.columns[index];
        if (column !== "product_id") {
          recipe[column] = parseSqlLiteral(recipeInsert.expressions[index]);
        }
      }
      dataset.recipes.push(recipe);
      continue;
    }

    const imageInsert = parseInsertSelect(statement, "product_images", "WHERE");
    if (imageInsert) {
      const reference = extractProductReference(statement);
      const image = { ...reference };
      for (let index = 0; index < imageInsert.columns.length; index += 1) {
        const column = imageInsert.columns[index];
        if (column !== "product_id") {
          image[column] = parseSqlLiteral(imageInsert.expressions[index]);
        }
      }
      dataset.images.push(image);
    }
  }

  assert.ok(dataset.sourceProducts.length > 0, "productsを1件も抽出できませんでした");
  return dataset;
}

export function parseCsv(csv) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (inQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      inQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (character !== "\r") {
      field += character;
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  assert.equal(inQuotes, false, "CSVの引用符が閉じられていません");
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  headers[0] = headers[0].replace(/^\uFEFF/, "");
  return rows
    .slice(1)
    .filter((values) => values.some((value) => value !== ""))
    .map((values, rowIndex) => {
      assert.equal(
        values.length,
        headers.length,
        `CSV ${rowIndex + 2}行目のカラム数が一致しません`,
      );
      return Object.fromEntries(
        headers.map((header, index) => [
          header,
          values[index] === "" || values[index] === "\\N" ? null : values[index],
        ]),
      );
    });
}

function rowsById(rows) {
  return new Map(rows.filter((row) => row.id).map((row) => [row.id, row]));
}

function resolveReference(row, productsById) {
  if (row.name && (row.manufacturer_name || row.company_name)) {
    return {
      name: row.name,
      manufacturer_name: row.manufacturer_name ?? row.company_name,
    };
  }
  const product = productsById.get(row.product_id);
  if (!product) {
    throw new Error(`product_idを解決できません：${row.product_id}`);
  }
  return {
    name: product.legacy.name,
    manufacturer_name: product.manufacturer_name,
  };
}

export function parseTableDump(dump, source = "JSON／CSV dump") {
  const makerProfiles = rowsById(
    (dump.maker_profiles ?? []).map((row) => ({
      ...row,
      id: row.id ?? row.user_id,
    })),
  );
  const productTypes = rowsById(dump.product_types ?? []);
  const products = dump.products ?? [];
  assert.ok(products.length > 0, "dumpのproductsが空です");

  const dataset = createEmptyRawDataset(source);
  for (const [sourceIndex, row] of products.entries()) {
    const maker = makerProfiles.get(row.maker_id);
    const manufacturerName = row.manufacturer_name ?? row.company_name ?? maker?.company_name;
    if (!manufacturerName) {
      throw new Error(`productsのメーカー名を解決できません：${row.name}`);
    }
    const productType =
      row.product_type ??
      row.product_type_name ??
      productTypes.get(row.product_type_id)?.name ??
      null;
    dataset.sourceProducts.push({
      source_index: sourceIndex,
      source_row: sourceIndex + 1,
      source_id: row.id ?? null,
      manufacturer_name: manufacturerName,
      product_type: productType,
      legacy: { ...row },
    });
  }

  const productsById = new Map(
    dataset.sourceProducts
      .filter((product) => product.source_id)
      .map((product) => [product.source_id, product]),
  );

  for (const row of dump.product_images ?? dump.material_images ?? []) {
    dataset.images.push({
      ...resolveReference(row, productsById),
      ...row,
    });
  }
  for (const row of dump.product_application_recipes ?? []) {
    dataset.recipes.push({
      ...resolveReference(row, productsById),
      ...row,
    });
  }

  const crops = rowsById(dump.crops ?? []);
  for (const row of dump.product_crops ?? []) {
    const reference = resolveReference(row, productsById);
    const cropName = row.crop_name ?? crops.get(row.crop_id)?.name;
    if (!cropName) {
      throw new Error(`product_cropsの作物名を解決できません：${row.crop_id}`);
    }
    addRelation(dataset.cropRelations, reference, cropName);
  }

  const benefits = rowsById(dump.product_benefits ?? []);
  for (const row of dump.product_benefit_relations ?? []) {
    const reference = resolveReference(row, productsById);
    const benefitName =
      row.benefit_name ??
      benefits.get(row.product_benefit_id)?.name ??
      benefits.get(row.benefit_id)?.name;
    if (!benefitName) {
      throw new Error(
        `product_benefit_relationsの効果名を解決できません：${row.product_benefit_id ?? row.benefit_id}`,
      );
    }
    addRelation(dataset.benefitRelations, reference, benefitName);
  }
  return dataset;
}

function readCsvDump(inputPath) {
  if (fs.statSync(inputPath).isDirectory()) {
    const dump = {};
    for (const tableName of SOURCE_TABLE_FILES) {
      const filePath = path.join(inputPath, `${tableName}.csv`);
      if (fs.existsSync(filePath)) {
        dump[tableName] = parseCsv(fs.readFileSync(filePath, "utf8"));
      }
    }
    return dump;
  }
  return {
    products: parseCsv(fs.readFileSync(inputPath, "utf8")),
  };
}

export function readSource(inputPath) {
  const stats = fs.statSync(inputPath);
  const extension = stats.isDirectory() ? ".csv-directory" : path.extname(inputPath).toLowerCase();
  if (extension === ".sql") {
    return parseLegacySeedSql(fs.readFileSync(inputPath, "utf8"), inputPath);
  }
  if (extension === ".json") {
    return parseTableDump(JSON.parse(fs.readFileSync(inputPath, "utf8")), inputPath);
  }
  if (extension === ".csv" || extension === ".csv-directory") {
    return parseTableDump(readCsvDump(inputPath), inputPath);
  }
  throw new Error(`未対応の入力形式です：${inputPath}`);
}

function extractValueTuples(valuesText) {
  const tuples = [];
  let depth = 0;
  let start = -1;
  let inString = false;

  for (let index = 0; index < valuesText.length; index += 1) {
    const character = valuesText[index];
    if (inString) {
      if (character === "'" && valuesText[index + 1] === "'") {
        index += 1;
      } else if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === "'") {
      inString = true;
    } else if (character === "(") {
      if (depth === 0) {
        start = index + 1;
      }
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(splitTopLevel(valuesText.slice(start, index)));
      }
    }
  }
  assert.equal(depth, 0, "VALUES句の括弧が閉じられていません");
  return tuples;
}

export function parseTagSeed(sql) {
  const tags = [];
  for (const statement of splitSqlStatements(sql)) {
    const match = statement.match(
      /INSERT\s+INTO\s+(?:public\.)?tags\s*\(([\s\S]*?)\)\s*VALUES\s+([\s\S]*);?$/i,
    );
    if (!match) {
      continue;
    }
    const columns = splitTopLevel(match[1]).map(unquoteIdentifier);
    for (const tuple of extractValueTuples(match[2])) {
      assert.equal(tuple.length, columns.length, "tagsのカラム数が一致しません");
      const row = Object.fromEntries(
        columns.map((column, index) => [column, parseSqlLiteral(tuple[index])]),
      );
      tags.push(row);
    }
  }
  assert.ok(tags.length > 0, "T-11のタグを抽出できませんでした");
  return tags;
}

function nonEmpty(value) {
  return value === null || value === undefined || value === "" ? null : value;
}

function formatDose(recipe) {
  if (nonEmpty(recipe.dose_raw_text)) {
    return recipe.dose_raw_text;
  }
  if (recipe.dose_amount !== null && recipe.dose_amount !== undefined) {
    return [recipe.dose_amount, recipe.dose_unit, recipe.dose_basis].filter(nonEmpty).join(" ");
  }
  return null;
}

function formatRecipeUsage(recipe) {
  const useParts = [
    ["栽培", recipe.cultivation_type],
    ["方法", recipe.application_method],
    ["時期", recipe.application_timing],
    ["生育段階", recipe.growth_stage],
    ["希釈", recipe.dilution_rate],
    ["施用量", formatDose(recipe)],
    ["散布液量", recipe.solution_amount],
    ["原液換算", recipe.original_liquid_equivalent],
    ["上限", recipe.max_dose_raw_text],
    ["補足", recipe.usage_notes],
    ["注意", recipe.precautions_specific],
  ]
    .filter(([, value]) => nonEmpty(value))
    .map(([label, value]) => `${label}：${value}`);
  return useParts.join("、");
}

function formatUsageText(product, recipes) {
  const sections = [];
  if (nonEmpty(product.legacy.usage_summary)) {
    sections.push(`概要：${product.legacy.usage_summary}`);
  }
  const bullets = [...recipes]
    .sort((left, right) => Number(left.sort_order) - Number(right.sort_order))
    .map((recipe) => {
      const crop = nonEmpty(recipe.crop_name) ?? nonEmpty(recipe.crop_category) ?? "不明";
      const purpose = nonEmpty(product.legacy.general_purpose) ?? "不明";
      const usage = formatRecipeUsage(recipe) || "不明";
      return `・作物：${crop}／目的：${purpose}／使い方：${usage}`;
    });
  if (bullets.length > 0) {
    sections.push(bullets.join("\n"));
  }
  return sections.length > 0 ? sections.join("\n") : null;
}

function mapImageType(imageType, missingImageTypes) {
  if (imageType === null || imageType === undefined || imageType === "") {
    return null;
  }
  const mapped = IMAGE_TYPE_MAP.get(imageType);
  if (!mapped) {
    missingImageTypes.add(imageType);
    return null;
  }
  return mapped;
}

function parseSortOrder(value, materialName) {
  const sortOrder = Number(value ?? 0);
  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    throw new Error(`画像のsort_orderが不正です：${materialName}／${value}`);
  }
  return sortOrder;
}

function toSortedArray(set) {
  return [...(set ?? [])].sort((left, right) => left.localeCompare(right, "ja"));
}

export function normalizeDataset(rawDataset, seededTags) {
  const productByKey = new Map();
  const duplicateIndexes = new Map();

  for (const product of rawDataset.sourceProducts) {
    const name = product.legacy.name;
    const key = materialKey(name, product.manufacturer_name);
    const previous = productByKey.get(key);
    if (previous) {
      const sourceRows = duplicateIndexes.get(key) ?? [previous.source_row];
      sourceRows.push(product.source_row);
      duplicateIndexes.set(key, sourceRows);
    }
    // 旧SQLのON CONFLICT DO UPDATEと同じく、同一キーは後の行を正とする。
    productByKey.set(key, product);
  }

  const tagsByName = new Map();
  for (const tag of seededTags) {
    const values = tagsByName.get(tag.name) ?? [];
    values.push(tag);
    tagsByName.set(tag.name, values);
  }

  const knownCropNames = new Set(
    seededTags.filter((tag) => tag.category === "crop").map((tag) => tag.name),
  );
  const missingClassificationMap = new Map();
  const missingImageTypes = new Set();
  const materials = [];

  function recordMissingClassification(sourceKind, sourceValue, product) {
    const key = `${sourceKind}\u0000${sourceValue}`;
    const entry = missingClassificationMap.get(key) ?? {
      source_kind: sourceKind,
      source_value: sourceValue,
      affected_materials: new Set(),
    };
    entry.affected_materials.add(`${product.legacy.name}／${product.manufacturer_name}`);
    missingClassificationMap.set(key, entry);
  }

  for (const [key, product] of productByKey) {
    const recipes = rawDataset.recipes.filter(
      (recipe) => materialKey(recipe.name, recipe.manufacturer_name) === key,
    );
    const images = rawDataset.images
      .filter((image) => materialKey(image.name, image.manufacturer_name) === key)
      .map((image) => ({
        url: image.url,
        image_type: mapImageType(image.image_type, missingImageTypes),
        sort_order: parseSortOrder(image.order ?? image.sort_order, product.legacy.name),
        legacy: { ...image },
      }))
      .sort((left, right) => left.sort_order - right.sort_order);

    const productTypes = nonEmpty(product.product_type)
      ? [{ name: product.product_type, source_value: product.product_type }]
      : [];
    const targetCrops = [...new Set(rawDataset.cropRelations.get(key) ?? [])].flatMap(
      (cropName, index) => {
        if (knownCropNames.has(cropName)) {
          return [{
          name: cropName,
          source_name: cropName,
          sort_order: index,
          }];
        }
        recordMissingClassification("crop", cropName, product);
        return [];
      },
    );
    const effects = new Map();
    const searchTags = new Map();
    for (const benefitName of rawDataset.benefitRelations.get(key) ?? []) {
      const matchingBenefitTags = (tagsByName.get(benefitName) ?? []).filter(
        (tag) =>
          tag.category === "concern" ||
          tag.category === "condition" ||
          tag.category === "effect",
      );
      if (matchingBenefitTags.length === 0) {
        recordMissingClassification("benefit", benefitName, product);
      } else {
        for (const tag of matchingBenefitTags) {
          const relation = { name: tag.name, source_value: benefitName };
          if (tag.category === "effect") {
            effects.set(tag.name, relation);
          } else {
            searchTags.set(`${tag.category}\u0000${tag.name}`, {
              ...relation,
              category: tag.category,
            });
          }
        }
      }
    }

    materials.push({
      source_rows: duplicateIndexes.get(key) ?? [product.source_row],
      name: product.legacy.name,
      manufacturer_name: product.manufacturer_name,
      sales_status: product.legacy.commercial_status ?? null,
      description: product.legacy.expected_effects_official ?? null,
      general_use: product.legacy.general_purpose ?? null,
      main_components: product.legacy.primary_compound ?? null,
      mechanism: product.legacy.mode_of_action ?? null,
      usage_text: formatUsageText(product, recipes),
      price_range: null,
      official_url: null,
      catalog_url: null,
      seller_id: null,
      product_types: productTypes,
      target_crops: targetCrops,
      effects: [...effects.values()].sort((left, right) => left.name.localeCompare(right.name, "ja")),
      search_tags: [...searchTags.values()].sort((left, right) =>
        `${left.category}\u0000${left.name}`.localeCompare(`${right.category}\u0000${right.name}`, "ja"),
      ),
      images,
      recipes: [...recipes].sort(
        (left, right) => Number(left.sort_order) - Number(right.sort_order),
      ),
      legacy: { ...product.legacy },
    });
  }

  materials.sort((left, right) =>
    `${left.manufacturer_name}\u0000${left.name}`.localeCompare(
      `${right.manufacturer_name}\u0000${right.name}`,
      "ja",
    ),
  );

  const duplicateProducts = [...duplicateIndexes].map(([key, sourceRows]) => {
    const [name, manufacturerName] = JSON.parse(key);
    return {
      name,
      manufacturer_name: manufacturerName,
      source_rows: sourceRows,
      handling: "旧SQLとv2の一意キーに従い、後の行で統合",
    };
  });
  const missingClassificationMappings = [...missingClassificationMap.values()]
    .map((entry) => ({
      source_kind: entry.source_kind,
      source_value: entry.source_value,
      affected_materials: toSortedArray(entry.affected_materials),
    }))
    .sort((left, right) =>
      `${left.source_kind}\u0000${left.source_value}`.localeCompare(
        `${right.source_kind}\u0000${right.source_value}`,
        "ja",
      ),
    );

  const normalized = {
    format_version: 2,
    source: rawDataset.source,
    counts: {
      source_product_rows: rawDataset.sourceProducts.length,
      duplicate_product_rows: rawDataset.sourceProducts.length - productByKey.size,
      unique_materials: materials.length,
      product_images: rawDataset.images.length,
      application_recipes: rawDataset.recipes.length,
      material_product_type_links: materials.reduce(
        (total, material) => total + material.product_types.length,
        0,
      ),
      material_crop_links: materials.reduce(
        (total, material) => total + material.target_crops.length,
        0,
      ),
      material_effect_links: materials.reduce(
        (total, material) => total + material.effects.length,
        0,
      ),
      material_search_tag_links: materials.reduce(
        (total, material) => total + material.search_tags.length,
        0,
      ),
    },
    duplicate_products: duplicateProducts,
    missing_classification_mappings: missingClassificationMappings,
    unmapped_image_types: toSortedArray(missingImageTypes),
    field_mappings: FIELD_MAPPINGS,
    needs_review_fields: NEEDS_REVIEW_FIELDS,
    source_products: rawDataset.sourceProducts.map((product) => ({
      source_row: product.source_row,
      manufacturer_name: product.manufacturer_name,
      product_type: product.product_type,
      legacy: { ...product.legacy },
    })),
    materials,
  };
  validateNormalized(normalized);
  return normalized;
}

export function validateNormalized(normalized) {
  assert.equal(
    normalized.counts.source_product_rows,
    normalized.source_products.length,
    "入力資材行数が一致しません",
  );
  assert.equal(
    normalized.counts.unique_materials,
    normalized.materials.length,
    "資材件数が一致しません",
  );
  assert.equal(
    normalized.counts.product_images,
    normalized.materials.reduce((total, material) => total + material.images.length, 0),
    "画像件数が一致しません",
  );
  assert.equal(
    normalized.counts.application_recipes,
    normalized.materials.reduce((total, material) => total + material.recipes.length, 0),
    "施用レシピ件数が一致しません",
  );
  assert.equal(
    normalized.counts.material_product_type_links,
    normalized.materials.reduce((total, material) => total + material.product_types.length, 0),
    "製品タイプ関連件数が一致しません",
  );
  assert.equal(
    normalized.counts.material_crop_links,
    normalized.materials.reduce((total, material) => total + material.target_crops.length, 0),
    "対象作物関連件数が一致しません",
  );
  assert.equal(
    normalized.counts.material_effect_links,
    normalized.materials.reduce((total, material) => total + material.effects.length, 0),
    "効果関連件数が一致しません",
  );
  assert.equal(
    normalized.counts.material_search_tag_links,
    normalized.materials.reduce((total, material) => total + material.search_tags.length, 0),
    "検索補助タグ関連件数が一致しません",
  );
  const keys = normalized.materials.map((material) =>
    materialKey(material.name, material.manufacturer_name),
  );
  assert.equal(new Set(keys).size, keys.length, "資材の一意キーが重複しています");
  for (const material of normalized.materials) {
    for (const image of material.images) {
      assert.ok(image.url, `${material.name}の画像URLがありません`);
    }
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderValues(rows) {
  if (rows.length === 0) {
    return "";
  }
  return rows
    .map(
      (row, index) =>
        `  (${row.map(sqlLiteral).join(", ")})${index === rows.length - 1 ? "" : ","}`,
    )
    .join("\n");
}

export function renderSeedSql(normalized) {
  validateNormalized(normalized);
  const materialColumns = [
    "name",
    "manufacturer_name",
    "sales_status",
    "description",
    "general_use",
    "main_components",
    "mechanism",
    "usage_text",
    "price_range",
    "official_url",
    "catalog_url",
    "seller_id",
  ];
  const materialRows = normalized.materials.map((material) =>
    materialColumns.map((column) => material[column]),
  );
  const keyRows = normalized.materials.map((material) => [
    material.name,
    material.manufacturer_name,
  ]);
  const productTypeRows = normalized.materials.flatMap((material) =>
    material.product_types.map((productType) => [
      material.name,
      material.manufacturer_name,
      productType.name,
    ]),
  );
  const cropRows = normalized.materials.flatMap((material) =>
    material.target_crops.map((crop) => [
      material.name,
      material.manufacturer_name,
      crop.name,
      crop.source_name,
      crop.sort_order,
    ]),
  );
  const effectRows = normalized.materials.flatMap((material) =>
    material.effects.map((effect) => [
      material.name,
      material.manufacturer_name,
      effect.name,
    ]),
  );
  const searchTagRows = normalized.materials.flatMap((material) =>
    material.search_tags.map((tag) => [
      material.name,
      material.manufacturer_name,
      tag.category,
      tag.name,
    ]),
  );
  const imageRows = normalized.materials.flatMap((material) =>
    material.images.map((image) => [
      material.name,
      material.manufacturer_name,
      image.url,
      image.image_type,
      image.sort_order,
    ]),
  );

  const productTypeInsert =
    productTypeRows.length === 0
      ? "-- 移行対象の製品タイプはありません。\n"
      : `insert into pg_temp._farmille_material_seed_product_types
  (name, manufacturer_name, product_type_name)
values
${renderValues(productTypeRows)};

insert into public.product_types (name, sort_order)
select distinct seed_type.product_type_name, 100
from pg_temp._farmille_material_seed_product_types seed_type
on conflict (name) do nothing;

insert into public.material_product_types (material_id, product_type_id)
select material.id, product_type.id
from pg_temp._farmille_material_seed_product_types seed_type
join public.materials material
  on material.name = seed_type.name
 and material.manufacturer_name = seed_type.manufacturer_name
join public.product_types product_type on product_type.name = seed_type.product_type_name
on conflict (material_id, product_type_id) do nothing;
`;

  const cropInsert =
    cropRows.length === 0
      ? "-- 移行対象の作物はありません。\n"
      : `insert into pg_temp._farmille_material_seed_crops
  (name, manufacturer_name, crop_name, source_name, sort_order)
values
${renderValues(cropRows)};

do $farmille_seed$
begin
  if exists (
    select 1
    from pg_temp._farmille_material_seed_crops seed_crop
    left join public.crops crop on crop.name = seed_crop.crop_name
    where crop.id is null
  ) then
    raise exception 'cropsに必要な作物がありません';
  end if;
end
$farmille_seed$;

insert into public.material_crops (material_id, crop_id, source_name, sort_order)
select material.id, crop.id, seed_crop.source_name, seed_crop.sort_order
from pg_temp._farmille_material_seed_crops seed_crop
join public.materials material
  on material.name = seed_crop.name
 and material.manufacturer_name = seed_crop.manufacturer_name
join public.crops crop on crop.name = seed_crop.crop_name
on conflict (material_id, crop_id) do update set
  source_name = excluded.source_name,
  sort_order = excluded.sort_order,
  updated_at = now();
`;

  const effectInsert =
    effectRows.length === 0
      ? "-- 移行対象の効果はありません。\n"
      : `insert into pg_temp._farmille_material_seed_effects
  (name, manufacturer_name, effect_name)
values
${renderValues(effectRows)};

do $farmille_seed$
begin
  if exists (
    select 1
    from pg_temp._farmille_material_seed_effects seed_effect
    left join public.effects effect on effect.name = seed_effect.effect_name
    group by seed_effect.name, seed_effect.manufacturer_name, seed_effect.effect_name
    having count(effect.id) <> 1
  ) then
    raise exception 'effectsに一意に対応できない効果があります';
  end if;
end
$farmille_seed$;

insert into public.material_effects (material_id, effect_id)
select material.id, effect.id
from pg_temp._farmille_material_seed_effects seed_effect
join public.materials material
  on material.name = seed_effect.name
 and material.manufacturer_name = seed_effect.manufacturer_name
join public.effects effect on effect.name = seed_effect.effect_name
on conflict (material_id, effect_id) do nothing;
`;

  const searchTagInsert =
    searchTagRows.length === 0
      ? "-- 移行対象の検索補助タグはありません。\n"
      : `insert into pg_temp._farmille_material_seed_search_tags
  (name, manufacturer_name, category, tag_name)
values
${renderValues(searchTagRows)};

insert into public.search_tags (category, name, sort_order)
select distinct seed_tag.category, seed_tag.tag_name, 100
from pg_temp._farmille_material_seed_search_tags seed_tag
on conflict (category, name) do nothing;

insert into public.material_search_tags (material_id, search_tag_id)
select material.id, search_tag.id
from pg_temp._farmille_material_seed_search_tags seed_tag
join public.materials material
  on material.name = seed_tag.name
 and material.manufacturer_name = seed_tag.manufacturer_name
join public.search_tags search_tag
  on search_tag.category = seed_tag.category
 and search_tag.name = seed_tag.tag_name
on conflict (material_id, search_tag_id) do nothing;
`;

  const imageInsert =
    imageRows.length === 0
      ? "-- 移行対象の画像はありません。\n"
      : `insert into public.material_images
  (material_id, url, image_type, sort_order)
select material.id, seed_image.url, seed_image.image_type, seed_image.sort_order
from (
  values
${renderValues(imageRows)}
) as seed_image (name, manufacturer_name, url, image_type, sort_order)
join public.materials material
  on material.name = seed_image.name
 and material.manufacturer_name = seed_image.manufacturer_name;
`;

  return `-- =============================================================================
-- Farmille v2 資材マスタ開発シード
-- 生成元：tools/migration/convert-materials-v2.mjs
-- 入力行：${normalized.counts.source_product_rows}
-- 一意資材：${normalized.counts.unique_materials}
-- 画像：${normalized.counts.product_images}
-- 施用レシピ：${normalized.counts.application_recipes}（usage_textへ集約済み）
-- =============================================================================

begin;

create temporary table _farmille_material_seed_keys (
  name text not null,
  manufacturer_name text not null,
  primary key (name, manufacturer_name)
) on commit drop;

insert into pg_temp._farmille_material_seed_keys (name, manufacturer_name)
values
${renderValues(keyRows)};

insert into public.materials (
  ${materialColumns.join(",\n  ")}
)
values
${renderValues(materialRows)}
on conflict (name, manufacturer_name) do update set
  sales_status = excluded.sales_status,
  description = excluded.description,
  general_use = excluded.general_use,
  main_components = excluded.main_components,
  mechanism = excluded.mechanism,
  usage_text = excluded.usage_text,
  price_range = excluded.price_range,
  official_url = excluded.official_url,
  catalog_url = excluded.catalog_url,
  seller_id = excluded.seller_id,
  updated_at = now();

create temporary table _farmille_material_seed_product_types (
  name text not null,
  manufacturer_name text not null,
  product_type_name text not null,
  primary key (name, manufacturer_name, product_type_name)
) on commit drop;

create temporary table _farmille_material_seed_crops (
  name text not null,
  manufacturer_name text not null,
  crop_name text not null,
  source_name text not null,
  sort_order integer not null,
  primary key (name, manufacturer_name, crop_name)
) on commit drop;

create temporary table _farmille_material_seed_effects (
  name text not null,
  manufacturer_name text not null,
  effect_name text not null,
  primary key (name, manufacturer_name, effect_name)
) on commit drop;

create temporary table _farmille_material_seed_search_tags (
  name text not null,
  manufacturer_name text not null,
  category text not null check (category in ('concern', 'condition')),
  tag_name text not null,
  primary key (name, manufacturer_name, category, tag_name)
) on commit drop;

delete from public.material_product_types relation
using public.materials material, pg_temp._farmille_material_seed_keys seed_key
where relation.material_id = material.id
  and material.name = seed_key.name
  and material.manufacturer_name = seed_key.manufacturer_name;

delete from public.material_crops relation
using public.materials material, pg_temp._farmille_material_seed_keys seed_key
where relation.material_id = material.id
  and material.name = seed_key.name
  and material.manufacturer_name = seed_key.manufacturer_name;

delete from public.material_effects relation
using public.materials material, pg_temp._farmille_material_seed_keys seed_key
where relation.material_id = material.id
  and material.name = seed_key.name
  and material.manufacturer_name = seed_key.manufacturer_name;

delete from public.material_search_tags relation
using public.materials material, pg_temp._farmille_material_seed_keys seed_key
where relation.material_id = material.id
  and material.name = seed_key.name
  and material.manufacturer_name = seed_key.manufacturer_name;

${productTypeInsert}
${cropInsert}
${effectInsert}
${searchTagInsert}
delete from public.material_images material_image
using public.materials material, pg_temp._farmille_material_seed_keys seed_key
where material_image.material_id = material.id
  and material.name = seed_key.name
  and material.manufacturer_name = seed_key.manufacturer_name;

${imageInsert}
do $farmille_verify$
declare
  actual_materials integer;
  actual_images integer;
  actual_product_type_links integer;
  actual_crop_links integer;
  actual_effect_links integer;
  actual_search_tag_links integer;
  actual_recipes integer;
begin
  select count(*) into actual_materials
  from public.materials material
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select count(*) into actual_images
  from public.material_images material_image
  join public.materials material on material.id = material_image.material_id
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select count(*) into actual_product_type_links
  from public.material_product_types relation
  join public.materials material on material.id = relation.material_id
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select count(*) into actual_crop_links
  from public.material_crops relation
  join public.materials material on material.id = relation.material_id
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select count(*) into actual_effect_links
  from public.material_effects relation
  join public.materials material on material.id = relation.material_id
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select count(*) into actual_search_tag_links
  from public.material_search_tags relation
  join public.materials material on material.id = relation.material_id
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  select coalesce(sum(regexp_count(coalesce(material.usage_text, ''), '・作物：')), 0)
    into actual_recipes
  from public.materials material
  join pg_temp._farmille_material_seed_keys seed_key
    on material.name = seed_key.name
   and material.manufacturer_name = seed_key.manufacturer_name;

  if actual_materials <> ${normalized.counts.unique_materials} then
    raise exception '資材件数が一致しません：期待=%、実際=%',
      ${normalized.counts.unique_materials}, actual_materials;
  end if;
  if actual_images <> ${normalized.counts.product_images} then
    raise exception '画像件数が一致しません：期待=%、実際=%',
      ${normalized.counts.product_images}, actual_images;
  end if;
  if actual_product_type_links <> ${normalized.counts.material_product_type_links} then
    raise exception '製品タイプ関連件数が一致しません：期待=%、実際=%',
      ${normalized.counts.material_product_type_links}, actual_product_type_links;
  end if;
  if actual_crop_links <> ${normalized.counts.material_crop_links} then
    raise exception '対象作物関連件数が一致しません：期待=%、実際=%',
      ${normalized.counts.material_crop_links}, actual_crop_links;
  end if;
  if actual_effect_links <> ${normalized.counts.material_effect_links} then
    raise exception '効果関連件数が一致しません：期待=%、実際=%',
      ${normalized.counts.material_effect_links}, actual_effect_links;
  end if;
  if actual_search_tag_links <> ${normalized.counts.material_search_tag_links} then
    raise exception '検索補助タグ関連件数が一致しません：期待=%、実際=%',
      ${normalized.counts.material_search_tag_links}, actual_search_tag_links;
  end if;
  if actual_recipes <> ${normalized.counts.application_recipes} then
    raise exception '施用レシピ集約件数が一致しません：期待=%、実際=%',
      ${normalized.counts.application_recipes}, actual_recipes;
  end if;
end
$farmille_verify$;

select
  ${normalized.counts.source_product_rows}::integer as source_product_rows,
  ${normalized.counts.duplicate_product_rows}::integer as duplicate_product_rows,
  (select count(*) from pg_temp._farmille_material_seed_keys)::integer
    as expected_unique_materials,
  (
    select count(*)
    from public.materials material
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_unique_materials,
  ${normalized.counts.product_images}::integer as expected_images,
  (
    select count(*)
    from public.material_images material_image
    join public.materials material on material.id = material_image.material_id
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_images,
  ${normalized.counts.material_product_type_links}::integer as expected_product_type_links,
  (
    select count(*)
    from public.material_product_types relation
    join public.materials material on material.id = relation.material_id
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_product_type_links,
  ${normalized.counts.material_crop_links}::integer as expected_crop_links,
  (
    select count(*)
    from public.material_crops relation
    join public.materials material on material.id = relation.material_id
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_crop_links,
  ${normalized.counts.material_effect_links}::integer as expected_effect_links,
  (
    select count(*)
    from public.material_effects relation
    join public.materials material on material.id = relation.material_id
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_effect_links,
  ${normalized.counts.material_search_tag_links}::integer as expected_search_tag_links,
  (
    select count(*)
    from public.material_search_tags relation
    join public.materials material on material.id = relation.material_id
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_search_tag_links,
  ${normalized.counts.application_recipes}::integer as expected_recipes,
  (
    select coalesce(sum(regexp_count(coalesce(material.usage_text, ''), '・作物：')), 0)
    from public.materials material
    join pg_temp._farmille_material_seed_keys seed_key
      on material.name = seed_key.name
     and material.manufacturer_name = seed_key.manufacturer_name
  )::integer as actual_recipes;

commit;
`;
}

function pickSampleIndexes(length) {
  if (length <= 5) {
    return Array.from({ length }, (_, index) => index);
  }
  return [0, 0.25, 0.5, 0.75, 1].map((position) =>
    Math.min(length - 1, Math.round((length - 1) * position)),
  );
}

export function createReport(normalized) {
  const sampleComparisons = pickSampleIndexes(normalized.materials.length).map((index) => {
    const material = normalized.materials[index];
    return {
      key: {
        name: material.name,
        manufacturer_name: material.manufacturer_name,
      },
      source: {
        product_type: material.product_types[0]?.source_value ?? null,
        commercial_status: material.legacy.commercial_status ?? null,
        expected_effects_official: material.legacy.expected_effects_official ?? null,
        general_purpose: material.legacy.general_purpose ?? null,
        primary_compound: material.legacy.primary_compound ?? null,
        mode_of_action: material.legacy.mode_of_action ?? null,
        usage_summary: material.legacy.usage_summary ?? null,
        image_count: material.images.length,
        recipe_count: material.recipes.length,
      },
      target: {
        product_types: material.product_types.map((productType) => productType.name),
        sales_status: material.sales_status,
        description: material.description,
        general_use: material.general_use,
        main_components: material.main_components,
        mechanism: material.mechanism,
        usage_text: material.usage_text,
        image_count: material.images.length,
        target_crop_count: material.target_crops.length,
        effect_count: material.effects.length,
        search_tag_count: material.search_tags.length,
      },
    };
  });
  return {
    counts: normalized.counts,
    duplicate_products: normalized.duplicate_products,
    field_mappings: normalized.field_mappings,
    missing_classification_mappings: normalized.missing_classification_mappings,
    needs_review_fields: normalized.needs_review_fields,
    unmapped_image_types: normalized.unmapped_image_types,
    sample_comparisons: sampleComparisons,
  };
}

function parseArguments(argv) {
  const options = {
    input: DEFAULT_INPUT,
    tagSeed: DEFAULT_TAG_SEED,
    jsonOutput: DEFAULT_JSON_OUTPUT,
    sqlOutput: DEFAULT_SQL_OUTPUT,
    reportOutput: DEFAULT_REPORT_OUTPUT,
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    const optionMap = new Map([
      ["--input", "input"],
      ["--tag-seed", "tagSeed"],
      ["--json-output", "jsonOutput"],
      ["--sql-output", "sqlOutput"],
      ["--report-output", "reportOutput"],
    ]);
    const key = optionMap.get(argument);
    if (!key) {
      throw new Error(`不明な引数です：${argument}`);
    }
    const value = argv[index + 1];
    if (!value) {
      throw new Error(`${argument}の値が必要です`);
    }
    options[key] = path.resolve(value);
    index += 1;
  }
  return options;
}

function relativeSource(inputPath) {
  return path.relative(SCRIPT_DIR, inputPath).split(path.sep).join("/");
}

function writeOrCheck(filePath, content, check) {
  if (check) {
    assert.ok(fs.existsSync(filePath), `生成済みファイルがありません：${filePath}`);
    assert.equal(
      fs.readFileSync(filePath, "utf8"),
      content,
      `生成結果に差分があります：${filePath}`,
    );
    return;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

export function run(options) {
  const rawDataset = readSource(options.input);
  rawDataset.source = relativeSource(options.input);
  const seededTags = parseTagSeed(fs.readFileSync(options.tagSeed, "utf8"));
  const normalized = normalizeDataset(rawDataset, seededTags);
  const report = createReport(normalized);
  const jsonContent = `${JSON.stringify(normalized, null, 2)}\n`;
  const sqlContent = renderSeedSql(normalized);
  const reportContent = `${JSON.stringify(report, null, 2)}\n`;

  writeOrCheck(options.jsonOutput, jsonContent, options.check);
  writeOrCheck(options.sqlOutput, sqlContent, options.check);
  writeOrCheck(options.reportOutput, reportContent, options.check);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return { normalized, report };
}

function main() {
  try {
    run(parseArguments(process.argv.slice(2)));
  } catch (error) {
    const message = error instanceof Error ? error.stack : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main();
}
