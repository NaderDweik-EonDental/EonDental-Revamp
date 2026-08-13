import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { CameraPreset } from '../domain/viewerRules.js';

type TeethViewportProps = {
  upperFile: File | null;
  lowerFile: File | null;
  camera: CameraPreset;
  active: boolean;
  onStats?: (stats: { triangles: number }) => void;
  onError?: (message: string) => void;
};

const CAMERA_VIEWS: Record<
  CameraPreset,
  { position: THREE.Vector3; up: THREE.Vector3 }
> = {
  front: {
    position: new THREE.Vector3(0, 20, 120),
    up: new THREE.Vector3(0, 1, 0),
  },
  occlusal: {
    position: new THREE.Vector3(0, 140, 8),
    up: new THREE.Vector3(0, 0, -1),
  },
  lateral: {
    position: new THREE.Vector3(130, 30, 20),
    up: new THREE.Vector3(0, 1, 0),
  },
};

const UPPER_COLOR = 0xf2ebe0;
const LOWER_COLOR = 0xe8f0f7;

export function TeethViewport({
  upperFile,
  lowerFile,
  camera,
  active,
  onStats,
  onError,
}: TeethViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    modelGroup: THREE.Group;
    frame: number;
    resizeObserver: ResizeObserver;
  } | null>(null);
  const onStatsRef = useRef(onStats);
  const onErrorRef = useRef(onError);
  const cameraRef = useRef(camera);
  onStatsRef.current = onStats;
  onErrorRef.current = onError;
  cameraRef.current = camera;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f141c);

    const perspective = new THREE.PerspectiveCamera(42, 1, 0.1, 5000);
    perspective.position.copy(CAMERA_VIEWS.front.position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(perspective, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 20;
    controls.maxDistance = 600;
    controls.target.set(0, 0, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x223044, 1.05);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(60, 90, 40);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9ec9ff, 0.45);
    fill.position.set(-50, 20, -30);
    scene.add(fill);

    const grid = new THREE.GridHelper(220, 22, 0x2a3545, 0x1a2230);
    grid.position.y = -40;
    scene.add(grid);

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      perspective.aspect = width / height;
      perspective.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frame = 0;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      frame = requestAnimationFrame(tick);
      controls.update();
      renderer.render(scene, perspective);
    };
    tick();

    sceneRef.current = {
      renderer,
      scene,
      camera: perspective,
      controls,
      modelGroup,
      frame,
      resizeObserver,
    };

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      controls.dispose();
      disposeObject(modelGroup);
      renderer.dispose();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = sceneRef.current;
    if (!runtime) return;

    let cancelled = false;
    const loader = new STLLoader();

    const loadArch = async (
      file: File | null,
      color: number,
      name: string,
    ): Promise<THREE.Mesh | null> => {
      if (!file) return null;
      const buffer = await file.arrayBuffer();
      if (cancelled) return null;
      const geometry = loader.parse(buffer);
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.05,
        roughness: 0.45,
        flatShading: false,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    const run = async () => {
      disposeObject(runtime.modelGroup);
      runtime.modelGroup.clear();
      runtime.modelGroup.position.set(0, 0, 0);

      if (!active || (!upperFile && !lowerFile)) {
        onStatsRef.current?.({ triangles: 0 });
        return;
      }

      try {
        const [upper, lower] = await Promise.all([
          loadArch(upperFile, UPPER_COLOR, 'upper'),
          loadArch(lowerFile, LOWER_COLOR, 'lower'),
        ]);
        if (cancelled) {
          upper?.geometry.dispose();
          lower?.geometry.dispose();
          return;
        }

        if (upper) runtime.modelGroup.add(upper);
        if (lower) runtime.modelGroup.add(lower);

        const box = new THREE.Box3().setFromObject(runtime.modelGroup);
        if (!box.isEmpty()) {
          const center = box.getCenter(new THREE.Vector3());
          runtime.modelGroup.position.sub(center);
        }

        fitCameraToObject(runtime.camera, runtime.controls, runtime.modelGroup);
        applyCameraPreset(
          runtime.camera,
          runtime.controls,
          cameraRef.current,
        );

        let triangles = 0;
        runtime.modelGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const geo = obj.geometry as THREE.BufferGeometry;
            const index = geo.index;
            triangles += index
              ? index.count / 3
              : (geo.getAttribute('position')?.count ?? 0) / 3;
          }
        });
        onStatsRef.current?.({ triangles: Math.round(triangles) });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to parse STL file';
        onErrorRef.current?.(message);
        onStatsRef.current?.({ triangles: 0 });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [upperFile, lowerFile, active]);

  useEffect(() => {
    const runtime = sceneRef.current;
    if (!runtime || !active) return;
    applyCameraPreset(runtime.camera, runtime.controls, camera);
  }, [camera, active]);

  return <div ref={hostRef} className="viewer__canvas-host" />;
}

function applyCameraPreset(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  preset: CameraPreset,
) {
  const view = CAMERA_VIEWS[preset];
  const target = controls.target.clone();
  const distance = camera.position.distanceTo(target) || 140;
  const direction = view.position.clone().normalize();
  camera.up.copy(view.up);
  camera.position.copy(target.clone().add(direction.multiplyScalar(distance)));
  controls.update();
}

function fitCameraToObject(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const fitDistance =
    maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));

  controls.target.copy(center);
  camera.near = Math.max(0.1, fitDistance / 100);
  camera.far = fitDistance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy(center.clone().add(new THREE.Vector3(0, 0.15, 1).normalize().multiplyScalar(fitDistance * 1.65)));
  controls.update();
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      const material = obj.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    }
  });
}
