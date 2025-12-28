import { create } from 'zustand';
import { TTS } from "@/types";

interface TTSStore {
  ttsList: TTS[];
  addTTS: (tts: TTS) => void;
}

export const useTTSStore = create<TTSStore>((set) => ({
  ttsList: [],
  addTTS: (tts) => set((state) => ({ ttsList: [tts, ...state.ttsList] })),
}));