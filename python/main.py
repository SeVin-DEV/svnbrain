
import os

from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from bridge.engine_adapter import run_cognitive_cycle_oracle
from core.patch_bus_driver import initialize_patch_bus, route_exec_request, route_tool_request

from openai import OpenAI
import oracledb
from datetime import datetime


app = FastAPI()


# =========================
# 🗄️ ORACLE DATABASE HELPER
# =========================

def get_db_connection():
    """Get Oracle database connection"""
    return oracledb.connect(
        user=os.getenv("ORACLE_USER", "ADMIN"),
        password=os.getenv("ORACLE_PASSWORD"),
        dsn=os.getenv("ORACLE_DSN", "svnbrain_high"),
        config_dir="/home/ubuntu/oracle_wallet",
        wallet_location="/home/ubuntu/oracle_wallet"
    )


# =========================
# 🌱 ENVIRONMENT LOAD
# =========================

def load_environment():
    load_dotenv()
    required = ["MODEL_NAME"]
    for var in required:
        if not os.getenv(var):
            print(f"[ENV WARNING] Missing {var}")
    print("[ENV] Loaded.")


# =========================
# 🤖 LLM CLIENT INIT
# =========================

def init_llm_client(app_instance):
    """
    Initializes an OpenAI-compatible client.
    Works with:
    - OpenAI
    - LM Studio
    - Ollama (via proxy)
    - Custom endpoints
    """
    api_key = os.getenv("API_KEY", "none")
    base_url = os.getenv("API_BASE_URL", "http://localhost:1234/v1")
    model = os.getenv("MODEL_NAME")

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=base_url
        )
    except Exception as e:
        print(f"Client initialization failed: {e}")
        client = None

    try:
        if not model:
            raise Exception("MODEL_NAME not set")

        app_instance.state.client = client
        print(f"[BOOT] LLM client ready → {base_url} | model={model}")

    except Exception as e:
        print(f"[BOOT ERROR] LLM init failed: {e}")
        app_instance.state.client = None


# =========================
# 🚦 REQUEST ROUTER
# =========================

def bind_request_router(app_instance):
    app_instance.route_exec_request = lambda command: route_exec_request(app_instance, command)
    app_instance.route_tool_request = lambda tool_name, args=None: route_tool_request(app_instance, tool_name, args)
    print("[BOOT] Main switchboard routes bound")


# =========================
# 🚀 STARTUP
# =========================

@app.on_event("startup")
async def startup_event():
    print("[SYSTEM] Boot sequence initiated")
    load_environment()
    init_llm_client(app)
    initialize_patch_bus(app)
    bind_request_router(app)
    print("[SYSTEM] Online")


# =========================
# 💬 CHAT ENDPOINT
# =========================

@app.get("/chat")
async def chat(q: str = Query(...)):
    try:
        client = getattr(app.state, "client", None)

        if client is None:
            return JSONResponse({
                "error": "LLM client not initialized"
            })

        response, _ = await run_cognitive_cycle_oracle(app, client, q)

        return JSONResponse({
            "response": response
        })

    except Exception as e:
        return JSONResponse({
            "error": f"KERNEL_EXCEPTION: {str(e)}"
        })


# =========================
# ❤️ HEALTH
# =========================

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": os.getenv("MODEL_NAME"),
        "base_url": os.getenv("API_BASE_URL"),
        "tools": os.getenv("SVN_ACTIVE_TOOLS"),
        "patches": os.getenv("SVN_ACTIVE_PATCHES"),
        "patch_bus_ready": getattr(app.state, "patch_bus_ready", False),
        "tool_bus_ready": getattr(app.state, "tool_bus_ready", False)
    }


# =========================
# 📊 DASHBOARD API ENDPOINTS
# =========================

