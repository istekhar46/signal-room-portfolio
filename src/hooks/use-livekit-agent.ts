"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ConnectionState,
  ParticipantEvent,
  RemoteParticipant,
  Room,
  RoomEvent,
  RpcError,
  Track,
  type RpcInvocationData,
  type TranscriptionSegment,
} from "livekit-client";
import {
  formatActionSignature,
  UiActionSchema,
  type AgentPersonaId,
  type AgentVisualState,
  type AgentVoiceKey,
  type SignalTraceEntry,
  type TurnLatencyMetrics,
  type UiAction,
} from "@/lib/ui-actions";

export interface TranscriptLine {
  id: string;
  speaker: "visitor" | "agent" | "system";
  text: string;
  final: boolean;
  timestamp: number;
}

interface UseLiveKitAgentOptions {
  onUiAction: (action: UiAction) => Promise<{ ok: boolean; detail?: string }>;
}

function mapLiveKitState(raw?: string): AgentVisualState {
  switch (raw) {
    case "listening":
      return "listening";
    case "thinking":
      return "thinking";
    case "speaking":
      return "speaking";
    case "initializing":
      return "connecting";
    default:
      return "idle";
  }
}

function waitForAgentReady(room: Room): Promise<void> {
  const isReady = () =>
    Array.from(room.remoteParticipants.values()).some((participant) =>
      ["listening", "thinking", "speaking"].includes(participant.attributes["lk.agent.state"])
    );
  if (isReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      room.off(RoomEvent.ParticipantConnected, checkReady);
      room.off(RoomEvent.ParticipantAttributesChanged, checkReady);
      room.off(RoomEvent.Disconnected, onDisconnect);
    };
    const checkReady = () => {
      if (isReady()) {
        cleanup();
        resolve();
      }
    };
    const onDisconnect = () => {
      cleanup();
      reject(new Error("The session ended before your message could be sent. Connect again to retry."));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("The agent is taking too long to join. Your message was not sent. Please try again."));
    }, 30_000);
    room.on(RoomEvent.ParticipantConnected, checkReady);
    room.on(RoomEvent.ParticipantAttributesChanged, checkReady);
    room.on(RoomEvent.Disconnected, onDisconnect);
    checkReady();
  });
}

