export interface DharmaWisdom {
  term: string;
  originalTerm: string; // Sanskrit or Pali
  language: string; // e.g., "Pali" or "Sanskrit"
  translation: string;
  definition: string;
  wisdom: string;
  application: string;
  reflectionPrompt: string;
  affirmation: string; // A short "I AM" statement
}

export interface CachedWisdom {
  date: string;
  data: DharmaWisdom;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum SessionState {
  WELCOME = 'WELCOME',
  BREATHING = 'BREATHING',
  WISDOM = 'WISDOM',
}

export interface ReflectionResponse {
  echo: string;
}