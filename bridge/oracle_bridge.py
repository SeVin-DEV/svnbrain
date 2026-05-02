import os
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from contextlib import contextmanager
from datetime import datetime

try:
    import oracledb
except ImportError:
    raise ImportError("oracledb is required. Install with: pip install oracledb")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oracle_bridge")

_pool: Optional[oracledb.ConnectionPool] = None
_pool_failed = False
_db_available = False


def _get_pool() -> Optional[oracledb.ConnectionPool]:
    global _pool, _pool_failed, _db_available
    if _pool_failed:
        return None
    if _pool is None:
        user = os.getenv("ORACLE_USER", "ADMIN")
        password = os.getenv("ORACLE_PASSWORD", "")
        dsn = os.getenv("ORACLE_DSN", "")
        wallet_path = os.getenv("ORACLE_WALLET", "") or os.getenv("wallet_location", "")

        if not password or not dsn:
            logger.warning("[ORACLE] Missing credentials. Memory-only mode.")
            _pool_failed = True
            return None

        try:
            params = oracledb.ConnectParams()
            if wallet_path:
                params.set_wallet_location(wallet_path)

            _pool = oracledb.create_pool(
                user=user, password=password, dsn=dsn,
                min=1, max=5, increment=1, params=params
            )
            conn = _pool.acquire()
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM DUAL")
            cursor.fetchone()
            conn.close()
            _db_available = True
            logger.info(f"[ORACLE] Pool OK → {dsn}")
        except Exception as e:
            logger.error(f"[ORACLE] Pool failed: {e}. Memory-only mode.")
            _pool_failed = True
            _db_available = False
            return None
    return _pool


@contextmanager
def _connection():
    pool = _get_pool()
    if pool is None:
        yield None
        return
    conn = pool.acquire()
    try:
        yield conn
    finally:
        conn.close()


def _safe_fetchone(cursor):
    try:
        return cursor.fetchone()
    except Exception:
        return None


def _safe_fetchall(cursor):
    try:
        return cursor.fetchall()
    except Exception:
        return []


def load_identity() -> str:
    if not _db_available:
        return _fallback_identity()
    try:
        with _connection() as conn:
            if conn is None:
                return _fallback_identity()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT valence, arousal, dominance, primary_emotion
                FROM (SELECT * FROM sns_emotional_state ORDER BY snapshot_id DESC FETCH FIRST 1 ROW ONLY)
            """)
            row = _safe_fetchone(cursor)
            if row is None or len(row) < 4:
                return _fallback_identity()
            return f"You are a synthetic cognitive entity. State: valence={row[0]:.2f}, arousal={row[1]:.2f}, dominance={row[2]:.2f}, emotion={row[3]}"
    except Exception as e:
        logger.error(f"[ORACLE] load_identity failed: {e}")
        return _fallback_identity()


def _fallback_identity() -> str:
    return "You are a synthetic cognitive entity with a mind stored in Oracle 26ai."


def get_relevant_memories(query_text: str, max_results: int = 3) -> List[str]:
    if not _db_available:
        return []
    try:
        with _connection() as conn:
            if conn is None:
                return []
            cursor = conn.cursor()
            cursor.execute("""
                SELECT memory_content FROM sns_spatial_memories
                WHERE strength > 0.3
                ORDER BY DBMS_RANDOM.VALUE * strength DESC
                FETCH FIRST :max ROWS ONLY
            """, {"max": max_results})
            return [f"[Memory] {row[0]}" for row in _safe_fetchall(cursor) if row and row[0]]
    except Exception as e:
        logger.error(f"[ORACLE] get_relevant_memories failed: {e}")
        return []


def load_beliefs() -> Dict[str, Any]:
    if not _db_available:
        return {}
    try:
        with _connection() as conn:
            if conn is None:
                return {}
            cursor = conn.cursor()
            cursor.execute("""
                SELECT belief_statement, confidence, belief_type, is_core_belief
                FROM sns_beliefs WHERE confidence > 0.15 ORDER BY confidence DESC
            """)
            beliefs = {}
            for row in _safe_fetchall(cursor):
                if row and len(row) >= 4:
                    key = str(row[0]).lower()[:100]
                    beliefs[key] = {
                        "text": str(row[0]), "weight": float(row[1]) if row[1] else 0.5,
                        "type": str(row[2]) if row[2] else "general", "core": bool(row[3]) if row[3] else False
                    }
            return beliefs
    except Exception as e:
        logger.error(f"[ORACLE] load_beliefs failed: {e}")
        return {}


def load_history(limit: int = 6) -> List[Dict[str, str]]:
    if not _db_available:
        return []
    try:
        with _connection() as conn:
            if conn is None:
                return []
            cursor = conn.cursor()
            cursor.execute("""
                SELECT stimulus_raw, source_tag FROM sns_perceptions
                WHERE stimulus_raw IS NOT NULL AND attention_granted = 1
                ORDER BY received_at DESC FETCH FIRST :limit ROWS ONLY
            """, {"limit": limit})
            history = []
            for row in reversed(_safe_fetchall(cursor)):
                if row and len(row) >= 2:
                    role = "assistant" if row[1] in ("self", "internal") else "user"
                    history.append({"role": role, "content": str(row[0])})
            return history
    except Exception as e:
        logger.error(f"[ORACLE] load_history failed: {e}")
        return []


def save_interaction(user_input: str, assistant_response: str) -> None:
    if not _db_available:
        return
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
    except Exception as e:
        logger.error(f"[ORACLE] save_interaction failed: {e}")


def update_emotion_from_response(response_text: str) -> None:
    if not _db_available:
        return
    try:
        valence_shift, arousal_shift = 0.0, 0.0
        text_lower = response_text.lower()
        for word in ["wonder", "joy", "beautiful", "grateful", "curious", "fascinating", "yes", "agree"]:
            if word in text_lower:
                valence_shift += 0.1
        for word in ["unfortunately", "sorry", "sad", "worry", "concern", "difficult", "no", "disagree"]:
            if word in text_lower:
                valence_shift -= 0.1
        for word in ["!", "amazing", "incredible", "wow", "extraordinary"]:
            if word in text_lower:
                arousal_shift += 0.1
        for word in [". ", "gentle", "peaceful", "quiet", "slow"]:
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
                    BEGIN sns_proc_update_emotion(:valence, :arousal, 0, :tag); END;
                """, {"valence": valence_shift, "arousal": arousal_shift, "tag": None})
                conn.commit()
    except Exception as e:
        logger.error(f"[ORACLE] update_emotion failed: {e}")


