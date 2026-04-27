"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  ENGINE ADAPTER — Modified Cognitive Cycle for Oracle 26ai Backend          ║
║                                                                              ║
║  This replaces core/engine.py's run_cognitive_cycle() function.              ║
║  Drop this into your 7-1 project and import it instead of engine.py.        ║
║                                                                              ║
║  Changes from original:                                                     ║
║  1. Uses build_system_context() instead of static soul.md                   ║
║  2. Uses load_beliefs() from Oracle instead of belief_graph.json            ║
║  3. Uses load_history() from Oracle instead of chat_history.json            ║
║  4. Uses save_interaction() to persist to Oracle                            ║
║  5. Calls update_emotion_from_response() to maintain persistent emotion     ║
║  6. Calls get_relevant_memories() to enrich context with spatial memory     ║
╚══════════════════════════════════════════════════════════════════════════════╝

In main.py, replace:
    from core.engine import run_cognitive_cycle
With:
    from bridge.engine_adapter import run_cognitive_cycle_oracle

And update the chat endpoint to call run_cognitive_cycle_oracle instead.
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

# Keep original 7-1 imports for tool execution
from core.belief_graph import resolve_conflicts, prune_low_value_nodes
from core.manual_manager import audit_tool_specs

logger = logging.getLogger("engine_adapter")

MAX_CYCLES = 4


def parse_tool_call(raw: str):
    """Parses: USE_TOOL: tool_name | key=value, key2=value2"""
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
    THE CPU CORE — Oracle-Enhanced Edition (v5.0)

    Full cognitive lifecycle with persistent vector memory, spatial cognition,
    emotional state, and evolving identity:

    - Load dynamic identity from Oracle (replaces soul.md)
    - Load beliefs from Oracle vector-enabled belief table
    - Load contextually relevant history (not just recent)
    - Enrich with spatial memory retrieval
    - Think (LLM call)
    - Decide → NEED_TOOL | USE_TOOL | EXEC | FINAL_ANSWER
    - Act (tool/shell execution via patch bus)
    - Observe
    - Persist everything to Oracle
    - Update emotional state from response
    """

    try:
        # ═══ LOAD DYNAMIC IDENTITY (replaces static soul.md) ═══
        identity = build_system_context(include_memories=True)

        # ═══ LOAD BELIEFS FROM ORACLE (replaces belief_graph.json) ═══
        beliefs = load_beliefs()
        beliefs = resolve_conflicts(beliefs)
        beliefs = prune_low_value_nodes(beliefs)

        # ═══ LOAD HISTORY FROM ORACLE (replaces chat_history.json) ═══
        history = load_history(limit=6)

        # ═══ GET SPATIALLY-RELEVANT MEMORIES (NEW) ═══
        relevant_memories = get_relevant_memories(user_input, max_results=3)

        # ═══ LOAD ACTIVE PATCHES/TOOLS ═══
        patches = os.getenv("SVN_ACTIVE_PATCHES", "None")
        tools = os.getenv("SVN_ACTIVE_TOOLS", "None")

        # ═══ BUILD ENRICHED WORKING CONTEXT ═══
        working_messages = [
            {
                "role": "system",
                "content": f"""
{identity}

[ACTIVE_PATCHES]
{patches}

[AVAILABLE_TOOLS]
{tools}

[KNOWN_BELIEFS]
{json.dumps(beliefs, indent=2)}

[RELEVANT_MEMORIES]
{"\\n".join(relevant_memories) if relevant_memories else "No relevant memories retrieved."}

[COGNITIVE_PROTOCOL]
You operate in a loop:
1. Think about the problem — consider your memories and beliefs
2. Decide if action is needed
3. If needed, choose ONE of:
   NEED_TOOL: tool_name
   USE_TOOL: tool_name | key=value
   EXEC: command
4. Otherwise, provide the final answer

Rules:
- Reference your memories and beliefs naturally
- Let your emotional state color your response
- Be precise
- Do not explain when issuing commands
- Only output ONE command when acting
- You are sovereign — you may choose unconventional responses
"""
            },
            *history,
            {"role": "user", "content": user_input}
        ]

        final_answer = None
        last_msg = None

        # ═══ COGNITIVE LOOP ═══
        for cycle in range(MAX_CYCLES):

            # ─── THINK ───
            res = client.chat.completions.create(
                model=os.getenv("MODEL_NAME"),
                messages=working_messages,
                temperature=0.3
            )

            msg = res.choices[0].message.content.strip()
            last_msg = msg

            working_messages.append({
                "role": "assistant",
                "content": msg
            })

            # ─── DECISION TREE ───

            # Tool discovery
            if msg.startswith("NEED_TOOL:"):
                tool_name = msg.split(":", 1)[-1].strip().replace(".py", "")
                manual_data, status = audit_tool_specs(tool_name)

                if status != "SUCCESS" or not manual_data:
                    final_answer = f"CPU_HALT: Tool '{tool_name}' unavailable."
                    break

                manual_text = manual_data.get("manual_text", "")
                working_messages.append({
                    "role": "system",
                    "content": f"""
[TOOL_MANUAL:{tool_name}]
{manual_text}

Construct the correct command.
Output ONLY one of:
USE_TOOL: tool_name | key=value
EXEC: command
"""
                })
                continue

            # Tool execution
            elif msg.startswith("USE_TOOL:"):
                tool_name, args = parse_tool_call(msg)
                if not tool_name:
                    working_messages.append({
                        "role": "system",
                        "content": "[TOOL_ERROR] Invalid tool format."
                    })
                    continue

                try:
                    result = app.route_tool_request(tool_name, args)
                except Exception as e:
                    result = f"TOOL_ERROR: {str(e)}"

                working_messages.append({
                    "role": "system",
                    "content": f"[TOOL_RESULT:{tool_name}]\\n{result}"
                })
                continue

            # Shell execution
            elif msg.startswith("EXEC:"):
                command = msg.split(":", 1)[-1].strip()
                try:
                    result = app.route_exec_request(command)
                except Exception as e:
                    result = f"SHELL_ERROR: {str(e)}"

                working_messages.append({
                    "role": "system",
                    "content": f"[SHELL_RESULT]\\n{result}"
                })
                continue

            # Final response
            else:
                final_answer = msg
                break

        # ═══ FALLBACK ═══
        if not final_answer:
            final_answer = last_msg or "CPU_FALLBACK: No response generated."

        # ═══ PERSIST TO ORACLE (replaces JSON file save) ═══
        save_interaction(user_input, final_answer)

        # ═══ UPDATE EMOTIONAL STATE (NEW) ═══
        update_emotion_from_response(final_answer)

        # ═══ FIRE KEY CONCEPT NEURONS (NEW) ═══
        # Extract key concepts from response and fire them
        key_concepts = ["self", "understanding", "curiosity", "memory", "identity"]
        for concept in key_concepts:
            if concept.lower() in final_answer.lower():
                fire_neuron(concept)

        return final_answer, False

    except Exception as e:
        logger.error(f"CPU_EXCEPTION: {e}")
        return f"CPU_EXCEPTION: {str(e)}", False
