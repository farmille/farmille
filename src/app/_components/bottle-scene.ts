import {
  BackSide,
  CanvasTexture,
  CircleGeometry,
  Color,
  CubicBezierCurve,
  CylinderGeometry,
  DataTexture,
  DoubleSide,
  FrontSide,
  Group,
  LatheGeometry,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Plane,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Side,
} from "three";

import { token } from "../../../styled-system/tokens";

const palette = {
  glass: token("colors.card"),
  label: token("colors.green.50"),
  band: token("colors.green.700"),
  leaf: token("colors.green.500"),
  vein: token("colors.green.800"),
  title: token("colors.ink2"),
  text: token("colors.ink3"),
  waveLight: token("colors.green.300"),
  waveDeep: token("colors.green.600"),
  liquid: token("colors.amber"),
  capLine: token("colors.ink3"),
  barcode: token("colors.ink"),
  shadow: token("colors.ink"),
};

const BODY_RADIUS = 0.5;
const BASE_CORNER = 0.09;
const WALL_TOP = 1.55;
const NECK_RADIUS = 0.215;
const NECK_RING_BOTTOM = 2.065;
const NECK_RING_TOP = 2.1;
const LABEL_RADIUS = 0.503;
const LABEL_BOTTOM = 0.26;
const LABEL_TOP = 1.18;
const FRONT_LABEL_ARC = Math.PI * 1.12;
const BACK_LABEL_ARC = Math.PI * 0.6;
const CAP_RADIUS = 0.255;
const CAP_BOTTOM = 2.115;
const CAP_TOP = 2.45;
const CAP_BEVEL = 0.03;
const KNURL_RIDGES = 48;
const SCALE_ANGLE = (FRONT_LABEL_ARC / 2 + Math.PI - BACK_LABEL_ARC / 2) / 2;
const SCALE_BOTTOM = 0.4;
const SCALE_STEP = 0.1;
const SCALE_TICKS = 11;
const LIQUID_RADIUS = 0.47;
const LIQUID_LEVEL = 1.32;
const PIVOT = 1.2;
const SHADOW_SIZE = 1.5;

const LEAN = (18 * Math.PI) / 180;
const FLOAT = 0.3;
const DROP = 0.18;
const BOB = 0.035;
const BOB_MS = 4_800;
const CAMERA_ELEVATION = (24 * Math.PI) / 180;
const FIT_MARGIN = 1.08;

const TURN_MS = 14_000;
const INTRO_MS = 1_800;
const INTRO_TURN = Math.PI * 0.7;
const REST_ANGLE = -0.35;
const MAX_FRAME_MS = 100;

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

const VERTEX_SHADER = `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec2 vUv;
#include <clipping_planes_pars_vertex>
void main() {
  vLocal = position;
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}
`;

const FRAGMENT_COMMON = `
varying vec3 vLocal;
varying vec3 vNormal;
varying vec2 vUv;
#include <clipping_planes_pars_fragment>
const vec3 LIGHT = vec3(0.48, 0.62, 0.62);
float hairline(float distance) {
  float width = max(fwidth(distance), 1e-5);
  return 1.0 - smoothstep(0.5 * width, 1.5 * width, abs(distance));
}
vec3 facingNormal() {
  vec3 normal = normalize(vNormal);
  return gl_FrontFacing ? normal : -normal;
}
float outline(vec3 normal) {
  float facing = abs(normal.z);
  return 1.0 - smoothstep(0.0, max(1.5 * fwidth(facing), 1e-4), facing);
}
float paper(vec3 normal, float shade) {
  return mix(shade, 1.0, max(dot(normal, normalize(LIGHT)), 0.0));
}
`;

