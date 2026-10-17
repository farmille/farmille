import * as Sentry from "@sentry/nextjs";
import {
  BackSide,
  CanvasTexture,
  CircleGeometry,
  Color,
  CubicBezierCurve,
  CustomBlending,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  FrontSide,
  Group,
  HalfFloatType,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  OneFactor,
  OneMinusSrcAlphaFactor,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  PlaneGeometry,
  PMREMGenerator,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type Side,
} from "three";

import { token } from "../../../styled-system/tokens";

const palette = {
  paper: token("colors.card"),
  band: token("colors.green.800"),
  bandText: token("colors.green.50"),
  leaf: token("colors.green.500"),
  leafDeep: token("colors.green.700"),
  title: token("colors.green.900"),
  text: token("colors.ink2"),
  fine: token("colors.ink3"),
  waveLight: token("colors.green.300"),
  waveDeep: token("colors.green.600"),
  barcode: token("colors.ink"),
  liquid: token("colors.amber"),
  cap: token("colors.card"),
  labelInside: token("colors.mist"),
  shadow: token("colors.ink"),
  sky: token("colors.line.strong"),
  horizon: token("colors.amber.soft"),
  ground: token("colors.green.900"),
  softbox: token("colors.amber.soft"),
  sun: token("colors.star"),
};

const LABEL_FONT = token("fonts.sans");

const BODY_RADIUS = 0.5;
const BASE_CORNER = 0.09;
const WALL_TOP = 1.55;
const NECK_RADIUS = 0.215;
const SHOULDER_TOP = 2.04;
const GROOVES = [0.19, 1.5];
const GROOVE_DEPTH = 0.012;
const SUPPORT_RING_RADIUS = 0.252;
const SUPPORT_RING_BOTTOM = 2.055;
const SUPPORT_RING_TOP = 2.075;
const NECK_TOP = 2.14;
const TAMPER_BAND_BOTTOM = 2.085;
const TAMPER_BAND_TOP = 2.11;
const CAP_RADIUS = 0.255;
const CAP_BOTTOM = 2.118;
const CAP_TOP = 2.45;
const CAP_BEVEL = 0.03;
const KNURL_RIDGES = 48;
const LABEL_RADIUS = 0.503;
const LABEL_BOTTOM = 0.26;
const LABEL_TOP = 1.18;
const FRONT_LABEL_ARC = Math.PI * 1.12;
const BACK_LABEL_ARC = Math.PI * 0.6;
const LIQUID_RADIUS = 0.486;
const LIQUID_LEVEL = 1.32;
const PIVOT = 1.2;
const SHADOW_SIZE = 1.2;

const LEAN = (18 * Math.PI) / 180;
const FLOAT = 0.3;
const DROP = 0.18;
const BOB = 0.035;
const BOB_MS = 4_800;
const CAMERA_ELEVATION = (24 * Math.PI) / 180;
const VIEW = new Vector3(0, Math.sin(CAMERA_ELEVATION), Math.cos(CAMERA_ELEVATION));
const CAMERA_DISTANCE = 9;
const CAMERA_TARGET = new Vector3(0, PIVOT + FLOAT, 0);
const FIT_MARGIN = 1.08;

const TURN_MS = 14_000;
const INTRO_MS = 1_800;
const INTRO_TURN = Math.PI * 0.7;
const REST_ANGLE = -0.35;
const MAX_FRAME_MS = 100;

const MATCAP_SIZE = 256;
const ENVIRONMENT_SIZE = 64;
const SUN = new Vector3(6, 2.5, -3);
const LIGHTS = [
  { position: new Vector3(-4.5, 2.5, 3.5), width: 2.4, height: 8, round: false, intensity: 16 },
  { position: new Vector3(4, 2, 2.5), width: 1.2, height: 8, round: false, intensity: 3 },
  { position: new Vector3(6, 4, -5), width: 5, height: 5, round: true, intensity: 24 },
];

interface Pose {
  spin: number;
  lean: number;
  lift: number;
}

