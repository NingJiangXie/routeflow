import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function SimulationCanvas3D({ grid, start, goal, path, dynamicObstacles, robotIndex, running, theme = 'light' }) {
  const mountRef = useRef(null);
  const stateRef = useRef({ grid, start, goal, path, dynamicObstacles, robotIndex, running, theme });
  const worldRef = useRef({ angle: -0.72, pitch: 0.72, dragging: false, lastX: 0, lastY: 0 });

  stateRef.current = { grid, start, goal, path, dynamicObstacles, robotIndex, running, theme };

  useEffect(() => {
    const mount = mountRef.current;
    const world = worldRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const group = new THREE.Group();
    let raf = 0;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = 'simulation-3d-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    mount.appendChild(renderer.domElement);

    applySceneTheme(scene, theme);
    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 1.7));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.7);
    keyLight.position.set(18, 32, 18);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 90;
    keyLight.shadow.camera.left = -42;
    keyLight.shadow.camera.right = 42;
    keyLight.shadow.camera.top = 42;
    keyLight.shadow.camera.bottom = -42;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x9aa7ff, 1.65);
    rimLight.position.set(-20, 18, -22);
    scene.add(rimLight);

    const blueWash = new THREE.PointLight(0x9bc7ff, 38, 120);
    blueWash.position.set(0, 18, 0);
    scene.add(blueWash);

    world.group = group;
    world.renderer = renderer;
    world.camera = camera;
    world.scene = scene;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(mount);
    window.addEventListener('resize', resize);

    const onPointerDown = event => {
      world.dragging = true;
      world.lastX = event.clientX;
      world.lastY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = event => {
      if (!world.dragging) return;
      const dx = event.clientX - world.lastX;
      const dy = event.clientY - world.lastY;
      world.lastX = event.clientX;
      world.lastY = event.clientY;
      world.angle -= dx * 0.006;
      world.pitch = clamp(world.pitch - dy * 0.003, 0.46, 1.08);
    };

    const onPointerUp = event => {
      world.dragging = false;
      renderer.domElement.releasePointerCapture?.(event.pointerId);
    };

    const onWheel = event => {
      event.preventDefault();
      world.zoom = clamp((world.zoom || 1) + event.deltaY * 0.0008, 0.72, 1.32);
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointercancel', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    rebuildScene(group, stateRef.current);
    resize();

    const animate = time => {
      const current = stateRef.current;
      const size = current.grid.length || 28;
      const distance = Math.max(32, size * 1.18) * (world.zoom || 1);
      const orbit = world.angle + (current.running && !world.dragging ? time * 0.000055 : 0);
      camera.position.set(Math.cos(orbit) * distance, distance * world.pitch, Math.sin(orbit) * distance);
      camera.lookAt(0, 0.2, 0);
      animateScene(group, time, current);
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(animate);
    };

    raf = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      disposeGroup(group);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const { group, scene } = worldRef.current;
    if (scene) applySceneTheme(scene, theme);
    if (group) rebuildScene(group, stateRef.current);
  }, [grid, start, goal, path, dynamicObstacles.length, theme]);

  return <div ref={mountRef} className="simulation-3d" aria-label="3D route simulation" />;
}

function rebuildScene(group, state) {
  disposeGroup(group);
  const { grid, start, goal, path, dynamicObstacles } = state;
  const size = grid.length || 1;
  const offset = (size - 1) / 2;
  const palette = readPalette();

  addGlassPlatform(group, size, palette);
  addGlassShards(group, size, palette);

  const gridHelper = new THREE.GridHelper(size, size, palette.gridStrong, palette.grid);
  gridHelper.position.y = 0.045;
  group.add(gridHelper);

  addObstacleField(group, grid, offset, palette);
  addPath(group, path, offset, palette);
  addDynamicObstacles(group, dynamicObstacles, offset, palette);
  addMarker(group, start, offset, palette.start, 'start');
  addMarker(group, goal, offset, palette.goal, 'goal');

  addRobotTrail(group, path, offset, palette.robot);
  addRobot(group, path[0] || start, offset, palette.robot);
}

