"use client";

import { useEffect, useRef, useState } from "react";
import { CarFront } from "lucide-react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { BodyType } from "@/lib/garage/types";

// Procedural low-poly car. This stands in for an AI-generated model; the
// component's props (colors + body type) are the hook for swapping that in.

interface CarSceneProps {
  bodyColor: string;
  roofColor?: string;
  bodyType: BodyType;
}

type P = [number, number];

interface Profile {
  length: number;
  width: number;
  wheelRadius: number;
  frontAxle: number;
  rearAxle: number;
  /** Side silhouette of the lower body, front of car at +x. */
  body: P[];
  /** Greenhouse silhouette: [windshield base, windshield top, roof rear, rear glass base]. */
  cabin: [P, P, P, P];
}

const PROFILES: Record<BodyType, Profile> = {
  hatchback: {
    length: 3.9,
    width: 1.75,
    wheelRadius: 0.33,
    frontAxle: 1.25,
    rearAxle: -1.25,
    body: [[1.97, 0.55], [1.85, 0.82], [0.9, 0.93], [-1.88, 0.93], [-1.97, 0.6]],
    cabin: [[0.82, 0.93], [0.12, 1.4], [-1.6, 1.42], [-1.84, 0.93]],
  },
  sedan: {
    length: 4.6,
    width: 1.8,
    wheelRadius: 0.33,
    frontAxle: 1.45,
    rearAxle: -1.35,
    body: [[2.3, 0.55], [2.18, 0.8], [1.0, 0.92], [-1.6, 0.95], [-2.25, 0.92], [-2.32, 0.6]],
    cabin: [[0.95, 0.92], [0.2, 1.38], [-0.95, 1.4], [-1.6, 0.95]],
  },
  suv: {
    length: 4.5,
    width: 1.9,
    wheelRadius: 0.38,
    frontAxle: 1.4,
    rearAxle: -1.4,
    body: [[2.25, 0.65], [2.12, 1.0], [1.05, 1.1], [-2.12, 1.1], [-2.25, 0.7]],
    cabin: [[0.98, 1.1], [0.25, 1.72], [-1.95, 1.75], [-2.1, 1.1]],
  },
};

function buildCar(profile: Profile, bodyColor: string, roofColor: string) {
  const car = new THREE.Group();
  const flat = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.55, metalness: 0.1, ...extra });

  const paint = flat(bodyColor, { roughness: 0.35, metalness: 0.25 });
  const roofPaint = flat(roofColor, { roughness: 0.35 });
  const glass = flat("#b9cded", { roughness: 0.15, metalness: 0.6 });
  const trim = flat("#1b1b1b", { roughness: 0.8 });
  const rubber = flat("#222222", { roughness: 0.95 });
  const rim = flat("#c9ccd1", { roughness: 0.3, metalness: 0.8 });
  const chrome = flat("#e7e9ec", { roughness: 0.2, metalness: 0.9 });

  const { width: W, wheelRadius: R, frontAxle, rearAxle, length } = profile;
  const halfL = length / 2;
  const floor = R * 0.75;
  const archR = R + 0.07;

  // Lower body: side profile with wheel arches, extruded across the width.
  const shape = new THREE.Shape();
  shape.moveTo(-halfL, floor);
  shape.lineTo(rearAxle - archR, floor);
  shape.absarc(rearAxle, R, archR, Math.PI, 0, true);
  shape.lineTo(frontAxle - archR, floor);
  shape.absarc(frontAxle, R, archR, Math.PI, 0, true);
  shape.lineTo(halfL, floor);
  profile.body.forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();

  const extrude = (s: THREE.Shape, depth: number, bevel = 0.05) => {
    const g = new THREE.ExtrudeGeometry(s, {
      depth,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 1,
      curveSegments: 5,
    });
    g.translate(0, 0, -depth / 2);
    return g;
  };

  const body = new THREE.Mesh(extrude(shape, W - 0.1, 0.06), paint);
  car.add(body);

  // Greenhouse (glass) with a contrasting roof slab and pillars.
  const [ws0, ws1, rf1, rg0] = profile.cabin;
  const cabinW = W - 0.28;
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(...ws0);
  cabinShape.lineTo(...ws1);
  cabinShape.lineTo(...rf1);
  cabinShape.lineTo(...rg0);
  cabinShape.closePath();
  car.add(new THREE.Mesh(extrude(cabinShape, cabinW, 0.03), glass));

  const roofShape = new THREE.Shape();
  roofShape.moveTo(ws1[0] + 0.04, ws1[1] - 0.02);
  roofShape.lineTo(ws1[0] + 0.02, ws1[1] + 0.06);
  roofShape.lineTo(rf1[0] - 0.04, rf1[1] + 0.06);
  roofShape.lineTo(rf1[0] - 0.02, rf1[1] - 0.02);
  roofShape.closePath();
  car.add(new THREE.Mesh(extrude(roofShape, cabinW + 0.06, 0.03), roofPaint));

  const pillar = (a: P, b: P, z: number) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), roofPaint);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
    m.rotation.z = Math.atan2(dy, dx);
    return m;
  };
  const midX = (ws1[0] + rf1[0]) / 2 + 0.15;
  const roofYAt = (x: number) => ws1[1] + ((x - ws1[0]) / (rf1[0] - ws1[0])) * (rf1[1] - ws1[1]);
  for (const side of [-1, 1]) {
    const z = side * (cabinW / 2 + 0.02);
    car.add(pillar(ws0, ws1, z)); // A
    car.add(pillar([midX, ws0[1]], [midX, roofYAt(midX)], z)); // B
    car.add(pillar(rg0, rf1, z)); // C
  }

  // Front: grille, headlights, bumper trim.
  const front = profile.body[0][0];
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, W * 0.5), trim);
  grille.position.set(halfL + 0.02, floor + 0.28, 0);
  car.add(grille);
  const grilleBar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, W * 0.5), chrome);
  grilleBar.position.copy(grille.position);
  car.add(grilleBar);

  const lampMat = flat("#fff6d6", { emissive: "#fff2c0", emissiveIntensity: 0.35 });
  const tailMat = flat("#b3121c", { emissive: "#6e0a10", emissiveIntensity: 0.4 });
  for (const side of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 7), lampMat);
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(front - 0.06, profile.body[1][1] - 0.08, side * W * 0.32);
    car.add(lamp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 4, 7), chrome);
    ring.rotation.y = Math.PI / 2;
    ring.position.copy(lamp.position).add(new THREE.Vector3(0.045, 0, 0));
    car.add(ring);

    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.22), tailMat);
    const rear = profile.body[profile.body.length - 1];
    tail.position.set(rear[0] - 0.01, rear[1] + 0.12, side * (W / 2 - 0.2));
    car.add(tail);

    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.16), roofPaint);
    mirror.position.set(ws0[0] - 0.12, ws0[1] + 0.1, side * (W / 2 + 0.03));
    car.add(mirror);
  }

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, W - 0.05), trim);
  bumper.position.set(halfL + 0.01, floor + 0.05, 0);
  car.add(bumper);
  const rearBumper = bumper.clone();
  rearBumper.position.x = -halfL - 0.01;
  car.add(rearBumper);

  // Wheels.
  const tireGeo = new THREE.CylinderGeometry(R, R, 0.24, 9);
  const rimGeo = new THREE.CylinderGeometry(R * 0.62, R * 0.62, 0.25, 5);
  for (const x of [frontAxle, rearAxle]) {
    for (const side of [-1, 1]) {
      const wheel = new THREE.Group();
      wheel.add(new THREE.Mesh(tireGeo, rubber));
      wheel.add(new THREE.Mesh(rimGeo, rim));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, R, side * (W / 2 - 0.1));
      car.add(wheel);
    }
  }

  car.traverse((o) => {
    if (o instanceof THREE.Mesh) o.castShadow = true;
  });
  return car;
}