export function useLiveKitAgent({ onUiAction }: UseLiveKitAgentOptions) {
  const [serverConfigured, setServerConfigured] = useState<boolean | null>(null);
  const [connected, setConnected] = useState(false);
  const [agentState, setAgentState] = useState<AgentVisualState>("idle");
  const [micEnabled, setMicEnabled] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [traceLog, setTraceLog] = useState<SignalTraceEntry[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<TurnLatencyMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<TurnLatencyMetrics[]>([]);
  const [activePersona, setActivePersona] = useState<AgentPersonaId>("representative");
  const [activeVoiceKey, setActiveVoiceKey] = useState<AgentVoiceKey>("sarah");

  // Live audio levels (0..1) and 64-band FFT spectra stored in refs for zero-GC 60fps WebGL/Canvas reading
  const micLevelRef = useRef(0);
  const agentLevelRef = useRef(0);
  const micBinsRef = useRef<Uint8Array>(new Uint8Array(64));
  const agentBinsRef = useRef<Uint8Array>(new Uint8Array(64));

  const roomRef = useRef<Room | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micRafRef = useRef<number | null>(null);
  const agentRafRef = useRef<number | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);
  const onUiActionRef = useRef(onUiAction);
  onUiActionRef.current = onUiAction;

  // Check if LiveKit credentials are present on server
  useEffect(() => {
    let cancelled = false;
    fetch("/api/livekit/status")
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) {
          const isConfigured = Boolean(data.configured);
          setServerConfigured(isConfigured);
          if (!isConfigured) {
            setAgentState("offline");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerConfigured(false);
          setAgentState("offline");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopAudioMonitors = useCallback(() => {
    if (micRafRef.current !== null) {
      cancelAnimationFrame(micRafRef.current);
      micRafRef.current = null;
    }
    if (agentRafRef.current !== null) {
      cancelAnimationFrame(agentRafRef.current);
      agentRafRef.current = null;
    }
    micLevelRef.current = 0;
    agentLevelRef.current = 0;
    micBinsRef.current.fill(0);
    agentBinsRef.current.fill(0);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const startAudioMonitor = useCallback(
    (stream: MediaStream, target: "mic" | "agent") => {
      try {
        const targetRafRef = target === "mic" ? micRafRef : agentRafRef;
        if (targetRafRef.current !== null) {
          cancelAnimationFrame(targetRafRef.current);
          targetRafRef.current = null;
        }
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const data = new Uint8Array(analyser.frequencyBinCount);
        const destBins = target === "mic" ? micBinsRef.current : agentBinsRef.current;
        const sample = () => {
          analyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            sum += data[i];
          }
          // Copy lower 64 voice-band bins (approx 0-11kHz at 44.1/48kHz) into pre-allocated buffer
          const binCount = Math.min(destBins.length, data.length);
          for (let i = 0; i < binCount; i++) {
            destBins[i] = data[i];
          }
          const avg = sum / (data.length * 255);
          const boosted = Math.min(1, avg * 2.4);
          if (target === "mic") {
            micLevelRef.current = boosted;
          } else {
            agentLevelRef.current = boosted;
          }
          targetRafRef.current = requestAnimationFrame(sample);
        };
        targetRafRef.current = requestAnimationFrame(sample);
      } catch {
        // Non-fatal: shader falls back to calm state animation
      }
    },
    []
  );

  const disconnect = useCallback(async () => {
    stopAudioMonitors();
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }
    setConnected(false);
    setMicEnabled(false);
    setAgentState(serverConfigured === false ? "offline" : "idle");
  }, [serverConfigured, stopAudioMonitors]);

  const connect = useCallback(
    async ({
      enableMic,
      persona,
      voiceKey,
    }: {
      enableMic: boolean;
      persona?: AgentPersonaId;
      voiceKey?: AgentVoiceKey;
    }) => {
      setConnectionError(null);
      setMicPermissionError(null);
      const chosenPersona = persona ?? activePersona;
      const chosenVoice = voiceKey ?? activeVoiceKey;
      setActivePersona(chosenPersona);
      setActiveVoiceKey(chosenVoice);

      if (roomRef.current && roomRef.current.state === ConnectionState.Connected) {
        if (enableMic && !micEnabled) {
          try {
            await roomRef.current.localParticipant.setMicrophoneEnabled(true);
            setMicEnabled(true);
          } catch {
            setMicPermissionError(
              "Microphone permission was denied. You can still talk to the agent using text mode below."
            );
          }
        }
        return true;
      }

      setAgentState("connecting");

      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona: chosenPersona, voiceKey: chosenVoice }),
        });

        const data = (await res.json()) as {
          serverUrl?: string;
          participantToken?: string;
          error?: string;
        };

        if (!res.ok || !data.serverUrl || !data.participantToken) {
          setAgentState("offline");
          setConnectionError(
            data.error ||
              "Voice agent backend is offline. You can browse every section of the portfolio directly."
          );
          return false;
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        roomRef.current = room;

        // Register strict schema-validated RPC method for UI orchestration
        room.localParticipant.registerRpcMethod(
          "ui.action",
          async (rpcData: RpcInvocationData) => {
            let parsedRaw: unknown;
            try {
              parsedRaw = JSON.parse(rpcData.payload);
            } catch {
              throw new RpcError(400, "Invalid JSON payload for ui.action");
            }

            const result = UiActionSchema.safeParse(parsedRaw);
            if (!result.success) {
              setTraceLog((prev) => [
                {
                  id: crypto.randomUUID(),
                  timestamp: Date.now(),
                  actionLabel: "invalid_action_rejected",
                  payload: rpcData.payload,
                  ok: false,
                  error: "Schema validation rejected agent payload",
                },
                ...prev.slice(0, 14),
              ]);
              throw new RpcError(422, "UI action failed schema validation");
            }

            const action = result.data;
            const signature = formatActionSignature(action);
            setAgentState("executing");

            const outcome = await onUiActionRef.current(action);

            setTraceLog((prev) => [
              {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                actionLabel: signature,
                payload: JSON.stringify(action, null, 2),
                ok: outcome.ok,
                error: outcome.ok ? undefined : outcome.detail,
              },
              ...prev.slice(0, 14),
            ]);

            return JSON.stringify(outcome);
          }
        );

        // Listen for remote agent state attribute (`lk.agent.state`)
        const syncParticipantState = (participant: RemoteParticipant) => {
          const stateAttr = participant.attributes?.["lk.agent.state"];
          if (stateAttr) {
            setAgentState(mapLiveKitState(stateAttr));
          }
        };

        room.on(RoomEvent.ParticipantConnected, (p) => {
          syncParticipantState(p);
          p.on(ParticipantEvent.AttributesChanged, () => syncParticipantState(p));
        });

        room.on(RoomEvent.ParticipantAttributesChanged, (_changed, participant) => {
          if (participant instanceof RemoteParticipant) {
            syncParticipantState(participant);
          }
        });

        // Attach remote agent audio track + monitor FFT
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            if (audioContainerRef.current) {
              audioContainerRef.current.appendChild(el);
            }
            if (track.mediaStream) {
              startAudioMonitor(track.mediaStream, "agent");
            }
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((el) => el.remove());
        });

        // Live transcripts (both visitor & agent)
        room.on(
          RoomEvent.TranscriptionReceived,
          (segments: TranscriptionSegment[], participant) => {
            const isLocal = participant?.identity === room.localParticipant.identity;
            setTranscript((prev) => {
              const next = [...prev];
              for (const seg of segments) {
                const idx = next.findIndex((item) => item.id === seg.id);
                const entry: TranscriptLine = {
                  id: seg.id,
                  speaker: isLocal ? "visitor" : "agent",
                  text: seg.text,
                  final: seg.final,
                  timestamp: Date.now(),
                };
                if (idx >= 0) {
                  next[idx] = entry;
                } else {
                  next.push(entry);
                }
              }
              return next.slice(-40);
            });
          }
        );

        // Real per-turn latency metrics published by agent/agent.py
        room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
          if (topic === "signal.metrics") {
            try {
              const parsed = JSON.parse(new TextDecoder().decode(payload)) as TurnLatencyMetrics;
              const total =
                (parsed.vadMs ?? 0) +
                (parsed.sttMs ?? 0) +
                (parsed.llmTtftMs ?? 0) +
                (parsed.ttsTtfbMs ?? 0);
              const nextMetric: TurnLatencyMetrics = {
                ...parsed,
                totalMs: total > 0 ? total : undefined,
              };
              setLatestMetrics(nextMetric);
              setMetricsHistory((prev) => [nextMetric, ...prev.slice(0, 11)]);
            } catch {
              // Ignore malformed metrics packets
            }
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          stopAudioMonitors();
          setConnected(false);
          setMicEnabled(false);
          setAgentState("idle");
        });

        await room.connect(data.serverUrl, data.participantToken);
        setConnected(true);
        setAgentState("idle");

        // Sync any already-present remote agent
        room.remoteParticipants.forEach((p) => {
          syncParticipantState(p);
          p.on(ParticipantEvent.AttributesChanged, () => syncParticipantState(p));
        });

        if (enableMic) {
          try {
            const pub = await room.localParticipant.setMicrophoneEnabled(true);
            setMicEnabled(true);
            if (pub?.track?.mediaStream) {
              startAudioMonitor(pub.track.mediaStream, "mic");
            }
          } catch {
            setMicEnabled(false);
            setMicPermissionError(
              "Microphone permission was denied or unavailable. Text mode is open below using the same LiveKit agent."
            );
          }
        }

        return true;
      } catch (err) {
        setAgentState("offline");
        setConnectionError(
          err instanceof Error
            ? `Could not connect to LiveKit: ${err.message}`
            : "Could not connect to the LiveKit voice server."
        );
        return false;
      }
    },
    [activePersona, activeVoiceKey, micEnabled, startAudioMonitor, stopAudioMonitors]
  );

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !connected) {
      await connect({ enableMic: true });
      return;
    }
    try {
      const next = !micEnabled;
      const pub = await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
      setMicPermissionError(null);
      if (next && pub?.track?.mediaStream) {
        startAudioMonitor(pub.track.mediaStream, "mic");
      } else if (!next) {
        micLevelRef.current = 0;
        micBinsRef.current.fill(0);
      }
    } catch {
      setMicPermissionError(
        "Microphone access is blocked in your browser. Enable mic permissions or continue in text mode."
      );
    }
  }, [connect, connected, micEnabled, startAudioMonitor]);

  const sendTextMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected) {
        const ok = await connect({ enableMic: false });
        if (!ok || !roomRef.current) return false;
      }

      const room = roomRef.current;
      try {
        setConnectionError(null);
        // Room connection can finish before the dispatched worker accepts text.
        await waitForAgentReady(room);
        setTranscript((prev) => [
          ...prev.slice(-39),
          {
            id: `local-${crypto.randomUUID()}`,
            speaker: "visitor",
            text: trimmed,
            final: true,
            timestamp: Date.now(),
          },
        ]);
        await room.localParticipant.sendText(trimmed, {
          topic: "lk.chat",
        });
        setAgentState("thinking");
        return true;
      } catch (error) {
        setConnectionError(error instanceof Error ? error.message : "Message could not be sent to the LiveKit room.");
        return false;
      }
    },
    [connect]
  );

  const notifyPanelClosed = useCallback(async (panelName: string) => {
    if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected) return;
    try {
      const bytes = new TextEncoder().encode(
        JSON.stringify({ event: "panel_closed", panel: panelName })
      );
      await roomRef.current.localParticipant.publishData(bytes, {
        reliable: true,
        topic: "ui.events",
      });
    } catch {
      // Non-critical state sync
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudioMonitors();
      roomRef.current?.disconnect();
    };
  }, [stopAudioMonitors]);

  return {
    serverConfigured,
    connected,
    agentState,
    activePersona,
    activeVoiceKey,
    micEnabled,
    micPermissionError,
    connectionError,
    transcript,
    traceLog,
    latestMetrics,
    metricsHistory,
    micLevelRef,
    agentLevelRef,
    micBinsRef,
    agentBinsRef,
    audioContainerRef,
    connect,
    disconnect,
    toggleMic,
    sendTextMessage,
    notifyPanelClosed,
    setTraceLog,
    clearErrors: () => {
      setConnectionError(null);
      setMicPermissionError(null);
    },
  };
}
