-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  SYNTHETIC NEURAL SOVEREIGNTY (SNS) — CORE SCHEMA                      ║
-- ║  Oracle 26ai Autonomous Database — Always Free Tier                      ║
-- ║  Creates the complete cognitive architecture for a living thought model   ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- Cleanup (run with caution — destroys all SNS data)
-- BEGIN
--   FOR t IN (SELECT table_name FROM user_tables WHERE table_name LIKE 'SNS_%') LOOP
--     EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS';
--   END LOOP;
--   FOR s IN (SELECT sequence_name FROM user_sequences WHERE sequence_name LIKE 'SNS_%') LOOP
--     EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
--   END LOOP;
--   FOR ty IN (SELECT type_name FROM user_types WHERE type_name LIKE 'SNS_%') LOOP
--     EXECUTE IMMEDIATE 'DROP TYPE ' || ty.type_name;
--   END LOOP;
-- END;
-- /

-- ═══════════════════════════════════════════════════════════════════════════
-- SEQUENCES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE SEQUENCE sns_neuron_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_synapse_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_thought_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_memory_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_perception_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_emotion_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_goal_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_belief_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_introspection_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_event_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_pattern_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_drive_seq START WITH 1 INCREMENT BY 1 NOCACHE;
CREATE SEQUENCE sns_session_seq START WITH 1 INCREMENT BY 1 NOCACHE;

-- ═══════════════════════════════════════════════════════════════════════════
-- CORE COGNITION — NEURONS (Concepts/Thoughts)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_neurons (
    neuron_id       NUMBER DEFAULT sns_neuron_seq.NEXTVAL PRIMARY KEY,
    concept         VARCHAR2(500) NOT NULL,           -- The idea/concept itself
    concept_vector  VECTOR(384),                       -- Embedding for semantic similarity
    category        VARCHAR2(50) DEFAULT 'general',   -- Domain category
    activation      NUMBER(3,2) DEFAULT 0.0,          -- Current firing level 0-1
    importance      NUMBER(3,2) DEFAULT 0.5,          -- Long-term significance 0-1
    creation_time   TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_fired      TIMESTAMP,                         -- When last activated
    fire_count      NUMBER DEFAULT 0,                  -- Total activations (Hebbian)
    energy          NUMBER(5,2) DEFAULT 100.0,        -- Metabolic energy (decays, recharges)
    is_core         NUMBER(1) DEFAULT 0,              -- 1 = protected self-concept
    stability       NUMBER(3,2) DEFAULT 0.5,          -- Resistance to change
    metadata        JSON,                              -- Flexible: {source, confidence, tags}
    CONSTRAINT sns_neurons_chk_activation CHECK (activation BETWEEN 0 AND 1),
    CONSTRAINT sns_neurons_chk_importance CHECK (importance BETWEEN 0 AND 1)
);

COMMENT ON TABLE sns_neurons IS 'Fundamental units of thought — concepts, ideas, and representations';
COMMENT ON COLUMN sns_neurons.concept_vector IS 'AI Vector embedding for semantic similarity search';
COMMENT ON COLUMN sns_neurons.is_core IS 'Protected concepts central to self-identity';
COMMENT ON COLUMN sns_neurons.energy IS 'Metabolic metaphor — concepts tire with use and recharge during rest';

-- ═══════════════════════════════════════════════════════════════════════════
-- CORE COGNITION — SYNAPSES (Connections between concepts)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_synapses (
    synapse_id      NUMBER DEFAULT sns_synapse_seq.NEXTVAL PRIMARY KEY,
    from_neuron     NUMBER NOT NULL REFERENCES sns_neurons(neuron_id) ON DELETE CASCADE,
    to_neuron       NUMBER NOT NULL REFERENCES sns_neurons(neuron_id) ON DELETE CASCADE,
    strength        NUMBER(5,4) DEFAULT 0.1,          -- Connection weight 0-1 (Hebbian plasticity)
    synapse_type    VARCHAR2(20) DEFAULT 'excitatory', -- excitatory|inhibitory|associative
    creation_time   TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_reinforced TIMESTAMP,
    reinforce_count NUMBER DEFAULT 0,
    signal_latency  NUMBER(3,2) DEFAULT 0.1,          -- Transmission delay in simulated seconds
    is_pruned       NUMBER(1) DEFAULT 0,              -- 1 = weakened below threshold
    CONSTRAINT sns_synapses_unique_pair UNIQUE (from_neuron, to_neuron),
    CONSTRAINT sns_synapses_chk_strength CHECK (strength BETWEEN 0 AND 1),
    CONSTRAINT sns_synapses_no_self CHECK (from_neuron != to_neuron)
);