function addGlassPlatform(group, size, palette) {
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(size + 1.8, 0.1, size + 1.8),
    new THREE.MeshPhysicalMaterial({
      color: palette.mapBg,
      roughness: 0.22,
      metalness: 0.02,
      transmission: 0.18,
      thickness: 0.6,
      transparent: true,
      opacity: 0.72,
      clearcoat: 0.9,
      clearcoatRoughness: 0.18,
    }),
  );
  deck.position.y = -0.08;
  deck.receiveShadow = true;
  group.add(deck);

  const underGlow = new THREE.Mesh(
    new THREE.BoxGeometry(size + 2.8, 0.08, size + 2.8),
    new THREE.MeshBasicMaterial({ color: palette.path, transparent: true, opacity: 0.08 }),
  );
  underGlow.position.y = -0.18;
  group.add(underGlow);
}

function addGlassShards(group, size, palette) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.34,
    transmission: 0.26,
    thickness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.14,
  });
  const positions = [
    [-size * 0.55, 0.72, -size * 0.42, 0.28],
    [size * 0.52, 0.62, -size * 0.5, -0.2],
    [-size * 0.45, 0.58, size * 0.5, -0.16],
    [size * 0.48, 0.8, size * 0.42, 0.22],
  ];
  positions.forEach(([x, y, z, rotation], index) => {
    const shard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.56), material.clone());
    shard.position.set(x, y, z);
    shard.rotation.set(0.22, rotation, 0.42);
    shard.userData.shard = true;
    shard.userData.phase = index * 0.8;
    shard.userData.baseY = y;
    group.add(shard);
  });

  const frame = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(size + 1.95, 0.16, size + 1.95)),
    new THREE.LineBasicMaterial({ color: palette.path, transparent: true, opacity: 0.18 }),
  );
  frame.position.y = -0.05;
  group.add(frame);
}

function addObstacleField(group, grid, offset, palette) {
  const cells = [];
  grid.forEach((row, y) => row.forEach((value, x) => {
    if (value) cells.push({ x, y });
  }));
  if (!cells.length) return;

  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.72, 0.58, 0.72),
    new THREE.MeshPhysicalMaterial({ color: palette.obstacle, roughness: 0.34, metalness: 0.04, transparent: true, opacity: 0.78, clearcoat: 0.72, clearcoatRoughness: 0.22 }),
    cells.length,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  cells.forEach((cell, index) => {
    dummy.position.set(cell.x - offset, 0.25, cell.y - offset);
    dummy.scale.set(1, 0.78 + ((cell.x + cell.y) % 3) * 0.12, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  });
  group.add(mesh);
}

function addPath(group, path, offset, palette) {
  if (path.length < 2) return;
  const points = path.map(point => new THREE.Vector3(point.x - offset, 0.72, point.y - offset));
  const curve = new THREE.CatmullRomCurve3(points);
  const corridor = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(20, path.length * 4), 0.19, 14, false),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.16,
      metalness: 0.02,
      transmission: 0.24,
      thickness: 0.4,
      transparent: true,
      opacity: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      depthWrite: false,
    }),
  );
  markPulse(corridor, 0.16, 0.035);
  group.add(corridor);

  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(curve, Math.max(16, path.length * 4), 0.075, 10, false),
    new THREE.MeshStandardMaterial({ color: palette.path, emissive: palette.path, emissiveIntensity: 0.56, roughness: 0.24, transparent: true, opacity: 0.88 }),
  );
  markPulse(tube, 0.88, 0.1);
  group.add(tube);

  const glow = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: palette.path, transparent: true, opacity: 0.2 }),
  );
  glow.scale.set(1, 1.015, 1);
  markPulse(glow, 0.2, 0.08);
  group.add(glow);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }),
  );
  markPulse(line, 0.7, 0.12);
  group.add(line);

  addPathParticles(group, path, offset, palette);
}

function addRobotTrail(group, path, offset, color) {
  if (path.length < 2) return;
  const count = Math.min(14, Math.max(6, Math.floor(path.length / 2)));
  for (let index = 0; index < count; index += 1) {
    const point = path[0];
    const trail = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 - Math.min(index, 8) * 0.006, 16, 10),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: Math.max(0.08, 0.34 - index * 0.018), depthWrite: false }),
    );
    trail.position.set(point.x - offset, 0.58, point.y - offset);
    trail.userData.robotTrail = true;
    trail.userData.lag = index + 1;
    trail.userData.baseOpacity = Math.max(0.06, 0.32 - index * 0.018);
    group.add(trail);
  }
}

