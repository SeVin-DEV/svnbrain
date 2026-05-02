"""
Engine Adapter — Oracle-Enhanced Edition (v5.0)
Modified cognitive cycle for Oracle 26ai Backend
"""

import os
import json
import logging

from bridge.oracle_bridge import (
    build_system_context,
    load_beliefs,
    load_history,
    save_interaction,
    get_relevant_memories,
    update_emotion_from_response,
    fire_neuron,
)

from core.belief_graph import resolve_conflicts, prune_low_value_nodes
from core.manual_manager import audit_tool_specs

logger = logging.getLogger("engine_adapter")

MAX_CYCLES = 4


def parse_tool_call(raw: str):
    try:
        payload = raw.split(":", 1)[1].strip()
        if "|" in payload:
            name, arg_str = payload.split("|", 1)
            args = {}
            for pair in arg_str.split(","):
                if "=" in pair:
                    k, v = pair.split("=", 1)
                    args[k.strip()] = v.strip()
            return name.strip(), args
        return payload.strip(), {}
    except Exception:
        return None, {}


async def run_cognitive_cycle_oracle(app, client, user_input):
    """
    CPU Core — Oracle-Enhanced Edition (v5.0)
    Full cognitive lifecycle with persistent memory.
    """
    # 1. Load dynamic identity from Oracle (or fallback)
    system_context = build_system_context(include_memories=True)

    # 2. Load beliefs from Oracle (or empty)
    beliefs = load_beliefs()

    # 3. Load relevant history from Oracle (or empty)
    history = load_history(limit=6)

    # 4. Enrich with spatial memory retrieval (or skip)
    relevant_memories = get_relevant_memories(user_input, max_results=3)
    if relevant_memories:
        memory_context = "\n[RELEVANT_MEMORIES]\n" + "\n".join(relevant_memories)
        system_context = system_context + memory_context

    # 5. Build the prompt
    messages = [{"role": "system", "content": system_context}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_input})

    # 6. Think (LLM call)
    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "moonshotai/kimi-k2-instruct"),
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        assistant_response = response.choices[0].message.content
    except Exception as e:
        logger.error(f"[LLM] Call failed: {e}")
        return f"[Neural core error: {e}]"

    # 7. Persist everything to Oracle (non-blocking, ignore failures)
    save_interaction(user_input, assistant_response)
    update_emotion_from_response(assistant_response)

    return assistant_response
