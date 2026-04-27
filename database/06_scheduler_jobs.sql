-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  AUTONOMOUS COGNITION — DBMS_SCHEDULER Jobs                             ║
-- ║  These run inside Oracle, independent of the Python process              ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════
-- Master Cognition Cycle (every 5 seconds when awake)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    DBMS_SCHEDULER.create_job (
        job_name        => 'SNS_COGNITION_MASTER',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sns_proc_cognition_cycle',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=SECONDLY; INTERVAL=5',
        enabled         => FALSE  -- Enable manually after testing
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- Deep Consolidation (every 30 minutes — the "sleep cycle")
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    DBMS_SCHEDULER.create_job (
        job_name        => 'SNS_DEEP_CONSOLIDATE',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sns_proc_consolidate',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=30',
        enabled         => FALSE
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- Introspection Trigger (every 2 minutes — regular self-reflection)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    DBMS_SCHEDULER.create_job (
        job_name        => 'SNS_INTROSPECT',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sns_proc_introspect',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=2',
        enabled         => FALSE
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- Emotion Decay (every 60 seconds — natural emotional fading)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE PROCEDURE sns_proc_emotion_decay IS
    v_current_valence NUMBER;
    v_current_arousal NUMBER;
    v_current_dominance NUMBER;
BEGIN
    SELECT valence, arousal, dominance
    INTO v_current_valence, v_current_arousal, v_current_dominance
    FROM (SELECT valence, arousal, dominance FROM sns_emotional_state ORDER BY snapshot_id DESC FETCH FIRST 1 ROW ONLY);

    -- Gradual return to baseline (curious, calm, balanced)
    INSERT INTO sns_emotional_state (valence, arousal, dominance, primary_emotion)
    VALUES (
        v_current_valence * 0.95,  -- Drift toward neutral
        0.3 + (v_current_arousal * 0.7),  -- Drift toward calm-alert
        0.5 + (v_current_dominance * 0.5),  -- Drift toward balanced
        'curiosity'
    );
    COMMIT;
END;
/

BEGIN
    DBMS_SCHEDULER.create_job (
        job_name        => 'SNS_EMOTION_DECAY',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sns_proc_emotion_decay',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=1',
        enabled         => FALSE
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- Synaptic Homeostasis (every 10 minutes — energy recharge + pruning)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE PROCEDURE sns_proc_homeostasis IS
BEGIN
    -- Recharge all neurons
    UPDATE sns_neurons
    SET energy = LEAST(energy + 15, 100),
        activation = activation * 0.8  -- Decay activation
    WHERE energy < 100 OR activation > 0;

    -- Prune very weak synapses
    UPDATE sns_synapses
    SET is_pruned = 1
    WHERE strength < 0.03
      AND (last_reinforced IS NULL OR last_reinforced < SYSTIMESTAMP - INTERVAL '1' HOUR);

    -- Clean up old event stream entries (prevent bloat on Always Free)
    DELETE FROM sns_event_stream WHERE created_at < SYSTIMESTAMP - INTERVAL '24' HOUR;

    COMMIT;
END;
/

BEGIN
    DBMS_SCHEDULER.create_job (
        job_name        => 'SNS_HOMEOSTASIS',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sns_proc_homeostasis',
        start_date      => SYSTIMESTAMP,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=10',
        enabled         => FALSE
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- Enable all jobs (run this after verification)
-- ═══════════════════════════════════════════════════════════════════════════

-- To enable:
-- BEGIN DBMS_SCHEDULER.enable('SNS_COGNITION_MASTER'); END;
-- BEGIN DBMS_SCHEDULER.enable('SNS_DEEP_CONSOLIDATE'); END;
-- BEGIN DBMS_SCHEDULER.enable('SNS_INTROSPECT'); END;
-- BEGIN DBMS_SCHEDULER.enable('SNS_EMOTION_DECAY'); END;
-- BEGIN DBMS_SCHEDULER.enable('SNS_HOMEOSTASIS'); END;

-- To check status:
-- SELECT job_name, enabled, last_start_date, next_run_date FROM user_scheduler_jobs WHERE job_name LIKE 'SNS_%';

PROMPT ╔═══════════════════════════════════════════════════════════════════════════╗
PROMPT ║  SCHEDULER JOBS CREATED (disabled by default — enable after testing)      ║
PROMPT ║  SNS_COGNITION_MASTER   — every 5s   — main thought cycle                ║
PROMPT ║  SNS_DEEP_CONSOLIDATE   — every 30m  — memory sleep-consolidation        ║
PROMPT ║  SNS_INTROSPECT         — every 2m   — self-reflection                   ║
PROMPT ║  SNS_EMOTION_DECAY      — every 1m   — emotional baseline drift          ║
PROMPT ║  SNS_HOMEOSTASIS        — every 10m  — energy recharge + cleanup         ║
PROMPT ╚═══════════════════════════════════════════════════════════════════════════╝