const STILL: Pose = { spin: REST_ANGLE, lean: LEAN, lift: FLOAT };

export function spinAngle(elapsedMs: number): number {
  const steady = (elapsedMs / TURN_MS) * Math.PI * 2;
  const progress = Math.min(elapsedMs / INTRO_MS, 1);
  const intro = INTRO_TURN * (1 - (1 - progress) ** 3);
  const introEnd = (INTRO_MS / TURN_MS) * Math.PI * 2 + INTRO_TURN;
  return REST_ANGLE - introEnd + steady + intro;
}

export function poseAt(elapsedMs: number): Pose {
  const settled = 1 - (1 - Math.min(elapsedMs / INTRO_MS, 1)) ** 3;
  return {
    spin: spinAngle(elapsedMs),
    lean: LEAN * settled,
    lift: FLOAT - DROP * (1 - settled) + BOB * Math.sin((elapsedMs / BOB_MS) * Math.PI * 2),
  };
}

const GLASS_EDGE = `
diffuseColor.a = mix(diffuseColor.a, 1.0, 0.7 * pow(1.0 - saturate(dot(normal, viewDir)), 3.0));
#include <opaque_fragment>
`;

const tint = new Color(palette.liquid);
const TINT = `vec3(${tint.r.toFixed(4)}, ${tint.g.toFixed(4)}, ${tint.b.toFixed(4)})`;

const LIQUID_SIDE = `
float facing = saturate(dot(normal, viewDir));
float thickness = mix(2.6, 0.9, facing);
vec3 throughLiquid = pow(${TINT}, vec3(thickness)) * 1.1;
vec3 sunRim = pow(${TINT}, vec3(0.5)) * pow(1.0 - facing, 2.0) * saturate(normal.x) * 0.9;
outgoingLight = throughLiquid + sunRim;
diffuseColor.a = mix(0.98, 0.9, facing);
#include <opaque_fragment>
`;

const LIQUID_TOP = `
float far = smoothstep(0.0, 1.0, vUv.y);
float meniscus = smoothstep(0.43, 0.5, length(vUv - 0.5));
outgoingLight += pow(${TINT}, vec3(mix(2.2, 1.1, far))) * mix(0.55, 1.0, far)
  + pow(${TINT}, vec3(0.6)) * meniscus * 0.6;
diffuseColor.a = 0.97;
#include <opaque_fragment>
`;

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

function groove(y: number): Vector2[] {
  return arc(BODY_RADIUS, y, GROOVE_DEPTH, -Math.PI / 2, -Math.PI * 1.5, 8);
}

function bodyProfile(): Vector2[] {
  const shoulder = new CubicBezierCurve(
    new Vector2(BODY_RADIUS, WALL_TOP),
    new Vector2(BODY_RADIUS, WALL_TOP + 0.33),
    new Vector2(NECK_RADIUS, WALL_TOP + 0.25),
    new Vector2(NECK_RADIUS, SHOULDER_TOP),
  );
  return [
    new Vector2(0, 0),
    ...arc(BODY_RADIUS - BASE_CORNER, BASE_CORNER, BASE_CORNER, -Math.PI / 2, 0, 12),
    ...GROOVES.flatMap(groove),
    ...shoulder.getPoints(40),
    new Vector2(SUPPORT_RING_RADIUS, SUPPORT_RING_BOTTOM),
    new Vector2(SUPPORT_RING_RADIUS, SUPPORT_RING_TOP),
    new Vector2(NECK_RADIUS, SUPPORT_RING_TOP),
    new Vector2(NECK_RADIUS, NECK_TOP),
    new Vector2(0, NECK_TOP),
  ];
}

function liquidProfile(): Vector2[] {
  const floor = BODY_RADIUS - LIQUID_RADIUS;
  const corner = BASE_CORNER - floor;
  return [
    new Vector2(0, floor),
    ...arc(LIQUID_RADIUS - corner, floor + corner, corner, -Math.PI / 2, 0, 12),
    new Vector2(LIQUID_RADIUS, WALL_TOP),
  ];
}

