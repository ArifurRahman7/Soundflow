import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import { API_BASE_URL } from "@public/BaseURL.ts";

const AllPodCast = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [localPodcasts, setLocalPodcasts] = useState<any[]>([]);
  const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();
  const [podcastQueue, setPodcastQueue] = useState<any[]>([]);
  const [currentPodcastIndex, setCurrentPodcastIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        //console.log("Fetching podcasts...", import.meta.env.VITE_API_BASE_URL);
        const res = await axios.get(`${API_BASE_URL}/api/podcast/all-podcasts`);
        const podcasts = res.data.reverse();
        setLocalPodcasts(podcasts);
        setPodcastQueue(podcasts);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchPodcasts();
  }, []);

  const handlePlayPodcast = useCallback((podcast: any) => {
    const idx = podcastQueue.findIndex((p) => (p._id || p.audioUrl) === (podcast._id || podcast.audioUrl));
    const isCurrent = currentPodcastIndex === idx && currentSong?._id === (podcast._id || podcast.audioUrl);
    const audio = document.querySelector("audio");
    if (isCurrent) {
      // If already current, just toggle play/pause
      togglePlay();
    } else {
      // Pause any currently playing audio before switching
      if (audio) audio.pause();
      setCurrentPodcastIndex(idx);
      const songLike: Song = {
        _id: podcast._id || podcast.audioUrl,
        title: podcast.title,
        artist: podcast.category || "Podcast",
        albumId: null,
        imageUrl: podcast.thumbnailUrl,
        audioUrl: podcast.audioUrl,
        duration: 0,
        createdAt: podcast.createdAt,
        updatedAt: podcast.updatedAt || podcast.createdAt,
      };
      setCurrentSong(songLike);
    }
  }, [podcastQueue, currentSong, setCurrentSong, togglePlay, currentPodcastIndex]);

  useEffect(() => {
    // Only attach ended handler if a podcast is playing
    if (currentPodcastIndex === -1) return;
    const audio = document.querySelector("audio");
    if (!audio) return;
    const handleEnded = () => {
      const nextIndex = currentPodcastIndex + 1;
      if (nextIndex < podcastQueue.length) {
        setCurrentPodcastIndex(nextIndex);
        const nextPodcast = podcastQueue[nextIndex];
        const songLike: Song = {
          _id: nextPodcast._id || nextPodcast.audioUrl,
          title: nextPodcast.title,
          artist: nextPodcast.category || "Podcast",
          albumId: null,
          imageUrl: nextPodcast.thumbnailUrl,
          audioUrl: nextPodcast.audioUrl,
          duration: 0,
          createdAt: nextPodcast.createdAt,
          updatedAt: nextPodcast.updatedAt || nextPodcast.createdAt,
        };
        setCurrentSong(songLike);
      } else {
        setCurrentPodcastIndex(-1);
        setCurrentSong(null);
        // Explicitly pause the audio and stop the player
        if (audio) audio.pause();
        // Set isPlaying to false in the player store
        if (typeof togglePlay === 'function' && isPlaying) togglePlay();
      }
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentPodcastIndex, podcastQueue, setCurrentSong, isPlaying, togglePlay]);

  return (
    <div className="w-full mb-8 px-4 overflow-auto max-h-[calc(100vh-120px)]">
      <h3 className="text-white text-lg font-semibold mb-4">All Podcasts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {localPodcasts.length === 0 && (
          <div className="text-zinc-400 text-center">No podcasts yet.</div>
        )}
        {localPodcasts.map((podcast, idx) => {
          const songLike: Song = {
            _id: podcast._id || podcast.audioUrl,
            title: podcast.title,
            artist: podcast.category || "Podcast",
            albumId: null,
            imageUrl: podcast.thumbnailUrl,
            audioUrl: podcast.audioUrl,
            duration: 0,
            createdAt: podcast.createdAt,
            updatedAt: podcast.updatedAt || podcast.createdAt,
          };
          const isCurrent = currentSong?._id === songLike._id;
          return (
            <div
              key={idx}
              className={`bg-[#23262F] rounded-lg p-4 flex gap-4 items-center group transition hover:bg-[#292c36] cursor-pointer ${isCurrent ? "ring-2 ring-green-500" : ""}`}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-[#181A20] relative">
                <img
                  src={podcast.thumbnailUrl}
                  alt={podcast.title}
                  className="w-full h-full object-cover object-center rounded"
                  style={{ display: 'block', objectFit: 'cover', objectPosition: 'center' }}
                />
                <button
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${hovered === idx || isCurrent ? "opacity-100" : "opacity-0"}`}
                  onClick={e => { e.stopPropagation(); handlePlayPodcast(podcast); }}
                  aria-label={isCurrent && isPlaying ? "Pause podcast" : "Play podcast"}
                >
                  {isCurrent && isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-black">
                      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-black">
                      <path className="ring-green-500" strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.25v13.5l13.5-6.75-13.5-6.75z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-base">{podcast.title}</div>
                <div className="text-zinc-400 text-xs mb-1">{podcast.category} &middot; {new Date(podcast.createdAt).toLocaleString()}</div>
                <div className="text-zinc-300 text-sm mb-2 line-clamp-2">{podcast.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllPodCast;