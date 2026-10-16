import {
  CanvasTexture,
  CubicBezierCurve,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { token } from "../../../styled-system/tokens";

/** 白いボトルに緑のラベル。掲載資材カードの容器画像（public/images/container-shapes）と同じ見た目に揃える。 */
const palette = {
  bottle: token("colors.card"),
  label: token("colors.green.50"),
  band: token("colors.green.700"),
  leaf: token("colors.green.500"),
  vein: token("colors.green.800"),
  title: token("colors.ink2"),
  text: token("colors.ink3"),
  waveLight: token("colors.green.300"),
  waveDeep: token("colors.green.600"),
  // ヒーローの写真は右上から夕日が差しているので、主光を暖かい色にして写真になじませる
  sunlight: token("colors.amber.soft"),
  barcode: token("colors.ink"),
  shadow: token("colors.ink"),
};

/** 長さの単位はボトルの直径。原点はボトルの底の中心。 */
const BODY_RADIUS = 0.5;
const WALL_TOP = 1.55;
const NECK_RADIUS = 0.215;
const LABEL_RADIUS = 0.503;
const LABEL_BOTTOM = 0.26;
const LABEL_TOP = 1.46;
/** 表ラベルと裏ラベルが胴の周に占める割合。 */
const FRONT_LABEL = 0.56;
const BACK_LABEL = 0.3;
const CAP_RADIUS = 0.255;
const CAP_BOTTOM = 2.115;
const CAP_TOP = 2.45;
const SHADOW_SIZE = 1.4;

/** 画面に収める範囲。影の縁がキャンバスで切れないよう、幅は影の大きさで取る。 */
const FIT_WIDTH = SHADOW_SIZE * 1.04;
const FIT_HEIGHT = CAP_TOP * 1.12;
const CAMERA_FOV = 28;
/** 少し上から見下ろし、キャップの天面とラベルの曲がりを見せる。 */
const CAMERA_ELEVATION = (13 * Math.PI) / 180;

/** 一定の速さで1回転するのにかける時間。 */
const TURN_MS = 14_000;
/** 登場時に余分に回して減速させる長さと角度。 */
const INTRO_MS = 1_800;
const INTRO_TURN = Math.PI * 0.7;
/** ラベルを正面からわずかに振った角度。登場の終わりと、動きを減らす設定での静止に使う。 */
const REST_ANGLE = -0.35;
/** タブ復帰などでフレーム間隔が空いても、角度を飛ばさない上限。 */
const MAX_FRAME_MS = 100;

/**
 * 経過時間（ms）に対するボトルの向き（rad）。
 * 登場直後は速く回り、ease-out で減速して REST_ANGLE を通る。その後は一定の速さで回り続ける。
 */
export function spinAngle(elapsedMs: number): number {
  const steady = (elapsedMs / TURN_MS) * Math.PI * 2;
  const progress = Math.min(elapsedMs / INTRO_MS, 1);
  const intro = INTRO_TURN * (1 - (1 - progress) ** 3);
  const introEnd = (INTRO_MS / TURN_MS) * Math.PI * 2 + INTRO_TURN;
  return REST_ANGLE - introEnd + steady + intro;
}

function arc(
  centerX: number,
  centerY: number,
  radius: number,
  from: number,
  to: number,
  steps: number,
): Vector2[] {
  return Array.from({ length: steps + 1 }, (_, step) => {
    const angle = from + ((to - from) * step) / steps;
    return new Vector2(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
  });
}

/** 胴の断面。底の角を丸め、直線の胴から肩で絞って首とネックリングにつなぐ。 */
function bodyProfile(): Vector2[] {
  const corner = 0.09;
  const shoulder = new CubicBezierCurve(
    new Vector2(BODY_RADIUS, WALL_TOP),
    new Vector2(BODY_RADIUS, WALL_TOP + 0.33),
    new Vector2(NECK_RADIUS, WALL_TOP + 0.25),
    new Vector2(NECK_RADIUS, WALL_TOP + 0.49),
  );
  return [
    new Vector2(0, 0),
    ...arc(BODY_RADIUS - corner, corner, corner, -Math.PI / 2, 0, 8),
    ...shoulder.getPoints(24),
    new Vector2(0.24, CAP_BOTTOM - 0.05),
    new Vector2(0.24, CAP_BOTTOM - 0.015),
    new Vector2(NECK_RADIUS, CAP_BOTTOM - 0.005),
    new Vector2(NECK_RADIUS, CAP_BOTTOM + 0.06),
    new Vector2(0, CAP_BOTTOM + 0.06),
  ];
}

/** キャップは天面の縁を丸め、側面に滑り止めの縦溝を刻む。 */
function knurledCapGeometry(): LatheGeometry {
  const bevel = 0.03;
  const knurlBottom = CAP_BOTTOM + 0.02;
  const knurlTop = CAP_TOP - bevel - 0.01;
  const geometry = new LatheGeometry(
    [
      new Vector2(0.218, CAP_BOTTOM),
      new Vector2(CAP_RADIUS, CAP_BOTTOM),
      new Vector2(CAP_RADIUS, knurlBottom),
      new Vector2(CAP_RADIUS, knurlTop),
      new Vector2(CAP_RADIUS, CAP_TOP - bevel),
      ...arc(CAP_RADIUS - bevel, CAP_TOP - bevel, bevel, 0, Math.PI / 2, 6),
      new Vector2(0, CAP_TOP),
    ],
    192,
  );
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    if (y < knurlBottom - 1e-6 || y > knurlTop + 1e-6) continue;
    const x = position.getX(index);
    const z = position.getZ(index);
    const ridge = 1 + 0.018 * Math.sin(Math.atan2(x, z) * 48);
    position.setXYZ(index, x * ridge, y, z * ridge);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** 角の丸い横棒。ラベルの文字の行を、読めない飾りとして表す。 */
function bar(
  context: CanvasRenderingContext2D,
  centerX: number,
  top: number,
  length: number,
  thickness: number,
  color: string,
): void {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(centerX - length / 2, top, length, thickness, thickness / 2);
  context.fill();
}

/** 表ラベル。葉のマーク・品名・説明の行・下端の波を、正面に来る中央へ左右対称に組む。 */
function drawFrontLabel(context: CanvasRenderingContext2D, width: number, height: number): void {
  const centerX = width / 2;
  context.fillStyle = palette.label;
  context.fillRect(0, 0, width, height);
  context.fillStyle = palette.band;
  context.fillRect(0, 0, width, height * 0.12);

  const leaf = height * 0.085;
  context.save();
  context.translate(centerX, height * 0.27);
  context.rotate(Math.PI / 4);
  context.fillStyle = palette.leaf;
  context.beginPath();
  context.moveTo(0, -leaf);
  context.quadraticCurveTo(leaf * 0.95, 0, 0, leaf);
  context.quadraticCurveTo(-leaf * 0.95, 0, 0, -leaf);
  context.fill();
  context.strokeStyle = palette.vein;
  context.lineWidth = leaf * 0.09;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, -leaf * 0.65);
  context.lineTo(0, leaf * 1.3);
  context.stroke();
  context.restore();

  bar(context, centerX, height * 0.4, width * 0.29, height * 0.06, palette.title);
  bar(context, centerX, height * 0.5, width * 0.18, height * 0.035, palette.text);
  context.globalAlpha = 0.45;
  for (const [index, length] of [0.33, 0.3, 0.22].entries()) {
    bar(
      context,
      centerX,
      height * (0.6 + index * 0.05),
      width * length,
      height * 0.022,
      palette.text,
    );
  }
  context.globalAlpha = 1;

  const wave = (left: number, right: number, color: string) => {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(0, height * (1 - left));
    context.bezierCurveTo(
      width * 0.4,
      height * (1 - left),
      width * 0.6,
      height * (1 - right),
      width,
      height * (1 - right),
    );
    context.lineTo(width, height);
    context.closePath();
    context.fill();
  };
  wave(0.07, 0.27, palette.waveLight);
  wave(0.03, 0.17, palette.waveDeep);
}

/** 裏ラベル。成分や使い方の細かい行と、バーコードを置く。 */
function drawBackLabel(context: CanvasRenderingContext2D, width: number, height: number): void {
  const centerX = width / 2;
  context.fillStyle = palette.label;
  context.fillRect(0, 0, width, height);
  context.fillStyle = palette.band;
  context.fillRect(0, 0, width, height * 0.12);

  bar(context, centerX, height * 0.2, width * 0.5, height * 0.045, palette.title);
  context.globalAlpha = 0.45;
  for (const [index, length] of [0.74, 0.68, 0.74, 0.6, 0.74, 0.7, 0.46].entries()) {
    bar(
      context,
      centerX,
      height * (0.31 + index * 0.055),
      width * length,
      height * 0.02,
      palette.text,
    );
  }
  context.globalAlpha = 1;

  // バーとすき間の幅を交互に並べた、読めない飾りのバーコード
  const modules = [2, 1, 1, 2, 3, 1, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 2, 2, 1, 1, 3, 2];
  const unit = (width * 0.44) / modules.reduce((sum, module) => sum + module, 0);
  let x = centerX - width * 0.22;
  context.fillStyle = palette.barcode;
  for (const [index, module] of modules.entries()) {
    if (index % 2 === 0) context.fillRect(x, height * 0.75, module * unit, height * 0.15);
    x += module * unit;
  }
}

/**
 * ラベルは胴を一周する1枚の絵にする。真正面に表ラベル、真後ろに裏ラベルを置き、
 * 間は透明にして白い胴を見せる。裏ラベルは絵の継ぎ目（真後ろ）をまたぐので、左右の端に半分ずつ描く。
 */
function labelTexture(renderer: WebGLRenderer): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = Math.round(
    (canvas.width * (LABEL_TOP - LABEL_BOTTOM)) / (Math.PI * 2 * LABEL_RADIUS),
  );
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ラベルを描く 2D コンテキストを作れませんでした。");
  const { width, height } = canvas;
  context.save();
  context.translate(width * (0.5 - FRONT_LABEL / 2), 0);
  drawFrontLabel(context, width * FRONT_LABEL, height);
  context.restore();
  for (const left of [-BACK_LABEL / 2, 1 - BACK_LABEL / 2]) {
    context.save();
    context.translate(width * left, 0);
    drawBackLabel(context, width * BACK_LABEL, height);
    context.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

/** 接地影の濃さ。影の半径の 55% までは一定で、そこから縁に向けて smoothstep で 0 まで薄める。 */
function shadowTexture(): DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const fade = Math.min(Math.max((1 - distance) / 0.45, 0), 1);
      const alpha = fade * fade * (3 - 2 * fade);
      data.fill(Math.round(alpha * 255), (y * size + x) * 4, (y * size + x) * 4 + 4);
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

/** 幅と高さの両方に収まる距離までカメラを引く。 */
function frameCamera(camera: PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  const slope = Math.tan((camera.fov * Math.PI) / 360);
  const distance = Math.max(FIT_HEIGHT / 2 / slope, FIT_WIDTH / 2 / (slope * camera.aspect));
  const centerY = CAP_TOP / 2;
  camera.position.set(
    0,
    centerY + distance * Math.sin(CAMERA_ELEVATION),
    distance * Math.cos(CAMERA_ELEVATION),
  );
  camera.lookAt(0, centerY, 0);
  camera.updateProjectionMatrix();
}

type Motion = "spin" | "still";

/**
 * canvas に回転するボトルを描く。戻り値を呼ぶと描画を止めて GPU の資源を解放する。
 * 画面外にある間と、動きを減らす設定の間は回さない。最初の1枚を描いたら onFirstFrame を呼ぶ。
 */
export function mountBottleScene(canvas: HTMLCanvasElement, onFirstFrame: () => void): () => void {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.5;

  const key = new DirectionalLight(palette.sunlight, 2.2);
  key.position.set(3, 3.5, 2);
  const rim = new DirectionalLight(palette.bottle, 1.4);
  rim.position.set(-2.5, 2, -3);
  scene.add(key, rim);

  const plastic = new MeshStandardMaterial({ color: palette.bottle, roughness: 0.45 });
  const capPlastic = new MeshStandardMaterial({ color: palette.bottle, roughness: 0.55 });
  const labelMap = labelTexture(renderer);
  const labelFilm = new MeshStandardMaterial({ map: labelMap, alphaTest: 0.5, roughness: 0.3 });
  const shadowMap = shadowTexture();
  const shadowFilm = new MeshBasicMaterial({
    color: palette.shadow,
    alphaMap: shadowMap,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    toneMapped: false,
  });

  const bodyGeometry = new LatheGeometry(bodyProfile(), 96);
  const capGeometry = knurledCapGeometry();
  const labelGeometry = new CylinderGeometry(
    LABEL_RADIUS,
    LABEL_RADIUS,
    LABEL_TOP - LABEL_BOTTOM,
    192,
    1,
    true,
    -Math.PI,
    Math.PI * 2,
  );
  labelGeometry.translate(0, (LABEL_TOP + LABEL_BOTTOM) / 2, 0);
  const shadowGeometry = new PlaneGeometry(SHADOW_SIZE, SHADOW_SIZE);
  shadowGeometry.rotateX(-Math.PI / 2);

  const bottle = new Group();
  bottle.add(
    new Mesh(bodyGeometry, plastic),
    new Mesh(capGeometry, capPlastic),
    new Mesh(labelGeometry, labelFilm),
  );
  const shadow = new Mesh(shadowGeometry, shadowFilm);
  shadow.position.y = 0.002;
  scene.add(bottle, shadow);

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let motion: Motion = reducedMotion.matches ? "still" : "spin";
  let inView = false;
  let compiled = false;
  let disposed = false;
  let shown = false;
  let elapsed = 0;
  let lastFrame: number | null = null;

  const draw = () => {
    renderer.render(scene, camera);
    if (shown) return;
    shown = true;
    onFirstFrame();
  };

  const tick = (now: number) => {
    if (lastFrame !== null) elapsed += Math.min(now - lastFrame, MAX_FRAME_MS);
    lastFrame = now;
    bottle.rotation.y = spinAngle(elapsed);
    draw();
  };

  /** 回すのは「回す設定」かつ「画面内」のときだけ。静止の設定では正面寄りの向きで1枚だけ描く。 */
  const sync = () => {
    if (!compiled || disposed) return;
    if (motion === "spin" && inView) {
      renderer.setAnimationLoop(tick);
      return;
    }
    renderer.setAnimationLoop(null);
    lastFrame = null;
    if (motion === "spin") return;
    bottle.rotation.y = REST_ANGLE;
    draw();
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    frameCamera(camera, width, height);
    if (compiled && motion === "still") draw();
  };

  const handleMotionChange = () => {
    motion = reducedMotion.matches ? "still" : "spin";
    sync();
  };
  reducedMotion.addEventListener("change", handleMotionChange);

  const viewObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) inView = entry.isIntersecting;
    sync();
  });
  const sizeObserver = new ResizeObserver(resize);

  resize();
  void renderer.compileAsync(scene, camera).then(() => {
    if (disposed) return;
    compiled = true;
    sizeObserver.observe(canvas);
    viewObserver.observe(canvas);
  });

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    reducedMotion.removeEventListener("change", handleMotionChange);
    viewObserver.disconnect();
    sizeObserver.disconnect();
    for (const resource of [
      bodyGeometry,
      capGeometry,
      labelGeometry,
      shadowGeometry,
      plastic,
      capPlastic,
      labelFilm,
      shadowFilm,
      labelMap,
      shadowMap,
      environment,
      pmrem,
    ]) {
      resource.dispose();
    }
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
