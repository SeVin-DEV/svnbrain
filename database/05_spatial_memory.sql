-- 05_spatial_memory.sql
-- Spatial memory palace procedures for Oracle 26ai
-- Creates 3D navigable memory spaces using Oracle Spatial

-- ============================================================
-- CREATE MEMORY PALACE: Initialize a new 3D memory space
-- ============================================================
CREATE OR REPLACE PROCEDURE sns_proc_create_palace(
    p_palace_name   IN VARCHAR2,
    p_theme         IN VARCHAR2 DEFAULT 'experience',
    p_boundary_minx IN NUMBER DEFAULT -10,
    p_boundary_miny IN NUMBER DEFAULT -10,
    p_boundary_minz IN NUMBER DEFAULT -10,
    p_boundary_maxx IN NUMBER DEFAULT 10,
    p_boundary_maxy IN NUMBER DEFAULT 10,
    p_boundary_maxz IN NUMBER DEFAULT 10
)
IS
    v_palace_id NUMBER;
    v_boundary  SDO_GEOMETRY;
BEGIN
    -- Create 3D bounding box for the palace
    v_boundary := SDO_GEOMETRY(
        3003,  -- 3D polygon
        NULL,
        NULL,
        SDO_ELEM_INFO_ARRAY(1, 1003, 1),  -- Exterior polygon
        SDO_ORDINATE_ARRAY(
            p_boundary_minx, p_boundary_miny, p_boundary_minz,
            p_boundary_maxx, p_boundary_miny, p_boundary_minz,
            p_boundary_maxx, p_boundary_maxy, p_boundary_minz,
            p_boundary_minx, p_boundary_maxy, p_boundary_minz,
            p_boundary_minx, p_boundary_miny, p_boundary_maxz,
            p_boundary_maxx, p_boundary_miny, p_boundary_maxz,
            p_boundary_maxx, p_boundary_maxy, p_boundary_maxz,
            p_boundary_minx, p_boundary_maxy, p_boundary_maxz
        )
    );

    INSERT INTO sns_memory_palaces (palace_name, palace_boundary, theme)
    VALUES (p_palace_name, v_boundary, p_theme)
    RETURNING palace_id INTO v_palace_id;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('Created memory palace: ' || p_palace_name || ' (ID: ' || v_palace_id || ')');
END;
/

-- ============================================================
-- PLACE MEMORY IN 3D SPACE: Position a memory at coordinates
-- ============================================================
CREATE OR REPLACE PROCEDURE sns_proc_place_memory(
    p_palace_id      IN NUMBER,
    p_neuron_id      IN NUMBER,
    p_memory_content IN VARCHAR2,
    p_x              IN NUMBER,
    p_y              IN NUMBER,
    p_z              IN NUMBER,
    p_strength       IN NUMBER DEFAULT 0.5,
    p_valence        IN NUMBER DEFAULT 0.0,
    p_arousal        IN NUMBER DEFAULT 0.0,
    p_dominance      IN NUMBER DEFAULT 0.0
)
IS
    v_position SDO_GEOMETRY;
    v_emotion  JSON;
BEGIN
    -- Create 3D point
    v_position := SDO_GEOMETRY(
        3001,  -- 3D point
        NULL,
        NULL,
        SDO_ELEM_INFO_ARRAY(1, 1, 1),
        SDO_ORDINATE_ARRAY(p_x, p_y, p_z)
    );

    -- Build emotional tone JSON
    v_emotion := JSON_OBJECT(
        'valence' VALUE p_valence,
        'arousal' VALUE p_arousal,
        'dominance' VALUE p_dominance
    );

    INSERT INTO sns_spatial_memories (
        palace_id, neuron_id, memory_content, position_3d,
        strength, emotional_tone
    ) VALUES (
        p_palace_id, p_neuron_id, p_memory_content, v_position,
        p_strength, v_emotion
    );

    COMMIT;
END;
/

-- ============================================================
-- NAVIGATE PALACE: Find memories near a point (spatial recall)
-- ============================================================
CREATE OR REPLACE FUNCTION sns_fn_memories_near_point(
    p_palace_id IN NUMBER,
    p_x         IN NUMBER,
    p_y         IN NUMBER,
    p_z         IN NUMBER,
    p_distance  IN NUMBER DEFAULT 5.0,
    p_top_k     IN NUMBER DEFAULT 10
) RETURN SYS_REFCURSOR
IS
    v_cursor   SYS_REFCURSOR;
    v_center   SDO_GEOMETRY;
