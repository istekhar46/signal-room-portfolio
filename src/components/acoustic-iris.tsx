"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentVisualState } from "@/lib/ui-actions";

interface JarvisCoreSceneProps {
  state: AgentVisualState;
  micLevelRef: React.MutableRefObject<number>;
  agentLevelRef: React.MutableRefObject<number>;
  reducedMotion: boolean;
}

function buildSegmentedArcRing(
  radius: number,
  segments: { startDeg: number; sweepDeg: number }[],
  color: string,
  opacity: number
): THREE.LineSegments {
  const pts: number[] = [];
  const stepDeg = 3;
  for (const seg of segments) {
    const steps = Math.max(2, Math.ceil(seg.sweepDeg / stepDeg));
    for (let i = 0; i < steps; i++) {
      const a0 = ((seg.startDeg + (i / steps) * seg.sweepDeg) * Math.PI) / 180;
      const a1 = ((seg.startDeg + ((i + 1) / steps) * seg.sweepDeg) * Math.PI) / 180;
      pts.push(
        Math.cos(a0) * radius,
        Math.sin(a0) * radius,
        0,
        Math.cos(a1) * radius,
        Math.sin(a1) * radius,
        0
      );
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
  });
  return new THREE.LineSegments(geo, mat);
}

function buildWaveLoop(segments: number, radius: number, color: string, opacity: number): THREE.Line {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = Math.sin(a) * radius;
    positions[i * 3 + 2] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
  });
  return new THREE.Line(geo, mat);
}

