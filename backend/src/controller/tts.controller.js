import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import cloudinary from "../lib/cloudinary.js";
import TTS from "../models/tts.model.js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const nebius = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const gemini = new GoogleGenAI({});

// ensure tmp dir
const TMP_DIR = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// upload helper
const uploadToCloudinary = async (file) => {
  if (!file?.tempFilePath) throw new Error("Invalid file");
  const result = await cloudinary.uploader.upload(file.tempFilePath, {
    resource_type: "auto",
  });
  return result.secure_url;
};

// ---------------- CONTROLLERS ----------------

// Generate TTS audio (Groq)
export const generateTTSAudio = async (req, res) => {
  try {
    const { text, voice = "Fritz-PlayAI" } = req.body;
    if (!text) return res.status(400).json({ message: "Text required" });

    const response = await groq.audio.speech.create({
      model: "playai-tts",
      voice,
      input: text,
      response_format: "wav",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(TMP_DIR, `tts-${Date.now()}.wav`);
    fs.writeFileSync(filePath, buffer);

    const upload = await cloudinary.uploader.upload(filePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(filePath);
    res.json({ audioUrl: upload.secure_url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate thumbnail
export const generateThumbnail = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: "Prompt required" });

    const image = await nebius.images.generate({
      model: "black-forest-labs/flux-schnell",
      prompt,
      width: 1024,
      height: 1024,
      response_format: "url",
    });

    res.json({ imageUrl: image.data[0].url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate TTS description text
export const generateTTSText = async (req, res) => {
  try {
    const { category, ttsTitle } = req.body;
    if (!category || !ttsTitle) {
      return res.status(400).json({ message: "category & ttsTitle required" });
    }

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a short description for "${ttsTitle}" in ${category}`,
    });

    res.json({ description: response.text.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate TTS script
export const generateTTSScript = async (req, res) => {
  try {
    const { givenAiPrompt } = req.body;
    if (!givenAiPrompt) {
      return res.status(400).json({ message: "Prompt required" });
    }

    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a 30-word TTS script about ${givenAiPrompt}`,
    });

    res.json({ scriptDescription: response.text });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create TTS
export const createTTS = async (req, res) => {
  try {
    const {
      userName,
      title,
      category,
      description,
      aiVoice,
      aiTTSPrompt,
      aiThumbnailPrompt,
      aiThumbnailURL,
      audiourl,
    } = req.body;

    if (
      !userName ||
      !title ||
      !category ||
      !description ||
      !aiVoice ||
      !aiTTSPrompt ||
      !aiThumbnailURL ||
      !audiourl
    ) {
      return res.status(400).json({ message: "All fields required" });
    }

    const thumbnailUpload = await cloudinary.uploader.upload(aiThumbnailURL);
    const tts = await TTS.create({
      userName,
      title,
      category,
      description,
      aiVoice,
      aiTTSPrompt,
      aiThumbnailPrompt,
      audioUrl: audiourl,
      thumbnailUrl: thumbnailUpload.secure_url,
    });

    res.status(201).json({ success: true, tts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all TTS
export const getAllTTS = async (req, res) => {
  try {
    const tts = await TTS.find().sort({ createdAt: -1 });
    res.json(tts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload audio
export const uploadAudioFile = async (req, res) => {
  try {
    if (!req.files?.audioFile) {
      return res.status(400).json({ message: "No audio file" });
    }
    const url = await uploadToCloudinary(req.files.audioFile);
    res.json({ audioUrl: url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload image
export const uploadImageFile = async (req, res) => {
  try {
    if (!req.files?.imageFile) {
      return res.status(400).json({ message: "No image file" });
    }
    const url = await uploadToCloudinary(req.files.imageFile);
    res.json({ imageUrl: url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
