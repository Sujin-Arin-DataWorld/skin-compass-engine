// Shared types for the AI skin analysis feature

export interface SkinAxisScores {
  seb: number;
  hyd: number;
  bar: number;
  sen: number;
  acne: number;
  pigment: number;
  texture: number;
  aging: number;
  ox: number;
  makeup_stability: number;
}

export type AnalysisStep = 'idle' | 'survey' | 'camera-prompt' | 'camera' | 'analyzing' | 'result' | 'error';
export type ScoreSource = 'manual_questionnaire' | 'ai_photo_analysis';

export interface AnalysisApiResponse {
  analysis_id: string;
  scores: SkinAxisScores;
  model: string;
  version: string;
}

export interface ProductRule {
  productId: string;
  name: { ko: string; en: string; de: string };
  image: string;
  triggerCondition: (scores: SkinAxisScores) => boolean;
  priority: number;
  marketingCopy: { ko: string; en: string; de: string };
  targetAxes: (keyof SkinAxisScores)[];
}
