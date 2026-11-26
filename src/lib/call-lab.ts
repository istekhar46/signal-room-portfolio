export type CallPhase = "ready" | "listening" | "transcribing" | "thinking" | "speaking" | "complete" | "interrupted";

export const CALL_STAGES = [
  { phase: "listening", at: 0, label: "Listening", event: "room.joined", detail: "A prompt snapshot is pinned to this call." },
  { phase: "transcribing", at: 1.6, label: "Transcribing", event: "transcript.final", detail: "The caller's utterance is ready for the model." },
  { phase: "thinking", at: 2.8, label: "Thinking", event: "generation.started", detail: "The active generation uses the pinned prompt." },
  { phase: "speaking", at: 4.4, label: "Speaking", event: "audio.streaming", detail: "Interrupt now to cancel the pending output." },
  { phase: "complete", at: 8, label: "Complete", event: "turn.completed", detail: "The completion event is applied once." },
] as const;

export interface CallLabEvent {
  name: string;
  detail: string;
  kind: "normal" | "change" | "guard";
}

export interface CallLabState {
  run: number;
  phase: CallPhase;
  publishedVersion: number;
  snapshotVersion: number | null;
  eventDeliveries: number;
  eventApplications: number;
  events: CallLabEvent[];
}

export type CallLabAction =
  | { type: "start" }
  | { type: "stage"; run: number; phase: (typeof CALL_STAGES)[number]["phase"] }
  | { type: "interrupt" }
  | { type: "publish" }
  | { type: "deliver"; run: number };

export const INITIAL_CALL_LAB: CallLabState = {
  run: 0,
  phase: "ready",
  publishedVersion: 1,
  snapshotVersion: null,
  eventDeliveries: 0,
  eventApplications: 0,
  events: [],
};

export function isCallActive(phase: CallPhase): boolean {
  return phase !== "ready" && phase !== "complete" && phase !== "interrupted";
}

function record(state: CallLabState, event: CallLabEvent): CallLabState {
  return { ...state, events: [...state.events, event].slice(-7) };
}

export function callLabReducer(state: CallLabState, action: CallLabAction): CallLabState {
  switch (action.type) {
    case "start":
      if (isCallActive(state.phase)) return state;
      return {
        ...state,
        run: state.run + 1,
        phase: "listening",
        snapshotVersion: state.publishedVersion,
        eventDeliveries: 0,
        eventApplications: 0,
        events: [{ name: "room.joined", detail: `Call ${state.run + 1} pinned prompt v${state.publishedVersion}.`, kind: "normal" }],
      };
    case "stage": {
      if (action.run !== state.run || !isCallActive(state.phase)) return state;
      const current = CALL_STAGES.findIndex((stage) => stage.phase === state.phase);
      const next = CALL_STAGES.findIndex((stage) => stage.phase === action.phase);
      if (next !== current + 1) return state;
      const stage = CALL_STAGES[next];
      const updated = record({ ...state, phase: action.phase }, { name: stage.event, detail: stage.detail, kind: "normal" });
      return action.phase === "complete" ? callLabReducer(updated, { type: "deliver", run: state.run }) : updated;
    }
    case "interrupt":
      if (!isCallActive(state.phase)) return state;
      return record({ ...state, phase: "interrupted" }, {
        name: "generation.cancelled",
        detail: "Pending output cancelled. This turn cannot resume.",
        kind: "guard",
      });
    case "publish":
      return record({ ...state, publishedVersion: state.publishedVersion + 1 }, {
        name: "prompt.published",
        detail: state.snapshotVersion === null
          ? `Prompt v${state.publishedVersion + 1} is ready for the next call.`
          : `Published v${state.publishedVersion + 1}. Call ${state.run} keeps v${state.snapshotVersion}.`,
        kind: "change",
      });
    case "deliver":
      if (action.run !== state.run || state.phase !== "complete") return state;
      return record({ ...state, eventDeliveries: state.eventDeliveries + 1, eventApplications: 1 }, {
        name: state.eventApplications ? "duplicate.ignored" : "event.applied",
        detail: state.eventApplications
          ? `call-${state.run}:completed already applied. No second side effect.`
          : `call-${state.run}:completed recorded with its event key.`,
        kind: state.eventApplications ? "guard" : "normal",
      });
  }
}
