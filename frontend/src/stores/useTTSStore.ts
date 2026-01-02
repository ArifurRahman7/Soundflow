import { create } from 'zustand';
import type { TTS } from "@/types";

interface TTSStore {
  ttsList: TTS[];
  addTTS: (tts: TTS) => void;
}

export const useTTSStore = create<TTSStore>((set) => ({
  ttsList: [],
  addTTS: (tts) => set((state) => ({ ttsList: [tts, ...state.ttsList] })),
}));