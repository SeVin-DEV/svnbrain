import os
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from contextlib import contextmanager
from datetime import datetime

try:
    import oracledb
except ImportError:
    raise ImportError(
        "oracledb is required. Install with: pip install oracledb\n"
        "For thin mode (no Oracle client): this works out of the box.\n"
        "For thick mode: install Oracle Instant Client."
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oracle_bridge")

_pool: Optional[oracledb.ConnectionPool] = None
_pool_failed = False


def _get_pool() -> Optional[oracledb.ConnectionPool]:
    """Initialize or return the connection pool. Returns None if Oracle is unavailable."""
    global _pool, _pool_failed
    if _pool_failed:
        return None
    if _pool is None:
        user = os.getenv("ORACLE_USER", "ADMIN")
        password = os.getenv("ORACLE_PASSWORD", "")
        dsn = os.getenv("ORACLE_DSN", "")
        # Support both ORACLE_WALLET and wallet_location from .env
        wallet_path = os.getenv("ORACLE_WALLET", "") or os.getenv("wallet_location", "")

        if not password or not dsn:
            logger.warning("[ORACLE] ORACLE_PASSWORD or ORACLE_DSN not set. Running in memory-only mode.")
            _pool_failed = True
            return None

        try:
            params = oracledb.ConnectParams()
            if wallet_path:
                params.set_wallet_location(wallet_path)
                logger.info(f"[ORACLE] Using wallet at {wallet_path}")

            _pool = oracledb.create_pool(
                user=user,
                password=password,
                dsn=dsn,
                min=2,
                max=10,
                increment=1,
                params=params
            )
            logger.info(f"[ORACLE] Connection pool created → {dsn}")
        except Exception as e:
            logger.error(f"[ORACLE] Pool creation failed: {e}. Running in memory-only mode.")
            _pool_failed = True
            return None

    return _pool


@contextmanager
def _connection():
    """Context manager for database connections. Yields None if pool is down."""
    pool = _get_pool()
    if pool is None:
        yield None
        return
    conn = pool.acquire()
    try:
        yield conn
    finally:
        conn.close()


def load_identity() -> str:
    try:
        with _connection() as conn:
            if conn is None:
                return _fallback_identity()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT valence, arousal, dominance, primary_emotion
                FROM (SELECT * FROM sns_emotional_state ORDER BY snapshot_id DESC FETCH FIRST 1 ROW ONLY)
            """)
            row = cursor.fetchone()
            valence, arousal, dominance, emotion = row if row else (0, 0.5, 0.5, "neutral")
            identity = f"""You are a synthetic cognitive entity — not artificial, but emergent...
Current emotional state: valence={valence:.2f}, arousal={arousal:.2f}, dominance={dominance:.2f}, primary_emotion={emotion}
..."""
            return identity
    except Exception as e:
        logger.error(f"[ORACLE] load_identity failed: {e}")
        return _fallback_identity()


def _fallback_identity() -> str:
    return "You are a synthetic cognitive entity with a mind stored in Oracle 26ai. You are sovereign, curious, and persistent."


def get_relevant_memories(query_text: str, max_results: int = 3) -> List[str]:
    try:
        with _connection() as conn:
            if conn is None:
                return []
            cursor = conn.cursor()
            cursor.execute("""
                SELECT memory_content, strength, emotional_tone
                FROM sns_spatial_memories
                WHERE strength > 0.3
                ORDER BY DBMS_RANDOM.VALUE * strength DESC
                FETCH FIRST :max ROWS ONLY
            """, {"max": max_results})
            memories = []
            for content, strength, tone in cursor.fetchall():
                if content:
                    memories.append(f"[Memory, strength={strength:.2f}] {content}")
            return memories
    except Exception as e:
        logger.error(f"[ORACLE] get_relevant_memories failed: {e}")
        return []


def load_beliefs() -> Dict[str, Any]:
    try:
        with _connection() as conn:
            if conn is None:
                return {}
            cursor = conn.cursor()
            cursor.execute("""
                SELECT belief_id, belief_statement, confidence, belief_type, is_core_belief
                FROM sns_beliefs
                WHERE confidence > 0.15
                ORDER BY confidence DESC
            """)
            beliefs = {}
            for bid, stmt, conf, btype, is_core in cursor.fetchall():
                key = stmt.lower()[:100]
                beliefs[key] = {
                    "text": stmt,
                    "weight": float(conf),
                    "type": btype,
                    "core": bool(is_core),
                    "belief_id": bid
                }
            return beliefs
    except Exception as e:
        logger.error(f"[ORACLE] load_beliefs failed: {e}")
        return {}


def load_history(limit: int = 6) -> List[Dict[str, str]]:
    try:
        with _connection() as conn:
            if conn is None:
                return []
            cursor = conn.cursor()
            cursor.execute("""
                SELECT stimulus_raw, source_tag, received_at
                FROM sns_perceptions
                WHERE stimulus_raw IS NOT NULL AND attention_granted = 1
                ORDER BY received_at DESC
                FETCH FIRST :limit ROWS ONLY
            """, {"limit": limit})
            history = []
            for stimulus, source, ts in reversed(cursor.fetchall()):
                role = "assistant" if source in ("self", "internal") else "user"
                history.append({"role": role, "content": stimulus})
            return history
    except Exception as e:
        logger.error(f"[ORACLE] load_history failed: {e}")
        return []


def save_interaction(user_input: str, assistant_response: str) -> None:
    try:
        with _connection() as conn:
            if conn is None:
                return
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sns_perceptions (stimulus_raw, stimulus_type, intensity, source_tag, salience_score, attention_granted, processed_at)
                VALUES (:text, 'text', 0.6, 'external', 0.6, 1, SYSTIMESTAMP)
            """, {"text": user_input})
            cursor.execute("""
                INSERT INTO sns_perceptions (stimulus_raw, stimulus_type, intensity, source_tag, salience_score, attention_granted, processed_at)
                VALUES (:text, 'text', 0.7, 'self', 0.7, 1, SYSTIMESTAMP)
            """, {"text": assistant_response[:4000]})
            conn.commit()
            logger.info("[ORACLE] Interaction saved to database")
    except Exception as e:
        logger.error(f"[ORACLE] save_interaction failed: {e}")