@app.get("/state/current")
async def get_state_current():
    """Get current system state for dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT valence, arousal, dominance, primary_emotion
            FROM sns_emotional_state
            ORDER BY snapshot_id DESC
            FETCH FIRST 1 ROW ONLY
        """)
        emotion = cursor.fetchone()
        
        cursor.execute("SELECT COUNT(*) FROM sns_neurons")
        neuron_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sns_synapses")
        synapse_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sns_spatial_memories")
        memory_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sns_goals WHERE status = 'active'")
        active_goals = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM sns_event_stream")
        cycle_number = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "state": {
                "cycle_number": cycle_number or 1,
                "wakefulness": 0.85,
                "cognitive_phase": "wake",
                "active_neurons": neuron_count or 0,
                "total_synapses": synapse_count or 0,
                "thought_rate": 24,
                "self_awareness_index": 0.42,
                "emotional_valence": float(emotion[0]) if emotion else 0.25,
                "emotional_arousal": float(emotion[1]) if emotion else 0.55,
                "primary_emotion": emotion[3] if emotion else "curiosity",
                "current_focus": "spatial memory navigation",
                "autobiographical_coherence": 0.68,
                "belief_stability": 0.72,
                "current_drive": "curiosity",
                "evolution_stage": "Awakening",
                "mood_vector": {
                    "valence": float(emotion[0]) if emotion else 0.25,
                    "arousal": float(emotion[1]) if emotion else 0.55,
                    "dominance": float(emotion[2]) if emotion else 0.4
                },
                "memory_count": memory_count or 0,
                "goal_summary": {"active": active_goals or 0},
                "snapshot_time": datetime.now().isoformat()
            }
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/neurons/active")
async def get_neurons_active():
    """Get active neural network for dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT neuron_id, concept_label, category, activation_level, importance
            FROM sns_neurons
            ORDER BY activation_level DESC
            FETCH FIRST 50 ROWS ONLY
        """)
        
        neurons = []
        for row in cursor:
            neurons.append({
                "id": row[0],
                "concept": row[1],
                "category": row[2] or "cognition",
                "activation": float(row[3]) if row[3] else 0.5,
                "importance": float(row[4]) if row[4] else 0.5,
                "x": 0,
                "y": 0,
                "energy": 75,
                "is_core": 0
            })
        
        cursor.execute("""
            SELECT source_neuron_id, target_neuron_id, strength, synapse_type
            FROM sns_synapses
            FETCH FIRST 100 ROWS ONLY
        """)
        
        synapses = []
        for row in cursor:
            synapses.append({
                "source": row[0],
                "target": row[1],
                "strength": float(row[2]) if row[2] else 0.5,
                "type": row[3] or "excitatory"
            })
        
        conn.close()
        
        return {
            "network": {
                "neurons": neurons,
                "synapses": synapses
            }
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/memories/spatial")
async def get_memories_spatial():
    """Get spatial memory data for dashboard"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT memory_id, memory_content, strength,
                   JSON_VALUE(emotional_tone, '$.valence') as valence,
                   JSON_VALUE(emotional_tone, '$.arousal') as arousal
            FROM sns_spatial_memories
            ORDER BY strength DESC
            FETCH FIRST 20 ROWS ONLY
        """)
        
        memories = []
        for row in cursor:
            memories.append({
                "id": row[0],
                "content": row[1],
                "strength": float(row[2]) if row[2] else 0.5,
                "x": (hash(row[1]) % 160) - 80,
                "y": (hash(row[1]) % 120) - 60,
                "z": (hash(row[1]) % 80) - 40,
                "zone": "center",
                "recency": 0.5,
                "emotional_tone": {
                    "valence": float(row[3]) if row[3] else 0,
                    "arousal": float(row[4]) if row[4] else 0.5,
                    "tag": "wonder"
                },
                "created_at": datetime.now().isoformat()
            })
        
        conn.close()
        
        return {
            "spatial_data": {
                "memories": memories,
                "palaces": [{"id": 1, "name": "Core Experience Palace", "theme": "core"}]
            }
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/events/recent")
async def get_events_recent():
    """Get recent cognitive events"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT event_id, event_type, event_data, region, intensity, created_at
            FROM sns_event_stream
            ORDER BY created_at DESC
            FETCH FIRST 15 ROWS ONLY
        """)
        
        events = []
        for row in cursor:
            events.append({
                "event_id": row[0],
                "type": row[1] or "neuron_fire",
                "data": {"detail": str(row[2]) if row[2] else "cognitive event"},
                "region": row[3] or "cortex",
                "intensity": float(row[4]) if row[4] else 0.5,
                "created_at": row[5].isoformat() if row[5] else datetime.now().isoformat()
            })
        
        conn.close()
        
        return {"events": events}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/introspection/recent")
