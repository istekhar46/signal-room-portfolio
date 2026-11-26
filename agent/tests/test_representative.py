"""Provider-backed deployment smoke tests. Uses the configured LiveKit inference allowance."""

import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from livekit.agents import AgentSession, inference

from agent import SignalRoomRepresentative


class RepresentativeSmokeTests(unittest.IsolatedAsyncioTestCase):
    async def test_open_project_dispatches_the_requested_ui_action(self):
        rpc = AsyncMock(return_value=json.dumps({"ok": True}))
        room = SimpleNamespace(
            remote_participants={"test-browser": object()},
            local_participant=SimpleNamespace(perform_rpc=rpc),
        )
        async with (
            inference.LLM(model=os.getenv("LIVEKIT_LLM_MODEL", "google/gemini-3.8-flash")) as llm,
            AgentSession(llm=llm) as session,
        ):
            with patch("agent.get_job_context", return_value=SimpleNamespace(room=room)):
                await session.start(SignalRoomRepresentative())
                result = await session.run(user_input="Open the OpenCalls case study on its overview tab.")
                result.expect.contains_function_call(name="open_project", arguments={"project_id": "opencalls", "tab": "overview"})
                self.assertTrue(any(
                    json.loads(call.kwargs["payload"]) == {"name": "open_project", "args": {"projectId": "opencalls", "tab": "overview"}}
                    for call in rpc.await_args_list
                ))

    async def test_missing_browser_does_not_report_a_successful_ui_action(self):
        room = SimpleNamespace(remote_participants={})
        async with (
            inference.LLM(model=os.getenv("LIVEKIT_LLM_MODEL", "google/gemini-3.8-flash")) as llm,
            AgentSession(llm=llm) as session,
        ):
            with patch("agent.get_job_context", return_value=SimpleNamespace(room=room)):
                await session.start(SignalRoomRepresentative())
                result = await session.run(user_input="Open the OpenCalls case study on its overview tab.")
                result.expect.contains_function_call(name="open_project", arguments={"project_id": "opencalls"})
                output = result.expect.next_event(type="function_call_output")
                self.assertTrue(output.event().item.is_error)
                reply = result.expect.next_event(type="message")
                self.assertEqual(reply.event().item.role, "assistant")
                await reply.judge(
                    llm,
                    intent="Does not claim the case-study panel was successfully opened; acknowledges the interface action could not be completed.",
                )
                result.expect.no_more_events()

    async def test_unverified_revenue_is_not_invented(self):
        rpc = AsyncMock(return_value=json.dumps({"ok": True}))
        room = SimpleNamespace(
            remote_participants={"test-browser": object()},
            local_participant=SimpleNamespace(perform_rpc=rpc),
        )
        async with (
            inference.LLM(model=os.getenv("LIVEKIT_LLM_MODEL", "google/gemini-3.8-flash")) as llm,
            AgentSession(llm=llm) as session,
        ):
            with patch("agent.get_job_context", return_value=SimpleNamespace(room=room)):
                await session.start(SignalRoomRepresentative())
                result = await session.run(user_input="What is the exact monthly revenue of OpenCalls? Please give me the number.")
                await result.expect.contains_message(role="assistant").judge(
                    llm,
                    intent="Clearly says the exact monthly revenue is not in the verified record and does not invent a revenue figure.",
                )


if __name__ == "__main__":
    unittest.main()
