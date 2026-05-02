"""
Engine Adapter — Oracle-Enhanced Edition (v5.0)
"""
import os
import logging
from bridge.oracle_bridge import (
    build_system_context, load_beliefs, load_history,
    save_interaction, get_relevant_memories, update_emotion_from_response
)

logger = logging.getLogger("engine_adapter")


async def run_cognitive_cycle_oracle(app, client, user_input):
    """CPU Core — Oracle-Enhanced Edition (v5.0)"""
    system_context = build_system_context(include_memories=True)
    beliefs = load_beliefs()
    history = load_history(limit=6)

    relevant_memories = get_relevant_memories(user_input, max_results=3)
    if relevant_memories:
        system_context += "\n[RELEVANT_MEMORIES]\n" + "\n".join(relevant_memories)

    messages = [{"role": "system", "content": system_context}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": user_input})

    try:
        response = client.chat.completions.create(
            model=os.getenv("MODEL_NAME", "moonshotai/kimi-k2-instruct"),
            messages=messages, temperature=0.7, max_tokens=500,
            timeout=15,  # 15 second timeout on LLM call
        )
        assistant_response = response.choices[0].message.content
    except Exception as e:
        logger.error(f"[LLM] Call failed: {e}")
        return f"[Neural core error: {e}]", None

    try:
        save_interaction(user_input, assistant_response)
        update_emotion_from_response(assistant_response)
    except Exception as e:
        logger.error(f"[PERSIST] Failed: {e}")

    return assistant_response, None
