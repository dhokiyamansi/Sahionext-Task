export type PipelineStatus =
  | "idle" // not started
  | "loading" // VAD model downloading / mic warming up
  | "listening" // waiting for / capturing speech
  | "thinking" // audio sent to Gemini, awaiting keywords
  | "speaking" // reading the keywords aloud
  | "error";

export interface Keyword {
  id: string;
  text: string;
  weight: number; // how many times it has appeared this session
  createdAt: number;
}

export interface KeywordsResponse {
  keywords?: string[];
  error?: string;
}
