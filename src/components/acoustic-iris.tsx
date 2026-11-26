"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { AgentVisualState } from "@/lib/ui-actions";

interface JarvisCoreSceneProps {
  state: AgentVisualState;
  micLevelRef: React.RefObject<number>;
  agentLevelRef: React.RefObject<number>;
  micBinsRef?: React.RefObject<Uint8Array>;
  agentBinsRef?: React.RefObject<Uint8Array>;
  pointerTargetRef: React.RefObject<{ x: number; y: number }>;
  hoveredRef: React.RefObject<boolean>;
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

function buildWaveLoop(
  segments: number,
  radius: number,
  color: string,
  opacity: number
): THREE.Line {
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
  micBinsRef,
  agentBinsRef,
  pointerTargetRef,
  hoveredRef,
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
  const coreLightRef = useRef<THREE.PointLight>(null);
  const pulseRingRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const tmpScaleVec = useRef(new THREE.Vector3(1, 1, 1));
  const tmpTargetColor = useRef(new THREE.Color("#FF9F38"));
  const smoothPointer = useRef({ x: 0, y: 0 });
  const hoverEnergy = useRef(0);
  const speakEnergy = useRef(0);
  const pulsePhase = useRef(0);
  const smoothedBins = useRef(new Float32Array(64));

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
      -2.55, 0, 0, -2.28, 0, 0, 2.28, 0, 0, 2.55, 0, 0, 0, -2.55, 0, 0, -2.28, 0, 0, 2.28, 0, 0,
      2.55, 0,
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
      opacity: 0.9,
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
    const activeBins =
      state === "speaking" && agent > 0.02
        ? agentBinsRef?.current
        : mic > 0.02
          ? micBinsRef?.current
          : agent > 0.02
            ? agentBinsRef?.current
            : undefined;
    const hasLiveSpectrum = Boolean(activeBins && (mic > 0.02 || agent > 0.02));

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

    // Smoothly damp cursor parallax, hover wave excitation, and speaking vocal drive
    const ptrDamp = Math.min(1, delta * 5.5);
    smoothPointer.current.x += (pointerTargetRef.current.x - smoothPointer.current.x) * ptrDamp;
    smoothPointer.current.y += (pointerTargetRef.current.y - smoothPointer.current.y) * ptrDamp;
    const targetHover = hoveredRef.current && !reducedMotion ? 1 : 0;
    hoverEnergy.current += (targetHover - hoverEnergy.current) * Math.min(1, delta * 6.5);
    const hoverAmt = hoverEnergy.current;
    const pointerAngle = Math.atan2(-smoothPointer.current.y, smoothPointer.current.x);

    const targetSpeak = state === "speaking" ? 1 : 0;
    speakEnergy.current += (targetSpeak - speakEnergy.current) * Math.min(1, delta * 7.5);
    const speakAmt = speakEnergy.current;
    // Combine real ElevenLabs FFT amplitude with natural speech syllable cadence so speaking is always expressive
    const syllableCadence =
      0.42 +
      0.34 * Math.abs(Math.sin(t * 7.2)) +
      0.24 * Math.abs(Math.sin(t * 13.4 + 0.8));
    const speakDrive = speakAmt * Math.max(agent * 1.15, syllableCadence * 0.72);

    if (rootRef.current) {
      const targetScale =
        state === "executing"
          ? 1.07
          : state === "speaking"
            ? 1.02 + speakDrive * 0.1
            : state === "listening"
              ? 0.98 + mic * 0.08
              : 1.0 + (reducedMotion ? 0 : Math.sin(t * 1.3) * 0.015);
      tmpScaleVec.current.set(targetScale, targetScale, targetScale);
      rootRef.current.scale.lerp(tmpScaleVec.current, Math.min(1, delta * 7));
      if (!reducedMotion) {
        rootRef.current.rotation.y = Math.sin(t * 0.35) * 0.16 + smoothPointer.current.x * 0.34;
        rootRef.current.rotation.x = Math.cos(t * 0.28) * 0.1 - smoothPointer.current.y * 0.28;
      }
    }

    // Dynamic vocal lighting & breathing nucleus + particle cloud during speech
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 2.6 + speakDrive * 3.4 + hoverAmt * 0.6;
    }

    if (innerLatticeRef.current) {
      const innerScale = 1 + speakDrive * 0.32 + hoverAmt * 0.06;
      innerLatticeRef.current.scale.setScalar(innerScale);
      const innerMat = innerLatticeRef.current.material as THREE.MeshStandardMaterial;
      innerMat.emissiveIntensity =
        state === "speaking"
          ? 1.25 + speakDrive * 1.35
          : state === "executing"
            ? 1.65
            : 0.95 + hoverAmt * 0.3;
    }

