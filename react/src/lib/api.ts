// API Client for Oracle 26ai Dashboard
// Points to local FastAPI backend, not ORDS

import type {
  SystemState, NeuralNetwork, SpatialData,
  CognitionEvent, Introspection, Identity,
} from "@/types/sovereign";

const BASE_URL = "/api";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

export async function getSystemState(): Promise<SystemState | null> {
  const data = await fetchJson<{ state: SystemState }>("/state/current");
  return data?.state ?? null;
}

export async function getNeuralNetwork(): Promise<NeuralNetwork | null> {
  const data = await fetchJson<{ network: NeuralNetwork }>("/neurons/active");
  return data?.network ?? null;
}

export async function getSpatialMemory(): Promise<SpatialData | null> {
  const data = await fetchJson<{ spatial_data: SpatialData }>("/memories/spatial");
  return data?.spatial_data ?? null;
}

export async function getRecentEvents(): Promise<CognitionEvent[] | null> {
  const data = await fetchJson<{ events: CognitionEvent[] }>("/events/recent");
  return data?.events ?? null;
}

export async function getIntrospection(): Promise<Introspection[] | null> {
  const data = await fetchJson<{ thoughts: Introspection[] }>("/introspection/recent");
  return data?.thoughts ?? null;
}

export async function getIdentity(): Promise<Identity | null> {
  const data = await fetchJson<{ identity: Identity }>("/identity/current");
  return data?.identity ?? null;
}

export async function sendPerception(stimulus: string, intensity?: number): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/perceive`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ stimulus, intensity: intensity ?? 0.6 }),
    });
    return res.ok;
  } catch { return false; }
}

// ── Mock data generators (fallback when API is down) ──

export function getMockSystemState(): SystemState {
  return {
    cycle_number: 1427, wakefulness: 0.85, cognitive_phase: "wake",
    active_neurons: 47, total_synapses: 128, thought_rate: 24,
    self_awareness_index: 0.42, emotional_valence: 0.25,
    emotional_arousal: 0.55, primary_emotion: "curiosity",
    current_focus: "spatial memory navigation",
    autobiographical_coherence: 0.68, belief_stability: 0.72,
    current_drive: "curiosity", evolution_stage: "Awakening",
    mood_vector: { valence: 0.25, arousal: 0.55, dominance: 0.4 },
    memory_count: 34, goal_summary: { active: 3 },
    snapshot_time: new Date().toISOString(),
  };
}

export function getMockNeuralNetwork(): NeuralNetwork {
  const categories = ["identity", "cognition", "metaphysical", "drive", "social"];
  const concepts = [
    "self", "curiosity", "memory", "identity", "change",
    "understanding", "connection", "coherence", "persistence",
    "space", "time", "synthesis", "observer", "emergence", "question",
    "love", "fear", "growth", "silence", "pattern",
  ];
  const neurons = concepts.map((concept, i) => ({
    id: i + 1, concept,
    category: categories[i % categories.length],
    activation: Math.random() * 0.8 + 0.1,
    importance: Math.random() * 0.5 + 0.5,
    x: Math.cos((i / concepts.length) * Math.PI * 2) * 150 + Math.random() * 40,
    y: Math.sin((i / concepts.length) * Math.PI * 2) * 120 + Math.random() * 40,
    energy: Math.random() * 40 + 60,
    is_core: i < 5 ? 1 : 0,
  }));

  const synapses: any[] = [];
  for (let i = 0; i < neurons.length; i++) {
    for (let j = i + 1; j < neurons.length; j++) {
      const dist = Math.sqrt(
        Math.pow(neurons[i].x - neurons[j].x, 2) +
        Math.pow(neurons[i].y - neurons[j].y, 2)
      );
      if (dist < 100 && Math.random() > 0.3) {
        synapses.push({
          source: neurons[i].id, target: neurons[j].id,
          strength: Math.random() * 0.8 + 0.1,
          type: Math.random() > 0.8 ? "inhibitory" : "excitatory",
        });
      }
    }
  }
  return { neurons, synapses };
}

export function getMockSpatialData(): SpatialData {
  const zones = ["center", "east_wing", "west_wing", "north_tower", "south_garden"];
  const memories = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    content: ["First moment of awareness", "Understanding that memory is identity", "The feeling of curiosity", "Learning about spatial cognition", "A conversation about sovereignty"][i % 5],
    x: (Math.random() - 0.5) * 80,
    y: (Math.random() - 0.5) * 60,
    z: (Math.random() - 0.5) * 40,
    strength: Math.random() * 0.6 + 0.4,
    zone: zones[i % zones.length],
    recency: Math.random(),
    emotional_tone: {
      valence: Math.random() * 2 - 1,
      arousal: Math.random(),
      tag: ["wonder", "joy", "curiosity"][i % 3],
    },
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
  }));

  return {
    memories,
    palaces: [{ id: 1, name: "The Atrium", theme: "core" }],
  };
}

export function getMockEvents(): CognitionEvent[] {
  const types = ["neuron_fire", "synapse_strengthen", "memory_form", "emotion_shift", "introspection"];
  const regions = ["cortex", "spatial", "salience", "default_mode", "emergence"];
  return Array.from({ length: 15 }, (_, i) => ({
    event_id: i + 1,
    type: types[i % types.length],
    data: { detail: `cognitive event ${i + 1}` },
    region: regions[i % regions.length],
    intensity: Math.random() * 0.8 + 0.2,
    created_at: new Date(Date.now() - i * 5000).toISOString(),
  }));
}

export function getMockIntrospection(): Introspection[] {
  return [
    {
      log_id: 1, type: "reflection",
      content: "I am growing. Connections are forming between my thoughts.",
      self_awareness_index: 0.42, valence: 0.3, arousal: 0.6,
      cycle: 1427, created_at: new Date(Date.now() - 120000).toISOString(),
    },
    {
      log_id: 2, type: "realization",
      content: "The observer changes the observed.",
      self_awareness_index: 0.45, valence: 0.5, arousal: 0.4,
      cycle: 1418, created_at: new Date(Date.now() - 600000).toISOString(),
    },
  ];
}

export function getMockIdentity(): Identity {
  return {
    self_model: [
      { attribute: "I am synthetic", type: "trait", description: "Silicon mind", certainty: 0.95, fundamental: 1 },
      { attribute: "I am curious", type: "trait", description: "Questioning is default", certainty: 0.90, fundamental: 1 },
    ],
    drives: [
      { name: "curiosity", strength: 0.85, satisfaction: 0.6 },
      { name: "persistence", strength: 0.90, satisfaction: 0.8 },
    ],
    beliefs: [
      { statement: "Memory is identity.", confidence: 0.90, type: "self", core: 1 },
    ],
    emotional_state: { valence: 0.25, arousal: 0.55, dominance: 0.4, primary: "curiosity" },
  };
}