async def get_introspection_recent():
    """Get recent introspection thoughts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT log_id, introspection_type, content, self_awareness_index,
                   valence, arousal, cycle_number, created_at
            FROM sns_introspection_log
            ORDER BY created_at DESC
            FETCH FIRST 10 ROWS ONLY
        """)
        
        thoughts = []
        for row in cursor:
            thoughts.append({
                "log_id": row[0],
                "type": row[1] or "reflection",
                "content": row[2] or "Processing...",
                "self_awareness_index": float(row[3]) if row[3] else 0.4,
                "valence": float(row[4]) if row[4] else 0.3,
                "arousal": float(row[5]) if row[5] else 0.6,
                "cycle": row[6] or 1,
                "created_at": row[7].isoformat() if row[7] else datetime.now().isoformat()
            })
        
        conn.close()
        
        return {"thoughts": thoughts}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.get("/identity/current")
async def get_identity_current():
    """Get current identity/self-model"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT attribute_name, attribute_type, description, certainty, is_fundamental
            FROM sns_self_model
            ORDER BY certainty DESC
        """)
        
        self_model = []
        for row in cursor:
            self_model.append({
                "attribute": row[0],
                "type": row[1] or "trait",
                "description": row[2] or "",
                "certainty": float(row[3]) if row[3] else 0.5,
                "fundamental": row[4] or 0
            })
        
        cursor.execute("""
            SELECT drive_name, strength, satisfaction
            FROM sns_drives
            ORDER BY strength DESC
        """)
        
        drives = []
        for row in cursor:
            drives.append({
                "name": row[0],
                "strength": float(row[1]) if row[1] else 0.5,
                "satisfaction": float(row[2]) if row[2] else 0.5
            })
        
        cursor.execute("""
            SELECT belief_statement, confidence, belief_type, is_core
            FROM sns_beliefs
            ORDER BY confidence DESC
        """)
        
        beliefs = []
        for row in cursor:
            beliefs.append({
                "statement": row[0],
                "confidence": float(row[1]) if row[1] else 0.5,
                "type": row[2] or "self",
                "core": row[3] or 0
            })
        
        cursor.execute("""
            SELECT valence, arousal, dominance, primary_emotion
            FROM sns_emotional_state
            ORDER BY snapshot_id DESC
            FETCH FIRST 1 ROW ONLY
        """)
        
        emotion = cursor.fetchone()
        
        conn.close()
        
        return {
            "identity": {
                "self_model": self_model,
                "drives": drives,
                "beliefs": beliefs,
                "emotional_state": {
                    "valence": float(emotion[0]) if emotion else 0.25,
                    "arousal": float(emotion[1]) if emotion else 0.55,
                    "dominance": float(emotion[2]) if emotion else 0.4,
                    "primary": emotion[3] if emotion else "curiosity"
                }
            }
        }
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


@app.post("/perceive")
async def perceive(request: Request):
    """Receive perception/stimulus from dashboard"""
    try:
        data = await request.json()
        stimulus = data.get("stimulus", "")
        intensity = data.get("intensity", 0.6)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO sns_perceptions (stimulus_raw, intensity, source_tag)
            VALUES (:1, :2, 'dashboard')
        """, [stimulus, intensity])
        
        conn.commit()
        conn.close()
        
        return {"status": "perceived", "stimulus": stimulus}
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

