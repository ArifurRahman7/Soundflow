import { create } from 'zustand';
import { Podcast } from "@/types";

interface PodcastStore {
  podcastList: Podcast[];
  addPodcast: (podcast: Podcast) => void;
}

export const usePodcastStore = create<PodcastStore>((set) => ({
  podcastList: [],
  addPodcast: (podcast) => set((state) => ({ podcastList: [podcast, ...state.podcastList] })),
}));