    if (neuralSphereRef.current) {
      const outerScale = 1 + speakDrive * 0.18 + hoverAmt * 0.04;
      neuralSphereRef.current.scale.setScalar(outerScale);
      const outerMat = neuralSphereRef.current.material as THREE.MeshStandardMaterial;
      outerMat.emissiveIntensity =
        state === "speaking" ? 0.95 + speakDrive * 1.05 : 0.68 + hoverAmt * 0.22;
    }

    if (particleShellRef.current) {
      const pScale = 1 + speakDrive * 0.24 + (state === "listening" ? mic * 0.12 : 0);
      particleShellRef.current.scale.setScalar(pScale);
      assets.pMat.size = 0.048 + speakDrive * 0.028;
    }

    // Radiating 3D vocal shockwave rings when agent is speaking
    if (!reducedMotion) {
      pulsePhase.current = (pulsePhase.current + delta * (0.68 + speakDrive * 0.85)) % 1;
    }
    for (let i = 0; i < 3; i++) {
      const ring = pulseRingRefs.current[i];
      if (!ring) continue;
      const p = (pulsePhase.current + i / 3) % 1;
      const mat = ring.material as THREE.MeshBasicMaterial;
      if (speakAmt > 0.02 && !reducedMotion) {
        const ringScale = 0.68 + p * 1.85;
        ring.scale.setScalar(ringScale);
        ring.position.z = Math.sin(p * Math.PI) * 0.25;
        mat.opacity = Math.pow(1 - p, 1.55) * (0.28 + speakDrive * 0.55) * speakAmt;
        ring.visible = true;
      } else {
        mat.opacity = 0;
        ring.visible = false;
      }
    }

