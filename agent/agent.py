"""
Signal Room — LiveKit Agents Python Voice Worker
Core voice & WebRTC engine: LiveKit Agents (~=1.8)
TTS engine: ElevenLabs plugin inside LiveKit (livekit-plugins-elevenlabs)
UI orchestration: Structured RPC calls (`ui.action`) to the Next.js frontend
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    RunContext,
    StopResponse,
    ToolError,
    TurnHandlingOptions,
    cli,
    function_tool,
    get_job_context,
    inference,
)
from livekit.plugins import elevenlabs, google, silero

from portfolio_context import build_greeting, build_instructions

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env.local")
load_dotenv(ROOT_DIR / ".env")
load_dotenv(".env.local")
load_dotenv()

logger = logging.getLogger("signal-room-agent")

SectionId = Literal["hero", "about", "voice-lab", "projects", "writing", "experience", "stack", "contact"]
ProjectId = Literal["opencalls", "invoiceo", "ruh-ai-voice"]
ProjectTab = Literal["overview", "problem", "architecture", "decisions", "stack", "contributions"]
RoleId = Literal["opencalls", "invoiceo", "ruh-ai", "rapid-innovation", "unbundl", "auralapp"]
VoiceTopicId = Literal[
    "pipeline", "vad", "stt", "llm", "tts", "webrtc", "sip", "telephony", "latency", "tools"
]
ArticleId = Literal[
    "inside-opencalls",
    "observability-signoz",
    "celery-rabbitmq-redis",
    "voice-agents-pain-points",
    "redis-lua-idempotency",
    "architecting-voice-agents",
]
HighlightTargetId = Literal[
    "active-projects",
    "opencalls",
    "invoiceo",
    "ruh-ai-voice",
    "voice-pipeline",
    "writing-notes",
    "experience-current",
    "contact-email",
]

AGENT_NAME = os.getenv("LIVEKIT_AGENT_NAME", "signal-room-representative")

server = AgentServer()


async def dispatch_ui_action(name: str, args: dict) -> str:
    """Send a structured UI action via LiveKit RPC to the connected browser participant."""
    room = get_job_context().room
    remote_identities = list(room.remote_participants.keys())
    if not remote_identities:
        raise ToolError("No browser participant connected to receive UI action.")

    payload = json.dumps({"name": name, "args": args})
    try:
        response = await room.local_participant.perform_rpc(
            destination_identity=remote_identities[0],
            method="ui.action",
            payload=payload,
            response_timeout=5.0,
        )
        return response
    except Exception as exc:
        logger.warning("UI RPC %s failed: %s", name, exc)
        raise ToolError(f"Could not execute UI action {name} on the client.") from exc


class SignalRoomRepresentative(Agent):
    def __init__(self, persona: str = "representative") -> None:
        self._persona = persona
        super().__init__(instructions=build_instructions(persona))

    async def on_enter(self) -> None:
        await self.session.generate_reply(instructions=build_greeting(self._persona))

    @function_tool()
    async def navigate_to_section(
        self, context: RunContext, section: SectionId
    ) -> str:
        """Smooth-scroll the portfolio page to a specific section."""
        return await dispatch_ui_action("navigate_to_section", {"section": section})

    @function_tool()
    async def open_project(
        self,
        context: RunContext,
        project_id: ProjectId,
        tab: Optional[ProjectTab] = None,
    ) -> str:
        """Open a project's Stage Panel case study (opencalls, invoiceo, or ruh-ai-voice)."""
        args: dict = {"projectId": project_id}
        if tab:
            args["tab"] = tab
        return await dispatch_ui_action("open_project", args)

    @function_tool()
    async def open_experience_panel(
        self,
        context: RunContext,
        role_id: Optional[RoleId] = None,
    ) -> str:
        """Navigate to the multitrack experience timeline and optionally scrub to a specific role."""
        args: dict = {}
        if role_id:
            args["roleId"] = role_id
        return await dispatch_ui_action("open_experience_panel", args)

    @function_tool()
    async def open_skill_explorer(
        self,
        context: RunContext,
        topic: Optional[VoiceTopicId] = None,
    ) -> str:
        """Open the interactive Voice Engineering explorer focused on a specific voice pipeline topic."""
        args: dict = {}
        if topic:
            args["topic"] = topic
        return await dispatch_ui_action("open_skill_explorer", args)

    @function_tool()
    async def open_writing_panel(
        self,
        context: RunContext,
        article_id: Optional[ArticleId] = None,
    ) -> str:
        """Open the Engineering Notes & Writing HUD focused on one of Istekhar's published Medium articles."""
        args: dict = {}
        if article_id:
            args["articleId"] = article_id
        return await dispatch_ui_action("open_writing_panel", args)

    @function_tool()
    async def show_architecture(
        self, context: RunContext, project_id: ProjectId
    ) -> str:
        """Open a project's Stage Panel directly to its technical architecture diagram."""
        return await dispatch_ui_action("show_architecture", {"projectId": project_id})

    @function_tool()
    async def open_contact_panel(self, context: RunContext) -> str:
        """Open the contact panel displaying Istekhar Khan's email and LinkedIn."""
        return await dispatch_ui_action("open_contact_panel", {})

    @function_tool()
    async def highlight_content(
        self, context: RunContext, target_id: HighlightTargetId
    ) -> str:
        """Trigger a tactical highlight lock-on around a specific portfolio target."""
        return await dispatch_ui_action("highlight_content", {"targetId": target_id})

    @function_tool()
    async def close_active_panel(self, context: RunContext) -> str:
        """Close whichever Stage Panel drawer is currently open."""
        return await dispatch_ui_action("close_active_panel", {})

    @function_tool()
    async def start_autopilot_tour(self, context: RunContext) -> str:
        """Launch the visual Auto-UI Pilot guided tour across Voice Lab, OpenCalls, Writing, Experience, and Contact."""
        return await dispatch_ui_action("start_autopilot_tour", {})

    @function_tool()
    async def end_voice_session(
        self,
        context: RunContext,
        farewell: Optional[str] = None,
    ) -> None:
        """End voice mode cleanly when the visitor says they are done talking.

        Speaks the brief farewell first, then closes any open HUD popups, scrolls back to
        the hero section, and shuts down the voice session.

        Args:
            farewell: A short, warm 1-sentence goodbye to speak before ending the session.
        """
        context.disallow_interruptions()
        closing_line = (
            farewell.strip()
            if farewell and farewell.strip()
            else "Thanks for exploring Istekhar's portfolio — feel free to tap Talk to my AI anytime."
        )
        speech_handle = context.session.say(
            closing_line,
            allow_interruptions=False,
        )
        await speech_handle.wait_for_playout()
        try:
            await dispatch_ui_action("end_voice_session", {"reason": "user_finished"})
        except ToolError as exc:
            logger.debug("Client already disconnected before end_voice_session RPC: %s", exc)
        context.session.shutdown(drain=False)
        raise StopResponse()


