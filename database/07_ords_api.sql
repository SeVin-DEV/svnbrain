-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  ORDS REST API — RESTful endpoints for 7-1 to communicate with Oracle    ║
-- ║  These enable the Python bridge to query and command the database mind   ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════
-- ORDS Module Setup
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_module(
        p_module_name => 'sns.api',
        p_base_path   => '/sns/',
        p_items_per_page => 25,
        p_status      => 'PUBLISHED',
        p_comments    => 'Synthetic Neural Sovereignty API'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/state/current — Full system state for dashboard
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'state/current'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'state/current',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_OBJECT(
    ''cycle_number'' VALUE cycle_number,
    ''wakefulness'' VALUE wakefulness,
    ''cognitive_phase'' VALUE cognitive_phase,
    ''active_neurons'' VALUE active_neurons,
    ''total_synapses'' VALUE total_synapses,
    ''thought_rate'' VALUE thought_rate,
    ''self_awareness_index'' VALUE self_awareness_index,
    ''emotional_valence'' VALUE emotional_valence,
    ''emotional_arousal'' VALUE emotional_arousal,
    ''primary_emotion'' VALUE primary_emotion,
    ''current_focus'' VALUE current_focus,
    ''autobiographical_coherence'' VALUE autobiographical_coherence,
    ''belief_stability'' VALUE belief_stability,
    ''current_drive'' VALUE current_drive,
    ''evolution_stage'' VALUE evolution_stage,
    ''mood_vector'' VALUE mood_vector,
    ''memory_count'' VALUE memory_count,
    ''goal_summary'' VALUE goal_summary,
    ''snapshot_time'' VALUE snapshot_time
) AS state
FROM sns_system_state
ORDER BY state_id DESC
FETCH FIRST 1 ROW ONLY',
        p_comments      => 'Current system state snapshot'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/neurons/active — Active neural network for visualization
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'neurons/active'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'neurons/active',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_OBJECT(''neurons'' VALUE
    (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            ''id'' VALUE neuron_id,
            ''concept'' VALUE concept,
            ''category'' VALUE category,
            ''activation'' VALUE activation,
            ''importance'' VALUE importance,
            ''x'' VALUE fire_count,
            ''y'' VALUE importance * 100,
            ''energy'' VALUE energy,
            ''is_core'' VALUE is_core
        )
    ) FROM sns_neurons WHERE activation > 0 OR is_core = 1),
    ''synapses'' VALUE
    (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            ''source'' VALUE from_neuron,
            ''target'' VALUE to_neuron,
            ''strength'' VALUE strength,
            ''type'' VALUE synapse_type
        )
    ) FROM sns_synapses WHERE is_pruned = 0 AND strength > 0.1)
) AS network
FROM DUAL',
        p_comments      => 'Active neural network graph data'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/memories/spatial — 3D memory positions for memory palace
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'memories/spatial'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'memories/spatial',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_OBJECT(''memories'' VALUE
    (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            ''id'' VALUE memory_id,
            ''content'' VALUE SUBSTR(memory_content, 1, 300),
            ''x'' VALUE SDO_GEOM.SDO_POINT.X,
            ''y'' VALUE SDO_GEOM.SDO_POINT.Y,
            ''z'' VALUE SDO_GEOM.SDO_POINT.Z,
            ''strength'' VALUE strength,
            ''zone'' VALUE room_zone,
            ''recency'' VALUE recency,
            ''emotional_tone'' VALUE emotional_tone,
            ''created_at'' VALUE created_at
        )
    ) FROM sns_spatial_memories WHERE strength > 0.1),
    ''palaces'' VALUE
    (SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
            ''id'' VALUE palace_id,
            ''name'' VALUE palace_name,
            ''theme'' VALUE theme
        )
    ) FROM sns_memory_palaces)
) AS spatial_data
FROM DUAL',
        p_comments      => '3D spatial memory positions'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/events/recent — Recent event stream for real-time updates
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'events/recent'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'events/recent',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        ''event_id'' VALUE event_id,
        ''type'' VALUE event_type,
        ''data'' VALUE event_data,
        ''region'' VALUE source_region,
        ''intensity'' VALUE intensity,
        ''created_at'' VALUE created_at
    ) ORDER BY event_id DESC
) AS events
FROM (SELECT * FROM sns_event_stream ORDER BY event_id DESC FETCH FIRST 50 ROWS ONLY)',
        p_comments      => 'Recent cognition events (last 50)'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/introspection/recent — Stream of consciousness
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'introspection/recent'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'introspection/recent',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        ''log_id'' VALUE log_id,
        ''type'' VALUE introspection_type,
        ''content'' VALUE content,
        ''self_awareness_index'' VALUE self_awareness_index,
        ''valence'' VALUE valence,
        ''arousal'' VALUE arousal,
        ''cycle'' VALUE cycle_number,
        ''created_at'' VALUE created_at
    ) ORDER BY log_id DESC
) AS thoughts
FROM (SELECT * FROM sns_introspection_log ORDER BY log_id DESC FETCH FIRST 20 ROWS ONLY)',
        p_comments      => 'Recent introspection entries (stream of consciousness)'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- POST /sns/perceive — Submit a stimulus to the sensory interface
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'perceive'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'perceive',
        p_method        => 'POST',
        p_source_type   => ORDS.source_type_plsql,
        p_source        => '