    if (!reducedMotion) {
      const coreSpeed =
        state === "thinking"
          ? 1.9
          : state === "executing"
            ? 2.8
            : state === "speaking"
              ? 1.05 + speakDrive * 1.75
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
        gyroARef.current.rotation.z +=
          delta * (state === "thinking" ? 1.5 : state === "speaking" ? 0.75 + speakDrive * 0.8 : 0.3);
        gyroARef.current.rotation.x = Math.sin(t * 0.48) * 0.42 + smoothPointer.current.y * 0.2;
        gyroARef.current.rotation.y = Math.cos(t * 0.38) * 0.36 + smoothPointer.current.x * 0.2;
      }
      if (gyroBRef.current) {
        gyroBRef.current.rotation.z -=
          delta * (state === "thinking" ? 1.85 : state === "speaking" ? 0.92 + speakDrive * 0.9 : 0.38);
        gyroBRef.current.rotation.x = Math.cos(t * 0.55) * 0.46 - smoothPointer.current.y * 0.18;
        gyroBRef.current.rotation.y = Math.sin(t * 0.42) * 0.42 - smoothPointer.current.x * 0.18;
      }
      if (gyroCRef.current) {
        gyroCRef.current.rotation.z +=
          delta * (state === "executing" ? 2.5 : state === "speaking" ? 1.2 + speakDrive * 1.1 : 0.48);
      }
      if (dialRef.current) {
        dialRef.current.rotation.z -=
          delta * (state === "thinking" ? 0.55 : state === "speaking" ? 0.22 + speakDrive * 0.25 : 0.07);
      }
    }

    const specMat = assets.spectrum.material as THREE.LineBasicMaterial;
    const targetHex =
      state === "listening"
        ? "#38D9A9"
        : state === "executing"
          ? "#FF5A1F"
          : state === "speaking"
            ? "#FF7A2F"
            : "#FF9F38";
    tmpTargetColor.current.set(targetHex);
    specMat.color.lerp(tmpTargetColor.current, Math.min(1, delta * 8));

    // Real 64-band FFT spectrum when audio is active; expressive vocal & hover waves otherwise
    const specAttr = assets.spectrum.geometry.attributes.position as THREE.BufferAttribute;
    const binLerp = Math.min(1, delta * 18);
    for (let i = 0; i < spectrumBars; i++) {
      const a = (i / spectrumBars) * Math.PI * 2;
      let targetNorm: number;
      if (hasLiveSpectrum && activeBins) {
        const mirroredIdx = i < 32 ? i : 63 - i;
        targetNorm = Math.min(1, activeBins[mirroredIdx] / 255 + speakDrive * 0.18);
      } else {
        const angularProx = Math.pow(Math.max(0, Math.cos(a - pointerAngle)), 3);
        const waveBoost = hoverAmt * (0.28 + angularProx * 0.58) + speakDrive * 0.72;
        const speedMult = 1 + hoverAmt * 0.7 + speakDrive * 1.35;
        targetNorm = reducedMotion
          ? 0.06
          : Math.abs(
              Math.sin(a * 6 + t * 4.4 * speedMult) * Math.cos(a * 3 - t * 2.5 * speedMult)
            ) *
              (0.28 + energy * 0.8 + waveBoost) +
            angularProx * hoverAmt * 0.25 +
            speakDrive * 0.18 * Math.abs(Math.sin(a * 10 - t * 9.5));
      }
      smoothedBins.current[i] += (targetNorm - smoothedBins.current[i]) * binLerp;

      const len = 0.06 + smoothedBins.current[i] * (hasLiveSpectrum || speakAmt > 0.2 ? 0.62 : 0.42);
      const r0 = 1.56;
      const r1 = r0 + len;
      specAttr.setXYZ(i * 2, Math.cos(a) * r0, Math.sin(a) * r0, 0.06);
      specAttr.setXYZ(i * 2 + 1, Math.cos(a) * r1, Math.sin(a) * r1, 0.06);
    }
    specAttr.needsUpdate = true;

    const aAttr = assets.amberWave.geometry.attributes.position as THREE.BufferAttribute;
    const mAttr = assets.mintWave.geometry.attributes.position as THREE.BufferAttribute;
    const aAmp =
      (state === "executing" ? 0.14 : 0.036) + speakDrive * 0.26 + hoverAmt * 0.11;
    const mAmp =
      (state === "listening" ? 0.06 + mic * 0.24 : 0.03) + speakDrive * 0.14 + hoverAmt * 0.095;
    const waveSpeed = 1 + hoverAmt * 1.15 + speakDrive * 1.65;

    for (let i = 0; i <= waveSegments; i++) {
      const a = (i / waveSegments) * Math.PI * 2;
      const cursorCrest = hoverAmt * Math.pow(Math.max(0, Math.cos(a - pointerAngle)), 4);
      const wA = reducedMotion
        ? 0
        : Math.sin(a * 8 - t * 3.4 * waveSpeed) * aAmp +
          Math.cos(a * 13 + t * 2.1 * waveSpeed) * (aAmp * 0.45) +
          Math.sin(a * 18 - t * 6.5) * cursorCrest * 0.14;
      const zA = reducedMotion ? 0.04 : 0.04 + Math.sin(a * 5 + t * 7.5) * speakDrive * 0.24;
      aAttr.setXYZ(i, Math.cos(a) * (1.88 + wA), Math.sin(a) * (1.88 + wA), zA);

      const wM = reducedMotion
        ? 0
        : Math.sin(a * 7 + t * 3.0 * waveSpeed) * mAmp +
          Math.cos(a * 11 - t * 1.8 * waveSpeed) * (mAmp * 0.48) +
          Math.cos(a * 16 + t * 5.8) * cursorCrest * 0.12;
      const zM = reducedMotion ? 0.05 : 0.05 + Math.cos(a * 6 - t * 6.2) * speakDrive * 0.18;
      mAttr.setXYZ(i, Math.cos(a) * (1.42 + wM), Math.sin(a) * (1.42 + wM), zM);
    }
    aAttr.needsUpdate = true;
    mAttr.needsUpdate = true;
  });

  const coreColor =
    state === "listening" ? "#38D9A9" : state === "executing" ? "#FF5A1F" : "#FF9F38";

  return (
    <group ref={rootRef}>
      <pointLight ref={coreLightRef} position={[0, 0, 2.2]} intensity={2.6} color="#FF9F38" />

      {/* 3 radiating vocal shockwave rings (visible & pulsing when agent is speaking) */}
      {(["#FF9F38", "#FF5A1F", "#FFB85C"] as const).map((ringColor, idx) => (
        <mesh
          key={ringColor}
          ref={(el) => {
            pulseRingRefs.current[idx] = el;
          }}
          visible={false}
        >
          <torusGeometry args={[1.05, 0.016, 12, 96]} />
          <meshBasicMaterial color={ringColor} transparent opacity={0} />
        </mesh>
      ))}

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
  micLevelRef: React.RefObject<number>;
  agentLevelRef: React.RefObject<number>;
  micBinsRef?: React.RefObject<Uint8Array>;
  agentBinsRef?: React.RefObject<Uint8Array>;
  onActivate?: () => void;
  activationLabel?: string;
}

