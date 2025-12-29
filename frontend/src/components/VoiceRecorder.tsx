import { useState, useRef } from 'react';
import { FaMicrophone, FaStopCircle, FaDownload } from 'react-icons/fa';

const VoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('🎤 Please allow microphone access.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white/10 backdrop-blur-md shadow-xl rounded-2xl p-8 text-center border border-white/20">
      <h2 className="text-2xl font-semibold text-white mb-4">🎤 Voice Recorder</h2>

      <div className="flex justify-center mb-6">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`text-white p-6 rounded-full shadow-lg transition-all duration-300 ${
            recording ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {recording ? <FaStopCircle size={30} /> : <FaMicrophone size={30} />}
        </button>
      </div>

      <p className="text-white mb-4">
        {recording ? 'Recording in progress...' : 'Click to start recording your voice.'}
      </p>

      {audioURL && (
        <div className="mt-6">
          <h3 className="text-white text-lg font-medium mb-2">▶️ Playback:</h3>
          <audio className="w-full rounded" controls src={audioURL} />

          <a
            href={audioURL}
            download="my_voice.wav"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FaDownload /> Download
          </a>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;