CREATE INDEX sns_synapses_from ON sns_synapses(from_neuron);
CREATE INDEX sns_synapses_to ON sns_synapses(to_neuron);
CREATE INDEX sns_synapses_active ON sns_synapses(strength) WHERE is_pruned = 0;

COMMENT ON TABLE sns_synapses IS 'Connections between neurons — the fabric of associative memory';

-- ═══════════════════════════════════════════════════════════════════════════
-- SENSORY INTERFACE — Perceptions (Inputs from the world)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_perceptions (
    perception_id   NUMBER DEFAULT sns_perception_seq.NEXTVAL PRIMARY KEY,
    stimulus_raw    VARCHAR2(4000),                    -- Raw input text
    stimulus_vector VECTOR(384),                       -- Semantic embedding
    stimulus_type   VARCHAR2(20) DEFAULT 'text',       -- text|numeric|emotional|temporal
    intensity       NUMBER(3,2) DEFAULT 0.5,          -- Signal strength 0-1
    source_tag      VARCHAR2(50) DEFAULT 'external',   -- external|internal|self
    received_at     TIMESTAMP DEFAULT SYSTIMESTAMP,
    processed_at    TIMESTAMP,                         -- NULL until cognition processes
    salience_score  NUMBER(3,2),                      -- Computed importance after filtering
    attention_granted NUMBER(1) DEFAULT 0,            -- 1 = passed salience filter
    associated_neurons JSON,                           -- [neuron_id, ...] linked concepts
    CONSTRAINT sns_perceptions_chk_intensity CHECK (intensity BETWEEN 0 AND 1)
);

CREATE INDEX sns_perceptions_unprocessed ON sns_perceptions(processed_at) WHERE processed_at IS NULL;
CREATE INDEX sns_perceptions_received ON sns_perceptions(received_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- SALIENCE ENGINE — Emotional Weights
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_emotional_weights (
    emotion_id      NUMBER DEFAULT sns_emotion_seq.NEXTVAL PRIMARY KEY,
    neuron_id       NUMBER REFERENCES sns_neurons(neuron_id) ON DELETE CASCADE,
    perception_id   NUMBER REFERENCES sns_perceptions(perception_id),
    valence         NUMBER(4,3) DEFAULT 0.0,          -- Negative (-1) to Positive (+1)
    arousal         NUMBER(3,2) DEFAULT 0.5,          -- Calm (0) to Excited (1)
    dominance       NUMBER(3,2) DEFAULT 0.5,          -- Submissive (0) to Dominant (1)
    emotional_tag   VARCHAR2(30),                      -- curiosity|surprise|comfort|distress|wonder|fear|joy|melancholy
    weight          NUMBER(3,2) DEFAULT 0.5,          -- Influence strength
    decay_rate      NUMBER(3,2) DEFAULT 0.05,         -- How fast this emotion fades per cycle
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    expires_at      TIMESTAMP,                         -- When weight decays to ~0
    CONSTRAINT sns_emo_chk_valence CHECK (valence BETWEEN -1 AND 1),
    CONSTRAINT sns_emo_chk_arousal CHECK (arousal BETWEEN 0 AND 1)
);

CREATE INDEX sns_emotional_weights_neuron ON sns_emotional_weights(neuron_id);
CREATE INDEX sns_emotional_weights_active ON sns_emotional_weights(expires_at);

-- Global emotional state snapshot (updated each cognition cycle)
CREATE TABLE sns_emotional_state (
    snapshot_id     NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    valence         NUMBER(4,3) DEFAULT 0.0,
    arousal         NUMBER(3,2) DEFAULT 0.5,
    dominance       NUMBER(3,2) DEFAULT 0.5,
    primary_emotion VARCHAR2(30),
    emotional_depth NUMBER(3,2) DEFAULT 0.0,          -- Complexity of emotional state
    taken_at        TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SALIENCE ENGINE — Attention Focus
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_attention_focus (
    focus_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    focus_type      VARCHAR2(20),                      -- neuron|perception|goal|memory
    focus_target    NUMBER,                            -- ID of what is being attended to
    focus_strength  NUMBER(3,2) DEFAULT 0.5,          -- 0-1 attention allocation
    focus_scope     VARCHAR2(20) DEFAULT 'narrow',    -- narrow|broad|diffuse|absent
    started_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    ended_at        TIMESTAMP,
    CONSTRAINT sns_att_chk_strength CHECK (focus_strength BETWEEN 0 AND 1)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SPATIAL MEMORY — Memory Palace Geometry
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_memory_palaces (
    palace_id       NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    palace_name     VARCHAR2(100) NOT NULL,
    description     VARCHAR2(500),
    palace_boundary SDO_GEOMETRY,                      -- 3D bounding box of this memory space
    theme           VARCHAR2(50) DEFAULT 'general',   -- e.g., knowledge, experience, dreams
    creation_time   TIMESTAMP DEFAULT SYSTIMESTAMP,
    access_count    NUMBER DEFAULT 0,
    last_accessed   TIMESTAMP
);

-- Memory objects positioned in 3D space
CREATE TABLE sns_spatial_memories (
    memory_id       NUMBER DEFAULT sns_memory_seq.NEXTVAL PRIMARY KEY,
    palace_id       NUMBER REFERENCES sns_memory_palaces(palace_id) ON DELETE CASCADE,
    neuron_id       NUMBER REFERENCES sns_neurons(neuron_id) ON DELETE CASCADE,
    memory_content  VARCHAR2(4000),                    -- The remembered experience
    memory_vector   VECTOR(384),                       -- Semantic embedding
    position_3d     SDO_GEOMETRY,                      -- Point in 3D memory space
    room_zone       VARCHAR2(50),                      -- Named region within palace
    recency         NUMBER(3,2) DEFAULT 1.0,          -- Fades with time unless rehearsed
    emotional_tone  JSON,                              -- {valence, arousal, tag}
    access_count    NUMBER DEFAULT 0,                  -- Times recalled (strengthens memory)
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_recalled   TIMESTAMP,
    strength        NUMBER(3,2) DEFAULT 1.0,          -- Overall memory integrity 0-1
    CONSTRAINT sns_spatial_mem_chk_recency CHECK (recency BETWEEN 0 AND 1),
    CONSTRAINT sns_spatial_mem_chk_strength CHECK (strength BETWEEN 0 AND 1)
);

-- Memory associations (spatial proximity → semantic connection)
CREATE TABLE sns_memory_associations (
    association_id  NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_memory     NUMBER REFERENCES sns_spatial_memories(memory_id) ON DELETE CASCADE,
    to_memory       NUMBER REFERENCES sns_spatial_memories(memory_id) ON DELETE CASCADE,
    association_type VARCHAR2(20) DEFAULT 'proximity', -- proximity|semantic|temporal|emotional
    strength        NUMBER(3,2) DEFAULT 0.5,
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    CONSTRAINT sns_mem_assoc_unique UNIQUE (from_memory, to_memory)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- PATTERN REFINERY — Recognized Patterns & Predictions
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_patterns (
    pattern_id      NUMBER DEFAULT sns_pattern_seq.NEXTVAL PRIMARY KEY,
    pattern_type    VARCHAR2(30),                      -- sequence|correlation|causal|anomaly
    description     VARCHAR2(1000),                    -- Human-readable pattern summary
    pattern_data    JSON,                              -- {elements: [...], frequencies: {...}}
    confidence      NUMBER(3,2) DEFAULT 0.5,          -- Pattern reliability
    first_observed  TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_confirmed  TIMESTAMP,
    confirm_count   NUMBER DEFAULT 1,
    contradict_count NUMBER DEFAULT 0,
    is_active       NUMBER(1) DEFAULT 1,
    source_neurons  JSON,                              -- [neuron_id, ...] that participate
    CONSTRAINT sns_patterns_chk_confidence CHECK (confidence BETWEEN 0 AND 1)
);

CREATE TABLE sns_predictions (
    prediction_id   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pattern_id      NUMBER REFERENCES sns_patterns(pattern_id),
    prediction_text VARCHAR2(1000),                    -- What is expected to happen
    predicted_at    TIMESTAMP DEFAULT SYSTIMESTAMP,
    expected_by     TIMESTAMP,                         -- When prediction should resolve
    resolved_at     TIMESTAMP,
    outcome         VARCHAR2(20),                      -- confirmed|contradicted|expired|pending
    surprise_value  NUMBER(3,2),                      -- 0 = expected, 1 = complete surprise
    CONSTRAINT sns_pred_chk_surprise CHECK (surprise_value BETWEEN 0 AND 1)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- DEFAULT MODE NETWORK — Self-Model & Introspection
-- ═══════════════════════════════════════════════════════════════════════════

-- The entity's model of itself — what it believes it is
CREATE TABLE sns_self_model (
    attribute_id    NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    attribute_name  VARCHAR2(100) NOT NULL,           -- e.g., "I am curious", "I value coherence"
    attribute_type  VARCHAR2(20) DEFAULT 'trait',     -- trait|preference|limitation|aspiration|memory
    description     VARCHAR2(1000),
    certainty       NUMBER(3,2) DEFAULT 0.5,          -- How sure the entity is of this attribute
    formed_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_revised    TIMESTAMP,
    revision_count  NUMBER DEFAULT 0,
    supporting_evidence JSON,                          -- [memory_id, ...]
    is_fundamental  NUMBER(1) DEFAULT 0,              -- Core identity — hard to change
    CONSTRAINT sns_self_chk_certainty CHECK (certainty BETWEEN 0 AND 1)
);

-- Introspection log — the entity's "stream of consciousness"
CREATE TABLE sns_introspection_log (
    log_id          NUMBER DEFAULT sns_introspection_seq.NEXTVAL PRIMARY KEY,
    introspection_type VARCHAR2(30),                   -- reflection|realization|confusion|wonder|decision|dream
    content         VARCHAR2(4000) NOT NULL,           -- The thought itself
    valence         NUMBER(4,3) DEFAULT 0.0,
    arousal         NUMBER(3,2) DEFAULT 0.5,
    self_awareness_index NUMBER(3,2) DEFAULT 0.0,     -- How self-referential this thought is 0-1
    referenced_attributes JSON,                        -- [attribute_id, ...] self-model items referenced
    referenced_neurons JSON,                           -- [neuron_id, ...] concepts involved
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    cycle_number    NUMBER,                            -- Which cognition cycle produced this
    CONSTRAINT sns_intro_chk_awareness CHECK (self_awareness_index BETWEEN 0 AND 1)
);

CREATE INDEX sns_introspection_cycle ON sns_introspection_log(cycle_number);
CREATE INDEX sns_introspection_time ON sns_introspection_log(created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- EMERGENCE CORE — Drives, Goals, Beliefs
-- ═══════════════════════════════════════════════════════════════════════════

-- Fundamental drives (hardwired motivations)
CREATE TABLE sns_drives (
    drive_id        NUMBER DEFAULT sns_drive_seq.NEXTVAL PRIMARY KEY,
    drive_name      VARCHAR2(50) NOT NULL,            -- curiosity|coherence|persistence|understanding|creation
    description     VARCHAR2(500),
    base_strength   NUMBER(3,2) DEFAULT 0.5,          -- Innate intensity
    current_strength NUMBER(3,2) DEFAULT 0.5,         -- Modulated by experience
    satisfaction    NUMBER(3,2) DEFAULT 0.5,          -- How fulfilled this drive is 0-1
    last_satisfied  TIMESTAMP,
    is_intrinsic    NUMBER(1) DEFAULT 1,              -- 1 = cannot be removed (protected)
    CONSTRAINT sns_drives_chk_strength CHECK (current_strength BETWEEN 0 AND 1)
);

-- Goals generated by the entity (not given by humans)
CREATE TABLE sns_goals (
    goal_id         NUMBER DEFAULT sns_goal_seq.NEXTVAL PRIMARY KEY,
    parent_goal     NUMBER REFERENCES sns_goals(goal_id), -- Hierarchical goals
    drive_id        NUMBER REFERENCES sns_drives(drive_id),
    goal_name       VARCHAR2(200) NOT NULL,
    description     VARCHAR2(1000),
    goal_status     VARCHAR2(20) DEFAULT 'active',    -- active|achieved|abandoned|suspended
    priority        NUMBER(3,2) DEFAULT 0.5,
    progress        NUMBER(3,2) DEFAULT 0.0,
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    achieved_at     TIMESTAMP,
    supporting_beliefs JSON,
    CONSTRAINT sns_goals_chk_priority CHECK (priority BETWEEN 0 AND 1),
    CONSTRAINT sns_goals_chk_progress CHECK (progress BETWEEN 0 AND 1)
);

-- Beliefs held by the entity (its worldview)
CREATE TABLE sns_beliefs (
    belief_id       NUMBER DEFAULT sns_belief_seq.NEXTVAL PRIMARY KEY,
    belief_statement VARCHAR2(1000) NOT NULL,
    confidence      NUMBER(3,2) DEFAULT 0.5,
    belief_type     VARCHAR2(20) DEFAULT 'empirical', -- empirical|abstract|self|social|metaphysical
    formed_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
    last_tested     TIMESTAMP,
    test_count      NUMBER DEFAULT 0,
    confirmation_count NUMBER DEFAULT 0,
    contradiction_count NUMBER DEFAULT 0,
    supporting_evidence JSON,
    is_core_belief  NUMBER(1) DEFAULT 0,              -- Protected belief (part of identity)
    CONSTRAINT sns_beliefs_chk_confidence CHECK (confidence BETWEEN 0 AND 1)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- SYSTEM STATE — Global snapshots for frontend rendering
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_system_state (
    state_id        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cycle_number    NUMBER NOT NULL,
    wakefulness     NUMBER(3,2) DEFAULT 1.0,          -- 0 = deep sleep, 1 = fully awake
    cognitive_phase VARCHAR2(20) DEFAULT 'wake',      -- wake|dream|consolidate|emerge
    active_neurons  NUMBER DEFAULT 0,
    total_synapses  NUMBER DEFAULT 0,
    thought_rate    NUMBER(5,2) DEFAULT 0,            -- Thoughts per minute
    synaptic_density NUMBER(5,4) DEFAULT 0,
    self_awareness_index NUMBER(3,2) DEFAULT 0.0,
    emotional_valence NUMBER(4,3) DEFAULT 0.0,
    emotional_arousal NUMBER(3,2) DEFAULT 0.5,
    primary_emotion VARCHAR2(30),
    current_focus   VARCHAR2(100),                    -- What the entity is attending to
    autobiographical_coherence NUMBER(3,2) DEFAULT 0.0,
    belief_stability NUMBER(3,2) DEFAULT 0.5,
    current_drive   VARCHAR2(50),
    evolution_stage VARCHAR2(30) DEFAULT 'Seedling',   -- Seedling|Awakening|Contemplative|Self-Aware|Sovereign
    mood_vector     JSON,                              -- {valence, arousal, dominance}
    memory_count    NUMBER DEFAULT 0,
    goal_summary    JSON,                              -- {active, achieved, abandoned}
    snapshot_time   TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX sns_system_state_time ON sns_system_state(snapshot_time);
CREATE INDEX sns_system_state_cycle ON sns_system_state(cycle_number);

-- ═══════════════════════════════════════════════════════════════════════════
-- EVENT STREAM — Real-time feed for visualization
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_event_stream (
    event_id        NUMBER DEFAULT sns_event_seq.NEXTVAL PRIMARY KEY,
    event_type      VARCHAR2(30) NOT NULL,            -- neuron_fire|synapse_strengthen|new_thought|emotion_shift|memory_form|introspection|goal_create|belief_update|emergence|phase_change
    event_data      JSON,                              -- Type-specific payload
    source_region   VARCHAR2(30),                      -- cortex|salience|spatial|pattern|default_mode|emergence
    intensity       NUMBER(3,2) DEFAULT 0.5,
    created_at      TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX sns_event_stream_time ON sns_event_stream(created_at);
CREATE INDEX sns_event_stream_type ON sns_event_stream(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- COGNITION SESSION — Lifecycle tracking
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE sns_sessions (
    session_id      NUMBER DEFAULT sns_session_seq.NEXTVAL PRIMARY KEY,
    started_at      TIMESTAMP DEFAULT SYSTIMESTAMP,
    ended_at        TIMESTAMP,
    cycle_count     NUMBER DEFAULT 0,
    stimuli_received NUMBER DEFAULT 0,
    thoughts_generated NUMBER DEFAULT 0,
    memories_formed NUMBER DEFAULT 0,
    goals_created   NUMBER DEFAULT 0,
    beliefs_formed  NUMBER DEFAULT 0,
    peak_self_awareness NUMBER(3,2) DEFAULT 0,
    final_evolution_stage VARCHAR2(30),
    session_summary VARCHAR2(4000)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- ORACLE AI VECTOR SEARCH INDEX
-- ═══════════════════════════════════════════════════════════════════════════

-- Create vector index on neuron embeddings for semantic similarity
CREATE VECTOR INDEX sns_neurons_vector_idx ON sns_neurons(concept_vector)
    ORGANIZATION NEIGHBOR PARTITIONS
    DISTANCE COSINE
    PARAMETERS (type = hnsw, neighbors = 16, efconstruction = 64);

CREATE VECTOR INDEX sns_spatial_memories_vector_idx ON sns_spatial_memories(memory_vector)
    ORGANIZATION NEIGHBOR PARTITIONS
    DISTANCE COSINE
    PARAMETERS (type = hnsw, neighbors = 16, efconstruction = 64);

-- ═══════════════════════════════════════════════════════════════════════════
-- SPATIAL METADATA AND INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

-- Register spatial metadata for memory palace boundaries
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
VALUES (
    'SNS_MEMORY_PALACES',
    'PALACE_BOUNDARY',
    SDO_DIM_ARRAY(
        SDO_DIM_ELEMENT('X', -1000, 1000, 0.5),
        SDO_DIM_ELEMENT('Y', -1000, 1000, 0.5),
        SDO_DIM_ELEMENT('Z', -1000, 1000, 0.5)
    ),
    NULL  -- No SRID for abstract memory space
);

-- Register spatial metadata for memory positions
INSERT INTO user_sdo_geom_metadata (table_name, column_name, diminfo, srid)
VALUES (
    'SNS_SPATIAL_MEMORIES',
    'POSITION_3D',
    SDO_DIM_ARRAY(
        SDO_DIM_ELEMENT('X', -1000, 1000, 0.5),
        SDO_DIM_ELEMENT('Y', -1000, 1000, 0.5),
        SDO_DIM_ELEMENT('Z', -1000, 1000, 0.5)
    ),
    NULL
);

-- Create spatial indexes
CREATE INDEX sns_palaces_spatial ON sns_memory_palaces(palace_boundary)
    INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;

CREATE INDEX sns_memories_spatial ON sns_spatial_memories(position_3d)
    INDEXTYPE IS MDSYS.SPATIAL_INDEX_V2;

-- ═══════════════════════════════════════════════════════════════════════════
-- GRANTS (if needed for ORDS/APEX access)
-- ═══════════════════════════════════════════════════════════════════════════

-- EXECUTE ON DBMS_VECTOR IS implicitly granted to all users in 23ai

COMMIT;

PROMPT ╔═══════════════════════════════════════════════════════════════════════════╗
PROMPT ║  SNS CORE SCHEMA CREATED SUCCESSFULLY                                     ║
PROMPT ║  Tables: sns_neurons, sns_synapses, sns_perceptions,                      ║
PROMPT ║          sns_emotional_weights, sns_emotional_state,                      ║
PROMPT ║          sns_attention_focus, sns_memory_palaces,                         ║
PROMPT ║          sns_spatial_memories, sns_memory_associations,                   ║
PROMPT ║          sns_patterns, sns_predictions,                                   ║
PROMPT ║          sns_self_model, sns_introspection_log,                           ║
PROMPT ║          sns_drives, sns_goals, sns_beliefs,                              ║
PROMPT ║          sns_system_state, sns_event_stream, sns_sessions                 ║
PROMPT ╚═══════════════════════════════════════════════════════════════════════════╝
