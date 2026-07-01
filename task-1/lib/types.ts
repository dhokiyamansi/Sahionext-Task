export type PipelineStatus =
  | "idle"
  | "loading"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface Keyword {
  id: string;
  text: string;
  weight: number;
  createdAt: number;
}

export interface KeywordsResponse {
  keywords?: string[];
  error?: string;
}