function JarvisCoreScene({
  state,
  micLevelRef,
  agentLevelRef,
  reducedMotion,
}: JarvisCoreSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const neuralSphereRef = useRef<THREE.Mesh>(null);
  const innerLatticeRef = useRef<THREE.Mesh>(null);
  const particleShellRef = useRef<THREE.Points>(null);
  const gyroARef = useRef<THREE.Group>(null);
  const gyroBRef = useRef<THREE.Group>(null);
  const gyroCRef = useRef<THREE.Group>(null);
  const dialRef = useRef<THREE.Group>(null);

  const waveSegments = 144;
  const spectrumBars = 64;

  const assets = useMemo(() => {
    const tickCount = 72;
    const tickPts = new Float32Array(tickCount * 6);
    for (let i = 0; i < tickCount; i++) {
      const a = (i / tickCount) * Math.PI * 2;
      const major = i % 6 === 0;
      const r0 = major ? 1.98 : 2.06;
      const r1 = 2.18;
      tickPts[i * 6] = Math.cos(a) * r0;
      tickPts[i * 6 + 1] = Math.sin(a) * r0;
      tickPts[i * 6 + 2] = 0;
      tickPts[i * 6 + 3] = Math.cos(a) * r1;
      tickPts[i * 6 + 4] = Math.sin(a) * r1;
      tickPts[i * 6 + 5] = 0;
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute("position", new THREE.BufferAttribute(tickPts, 3));
    const tickMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#FF9F38"),
      transparent: true,
      opacity: 0.52,
    });
    const ticks = new THREE.LineSegments(tickGeo, tickMat);

    const outerArc = buildSegmentedArcRing(
      2.28,
      [
        { startDeg: 10, sweepDeg: 68 },
        { startDeg: 100, sweepDeg: 52 },
        { startDeg: 175, sweepDeg: 82 },
        { startDeg: 280, sweepDeg: 58 },
      ],
      "#FF9F38",
      0.78
    );

    const midArcA = buildSegmentedArcRing(
      1.78,
      [
        { startDeg: 0, sweepDeg: 95 },
        { startDeg: 125, sweepDeg: 75 },
        { startDeg: 230, sweepDeg: 105 },
      ],
      "#FF5A1F",
      0.88
    );

    const midArcB = buildSegmentedArcRing(
      1.52,
      [
        { startDeg: 25, sweepDeg: 80 },
        { startDeg: 145, sweepDeg: 60 },
        { startDeg: 250, sweepDeg: 88 },
      ],
      "#38D9A9",
      0.82
    );

    const innerArc = buildSegmentedArcRing(
      1.26,
      [
        { startDeg: 0, sweepDeg: 120 },
        { startDeg: 150, sweepDeg: 70 },
        { startDeg: 255, sweepDeg: 85 },
      ],
      "#FFB85C",
      0.78
    );

    const chPts = new Float32Array([
      -2.55, 0, 0, -2.28, 0, 0,
      2.28, 0, 0, 2.55, 0, 0,
      0, -2.55, 0, 0, -2.28, 0,
      0, 2.28, 0, 0, 2.55, 0,
    ]);
    const chGeo = new THREE.BufferGeometry();
    chGeo.setAttribute("position", new THREE.BufferAttribute(chPts, 3));
    const chMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#FF5A1F"),
      transparent: true,
      opacity: 0.72,
    });
    const crosshairs = new THREE.LineSegments(chGeo, chMat);

    const specPts = new Float32Array(spectrumBars * 6);
    for (let i = 0; i < spectrumBars; i++) {
      const a = (i / spectrumBars) * Math.PI * 2;
      specPts[i * 6] = Math.cos(a) * 1.58;
      specPts[i * 6 + 1] = Math.sin(a) * 1.58;
      specPts[i * 6 + 2] = 0.06;
      specPts[i * 6 + 3] = Math.cos(a) * 1.72;
      specPts[i * 6 + 4] = Math.sin(a) * 1.72;
      specPts[i * 6 + 5] = 0.06;
    }
    const specGeo = new THREE.BufferGeometry();
    specGeo.setAttribute("position", new THREE.BufferAttribute(specPts, 3));
    const specMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#FF9F38"),
      transparent: true,
      opacity: 0.88,
    });
    const spectrum = new THREE.LineSegments(specGeo, specMat);

    const amberWave = buildWaveLoop(waveSegments, 1.88, "#FF9F38", 0.8);
    const mintWave = buildWaveLoop(waveSegments, 1.44, "#38D9A9", 0.7);

    const pCount = 260;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / pCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.94 + (i % 7) * 0.035;
      pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color("#FFB347"),
      size: 0.048,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    return {
      ticks,
      outerArc,
      midArcA,
      midArcB,
      innerArc,
      crosshairs,
      spectrum,
      amberWave,
      mintWave,
      pGeo,
      pMat,
    };
  }, []);

  useEffect(() => {
    return () => {
      const objs = [
        assets.ticks,
        assets.outerArc,
        assets.midArcA,
        assets.midArcB,
        assets.innerArc,
        assets.crosshairs,
        assets.spectrum,
        assets.amberWave,
        assets.mintWave,
      ];
      for (const o of objs) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
      assets.pGeo.dispose();
      assets.pMat.dispose();
    };
  }, [assets]);

  useFrame((frameState, delta) => {
    const t = frameState.clock.elapsedTime;
    const mic = micLevelRef.current;
    const agent = agentLevelRef.current;
    const energy =
      state === "listening"
        ? Math.max(0.28, mic)
        : state === "speaking"
          ? Math.max(0.35, agent)
          : state === "executing"
            ? 0.9
            : state === "thinking"
              ? 0.48
              : 0.14;

    if (rootRef.current) {
      const targetScale =
        state === "executing"
          ? 1.07
          : state === "speaking"
            ? 1.0 + agent * 0.1
            : state === "listening"
              ? 0.98 + mic * 0.08
              : 1.0 + (reducedMotion ? 0 : Math.sin(t * 1.3) * 0.015);
      rootRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        Math.min(1, delta * 7)
      );
      if (!reducedMotion) {
        rootRef.current.rotation.y = Math.sin(t * 0.35) * 0.18;
        rootRef.current.rotation.x = Math.cos(t * 0.28) * 0.12;
      }
    }

    if (!reducedMotion) {
      const coreSpeed =
        state === "thinking"
          ? 1.9
          : state === "executing"
            ? 2.8
            : state === "speaking"
              ? 0.8 + agent * 1.4
              : state === "listening"
                ? 0.65 + mic * 1.1
                : 0.26;

      if (neuralSphereRef.current) {
        neuralSphereRef.current.rotation.y += delta * coreSpeed;
        neuralSphereRef.current.rotation.x += delta * coreSpeed * 0.45;
      }
      if (innerLatticeRef.current) {
        innerLatticeRef.current.rotation.y -= delta * coreSpeed * 0.78;
        innerLatticeRef.current.rotation.z += delta * coreSpeed * 0.4;
      }
      if (particleShellRef.current) {
        particleShellRef.current.rotation.y += delta * (coreSpeed * 0.55);
        particleShellRef.current.rotation.z -= delta * 0.14;
      }
      if (gyroARef.current) {
        gyroARef.current.rotation.z += delta * (state === "thinking" ? 1.5 : 0.3);
        gyroARef.current.rotation.x = Math.sin(t * 0.48) * 0.42;
        gyroARef.current.rotation.y = Math.cos(t * 0.38) * 0.36;
      }
      if (gyroBRef.current) {
        gyroBRef.current.rotation.z -= delta * (state === "thinking" ? 1.85 : 0.38);
        gyroBRef.current.rotation.x = Math.cos(t * 0.55) * 0.46;
        gyroBRef.current.rotation.y = Math.sin(t * 0.42) * 0.42;
      }
      if (gyroCRef.current) {
        gyroCRef.current.rotation.z += delta * (state === "executing" ? 2.5 : 0.48);
      }
      if (dialRef.current) {
        dialRef.current.rotation.z -= delta * (state === "thinking" ? 0.55 : 0.07);
      }
    }

    const specMat = assets.spectrum.material as THREE.LineBasicMaterial;
    const targetHex = state === "listening" ? "#38D9A9" : state === "executing" ? "#FF5A1F" : "#FF9F38";
    specMat.color.lerp(new THREE.Color(targetHex), Math.min(1, delta * 8));

    const specAttr = assets.spectrum.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < spectrumBars; i++) {
      const a = (i / spectrumBars) * Math.PI * 2;
      const harmonic = reducedMotion
        ? 0.05
        : Math.abs(Math.sin(a * 6 + t * 4.4) * Math.cos(a * 3 - t * 2.5));
      const len = 0.06 + harmonic * (0.12 + energy * 0.42);
      const r0 = 1.56;
      const r1 = r0 + len;
      specAttr.setXYZ(i * 2, Math.cos(a) * r0, Math.sin(a) * r0, 0.06);
      specAttr.setXYZ(i * 2 + 1, Math.cos(a) * r1, Math.sin(a) * r1, 0.06);
    }
    specAttr.needsUpdate = true;

    const aAttr = assets.amberWave.geometry.attributes.position as THREE.BufferAttribute;
    const mAttr = assets.mintWave.geometry.attributes.position as THREE.BufferAttribute;
    const aAmp = state === "speaking" ? 0.06 + agent * 0.22 : state === "executing" ? 0.14 : 0.032;
    const mAmp = state === "listening" ? 0.06 + mic * 0.22 : 0.026;

    for (let i = 0; i <= waveSegments; i++) {
      const a = (i / waveSegments) * Math.PI * 2;
      const wA = reducedMotion
        ? 0
        : Math.sin(a * 8 - t * 3.4) * aAmp + Math.cos(a * 13 + t * 2.1) * (aAmp * 0.4);
      aAttr.setXYZ(i, Math.cos(a) * (1.88 + wA), Math.sin(a) * (1.88 + wA), 0.04);

      const wM = reducedMotion
        ? 0
        : Math.sin(a * 7 + t * 3.0) * mAmp + Math.cos(a * 11 - t * 1.8) * (mAmp * 0.45);
      mAttr.setXYZ(i, Math.cos(a) * (1.42 + wM), Math.sin(a) * (1.42 + wM), 0.05);
    }
    aAttr.needsUpdate = true;
    mAttr.needsUpdate = true;
  });

  const coreColor =
    state === "listening"
      ? "#38D9A9"
      : state === "executing"
        ? "#FF5A1F"
        : "#FF9F38";

  return (
    <group ref={rootRef}>
      <mesh ref={innerLatticeRef}>
        <icosahedronGeometry args={[0.52, 1]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={state === "speaking" || state === "executing" ? 1.6 : 0.95}
          wireframe
          transparent
          opacity={0.92}
        />
      </mesh>

      <mesh ref={neuralSphereRef}>
        <icosahedronGeometry args={[0.86, 2]} />
        <meshStandardMaterial
          color="#FF9F38"
          emissive="#FF5A1F"
          emissiveIntensity={state === "speaking" ? 1.2 : 0.68}
          wireframe
          transparent
          opacity={0.58}
        />
      </mesh>

      <points ref={particleShellRef} geometry={assets.pGeo} material={assets.pMat} />

      <group ref={gyroARef}>
        <primitive object={assets.midArcA} />
        <mesh>
          <torusGeometry args={[1.76, 0.015, 12, 96]} />
          <meshBasicMaterial color="#FF9F38" transparent opacity={0.38} />
        </mesh>
      </group>

      <group ref={gyroBRef}>
        <primitive object={assets.midArcB} />
        <mesh>
          <torusGeometry args={[1.5, 0.013, 12, 96]} />
          <meshBasicMaterial color="#38D9A9" transparent opacity={0.34} />
        </mesh>
      </group>

      <group ref={gyroCRef}>
        <primitive object={assets.innerArc} />
      </group>

      <group ref={dialRef}>
        <primitive object={assets.ticks} />
        <primitive object={assets.outerArc} />
        <mesh>
          <torusGeometry args={[2.18, 0.018, 14, 96]} />
          <meshBasicMaterial color="#FF9F38" transparent opacity={0.3} />
        </mesh>
      </group>

      <primitive object={assets.crosshairs} />
      <primitive object={assets.spectrum} />
      <primitive object={assets.amberWave} />
      <primitive object={assets.mintWave} />
    </group>
  );
}

