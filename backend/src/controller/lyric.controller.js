import fetch from "node-fetch";
import dotenv from "dotenv";
import Lyric from "../models/lyric.model.js";

dotenv.config();

export const generateLyrics = async (req, res) => {
  try {
    const { mood, language, userName } = req.body;

    if (!mood || !language || !userName) {
      return res
        .status(400)
        .json({ message: "mood, language, and userName are required" });
    }

    const prompt =
      language === "bn"
        ? `একটি ${mood} অনুভূতির উপর ভিত্তি করে একটি আবেগময় বাংলা গানের লিরিকস লেখো।`
        : `Write an emotional song lyric in English based on the mood: ${mood}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const result = await response.json();

    const lyrics =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No lyrics generated.";

    const lyric = await Lyric.create({
      userName,
      prompt: mood,
      lyrics,
    });

    res.status(200).json({ lyrics, lyric });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate lyrics" });
  }
};

export const getAllLyrics = async (req, res) => {
  try {
    const lyrics = await Lyric.find().sort({ createdAt: -1 });
    res.status(200).json(lyrics);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch lyrics" });
  }
};