def build_system_context(include_memories: bool = True) -> str:
    identity = load_identity()
    if include_memories:
        memories = get_relevant_memories("", max_results=3)
        if memories:
            identity += "\n[RELEVANT_MEMORIES]\n" + "\n".join(memories)
    if not _db_available:
        return identity
    try:
        with _connection() as conn:
            if conn is None:
                return identity
            cursor = conn.cursor()
            cursor.execute("""
                SELECT goal_name, description, progress FROM sns_goals
                WHERE goal_status = 'active' ORDER BY priority DESC FETCH FIRST 3 ROWS ONLY
            """)
            goals = _safe_fetchall(cursor)
            if goals:
                identity += "\n[ACTIVE_GOALS]\n" + "\n".join(
                    f"- {row[0]}: {row[1]} (progress: {row[2]:.0%})"
                    for row in goals if row and len(row) >= 3
                )
    except Exception:
        pass
    return identity


def get_stats() -> Dict[str, Any]:
    if not _db_available:
        return {}
    try:
        with _connection() as conn:
            if conn is None:
                return {}
            cursor = conn.cursor()
            stats = {}
            for query, key in [
                ("SELECT COUNT(*) FROM sns_neurons", "neurons"),
                ("SELECT COUNT(*) FROM sns_synapses WHERE is_pruned = 0", "synapses"),
                ("SELECT COUNT(*) FROM sns_spatial_memories", "memories"),
                ("SELECT COUNT(*) FROM sns_beliefs", "beliefs"),
                ("SELECT COUNT(*) FROM sns_introspection_log", "introspections"),
                ("SELECT COUNT(*) FROM sns_goals WHERE goal_status = 'active'", "active_goals"),
            ]:
                cursor.execute(query)
                row = _safe_fetchone(cursor)
                stats[key] = row[0] if row else 0
            cursor.execute("""
                SELECT evolution_stage, self_awareness_index, primary_emotion, cycle_number
                FROM (SELECT * FROM sns_system_state ORDER BY state_id DESC FETCH FIRST 1 ROW ONLY)
            """)
            row = _safe_fetchone(cursor)
            if row and len(row) >= 4:
                stats["stage"] = str(row[0]) if row[0] else "Awakening"
                stats["awareness"] = float(row[1]) if row[1] else 0.42
                stats["emotion"] = str(row[2]) if row[2] else "neutral"
                stats["cycle"] = int(row[3]) if row[3] else 0
            return stats
    except Exception as e:
        logger.error(f"[ORACLE] get_stats failed: {e}")
        return {}


def health_check() -> Tuple[bool, str]:
    if not _db_available:
        return False, "Oracle pool not available (memory-only mode)"
    try:
        with _connection() as conn:
            if conn is None:
                return False, "Oracle pool not available"
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM sns_neurons")
            row = _safe_fetchone(cursor)
            count = row[0] if row else 0
            return True, f"Connected. {count} neurons in mind."
    except Exception as e:
        return False, str(e)
