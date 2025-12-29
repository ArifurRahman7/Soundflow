import { useState } from 'react';
import axios from 'axios';

const Lyricify = () => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('english');
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);

  const generateLyrics = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/lyrics/generate', {
        topic,
        language,
      });
      setLyrics(res.data.lyrics);
    } catch (err) {
      setLyrics('Error generating lyrics');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎤 Lyricify - AI Song Generator</h1>
      <input
        className="w-full p-2 border mb-2"
        placeholder="Enter a topic (e.g. sad love, summer rain)"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <select
        className="w-full p-2 border mb-4"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="english">English</option>
        <option value="bengali">বাংলা</option>
      </select>
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={generateLyrics}
        disabled={loading || !topic}
      >
        {loading ? 'Generating...' : 'Generate Lyrics'}
      </button>

      {lyrics && (
        <div className="mt-6 whitespace-pre-wrap bg-gray-100 p-4 rounded">
          {lyrics}
        </div>
      )}
    </div>
  );
};

export default Lyricify;