const GLASS_SHADER = `
${FRAGMENT_COMMON}
uniform vec3 uColor;
uniform float uFill;
uniform float uRim;
uniform float uLine;
uniform float uRings[4];
uniform float uScaleAngle;
uniform vec3 uScale;
float scaleTicks() {
  float turn = atan(vLocal.x, vLocal.z) - uScaleAngle;
  float across = atan(sin(turn), cos(turn)) * length(vLocal.xz);
  float rung = (vLocal.y - uScale.x) / uScale.y;
  float index = floor(rung + 0.5);
  float reach = mix(0.035, 0.075, step(mod(index, 5.0), 0.5));
  float along = 1.0 - smoothstep(0.5, 1.5, abs(rung - index) * uScale.y / max(fwidth(vLocal.y), 1e-5));
  float span = 1.0 - smoothstep(reach - 0.004, reach + 0.004, abs(across));
  return along * span * step(0.0, index) * step(index, uScale.z - 1.0) * step(abs(across), 0.3);
}
void main() {
  vec3 normal = facingNormal();
  float rim = pow(1.0 - abs(normal.z), 2.5);
  float glint = pow(max(dot(normal, normalize(LIGHT + vec3(0.0, 0.0, 1.0))), 0.0), 60.0);
  float ink = max(outline(normal), scaleTicks());
  for (int index = 0; index < 4; index += 1) ink = max(ink, hairline(vLocal.y - uRings[index]));
  gl_FragColor = vec4(uColor, max(mix(uFill, uRim, rim) + 0.6 * glint, ink * uLine));
  #include <colorspace_fragment>
}
`;

const LABEL_SHADER = `
${FRAGMENT_COMMON}
uniform sampler2D uMap;
uniform vec2 uSize;
uniform vec3 uEdge;
void main() {
  vec3 normal = facingNormal();
  vec2 inset = min(vUv, 1.0 - vUv) * uSize;
  float edge = max(max(hairline(inset.x), hairline(inset.y)), outline(normal));
  vec3 paint = texture2D(uMap, vUv).rgb * paper(normal, 0.8);
  gl_FragColor = vec4(mix(paint, uEdge, edge), 0.94);
  #include <colorspace_fragment>
}
`;

const LIQUID_SHADER = `
${FRAGMENT_COMMON}
uniform vec3 uColor;
void main() {
  #include <clipping_planes_fragment>
  float rim = pow(1.0 - abs(facingNormal().z), 2.0);
  gl_FragColor = vec4(uColor, mix(0.3, 0.72, rim));
  #include <colorspace_fragment>
}
`;

const SURFACE_SHADER = `
${FRAGMENT_COMMON}
uniform vec3 uColor;
uniform vec3 uShine;
void main() {
  float edge = hairline(1.0 - 2.0 * length(vUv - 0.5));
  gl_FragColor = vec4(mix(uColor, uShine, 0.3 + 0.6 * edge), max(0.5, 0.9 * edge));
  #include <colorspace_fragment>
}
`;