function addPathParticles(group, path, offset, palette) {
  const count = Math.min(18, Math.max(5, Math.floor(path.length / 2)));
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
  for (let i = 0; i < count; i += 1) {
    const point = path[Math.floor((i / count) * (path.length - 1))];
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), material.clone());
    particle.position.set(point.x - offset, 0.92, point.y - offset);
    particle.userData.pathParticle = true;
    particle.userData.phase = i / count;
    particle.userData.path = path.map(item => ({ x: item.x - offset, z: item.y - offset }));
    group.add(particle);
  }
}

function addDynamicObstacles(group, obstacles, offset, palette) {
  obstacles.forEach((point, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.018, 10, 56),
      new THREE.MeshBasicMaterial({ color: palette.danger, transparent: true, opacity: 0.5 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(point.x - offset, 0.09, point.y - offset);
    ring.userData.warning = true;
    ring.userData.dynamicIndex = index;
    ring.userData.baseY = 0.09;
    ring.userData.phase = index * 0.46;
    group.add(ring);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 18, 14),
      new THREE.MeshStandardMaterial({ color: palette.danger, emissive: palette.danger, emissiveIntensity: 0.5, roughness: 0.28, transparent: true, opacity: 0.9 }),
    );
    core.position.set(point.x - offset, 0.45, point.y - offset);
    core.castShadow = true;
    core.userData.float = true;
    core.userData.dynamicIndex = index;
    core.userData.baseY = 0.45;
    core.userData.phase = index * 0.6;
    group.add(core);
  });
}

function addMarker(group, point, offset, color, type) {
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.58, 0.02, 10, 56),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.38 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(point.x - offset, 0.1, point.y - offset);
  markPulse(halo, 0.38, 0.1);
  group.add(halo);

  const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, 0.62, 24),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.28, metalness: 0.06 }),
  );
  marker.position.set(point.x - offset, 0.34, point.y - offset);
  marker.castShadow = true;
  marker.userData[type] = true;
  group.add(marker);
}

function addRobot(group, point, offset, color) {
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.56, 0.018, 10, 56),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.44 }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.set(point.x - offset, 0.34, point.y - offset);
  halo.userData.robot = true;
  halo.userData.baseY = 0.34;
  halo.userData.robotPart = 'halo';
  group.add(halo);

  const robot = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 18),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.54, roughness: 0.34 }),
  );
  robot.position.set(point.x - offset, 0.72, point.y - offset);
  robot.castShadow = true;
  robot.userData.robot = true;
  robot.userData.baseY = 0.72;
  robot.userData.robotPart = 'core';
  group.add(robot);
}