ALLOWED_ELEVENLABS_VOICE_IDS = {
    "EXAVITQu4vr4xnSDxMaL",  # Sarah
    "Xb7hH8MSUJpSbSDYk0k2",  # Alice
    "hpp4J3VqNfWAUOO0d1Us",  # Bella
}


@server.rtc_session(agent_name=AGENT_NAME)
async def entrypoint(ctx: JobContext) -> None:
    await ctx.connect()

    persona = "representative"
    default_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
    resolved_voice_id = default_voice_id
    raw_meta = getattr(ctx.job, "metadata", "") or ""
    if raw_meta:
        try:
            parsed_meta = json.loads(raw_meta)
            if isinstance(parsed_meta, dict):
                if isinstance(parsed_meta.get("persona"), str):
                    persona = parsed_meta["persona"]
                requested_voice = parsed_meta.get("voiceId")
                if isinstance(requested_voice, str) and requested_voice in ALLOWED_ELEVENLABS_VOICE_IDS:
                    resolved_voice_id = requested_voice
        except Exception:
            logger.debug("Ignoring non-JSON job metadata")

    # ElevenLabs TTS plugin inside LiveKit (requires ELEVEN_API_KEY)
    tts_plugin = elevenlabs.TTS(
        voice_id=resolved_voice_id,
        model=os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5"),
    )

    vad_plugin = silero.VAD.load()

    # LLM: Google Gemini 3.8 Flash (low-latency voice + fast structured tool calling).
    # Defaults to LiveKit Inference (recommended on LiveKit Cloud — no Google AI Studio credits needed).
    # Set LIVEKIT_USE_GOOGLE_PLUGIN=true with GOOGLE_API_KEY to call Google's Gemini API directly.
    configured_llm = os.getenv("LIVEKIT_LLM_MODEL", "google/gemini-3.8-flash")
    use_google_plugin = os.getenv("LIVEKIT_USE_GOOGLE_PLUGIN", "").lower() in {
        "1",
        "true",
        "yes",
    }
    google_api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if use_google_plugin and google_api_key:
        plugin_model = configured_llm.removeprefix("google/")
        llm_instance = google.LLM(
            model=plugin_model,
            api_key=google_api_key,
            thinking_config={"thinking_level": "minimal"},
        )
    else:
        inference_model = (
            configured_llm if "/" in configured_llm else f"google/{configured_llm}"
        )
        llm_instance = inference.LLM(
            model=inference_model,
            extra_kwargs={"reasoning_effort": "low"},
        )

    stt_instance = inference.STT(
        model=os.getenv("LIVEKIT_STT_MODEL", "deepgram/nova-3:en")
    )

    session = AgentSession(
        stt=stt_instance,
        llm=llm_instance,
        tts=tts_plugin,
        vad=vad_plugin,
        turn_handling=TurnHandlingOptions(
            turn_detection=inference.TurnDetector(),
        ),
        use_tts_aligned_transcript=True,
    )

    # Stream real per-turn latency metrics to the frontend Signal Trace
    latest_metrics: dict[str, int] = {}

    async def publish_metrics() -> None:
        payload = json.dumps({**latest_metrics, "measuredAt": int(time.time() * 1000)})
        try:
            await ctx.room.local_participant.publish_data(
                payload.encode("utf-8"),
                reliable=True,
                topic="signal.metrics",
            )
        except Exception as exc:
            logger.debug("Metrics publish skipped: %s", exc)

    @stt_instance.on("metrics_collected")
    def _on_stt_metrics(metrics) -> None:
        duration = getattr(metrics, "duration", None)
        if isinstance(duration, (int, float)) and duration > 0:
            latest_metrics["sttMs"] = round(duration * 1000)
            asyncio.create_task(publish_metrics())

    @llm_instance.on("metrics_collected")
    def _on_llm_metrics(metrics) -> None:
        ttft = getattr(metrics, "ttft", None)
        if isinstance(ttft, (int, float)) and ttft > 0:
            latest_metrics["llmTtftMs"] = round(ttft * 1000)
            asyncio.create_task(publish_metrics())

    @tts_plugin.on("metrics_collected")
    def _on_tts_metrics(metrics) -> None:
        ttfb = getattr(metrics, "ttfb", None)
        if isinstance(ttfb, (int, float)) and ttfb > 0:
            latest_metrics["ttsTtfbMs"] = round(ttfb * 1000)
            asyncio.create_task(publish_metrics())

    # Capture per-message latency reported by LiveKit Agents
    @session.on("conversation_item_added")
    def _on_item_added(event) -> None:
        item = getattr(event, "item", None)
        metrics = getattr(item, "metrics", None) if item else None
        if not metrics:
            return
        updated = False
        for attr, key in [
            ("llm_node_ttft", "llmTtftMs"),
            ("tts_node_ttfb", "ttsTtfbMs"),
            ("transcription_delay", "sttMs"),
            ("end_of_turn_delay", "vadMs"),
        ]:
            val = getattr(metrics, attr, None)
            if isinstance(val, (int, float)) and val > 0:
                latest_metrics[key] = round(val * 1000)
                updated = True
        if updated:
            asyncio.create_task(publish_metrics())

    await session.start(
        room=ctx.room,
        agent=SignalRoomRepresentative(persona=persona),
    )


if __name__ == "__main__":
    cli.run_app(server)