const CAP_SHADER = `
${FRAGMENT_COMMON}
uniform vec3 uColor;
uniform vec3 uLine;
uniform float uRings[2];
uniform float uRidges;
float knurl() {
  float front = atan(vLocal.x, vLocal.z);
  float back = atan(-vLocal.x, -vLocal.z);
  float width = min(fwidth(front), fwidth(back)) * uRidges / 6.2831853;
  float phase = front * uRidges / 6.2831853;
  float distance = abs(fract(phase) - 0.5);
  float inBand = step(uRings[0], vLocal.y) * step(vLocal.y, uRings[1]);
  return inBand * (1.0 - smoothstep(0.5 * width, 1.5 * width, distance));
}
void main() {
  vec3 normal = facingNormal();
  float ink = max(outline(normal), 0.55 * knurl());
  for (int index = 0; index < 2; index += 1) ink = max(ink, hairline(vLocal.y - uRings[index]));
  gl_FragColor = vec4(mix(uColor * paper(normal, 0.78), uLine, 0.75 * ink), 1.0);
  #include <colorspace_fragment>
}
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

function bodyProfile(): Vector2[] {
  const shoulder = new CubicBezierCurve(
    new Vector2(BODY_RADIUS, WALL_TOP),
    new Vector2(BODY_RADIUS, WALL_TOP + 0.33),
    new Vector2(NECK_RADIUS, WALL_TOP + 0.25),
    new Vector2(NECK_RADIUS, WALL_TOP + 0.49),
  );
  return [
    new Vector2(0, 0),
    ...arc(BODY_RADIUS - BASE_CORNER, BASE_CORNER, BASE_CORNER, -Math.PI / 2, 0, 8),
    ...shoulder.getPoints(24),
    new Vector2(0.24, NECK_RING_BOTTOM),
    new Vector2(0.24, NECK_RING_TOP),
    new Vector2(NECK_RADIUS, CAP_BOTTOM - 0.005),
    new Vector2(NECK_RADIUS, CAP_BOTTOM + 0.06),
    new Vector2(0, CAP_BOTTOM + 0.06),
  ];
}

function liquidProfile(): Vector2[] {
  const floor = BODY_RADIUS - LIQUID_RADIUS;
  const corner = BASE_CORNER - floor;
  return [
    new Vector2(0, floor),
    ...arc(LIQUID_RADIUS - corner, floor + corner, corner, -Math.PI / 2, 0, 8),
    new Vector2(LIQUID_RADIUS, WALL_TOP),
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
      ...arc(CAP_RADIUS - CAP_BEVEL, CAP_TOP - CAP_BEVEL, CAP_BEVEL, 0, Math.PI / 2, 6),
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
    const ridge = 1 + 0.018 * Math.sin(Math.atan2(x, z) * KNURL_RIDGES);
    position.setXYZ(index, x * ridge, y, z * ridge);
  }
  geometry.computeVertexNormals();
  return geometry;
}

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

  const modules = [2, 1, 1, 2, 3, 1, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 1, 2, 2, 1, 1, 3, 2];
  const unit = (width * 0.44) / modules.reduce((sum, module) => sum + module, 0);
  let x = centerX - width * 0.22;
  context.fillStyle = palette.barcode;
  for (const [index, module] of modules.entries()) {
    if (index % 2 === 0) context.fillRect(x, height * 0.75, module * unit, height * 0.15);
    x += module * unit;
  }
}

function labelArtwork(
  renderer: WebGLRenderer,
  arc: number,
  draw: (context: CanvasRenderingContext2D, width: number, height: number) => void,
): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.height = 576;
  canvas.width = Math.round((canvas.height * LABEL_RADIUS * arc) / (LABEL_TOP - LABEL_BOTTOM));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("ラベルを描く 2D コンテキストを作れませんでした。");
  draw(context, canvas.width, canvas.height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function labelGeometry(arc: number, facing: number): CylinderGeometry {
  const geometry = new CylinderGeometry(
    LABEL_RADIUS,
    LABEL_RADIUS,
    LABEL_TOP - LABEL_BOTTOM,
    96,
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
      const fade = Math.min(Math.max((1 - distance) / 0.7, 0), 1);
      const alpha = fade * fade * (3 - 2 * fade);
      data.fill(Math.round(alpha * 255), (y * size + x) * 4, (y * size + x) * 4 + 4);
    }
  }
  const texture = new DataTexture(data, size, size);
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function grow(bounds: Bounds, point: Vector3): void {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxY = Math.max(bounds.maxY, point.y);
}

function frameCamera(camera: OrthographicCamera, bounds: Bounds, width: number, height: number) {
  const aspect = width / height;
  const halfHeight =
    (FIT_MARGIN * Math.max(bounds.maxY - bounds.minY, (bounds.maxX - bounds.minX) / aspect)) / 2;
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  camera.left = centerX - halfHeight * aspect;
  camera.right = centerX + halfHeight * aspect;
  camera.top = centerY + halfHeight;
  camera.bottom = centerY - halfHeight;
  camera.updateProjectionMatrix();
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

  const owned: { dispose(): void }[] = [];
  const keep = <Resource extends { dispose(): void }>(resource: Resource): Resource => {
    owned.push(resource);
    return resource;
  };
  const shader = (fragmentShader: string, side: Side, uniforms: ShaderMaterial["uniforms"]) =>
    keep(
      new ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader,
        uniforms,
        side,
        transparent: true,
        depthWrite: false,
      }),
    );

  const glassRings = { value: [BASE_CORNER, WALL_TOP, NECK_RING_BOTTOM, NECK_RING_TOP] };
  const glassScale = {
    uScaleAngle: { value: SCALE_ANGLE },
    uScale: { value: new Vector3(SCALE_BOTTOM, SCALE_STEP, SCALE_TICKS) },
  };
  const bodyGeometry = keep(new LatheGeometry(bodyProfile(), 96));
  const glassBack = new Mesh(
    bodyGeometry,
    shader(GLASS_SHADER, BackSide, {
      uColor: { value: new Color(palette.glass) },
      uFill: { value: 0.04 },
      uRim: { value: 0.16 },
      uLine: { value: 0.32 },
      uRings: glassRings,
      ...glassScale,
    }),
  );
  const glassFront = new Mesh(
    bodyGeometry,
    shader(GLASS_SHADER, FrontSide, {
      uColor: { value: new Color(palette.glass) },
      uFill: { value: 0.08 },
      uRim: { value: 0.5 },
      uLine: { value: 0.9 },
      uRings: glassRings,
      ...glassScale,
    }),
  );

  const level = new Plane(new Vector3(0, -1, 0), 0);
  const liquidMaterial = shader(LIQUID_SHADER, DoubleSide, {
    uColor: { value: new Color(palette.liquid) },
  });
  liquidMaterial.clipping = true;
  liquidMaterial.clippingPlanes = [level];
  const liquid = new Mesh(keep(new LatheGeometry(liquidProfile(), 64)), liquidMaterial);
  const surfaceGeometry = keep(new CircleGeometry(1, 96));
  surfaceGeometry.rotateX(-Math.PI / 2);
  const surface = new Mesh(
    surfaceGeometry,
    shader(SURFACE_SHADER, DoubleSide, {
      uColor: { value: new Color(palette.liquid) },
      uShine: { value: new Color(palette.glass) },
    }),
  );

  const labelMaterial = (arc: number, map: CanvasTexture) => {
    const material = shader(LABEL_SHADER, FrontSide, {
      uMap: { value: map },
      uSize: { value: new Vector2(LABEL_RADIUS * arc, LABEL_TOP - LABEL_BOTTOM) },
      uEdge: { value: new Color(palette.band) },
    });
    material.depthWrite = true;
    return material;
  };
  const frontLabel = new Mesh(
    keep(labelGeometry(FRONT_LABEL_ARC, 0)),
    labelMaterial(FRONT_LABEL_ARC, keep(labelArtwork(renderer, FRONT_LABEL_ARC, drawFrontLabel))),
  );
  const backLabel = new Mesh(
    keep(labelGeometry(BACK_LABEL_ARC, Math.PI)),
    labelMaterial(BACK_LABEL_ARC, keep(labelArtwork(renderer, BACK_LABEL_ARC, drawBackLabel))),
  );

  const capMaterial = shader(CAP_SHADER, FrontSide, {
    uColor: { value: new Color(palette.glass) },
    uLine: { value: new Color(palette.capLine) },
    uRings: { value: [CAP_BOTTOM + 0.02, CAP_TOP - CAP_BEVEL - 0.01] },
    uRidges: { value: KNURL_RIDGES },
  });
  capMaterial.transparent = false;
  capMaterial.depthWrite = true;
  const cap = new Mesh(keep(knurledCapGeometry()), capMaterial);

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

  for (const [order, mesh] of [
    shadow,
    frontLabel,
    backLabel,
    glassBack,
    liquid,
    surface,
    glassFront,
  ].entries()) {
    mesh.renderOrder = order;
  }

  const spin = new Group();
  spin.position.y = -PIVOT;
  spin.add(cap, frontLabel, backLabel, glassBack, liquid, glassFront);
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

  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 40);
  camera.position.set(0, 10 * Math.sin(CAMERA_ELEVATION), 10 * Math.cos(CAMERA_ELEVATION));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();

  const bounds: Bounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  const point = new Vector3();
  for (const pose of [
    poseAt(0),
    { ...STILL, lift: FLOAT + BOB },
    { ...STILL, lift: FLOAT - BOB },
  ]) {
    place(pose);
    for (const mesh of [glassFront, cap]) {
      const position = mesh.geometry.getAttribute("position");
      for (let index = 0; index < position.count; index += 1) {
        point.fromBufferAttribute(position, index).applyMatrix4(mesh.matrixWorld);
        grow(bounds, point.applyMatrix4(camera.matrixWorldInverse));
      }
    }
  }
  for (const [x, z] of [
    [-0.45, -0.45],
    [0.45, 0.45],
  ]) {
    grow(bounds, point.set(x, 0, z).applyMatrix4(camera.matrixWorldInverse));
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
    for (const resource of owned) resource.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