function animateScene(group, time, state) {
  const t = time * 0.001;
  const { grid, start, path, dynamicObstacles, robotIndex, running } = state;
  const offset = ((grid.length || 1) - 1) / 2;
  const robotPoint = path[Math.min(robotIndex, path.length - 1)] || start;
  const robotTarget = toWorldPoint(robotPoint, offset, 0.72);
  group.traverse(object => {
    if (object.userData.dynamicIndex !== undefined) {
      const point = dynamicObstacles[object.userData.dynamicIndex];
      object.visible = Boolean(point);
      if (point) {
        const target = toWorldPoint(point, offset, object.userData.baseY || object.position.y);
        object.position.x += (target.x - object.position.x) * 0.18;
        object.position.z += (target.z - object.position.z) * 0.18;
      }
    }
    if (object.userData.warning) {
      const scale = running ? 1 + Math.sin(t * 3.1 + object.userData.phase) * 0.16 : 1;
      object.scale.set(scale, scale, scale);
      object.material.opacity = running ? 0.48 + Math.sin(t * 2.6 + object.userData.phase) * 0.14 : 0.36;
    }
    if (object.userData.float) {
      object.position.y = object.userData.baseY + (running ? Math.sin(t * 2.4 + object.userData.phase) * 0.06 : 0);
    }
    if (object.userData.robot) {
      const scale = running ? 1 + Math.sin(t * 4.2) * 0.08 : 1;
      object.scale.set(scale, scale, scale);
      object.position.x += (robotTarget.x - object.position.x) * 0.22;
      object.position.z += (robotTarget.z - object.position.z) * 0.22;
      object.position.y = object.userData.baseY + (object.userData.robotPart === 'core' && running ? Math.sin(t * 5.2) * 0.045 : 0);
      if (object.material?.opacity !== undefined && object.userData.robotPart === 'halo') {
        object.material.opacity = running ? 0.36 + Math.sin(t * 4.4) * 0.1 : 0.32;
      }
    }
    if (object.userData.robotTrail) {
      const target = sampleTrailPoint(path, robotIndex - object.userData.lag * 0.72, offset);
      object.visible = Boolean(target);
      if (target) {
        object.position.x += (target.x - object.position.x) * 0.18;
        object.position.z += (target.z - object.position.z) * 0.18;
        object.position.y = 0.58 + Math.sin(t * 4 + object.userData.lag) * 0.025;
      }
      object.material.opacity = running && target
        ? object.userData.baseOpacity * (0.72 + Math.sin(t * 4.2 + object.userData.lag) * 0.18)
        : 0.05;
    }
    if (object.userData.pathParticle) {
      const route = object.userData.path;
      const travel = running ? (object.userData.phase + t * 0.28) % 1 : object.userData.phase;
      const exact = travel * Math.max(1, route.length - 1);
      const index = Math.floor(exact);
      const next = Math.min(route.length - 1, index + 1);
      const local = exact - index;
      const a = route[index] || route[0];
      const b = route[next] || a;
      object.position.x = a.x + (b.x - a.x) * local;
      object.position.z = a.z + (b.z - a.z) * local;
      object.position.y = 0.96 + Math.sin(t * 4.8 + object.userData.phase * Math.PI * 2) * 0.08;
      object.material.opacity = running ? 0.58 + Math.sin(t * 5 + object.userData.phase * 8) * 0.28 : 0.34;
      const scale = running ? 1 + Math.sin(t * 4.4 + object.userData.phase * 6) * 0.35 : 0.82;
      object.scale.set(scale, scale, scale);
    }
    if (object.userData.shard) {
      object.position.y = object.userData.baseY + Math.sin(t * 1.3 + object.userData.phase) * 0.08;
      object.rotation.y += running ? 0.002 : 0.0006;
      object.material.opacity = 0.24 + Math.sin(t * 1.7 + object.userData.phase) * 0.08;
    }
    if (object.userData.pulse) {
      const base = object.userData.baseOpacity ?? object.material.opacity ?? 1;
      const range = object.userData.pulseRange ?? 0.12;
      object.material.opacity = running ? Math.max(0.04, base + Math.sin(t * 3.6) * range) : base;
    }
  });
}

function sampleTrailPoint(path, rawIndex, offset) {
  if (path.length < 2 || rawIndex < 0) return null;
  const exact = Math.min(path.length - 1, rawIndex);
  const index = Math.floor(exact);
  const next = Math.min(path.length - 1, index + 1);
  const local = exact - index;
  const a = path[index] || path[0];
  const b = path[next] || a;
  return {
    x: a.x - offset + (b.x - a.x) * local,
    z: a.y - offset + (b.y - a.y) * local,
  };
}

function toWorldPoint(point, offset, y = 0) {
  return new THREE.Vector3(point.x - offset, y, point.y - offset);
}

function markPulse(object, baseOpacity, range) {
  object.userData.pulse = true;
  object.userData.baseOpacity = baseOpacity;
  object.userData.pulseRange = range;
}

function applySceneTheme(scene, theme) {
  const fogColor = theme === 'dark' ? 0x17201f : 0xf8fbff;
  if (scene.fog) {
    scene.fog.color.setHex(fogColor);
    scene.fog.density = theme === 'dark' ? 0.022 : 0.018;
  } else {
    scene.fog = new THREE.FogExp2(fogColor, theme === 'dark' ? 0.022 : 0.018);
  }
}

function readPalette() {
  return {
    mapBg: cssColor('--map-bg', '#f5f2ec'),
    grid: cssColor('--border', '#e1dccf'),
    gridStrong: cssColor('--primary', '#3b352b'),
    obstacle: cssColor('--map-obstacle', '#d6d0c2'),
    path: cssColor('--map-path', '#9b965f'),
    robot: cssColor('--map-robot', '#3b352b'),
    start: cssColor('--map-start', '#5e7a3a'),
    goal: cssColor('--map-goal', '#b45309'),
    danger: cssColor('--danger', '#ef4444'),
  };
}

function cssColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function disposeGroup(group) {
  group.traverse(object => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
    else object.material?.dispose?.();
  });
  while (group.children.length) group.remove(group.children[0]);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