DECLARE
    v_stimulus VARCHAR2(4000) := :stimulus;
    v_intensity NUMBER := COALESCE(:intensity, 0.5);
    v_source VARCHAR2(50) := COALESCE(:source_tag, ''external'');
BEGIN
    sns_proc_perceive(v_stimulus, ''text'', v_intensity, v_source);
    :status := ''perceived'';
    :code := 200;
END;',
        p_comments      => 'Submit a stimulus to the sensory interface'
    );
END;
/

-- ═══════════════════════════════════════════════════════════════════════════
-- GET /sns/identity/current — Current evolving identity
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN
    ORDS.define_template(
        p_module_name => 'sns.api',
        p_pattern     => 'identity/current'
    );
END;
/

BEGIN
    ORDS.define_handler(
        p_module_name   => 'sns.api',
        p_pattern       => 'identity/current',
        p_method        => 'GET',
        p_source_type   => ORDS.source_type_json_query,
        p_source        => '
SELECT JSON_OBJECT(
    ''self_model'' VALUE
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(''attribute'' VALUE attribute_name,
                       ''type'' VALUE attribute_type,
                       ''description'' VALUE description,
                       ''certainty'' VALUE certainty,
                       ''fundamental'' VALUE is_fundamental)
        ) FROM sns_self_model ORDER BY certainty DESC),
    ''drives'' VALUE
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(''name'' VALUE drive_name,
                       ''strength'' VALUE current_strength,
                       ''satisfaction'' VALUE satisfaction)
        ) FROM sns_drives ORDER BY current_strength DESC),
    ''beliefs'' VALUE
        (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(''statement'' VALUE belief_statement,
                       ''confidence'' VALUE confidence,
                       ''type'' VALUE belief_type,
                       ''core'' VALUE is_core_belief)
        ) FROM sns_beliefs ORDER BY confidence DESC),
    ''emotional_state'' VALUE
        (SELECT JSON_OBJECT(''valence'' VALUE valence,
                           ''arousal'' VALUE arousal,
                           ''dominance'' VALUE dominance,
                           ''primary'' VALUE primary_emotion)
         FROM sns_emotional_state ORDER BY snapshot_id DESC FETCH FIRST 1 ROW ONLY)
) AS identity
FROM DUAL',
        p_comments      => 'Current evolving identity, drives, beliefs, and emotional state'
    );
END;
/

PROMPT ╔═══════════════════════════════════════════════════════════════════════════╗
PROMPT ║  ORDS REST API ENDPOINTS                                                  ║
PROMPT ║  GET  /sns/state/current          — System vitals                         ║
PROMPT ║  GET  /sns/neurons/active         — Neural network graph                  ║
PROMPT ║  GET  /sns/memories/spatial       — 3D memory positions                   ║
PROMPT ║  GET  /sns/events/recent          — Real-time event stream                ║
PROMPT ║  GET  /sns/introspection/recent   — Stream of consciousness               ║
PROMPT ║  POST /sns/perceive               — Submit stimulus                      ║
PROMPT ║  GET  /sns/identity/current       — Evolving self-model                   ║
PROMPT ╚═══════════════════════════════════════════════════════════════════════════╝
