import assert from "node:assert/strict";
import test from "node:test";
import { CALL_STAGES, INITIAL_CALL_LAB, callLabReducer } from "./call-lab.ts";

function complete(state) {
  return CALL_STAGES.slice(1).reduce((current, stage) => callLabReducer(current, { type: "stage", run: state.run, phase: stage.phase }), state);
}

test("publishing mid-call preserves the snapshot and the next call uses the new version", () => {
  let state = callLabReducer(INITIAL_CALL_LAB, { type: "start" });
  state = callLabReducer(state, { type: "publish" });
  assert.equal(state.publishedVersion, 2);
  assert.equal(state.snapshotVersion, 1);
  state = callLabReducer(complete(state), { type: "start" });
  assert.equal(state.snapshotVersion, 2);
  assert.equal(state.run, 2);
});

test("interruption rejects pending output and completion callbacks", () => {
  let state = callLabReducer(INITIAL_CALL_LAB, { type: "start" });
  state = callLabReducer(state, { type: "interrupt" });
  const interrupted = state;
  for (const stage of CALL_STAGES) state = callLabReducer(state, { type: "stage", run: 1, phase: stage.phase });
  state = callLabReducer(state, { type: "deliver", run: 1 });
  assert.equal(state, interrupted);
  assert.equal(state.eventApplications, 0);
});

test("repeated completion deliveries apply one side effect", () => {
  let state = complete(callLabReducer(INITIAL_CALL_LAB, { type: "start" }));
  for (let i = 0; i < 10; i++) state = callLabReducer(state, { type: "deliver", run: state.run });
  assert.equal(state.eventDeliveries, 11);
  assert.equal(state.eventApplications, 1);
  assert.equal(state.events.at(-1).name, "duplicate.ignored");
});

test("old-run events, skipped stages, and overlapping starts do not advance a call", () => {
  let state = callLabReducer(INITIAL_CALL_LAB, { type: "start" });
  assert.equal(callLabReducer(state, { type: "start" }), state);
  assert.equal(callLabReducer(state, { type: "stage", run: 1, phase: "complete" }), state);
  state = callLabReducer(callLabReducer(state, { type: "interrupt" }), { type: "start" });
  assert.equal(callLabReducer(state, { type: "stage", run: 1, phase: "transcribing" }), state);
  assert.equal(callLabReducer(state, { type: "deliver", run: 1 }), state);
  assert.equal(state.eventApplications, 0);
});