function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
    }
  });
}

/** Breathing room around the car's bounding sphere (1 = touching the edges). */
const FRAME_MARGIN = 1.04;

export function CarScene({ bodyColor, roofColor, bodyType }: CarSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  // Re-frames the camera around a car's bounding sphere; set up by the scene effect.
  const frameRef = useRef<((bounds: THREE.Sphere) => void) | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  // Renderer, camera, lights and controls: created once per mount.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL (blocked GPU, old hardware, some privacy modes).
      setUnsupported(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // CSS owns the displayed size so the canvas always tracks its container;
    // three.js only sets the drawing-buffer resolution (setSize(..., false)).
    // A fixed pixel width here would prop the layout open after a resize.
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(4.9, 2.7, 4.9);

    scene.add(new THREE.HemisphereLight("#ffffff", "#c8c2b8", 1.6));
    const sun = new THREE.DirectionalLight("#ffffff", 2.2);
    sun.position.set(4, 8, 3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -4;
    sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 4;
    sun.shadow.camera.bottom = -4;
    sun.shadow.radius = 6;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4, 32),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    sceneRef.current = scene;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.6, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    controls.autoRotateSpeed = 0.8;

    // Fit the car's bounding sphere inside the view. A sphere has the same
    // silhouette from every direction, so the whole car stays in frame however
    // it's rotated (even looking straight down) and for every body type.
    let bounds: THREE.Sphere | null = null;
    const frame = () => {
      if (!bounds) return;
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const distance = (bounds.radius * FRAME_MARGIN) / Math.sin(Math.min(vFov, hFov) / 2);
      const direction = camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(bounds.center);
      camera.position.copy(bounds.center).addScaledVector(direction, distance);
      controls.update();
    };
    frameRef.current = (next) => {
      bounds = next;
      frame();
    };

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      frame();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      disposeTree(scene);
      sceneRef.current = null;
      frameRef.current = null;
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // The car itself: swapped whenever colors or body style change, so live
  // edits (e.g. dragging a color picker) don't recreate the WebGL context.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const car = buildCar(PROFILES[bodyType], bodyColor, roofColor ?? bodyColor);
    scene.add(car);
    // Colors don't change the car's size, but body style does: re-frame.
    frameRef.current?.(new THREE.Box3().setFromObject(car).getBoundingSphere(new THREE.Sphere()));
    return () => {
      scene.remove(car);
      disposeTree(car);
    };
  }, [bodyColor, roofColor, bodyType]);

  if (unsupported) {
    return (
      <div className="flex h-full w-full items-center justify-center" role="img" aria-label="Vehicle preview unavailable">
        <CarFront className="h-20 w-20" strokeWidth={1} style={{ color: bodyColor }} />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className="h-full w-full cursor-grab active:cursor-grabbing"
      role="img"
      aria-label="Low-poly 3D render of your vehicle. Drag to rotate."
    />
  );
}