function tamperBandProfile(): Vector2[] {
  return [
    new Vector2(NECK_RADIUS, TAMPER_BAND_BOTTOM),
    new Vector2(CAP_RADIUS - 0.006, TAMPER_BAND_BOTTOM),
    new Vector2(CAP_RADIUS - 0.006, TAMPER_BAND_TOP),
    new Vector2(NECK_RADIUS, TAMPER_BAND_TOP),
  ];
}

function knurledCapGeometry(): LatheGeometry {
  const knurlBottom = CAP_BOTTOM + 0.02;
  const knurlTop = CAP_TOP - CAP_BEVEL - 0.01;
  const geometry = new LatheGeometry(
    [
      new Vector2(0.218, CAP_BOTTOM),
      new Vector2(CAP_RADIUS, CAP_BOTTOM),
      new Vector2(CAP_RADIUS, knurlBottom),
      new Vector2(CAP_RADIUS, knurlTop),
      new Vector2(CAP_RADIUS, CAP_TOP - CAP_BEVEL),
      ...arc(CAP_RADIUS - CAP_BEVEL, CAP_TOP - CAP_BEVEL, CAP_BEVEL, 0, Math.PI / 2, 8),
      new Vector2(0, CAP_TOP),
    ],
    288,
  );
  const position = geometry.getAttribute("position");
  const shade = new Float32Array(position.count * 3).fill(1);
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    if (y < knurlBottom - 1e-6 || y > knurlTop + 1e-6) continue;
    const x = position.getX(index);
    const z = position.getZ(index);
    const ridge = Math.abs(Math.sin((Math.atan2(x, z) * KNURL_RIDGES) / 2));
    position.setXYZ(index, x * (1 + 0.018 * ridge), y, z * (1 + 0.018 * ridge));
    shade.fill(0.72 + 0.28 * ridge, index * 3, index * 3 + 3);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(shade, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function leaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  color: string,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, 0);
  context.bezierCurveTo(size * 0.45, -size * 0.2, size * 0.5, -size * 0.8, 0, -size);
  context.bezierCurveTo(-size * 0.5, -size * 0.8, -size * 0.45, -size * 0.2, 0, 0);
  context.fill();
  context.strokeStyle = palette.paper;
  context.globalAlpha = 0.55;
  context.lineWidth = size * 0.04;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(0, -size * 0.08);
  context.quadraticCurveTo(size * 0.04, -size * 0.5, 0, -size * 0.88);
  context.stroke();
  context.restore();
}

function fineLines(
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  lineHeight: number,
  lengths: number[],
): void {
  context.fillStyle = palette.fine;
  for (const [index, length] of lengths.entries()) {
    const y = top + index * lineHeight;
    let x = left;
    let word = 0;
    while (x < left + width * length) {
      const wordWidth = lineHeight * (0.9 + ((index * 7 + word * 13) % 5) * 0.45);
      context.fillRect(x, y, Math.min(wordWidth, left + width * length - x), lineHeight * 0.42);
      x += wordWidth + lineHeight * 0.32;
      word += 1;
    }
  }
}

