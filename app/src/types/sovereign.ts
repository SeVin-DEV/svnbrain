export interface SystemState {
  cycle_number: number;
  wakefulness: number;
  cognitive_phase: string;
  active_neurons: number;
  total_synapses: number;
  thought_rate: number;
  self_awareness_index: number;
  emotional_valence: number;
  emotional_arousal: number;
  primary_emotion: string;
  current_focus: string;
  autobiographical_coherence: number;
  belief_stability: number;
  current_drive: string;
  evolution_stage: string;
  mood_vector: { valence: number; arousal: number; dominance: number };
  memory_count: number;
  goal_summary: { active: number };
  snapshot_time: string;
}

export interface Neuron {
  id: number;
  concept: string;
  category: string;
  activation: number;
  importance: number;
  x: number;
  y: number;
  energy: number;
  is_core: number;
}

export interface Synapse {
  source: number;
  target: number;
  strength: number;
  type: string;
}

export interface NeuralNetwork {
  neurons: Neuron[];
  synapses: Synapse[];
}

export interface SpatialMemory {
  id: number;
  content: string;
  x: number;
  y: number;
  z: number;
  strength: number;
  zone: string;
  recency: number;
  emotional_tone: { valence: number; arousal: number; tag: string };
  created_at: string;
}

export interface MemoryPalace {
  id: number;
  name: string;
  theme: string;
}

export interface SpatialData {
  memories: SpatialMemory[];
  palaces: MemoryPalace[];
}

export interface CognitionEvent {
  event_id: number;
  type: string;
  data: Record<string, unknown>;
  region: string;
  intensity: number;
  created_at: string;
}

export interface Introspection {
  log_id: number;
  type: string;
  content: string;
  self_awareness_index: number;
  valence: number;
  arousal: number;
  cycle: number;
  created_at: string;
}

export interface Identity {
  self_model: Array<{ attribute: string; type: string; description: string; certainty: number; fundamental: number }>;
  drives: Array<{ name: string; strength: number; satisfaction: number }>;
  beliefs: Array<{ statement: string; confidence: number; type: string; core: number }>;
  emotional_state: { valence: number; arousal: number; dominance: number; primary: string };
}

export interface EmotionalState {
  valence: number;
  arousal: number;
  dominance: number;
  primary_emotion: string;
}
