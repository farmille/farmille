import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const storybookEntry = require.resolve("@storybook/nextjs-vite");
const pluginEntry = require.resolve("vite-plugin-storybook-nextjs", {
  paths: [path.dirname(storybookEntry)],
});
const commonJsEntry = require.resolve("image-size", {
  paths: [path.dirname(pluginEntry)],
});
const moduleEntry = pathToFileURL(commonJsEntry.replace(/\.cjs$/, ".mjs")).href;

const maliciousImages = [
  {
    name: "HEIF のサイズ0 ispe box",
    bytes: [
      0x00, 0x00, 0x00, 0x10, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x24, 0x6d, 0x65, 0x74, 0x61, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x08, 0x69, 0x70, 0x72, 0x70, 0x00, 0x00, 0x00, 0x14, 0x69, 0x70, 0x63, 0x6f, 0x00,
      0x00, 0x00, 0x00, 0x69, 0x73, 0x70, 0x65, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
  },
  {
    name: "JXL のサイズ0 jxlp box",
    bytes: [
      0x00, 0x00, 0x00, 0x0c, 0x4a, 0x58, 0x4c, 0x20, 0x0d, 0x0a, 0x87, 0x0a, 0x00, 0x00, 0x00,
      0x10, 0x66, 0x74, 0x79, 0x70, 0x6a, 0x78, 0x6c, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x6a, 0x78, 0x6c, 0x70, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ],
  },
  {
    name: "ICNS の長さ0 entry",
    bytes: [
      0x69, 0x63, 0x6e, 0x73, 0x00, 0x00, 0x00, 0x10, 0x69, 0x73, 0x33, 0x32, 0x00, 0x00, 0x00,
      0x00,
    ],
  },
];

const moduleFormats = [
  {
    name: "CommonJS",
    arguments: (source) => ["-e", source],
    source: (bytes) => `
      const { imageSize } = require(${JSON.stringify(commonJsEntry)});
      try { imageSize(Uint8Array.from(${JSON.stringify(bytes)})); } catch {}
      process.stdout.write("completed");
    `,
  },
  {
    name: "ESM",
    arguments: (source) => ["--input-type=module", "-e", source],
    source: (bytes) => `
      const { imageSize } = await import(${JSON.stringify(moduleEntry)});
      try { imageSize(Uint8Array.from(${JSON.stringify(bytes)})); } catch {}
      process.stdout.write("completed");
    `,
  },
];

for (const format of moduleFormats) {
  for (const image of maliciousImages) {
    const source = format.source(image.bytes);
    const result = spawnSync(process.execPath, format.arguments(source), {
      encoding: "utf8",
      timeout: 1_000,
    });

    assert.notEqual(
      result.error?.code,
      "ETIMEDOUT",
      `${format.name}：${image.name} の解析が終了しませんでした。`,
    );
    assert.equal(
      result.status,
      0,
      `${format.name}：${image.name} の検査プロセスが失敗しました。\n${result.stderr}`,
    );
    assert.equal(
      result.stdout,
      "completed",
      `${format.name}：${image.name} の解析完了を確認できませんでした。`,
    );
  }
}

console.log("image-size の無限ループ対策を CommonJS／ESM の両方で確認しました。");