function band(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = palette.band;
  context.fillRect(0, 0, width, height * 0.15);
  context.fillStyle = palette.bandText;
  context.font = `700 ${height * 0.048}px ${LABEL_FONT}`;
  context.letterSpacing = `${height * 0.018}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("BIOSTIMULANT", width / 2, height * 0.077);
  context.letterSpacing = "0px";
}

function wave(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  left: number,
  right: number,
  color: string,
): void {
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, height);
  context.lineTo(0, height * (1 - left));
  context.bezierCurveTo(
    width * 0.35,
    height * (1 - left - 0.04),
    width * 0.65,
    height * (1 - right + 0.06),
    width,
    height * (1 - right),
  );
  context.lineTo(width, height);
  context.closePath();
  context.fill();
}

function drawFrontLabel(context: CanvasRenderingContext2D, width: number, height: number): void {
  const centerX = width / 2;
  context.fillStyle = palette.paper;
  context.fillRect(0, 0, width, height);
  band(context, width, height);

  leaf(context, centerX - height * 0.012, height * 0.36, height * 0.15, -0.5, palette.leaf);
  leaf(context, centerX + height * 0.012, height * 0.36, height * 0.12, 0.62, palette.leafDeep);

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = palette.title;
  context.font = `700 ${height * 0.17}px ${LABEL_FONT}`;
  context.fillText("BS資材", centerX, height * 0.56);
  context.fillStyle = palette.text;
  context.font = `400 ${height * 0.044}px ${LABEL_FONT}`;
  context.fillText("植物の力を引き出す液体資材", centerX, height * 0.645);
  context.fillStyle = palette.leafDeep;
  context.fillRect(centerX - height * 0.2, height * 0.68, height * 0.4, height * 0.004);
  context.fillStyle = palette.text;
  context.font = `700 ${height * 0.05}px ${LABEL_FONT}`;
  context.fillText("500mL", centerX, height * 0.75);

  wave(context, width, height, 0.1, 0.2, palette.waveLight);
  wave(context, width, height, 0.06, 0.13, palette.waveDeep);
}

function drawBackLabel(context: CanvasRenderingContext2D, width: number, height: number): void {
  const left = width * 0.12;
  context.fillStyle = palette.paper;
  context.fillRect(0, 0, width, height);
  band(context, width, height);

  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.fillStyle = palette.text;
  context.font = `700 ${height * 0.05}px ${LABEL_FONT}`;
  context.fillText("使用方法", left, height * 0.25);
  fineLines(context, left, height * 0.3, width * 0.76, height * 0.034, [1, 0.94, 1, 0.7]);
  context.font = `700 ${height * 0.05}px ${LABEL_FONT}`;
  context.fillText("成分", left, height * 0.5);
  fineLines(context, left, height * 0.55, width * 0.76, height * 0.034, [0.9, 1, 0.55]);

  const modules = [2, 1, 1, 2, 3, 1, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 2, 2, 1, 1, 3, 2];
  const unit = (width * 0.44) / modules.reduce((sum, module) => sum + module, 0);
  let x = width / 2 - width * 0.22;
  context.fillStyle = palette.barcode;
  for (const [index, module] of modules.entries()) {
    if (index % 2 === 0) context.fillRect(x, height * 0.72, module * unit, height * 0.13);
    x += module * unit;
  }
}

function labelCanvas(arc: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.height = 1024;
  canvas.width = Math.round((canvas.height * LABEL_RADIUS * arc) / (LABEL_TOP - LABEL_BOTTOM));
  return canvas;
}

function paint(
  canvas: HTMLCanvasElement,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): void {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ラベルを描く 2D コンテキストを作れませんでした。");
  draw(context, canvas.width, canvas.height);
}

function labelGeometry(arc: number, facing: number): CylinderGeometry {
  const geometry = new CylinderGeometry(
    LABEL_RADIUS,
    LABEL_RADIUS,
    LABEL_TOP - LABEL_BOTTOM,
    128,
    1,
    true,
    facing - arc / 2,
    arc,
  );
  geometry.translate(0, (LABEL_TOP + LABEL_BOTTOM) / 2, 0);
  return geometry;
}

function shadowTexture(): DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2);
      const alpha = Math.exp(-((distance / 0.42) ** 2)) * Math.max(0, 1 - distance);
      data.fill(Math.round(alpha * 255), (y * size + x) * 4, (y * size + x) * 4 + 4);
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function eveningFieldEnvironment(renderer: WebGLRenderer): WebGLRenderTarget {
  const scene = new Scene();
  const domeRadius = 30;
  const dome = new SphereGeometry(domeRadius, 64, 32);
  const sky = new Color(palette.sky);
  const horizon = new Color(palette.horizon);
  const ground = new Color(palette.ground);
  const color = new Color();
  const position = dome.getAttribute("position");
  const colors: number[] = [];
  for (let index = 0; index < position.count; index += 1) {
    const height = position.getY(index) / domeRadius;
    if (height >= 0) color.lerpColors(horizon, sky, Math.sqrt(height));
    else color.lerpColors(horizon, ground, Math.min(1, -height * 5));
    color.multiplyScalar(height >= 0 ? 0.8 - 0.3 * height : 0.8);
    colors.push(color.r, color.g, color.b);
  }
  dome.setAttribute("color", new Float32BufferAttribute(colors, 3));
  const domeMaterial = new MeshBasicMaterial({ side: BackSide, vertexColors: true });
  scene.add(new Mesh(dome, domeMaterial));

  const lightGeometry = (round: boolean) => {
    const geometry = new PlaneGeometry(1, 1, 24, 24);
    const corners = geometry.getAttribute("position");
    const falloff: number[] = [];
    for (let index = 0; index < corners.count; index += 1) {
      const across = Math.cos(corners.getX(index) * Math.PI);
      const along = Math.cos(corners.getY(index) * Math.PI);
      const value = round ? (across * along) ** 2 : across * along ** 0.35;
      falloff.push(value, value, value);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(falloff, 3));
    return geometry;
  };
  const lightGeometries = [lightGeometry(false), lightGeometry(true)];
  const lightMaterials = LIGHTS.map(
    (light) =>
      new MeshBasicMaterial({
        color: new Color(light.round ? palette.sun : palette.softbox).multiplyScalar(
          light.intensity,
        ),
        side: DoubleSide,
        vertexColors: true,
      }),
  );
  for (const [index, { position: at, width, height, round }] of LIGHTS.entries()) {
    const light = new Mesh(lightGeometries[round ? 1 : 0], lightMaterials[index]);
    light.position.copy(at);
    light.scale.set(width, height, 1);
    light.lookAt(CAMERA_TARGET);
    scene.add(light);
  }

  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(scene, 0, 0.1, 100, { size: ENVIRONMENT_SIZE });
  generator.dispose();
  dome.dispose();
  domeMaterial.dispose();
  for (const geometry of lightGeometries) geometry.dispose();
  for (const material of lightMaterials) material.dispose();
  return target;
}

function bakeMatcaps(renderer: WebGLRenderer) {
  const environment = eveningFieldEnvironment(renderer);
  const scene = new Scene();
  scene.environment = environment.texture;
  const sun = new DirectionalLight(new Color(palette.sun).lerp(new Color(palette.softbox), 0.5), 3);
  sun.position.copy(SUN);
  const sphere = new Mesh(new SphereGeometry(1, 128, 64));
  scene.add(sun, sphere);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.copy(VIEW).multiplyScalar(5);
  camera.lookAt(0, 0, 0);
  const bake = (finish: MeshStandardMaterial) => {
    const target = new WebGLRenderTarget(MATCAP_SIZE, MATCAP_SIZE, { type: HalfFloatType });
    sphere.material = finish;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    finish.dispose();
    return target;
  };
  const clear = bake(new MeshStandardMaterial({ color: new Color(0, 0, 0), roughness: 0.04 }));
  const satin = bake(new MeshStandardMaterial({ roughness: 0.4 }));
  renderer.setRenderTarget(null);
  sphere.geometry.dispose();
  environment.dispose();
  return { clear, satin };
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function grow(bounds: Bounds, camera: PerspectiveCamera, point: Vector3): void {
  point.applyMatrix4(camera.matrixWorldInverse);
  const depth = -point.z;
  bounds.minX = Math.min(bounds.minX, point.x / depth);
  bounds.maxX = Math.max(bounds.maxX, point.x / depth);
  bounds.minY = Math.min(bounds.minY, point.y / depth);
  bounds.maxY = Math.max(bounds.maxY, point.y / depth);
}

function frameCamera(camera: PerspectiveCamera, bounds: Bounds, width: number, height: number) {
  const aspect = width / height;
  const half =
    (FIT_MARGIN * Math.max(bounds.maxY - bounds.minY, (bounds.maxX - bounds.minX) / aspect)) / 2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const { near, far } = camera;
  camera.projectionMatrix.makePerspective(
    (centerX - half * aspect) * near,
    (centerX + half * aspect) * near,
    (centerY + half) * near,
    (centerY - half) * near,
    near,
    far,
  );
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

type Motion = "spin" | "still";

export function mountBottleScene(canvas: HTMLCanvasElement, onFirstFrame: () => void): () => void {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;
  renderer.toneMapping = NeutralToneMapping;

  const owned: { dispose(): void }[] = [];
  const keep = <Resource extends { dispose(): void }>(resource: Resource): Resource => {
    owned.push(resource);
    return resource;
  };

  const matcaps = bakeMatcaps(renderer);
  const clear = keep(matcaps.clear).texture;
  const satin = keep(matcaps.satin).texture;

  const glass = (side: Side) => {
    const material = keep(
      new MeshMatcapMaterial({
        matcap: clear,
        side,
        transparent: true,
        depthWrite: false,
        opacity: side === BackSide ? 0.04 : 0.08,
        blending: CustomBlending,
        blendSrc: OneFactor,
        blendDst: OneMinusSrcAlphaFactor,
        blendSrcAlpha: OneFactor,
        blendDstAlpha: OneMinusSrcAlphaFactor,
      }),
    );
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        GLASS_EDGE,
      );
    };
    return material;
  };
  const bodyGeometry = keep(new LatheGeometry(bodyProfile(), 128));
  const glassBack = new Mesh(bodyGeometry, glass(BackSide));
  const glassFront = new Mesh(bodyGeometry, glass(FrontSide));

  const level = new Plane(new Vector3(0, -1, 0), 0);
  const liquidSide = keep(
    new MeshMatcapMaterial({ transparent: true, depthWrite: false, clippingPlanes: [level] }),
  );
  liquidSide.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      LIQUID_SIDE,
    );
  };
  const liquid = new Mesh(keep(new LatheGeometry(liquidProfile(), 96)), liquidSide);
  const surfaceGeometry = keep(new CircleGeometry(1, 96));
  surfaceGeometry.rotateX(-Math.PI / 2);
  const liquidTop = keep(
    new MeshMatcapMaterial({
      matcap: clear,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    }),
  );
  liquidTop.defines = { ...liquidTop.defines, USE_UV: "" };
  liquidTop.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", LIQUID_TOP);
  };
  const surface = new Mesh(surfaceGeometry, liquidTop);

  const frontCanvas = labelCanvas(FRONT_LABEL_ARC);
  const backCanvas = labelCanvas(BACK_LABEL_ARC);
  const labelTexture = (source: HTMLCanvasElement) => {
    const texture = keep(new CanvasTexture(source));
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  };
  const frontTexture = labelTexture(frontCanvas);
  const backTexture = labelTexture(backCanvas);
  const print = (map: CanvasTexture) => keep(new MeshMatcapMaterial({ map, matcap: satin }));
  const labelInside = keep(
    new MeshMatcapMaterial({ color: palette.labelInside, matcap: satin, side: BackSide }),
  );
  const frontLabelGeometry = keep(labelGeometry(FRONT_LABEL_ARC, 0));
  const backLabelGeometry = keep(labelGeometry(BACK_LABEL_ARC, Math.PI));
  const labels = [
    new Mesh(frontLabelGeometry, print(frontTexture)),
    new Mesh(frontLabelGeometry, labelInside),
    new Mesh(backLabelGeometry, print(backTexture)),
    new Mesh(backLabelGeometry, labelInside),
  ];

  const plastic = (vertexColors: boolean) =>
    keep(new MeshMatcapMaterial({ color: palette.cap, matcap: satin, vertexColors }));
  const cap = new Mesh(keep(knurledCapGeometry()), plastic(true));
  const tamperBand = new Mesh(keep(new LatheGeometry(tamperBandProfile(), 96)), plastic(false));

  const shadowGeometry = keep(new PlaneGeometry(SHADOW_SIZE, SHADOW_SIZE));
  shadowGeometry.rotateX(-Math.PI / 2);
  const shadowFilm = keep(
    new MeshBasicMaterial({
      color: palette.shadow,
      alphaMap: keep(shadowTexture()),
      transparent: true,
      depthWrite: false,
    }),
  );
  const shadow = new Mesh(shadowGeometry, shadowFilm);

  for (const [order, mesh] of [shadow, glassBack, liquid, surface, glassFront].entries()) {
    mesh.renderOrder = order;
  }

  const spin = new Group();
  spin.position.y = -PIVOT;
  spin.add(cap, tamperBand, ...labels, glassBack, liquid, glassFront);
  const tilt = new Group();
  tilt.add(spin);
  const scene = new Scene();
  scene.add(shadow, tilt, surface);

  const axisPoint = new Vector3();
  const place = (pose: Pose) => {
    tilt.position.y = pose.lift + PIVOT;
    tilt.rotation.z = -pose.lean;
    spin.rotation.y = pose.spin;
    tilt.updateMatrixWorld(true);
    spin.localToWorld(axisPoint.set(0, LIQUID_LEVEL, 0));
    level.constant = axisPoint.y;
    surface.position.copy(axisPoint);
    surface.scale.set(LIQUID_RADIUS / Math.cos(pose.lean), 1, LIQUID_RADIUS);
    shadow.scale.setScalar(0.9 + 0.5 * pose.lift);
    shadowFilm.opacity = 0.6 - 0.6 * pose.lift;
  };

  const camera = new PerspectiveCamera(20, 1, 0.1, 40);
  camera.position.copy(VIEW).multiplyScalar(CAMERA_DISTANCE).add(CAMERA_TARGET);
  camera.lookAt(CAMERA_TARGET);
  camera.updateMatrixWorld();

  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const point = new Vector3();
  for (const pose of [
    poseAt(0),
    { ...STILL, lift: FLOAT + BOB },
    { ...STILL, lift: FLOAT - BOB },
  ]) {
    place(pose);
    shadow.updateMatrixWorld();
    for (const mesh of [glassFront, cap, shadow]) {
      const position = mesh.geometry.getAttribute("position");
      for (let index = 0; index < position.count; index += 1) {
        point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
        grow(bounds, camera, point);
      }
    }
  }

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
    place(poseAt(elapsed));
    draw();
  };

  const sync = () => {
    if (!compiled || disposed) return;
    if (motion === "spin" && inView) {
      renderer.setAnimationLoop(tick);
      return;
    }
    renderer.setAnimationLoop(null);
    lastFrame = null;
    if (motion === "spin") return;
    place(STILL);
    draw();
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    frameCamera(camera, bounds, width, height);
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

  place(STILL);
  resize();
  const fonts = ["400", "700"].map((weight) =>
    document.fonts.load(
      `${weight} 48px ${LABEL_FONT}`,
      "BIOSTIMULANT BS資材植物の力を引き出す液体使用方法成分500mL",
    ),
  );
  void Promise.all(fonts)
    .then(() => {
      if (disposed) return;
      paint(frontCanvas, drawFrontLabel);
      paint(backCanvas, drawBackLabel);
      frontTexture.needsUpdate = true;
      backTexture.needsUpdate = true;
      return renderer.compileAsync(scene, camera);
    })
    .then(() => {
      if (disposed) return;
      compiled = true;
      sizeObserver.observe(canvas);
      viewObserver.observe(canvas);
    })
    .catch(Sentry.captureException);

  return () => {
    disposed = true;
    renderer.setAnimationLoop(null);
    reducedMotion.removeEventListener("change", handleMotionChange);
    viewObserver.disconnect();
    sizeObserver.disconnect();
    for (const resource of owned) resource.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
