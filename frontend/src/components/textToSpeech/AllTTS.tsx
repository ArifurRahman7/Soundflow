import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Song } from "@/types";
import { API_BASE_URL } from "@public/BaseURL.ts";

const AllTTS = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [localTTS, setLocalTTS] = useState<any[]>([]);
  const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();
  const [ttsQueue, setTTSQueue] = useState<any[]>([]);
  const [currentTTSIndex, setCurrentTTSIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchTTS = async () => {
      try {
        //console.log("Fetching tts...", import.meta.env.VITE_API_BASE_URL);
        const res = await axios.get(`${API_BASE_URL}/api/tts/all-tts`);
        const tts = res.data.reverse();
        setLocalTTS(tts);
        setTTSQueue(tts);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchTTS();
  }, []);

  const handlePlayTTS = useCallback((tts: any) => {
    const idx = ttsQueue.findIndex((p) => (p._id || p.audioUrl) === (tts._id || tts.audioUrl));
    const isCurrent = currentTTSIndex === idx && currentSong?._id === (tts._id || tts.audioUrl);
    const audio = document.querySelector("audio");
    if (isCurrent) {
      // If already current, just toggle play/pause
      togglePlay();
    } else {
      // Pause any currently playing audio before switching
      if (audio) audio.pause();
      setCurrentTTSIndex(idx);
      const songLike: Song = {
        _id: tts._id || tts.audioUrl,
        title: tts.title,
        artist: tts.category || "TTS",
        albumId: null,
        imageUrl: tts.thumbnailUrl,
        audioUrl: tts.audioUrl,
        duration: 0,
        createdAt: tts.createdAt,
        updatedAt: tts.updatedAt || tts.createdAt,
      };
      setCurrentSong(songLike);
    }
  }, [ttsQueue, currentSong, setCurrentSong, togglePlay, currentTTSIndex]);

  useEffect(() => {
    // Only attach ended handler if a TTS is playing
    if (currentTTSIndex === -1) return;
    const audio = document.querySelector("audio");
    if (!audio) return;
    const handleEnded = () => {
      const nextIndex = currentTTSIndex + 1;
      if (nextIndex < ttsQueue.length) {
        setCurrentTTSIndex(nextIndex);
        const nextTTS = ttsQueue[nextIndex];
        const songLike: Song = {
          _id: nextTTS._id || nextTTS.audioUrl,
          title: nextTTS.title,
          artist: nextTTS.category || "TTS",
          albumId: null,
          imageUrl: nextTTS.thumbnailUrl,
          audioUrl: nextTTS.audioUrl,
          duration: 0,
          createdAt: nextTTS.createdAt,
          updatedAt: nextTTS.updatedAt || nextTTS.createdAt,
        };
        setCurrentSong(songLike);
      } else {
        setCurrentTTSIndex(-1);
        setCurrentSong(null);
        // Explicitly pause the audio and stop the player
        if (audio) audio.pause();
        // Set isPlaying to false in the player store
        if (typeof togglePlay === 'function' && isPlaying) togglePlay();
      }
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentTTSIndex, ttsQueue, setCurrentSong, isPlaying, togglePlay]);

  return (
    <div className="w-full mb-8 px-4 overflow-auto max-h-[calc(100vh-120px)]">
      <h3 className="text-white text-lg font-semibold mb-4">All TTS</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {localTTS.length === 0 && (
          <div className="text-zinc-400 text-center">No TTS yet.</div>
        )}
        {localTTS.map((tts, idx) => {
          const songLike: Song = {
            _id: tts._id || tts.audioUrl,
            title: tts.title,
            artist: tts.category || "TTS",
            albumId: null,
            imageUrl: tts.thumbnailUrl,
            audioUrl: tts.audioUrl,
            duration: 0,
            createdAt: tts.createdAt,
            updatedAt: tts.updatedAt || tts.createdAt,
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
                  src={tts.thumbnailUrl}
                  alt={tts.title}
                  className="w-full h-full object-cover object-center rounded"
                  style={{ display: 'block', objectFit: 'cover', objectPosition: 'center' }}
                />
                <button
                  className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${hovered === idx || isCurrent ? "opacity-100" : "opacity-0"}`}
                  onClick={e => { e.stopPropagation(); handlePlayTTS(tts); }}
                  aria-label={isCurrent && isPlaying ? "Pause TTS" : "Play TTS"}
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
                <div className="text-white font-semibold text-base">{tts.title}</div>
                <div className="text-zinc-400 text-xs mb-1">{tts.category} &middot; {new Date(tts.createdAt).toLocaleString()}</div>
                <div className="text-zinc-300 text-sm mb-2 line-clamp-2">{tts.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AllTTS;