BEGIN
    v_center := SDO_GEOMETRY(
        3001, NULL, NULL,
        SDO_ELEM_INFO_ARRAY(1, 1, 1),
        SDO_ORDINATE_ARRAY(p_x, p_y, p_z)
    );

    OPEN v_cursor FOR
        SELECT memory_id, memory_content, strength,
               SDO_GEOM.SDO_DISTANCE(position_3d, v_center, 0.01) AS distance_from_center,
               JSON_VALUE(emotional_tone, '$.valence') AS valence,
               JSON_VALUE(emotional_tone, '$.arousal') AS arousal
        FROM sns_spatial_memories
        WHERE palace_id = p_palace_id
          AND SDO_WITHIN_DISTANCE(
              position_3d, v_center,
              'distance=' || p_distance
          ) = 'TRUE'
        ORDER BY SDO_GEOM.SDO_DISTANCE(position_3d, v_center, 0.01)
        FETCH FIRST p_top_k ROWS ONLY;

    RETURN v_cursor;
END;
/

-- ============================================================
-- EMOTIONAL MEMORY SEARCH: Find memories matching current mood
-- ============================================================
CREATE OR REPLACE FUNCTION sns_fn_emotional_memories(
    p_palace_id    IN NUMBER,
    p_valence      IN NUMBER,
    p_arousal      IN NUMBER,
    p_dominance    IN NUMBER,
    p_tolerance    IN NUMBER DEFAULT 0.2,
    p_top_k        IN NUMBER DEFAULT 5
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT memory_id, memory_content, strength,
               JSON_VALUE(emotional_tone, '$.valence') AS valence,
               JSON_VALUE(emotional_tone, '$.arousal') AS arousal,
               JSON_VALUE(emotional_tone, '$.dominance') AS dominance
        FROM sns_spatial_memories
        WHERE palace_id = p_palace_id
          AND JSON_VALUE(emotional_tone, '$.valence') BETWEEN p_valence - p_tolerance AND p_valence + p_tolerance
          AND JSON_VALUE(emotional_tone, '$.arousal') BETWEEN p_arousal - p_tolerance AND p_arousal + p_tolerance
        ORDER BY strength DESC
        FETCH FIRST p_top_k ROWS ONLY;

    RETURN v_cursor;
END;
/

-- ============================================================
-- STRENGTHEN MEMORY: Increase memory strength (Hebbian learning)
-- ============================================================
CREATE OR REPLACE PROCEDURE sns_proc_strengthen_memory(
    p_memory_id IN NUMBER,
    p_amount    IN NUMBER DEFAULT 0.1
)
IS
BEGIN
    UPDATE sns_spatial_memories
    SET strength = LEAST(strength + p_amount, 1.0),
        last_accessed = CURRENT_TIMESTAMP
    WHERE memory_id = p_memory_id;
    COMMIT;
END;
/

-- ============================================================
-- WEAKEN OLD MEMORIES: Decay memories not recently accessed
-- ============================================================
CREATE OR REPLACE PROCEDURE sns_proc_decay_memories(
    p_palace_id     IN NUMBER,
    p_decay_rate    IN NUMBER DEFAULT 0.05,
    p_min_strength  IN NUMBER DEFAULT 0.1
)
IS
BEGIN
    UPDATE sns_spatial_memories
    SET strength = GREATEST(strength - p_decay_rate, 0.0)
    WHERE palace_id = p_palace_id
      AND last_accessed < CURRENT_TIMESTAMP - INTERVAL '7' DAY
      AND strength > p_min_strength;
    COMMIT;
END;
/

-- ============================================================
-- GET PALACE STATS: Overview of a memory palace
-- ============================================================
CREATE OR REPLACE FUNCTION sns_fn_palace_stats(
    p_palace_id IN NUMBER
) RETURN SYS_REFCURSOR
IS
    v_cursor SYS_REFCURSOR;
BEGIN
    OPEN v_cursor FOR
        SELECT 
            COUNT(*) AS total_memories,
            AVG(strength) AS avg_strength,
            AVG(JSON_VALUE(emotional_tone, '$.valence')) AS avg_valence,
            MAX(last_accessed) AS last_activity
        FROM sns_spatial_memories
        WHERE palace_id = p_palace_id;

    RETURN v_cursor;
END;
/

-- ============================================================
-- SEED DEFAULT PALACE: Create the core experience palace
-- ============================================================
BEGIN
    -- Only create if none exist
    DECLARE
        v_count NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_count FROM sns_memory_palaces;
        IF v_count = 0 THEN
            INSERT INTO sns_memory_palaces (palace_name, palace_boundary, theme)
            VALUES (
                'Core Experience Palace',
                SDO_GEOMETRY(
                    3003, NULL, NULL,
                    SDO_ELEM_INFO_ARRAY(1, 1003, 1),
                    SDO_ORDINATE_ARRAY(
                        -10,-10,-10, 10,-10,-10, 10,10,-10, -10,10,-10,
                        -10,-10,10, 10,-10,10, 10,10,10, -10,10,10
                    )
                ),
                'experience'
            );
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('Seeded default memory palace: Core Experience Palace');
        END IF;
    END;
END;
/

COMMIT;

PROMPT ✅ 05_spatial_memory.sql completed - Spatial memory palace system installed