export function AcousticIris({
  state,
  micLevelRef,
  agentLevelRef,
  micBinsRef,
  agentBinsRef,
  onActivate,
  activationLabel = "Start a live voice session",
}: AcousticIrisProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglOk, setWebglOk] = useState(true);
  const [inView, setInView] = useState(true);

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

  // Pause 3D render loop when scrolled off-screen to preserve 60fps across the page
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        setInView(entries[0]?.isIntersecting ?? true);
      },
      { threshold: 0.02 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handlePointerEnter = () => {
    hoveredRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    hoveredRef.current = true;
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    pointerTargetRef.current.x = Math.max(-1, Math.min(1, nx));
    pointerTargetRef.current.y = Math.max(-1, Math.min(1, ny));
  };

  const handlePointerLeave = () => {
    hoveredRef.current = false;
    pointerTargetRef.current.x = 0;
    pointerTargetRef.current.y = 0;
  };

  return (
    <div
      ref={containerRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full max-w-[228px] sm:max-w-[310px] lg:max-w-[390px] aspect-square mx-auto select-none"
      role="group"
      aria-label={`Interactive acoustic voice core, current state: ${state}`}
    >
      {/* Calibrated axis crosshairs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-[#FF9F38]/14"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px bg-[#FF9F38]/14"
      />

      {/* Precision telemetry corner markings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-2 left-2 font-mono text-[10px] tracking-wider text-[#9499A3]/80 telemetry-nums"
      >
        FFT // 64-BAND
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-2 font-mono text-[10px] tracking-wider text-[#9499A3]/80 telemetry-nums"
      >
        {state === "listening"
          ? "RX // MIC ACTIVE"
          : state === "speaking"
            ? "TX // TTS STREAM"
            : "GYRO // TRACKING"}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-8 rounded-full transition-opacity duration-300"
        style={{
          background:
            state === "listening"
              ? "radial-gradient(circle, rgba(56,217,169,0.22) 0%, rgba(18,20,24,0) 68%)"
              : state === "speaking"
                ? "radial-gradient(circle, rgba(255,159,56,0.34) 0%, rgba(255,90,31,0.16) 40%, rgba(18,20,24,0) 72%)"
                : "radial-gradient(circle, rgba(255,159,56,0.2) 0%, rgba(255,90,31,0.08) 38%, rgba(18,20,24,0) 70%)",
        }}
      />

      {/* Expanding acoustic ripple rings when agent is actively speaking */}
      {state === "speaking" && !reducedMotion && (
        <>
          <div
            aria-hidden="true"
            className="voice-ripple pointer-events-none absolute inset-4 rounded-full border border-[#FF9F38]/70"
          />
          <div
            aria-hidden="true"
            className="voice-ripple pointer-events-none absolute inset-4 rounded-full border border-[#FF5A1F]/65"
            style={{ animationDelay: "0.55s" }}
          />
          <div
            aria-hidden="true"
            className="voice-ripple pointer-events-none absolute inset-4 rounded-full border border-[#FF9F38]/55"
            style={{ animationDelay: "1.1s" }}
          />
        </>
      )}

      {webglOk ? (
        <div className="relative z-10 w-full h-full">
          <Canvas
            frameloop={inView ? "always" : "never"}
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
              micBinsRef={micBinsRef}
              agentBinsRef={agentBinsRef}
              pointerTargetRef={pointerTargetRef}
              hoveredRef={hoveredRef}
              reducedMotion={reducedMotion}
            />
          </Canvas>
          <button type="button" onClick={onActivate} aria-label={activationLabel} title={activationLabel} className="absolute inset-0 cursor-pointer rounded-full" />
        </div>
      ) : (
        <button
          type="button"
          onClick={onActivate}
          className="relative z-10 w-full h-full grid place-items-center cursor-pointer"
          aria-label={activationLabel}
        >
          <MiniAcousticIris state={state} size={240} />
        </button>
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
        className={state === "speaking" ? "signal-pulse" : ""}
      />
      <line x1="2" y1="32" x2="9" y2="32" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="55" y1="32" x2="62" y2="32" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="2" x2="32" y2="9" stroke={accent} strokeWidth="1" opacity="0.7" />
      <line x1="32" y1="55" x2="32" y2="62" stroke={accent} strokeWidth="1" opacity="0.7" />
    </svg>
  );
}