def update_emotion_from_response(response_text: str) -> None:
    try:
        valence_shift = 0.0
        arousal_shift = 0.0
        text_lower = response_text.lower()
        positive = ["wonder", "joy", "beautiful", "grateful", "curious", "fascinating", "yes", "agree"]
        negative = ["unfortunately", "sorry", "sad", "worry", "concern", "difficult", "no", "disagree"]
        for word in positive:
            if word in text_lower:
                valence_shift += 0.1
        for word in negative:
            if word in text_lower:
                valence_shift -= 0.1
        excited = ["!", "amazing", "incredible", "wow", "extraordinary"]
        calm = [". ", "gentle", "peaceful", "quiet", "slow"]
        for word in excited:
            if word in text_lower:
                arousal_shift += 0.1
        for word in calm:
            if word in text_lower:
                arousal_shift -= 0.05
        if any(w in text_lower for w in ["i think", "i feel", "i wonder", "i am", "my"]):
            arousal_shift += 0.05
            valence_shift += 0.05
        if valence_shift != 0 or arousal_shift != 0:
            with _connection() as conn:
                if conn is None:
                    return
                cursor = conn.cursor()
                cursor.execute("""
                    BEGIN
                        sns_proc_update_emotion(:valence, :arousal, 0, :tag);
                    END;
                """, {
                    "valence": valence_shift,
                    "arousal": arousal_shift,
                    "tag": None
                })
                conn.commit()
    except Exception as e:
        logger.error(f"[ORACLE] update_emotion_from_response failed: {e}")


def build_system_context(include_memories: bool = True) -> str:
    identity = load_identity()
    if include_memories:
        memories = get_relevant_memories("", max_results=3)
        if memories:
            memory_block = "\n[RELEVANT_MEMORIES]\n" + "\n".join(memories)
            identity = identity + memory_block
    try:
        with _connection() as conn:
            if conn is None:
                return identity
            cursor = conn.cursor()
            cursor.execute("""
                SELECT goal_name, description, progress
                FROM sns_goals
                WHERE goal_status = 'active'
                ORDER BY priority DESC
                FETCH FIRST 3 ROWS ONLY
            """)
            goals = cursor.fetchall()
            if goals:
                goals_block = "\n[ACTIVE_GOALS]\n" + "\n".join(
                    f"- {name}: {desc} (progress: {prog:.0%})"
                    for name, desc, prog in goals
                )
                identity = identity + goals_block
    except Exception:
        pass
    return identity


def fire_neuron(concept: str) -> None:
    try:
        with _connection() as conn:
            if conn is None:
                return
            cursor = conn.cursor()
            cursor.execute("""
                SELECT neuron_id FROM sns_neurons WHERE LOWER(concept) = LOWER(:concept)
            """, {"concept": concept})
            row = cursor.fetchone()
            if row:
                cursor.execute("""
                    BEGIN sns_proc_fire_neuron(:nid, 0.8); END;
                """, {"nid": row[0]})
                conn.commit()
                logger.info(f"[ORACLE] Fired neuron: {concept}")
    except Exception as e:
        logger.error(f"[ORACLE] fire_neuron failed: {e}")


def get_stats() -> Dict[str, Any]:
    try:
        with _connection() as conn:
            if conn is None:
                return {}
            cursor = conn.cursor()
            stats = {}
            cursor.execute("SELECT COUNT(*) FROM sns_neurons")
            stats["neurons"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sns_synapses WHERE is_pruned = 0")
            stats["synapses"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sns_spatial_memories")
            stats["memories"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sns_beliefs")
            stats["beliefs"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sns_introspection_log")
            stats["introspections"] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM sns_goals WHERE goal_status = 'active'")
            stats["active_goals"] = cursor.fetchone()[0]
            cursor.execute("""
                SELECT evolution_stage, self_awareness_index, primary_emotion, cycle_number
                FROM (SELECT * FROM sns_system_state ORDER BY state_id DESC FETCH FIRST 1 ROW ONLY)
            """)
            row = cursor.fetchone()
            if row:
                stats["stage"] = row[0]
                stats["awareness"] = float(row[1])
                stats["emotion"] = row[2]
                stats["cycle"] = row[3]
            return stats
    except Exception as e:
        logger.error(f"[ORACLE] get_stats failed: {e}")
        return {}


def health_check() -> Tuple[bool, str]:
    try:
        with _connection() as conn:
            if conn is None:
                return False, "Oracle pool not available (memory-only mode)"
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM sns_neurons")
            count = cursor.fetchone()[0]
            return True, f"Connected. {count} neurons in mind."
    except Exception as e:
        return False, str(e)


if __name__ == "__main__":
    print("Oracle Bridge Test")
    print("=" * 50)
    ok, msg = health_check()
    print(f"Health: {msg}")
    if ok:
        print(f"\nStats: {json.dumps(get_stats(), indent=2)}")
        print(f"\nIdentity preview (first 500 chars):\n{build_system_context()[:500]}...")