interface AcousticIrisProps {
  state: AgentVisualState;
  micLevelRef: React.MutableRefObject<number>;
  agentLevelRef: React.MutableRefObject<number>;
  onActivate?: () => void;
}

export function AcousticIris({
  state,
  micLevelRef,
  agentLevelRef,
  onActivate,
}: AcousticIrisProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) setWebglOk(false);
    } catch {
      setWebglOk(false);
    }
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className="relative w-full max-w-[390px] aspect-square mx-auto select-none"
      role="img"
      aria-label={`J.A.R.V.I.S.-inspired holographic voice core, current state: ${state}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-[#FF9F38]/14"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px bg-[#FF9F38]/14"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-8 rounded-full"
        style={{
          background:
            state === "listening"
              ? "radial-gradient(circle, rgba(56,217,169,0.18) 0%, rgba(18,20,24,0) 68%)"
              : "radial-gradient(circle, rgba(255,159,56,0.2) 0%, rgba(255,90,31,0.08) 38%, rgba(18,20,24,0) 70%)",
        }}
      />

      {webglOk ? (
        <div
          onClick={onActivate}
          className="relative z-10 w-full h-full cursor-pointer"
          title="Click to activate voice session"
        >
          <Canvas
            dpr={[1, 2]}
            camera={{ position: [0, 0, 5.8], fov: 46 }}
            gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          >
            <ambientLight intensity={0.85} />
            <pointLight position={[0, 0, 3]} intensity={2.6} color="#FF9F38" />
            <pointLight position={[-3, 3, 2]} intensity={1.6} color="#38D9A9" />
            <pointLight position={[3, -3, 2]} intensity={1.6} color="#FF5A1F" />
            <JarvisCoreScene
              state={state}
              micLevelRef={micLevelRef}
              agentLevelRef={agentLevelRef}
              reducedMotion={reducedMotion}
            />
          </Canvas>
        </div>
      ) : (
        <div
          onClick={onActivate}
          className="relative z-10 w-full h-full grid place-items-center cursor-pointer"
        >
          <MiniAcousticIris state={state} size={240} />
        </div>
      )}
    </div>
  );
}

export function MiniAcousticIris({
  state,
  size = 44,
}: {
  state: AgentVisualState;
  size?: number;
}) {
  const accent =
    state === "listening"
      ? "#38D9A9"
      : state === "speaking" || state === "executing" || state === "thinking"
        ? "#FF9F38"
        : state === "offline"
          ? "#6B7280"
          : "#FF9F38";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={state === "thinking" ? "animate-spin [animation-duration:4s]" : ""}
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        stroke={accent}
        strokeWidth="1.25"
        strokeDasharray="16 6 8 6"
        opacity={state === "offline" ? 0.35 : 0.85}
      />
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="#FF5A1F"
        strokeWidth="1.5"
        strokeDasharray="24 10"
        opacity={state === "offline" ? 0.3 : 0.85}
      />
      <circle cx="32" cy="32" r="14" stroke="#38D9A9" strokeWidth="1" opacity="0.65" />
      <circle
        cx="32"
        cy="32"
        r="6.5"
        fill={accent}
        fillOpacity={state === "speaking" || state === "listening" ? 0.92 : 0.5}
      />
      <line x1="2" y1="32" x2="9" y2="32" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="55" y1="32" x2="62" y2="32" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="2" x2="32" y2="9" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="55" x2="32" y2="62" stroke={accent} strokeWidth="1" opacity="0.7" />
    </svg>
  );
}
