import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Groq from 'groq-sdk';
import Podcast from "../models/podcast.model.js";
import cloudinary from "../lib/cloudinary.js";
import { GoogleGenAI } from "@google/genai";
import {execSync} from "child_process";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const nebius = new OpenAI({
  baseURL: "https://api.studio.nebius.com/v1/",
  apiKey: process.env.NEBIUS_API_KEY,
});

const gemini = new GoogleGenAI({});

// helper function to upload files to cloudinary 
const uploadToCloudinary = async (file) => {
    try {
        if (file.tempFilePath) {
            // express-fileupload
            const result = await cloudinary.uploader.upload(file.tempFilePath, {
                resource_type: "auto"
            });
            return result.secure_url;
        } else if (file.buffer) {
            // multer
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "auto" },
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
                stream.end(file.buffer);
            });
            return result.secure_url;
        } else {
            throw new Error("File format not supported for Cloudinary upload");
        }
    } catch (error) {
        console.log("Error in uploading to cloudinary", error);
        throw new Error("Error in uploading to cloudinary");
    }
}

export const uploadToCloudinaryIMG = async (imageUrl, folder = "images") => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder,
      resource_type: "image", // or "auto" if you're not sure
    });
    return result;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw new Error("Error in uploading to cloudinary");
  }
};


// Generate podcast audio (returns text or audio URL)
export const generatePodcast = async (req, res, next) => {
  try {
    const { prompt, model, title, description } = req.body;
    if (!prompt || !model) {
      return res.status(400).json({ message: "Prompt and model are required" });
    }
    // Generate podcast script using OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: `You are a helpful podcast script generator. Title: ${title || "Untitled"}. Description: ${description || ""}` },
        { role: "user", content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.8,
    });

    const script = completion.choices[0].message.content;
    res.json({ script });
  } catch (error) {
    next(error);
  }
};

// Generate podcast thumbnail (returns image URL or base64)
//https://youtu.be/pb_jYgSqGh0
export const generateThumbnail = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    // console.log(11111)
    // console.log(req.body)
    // console.log(prompt)

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }
    // Generate image using Nebius API, return as base64 data URL
    //console.log(prompt);
    const imageResponse = await nebius.images.generate({
        "model": "black-forest-labs/flux-schnell",
        "response_format": "url",
        "response_extension": "png",
        "width": 1024,
        "height": 1024,
        "num_inference_steps": 4,
        "negative_prompt": "",
        "seed": -1,
        prompt,
    });
  
    const imageUrl = imageResponse.data[0].url;
    
    res.json({ imageUrl });
  } catch (error) {
    next(error);
  }
};

// Generate podcast audio using Groq Podcast
//https://console.groq.com/docs/text-to-speech
export const generatePodcastAudio = async (req, res, next) => {
  try {
    const { script, aiVoice, aiGuestVoice } = req.body;

    if (!script) {
      return res.status(400).json({ message: "Script is required for Podcast generation" });
    }


    // const response = await groq.audio.speech.create({
    //   model,
    //   voice,
    //   input: text,
    //   response_format: responseFormat
    // });

    // Generate audio for each line


    const prompt = `
    Convert this podcast script to JSON with voices "${aiVoice}" and "${aiGuestVoice}":
    ${script}
    
    Output example:
    [
      { "text": "Welcome to our podcast.", "voice": "${aiVoice}" },
      { "text": "Thank you for joining us today.", "voice": "${aiGuestVoice}" },
      { "text": "Let's dive into the topic.", "voice": "${aiVoice}" },
      { "text": "Absolutely, let's begin!", "voice": "${aiGuestVoice}" }
    ]

    Only output the JSON array, no extra text, no explanations, 
    no markdown, just plain text.
    `;


    const promptResponse = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    
    const scripts = JSON.parse(promptResponse.text);

    console.log("Generating audio for script:", scripts);
    console.log("Using voices:", aiVoice, aiGuestVoice);

    const audioBuffers = [];
    for (const line of scripts) {
      if (!line.text || !line.voice) {
        return res.status(400).json({ message: "Each script line must have 'text' and 'voice'" });
      }

      const response = await groq.audio.speech.create({
        model: "playai-tts",
        voice: line.voice,
        input: line.text,
        response_format: "wav"
      });

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      audioBuffers.push(audioBuffer);
    }

    const finalAudioBuffer = mergeAudioBuffers(audioBuffers);

    // Save to temp file
    const fileName = `podcast_${Date.now()}.wav`;
    const tempFilePath = path.join("tmp", fileName);
    await fs.promises.writeFile(tempFilePath, finalAudioBuffer);

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto"
    });

    // Clean up temp file
    await fs.promises.unlink(tempFilePath);

    // Return Cloudinary URL
    res.json({ audioUrl: cloudinaryResult.secure_url });
  } catch (error) {
    next(error);
  }
};


export const generatePodcastAudioSample = async (req, res, next) => {
  try {
    const { text, model = "playai-tts", voice, responseFormat = "wav" } = req.body;
    if (!text) {
      return res.status(400).json({ message: "Text is required for TTS generation" });
    }
    // Ensure tmp directory exists
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const response = await groq.audio.speech.create({
      model,
      voice,
      input: text,
      response_format: responseFormat
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    // Save to a temp file
    const fileName = `speech_${Date.now()}.wav`;
    const tempFilePath = path.join(tmpDir, fileName);
    await fs.promises.writeFile(tempFilePath, buffer);

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinary.uploader.upload(tempFilePath, {
      resource_type: "auto"
    });
    // Remove temp file after upload
    await fs.promises.unlink(tempFilePath);

    // Return Cloudinary URL
    res.json({ audioUrl: cloudinaryResult.secure_url });
  } catch (error) {
    next(error);
  }
}

//merge multiple audios
function mergeAudioBuffers(audioBuffers) {
  const tempDir = "/tmp/groq-podcast";
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  const tempFiles = audioBuffers.map((buffer, index) => {
    const filePath = `${tempDir}/part-${index}.wav`;
    fs.writeFileSync(filePath, buffer);
    return filePath;
  });

  const concatListPath = `${tempDir}/concat.txt`;
  fs.writeFileSync(concatListPath, tempFiles.map(f => `file '${f}'`).join("\n"));

  const outputPath = `${tempDir}/final-output.wav`;
  execSync(`ffmpeg -f concat -safe 0 -i ${concatListPath} -c copy ${outputPath}`);

  const finalBuffer = fs.readFileSync(outputPath);

  // Cleanup
  tempFiles.forEach(fs.unlinkSync);
  fs.unlinkSync(concatListPath);
  fs.unlinkSync(outputPath);

  return finalBuffer;
}



export const generatePodcastText = async (req, res) => {
  const { category, podcastTitle } = req.body;
  if (!category || !podcastTitle) {
    return res.status(400).json({ message: "Both Name and Category is required" });
  }
  const description = await gemini.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate a 8 word description based on those content: ${podcastTitle} and ${category}`,
  });
  console.log(podcastTitle);
  console.log(description.text);
  res.json({ description: description.text, podcastTitle });
};

export const generatePodcastScript = async (req, res) => {
  console.log("Hello with body:", req.body);

  const { givenAiPrompt } = req.body;
  if (!givenAiPrompt) {
    return res.status(400).json({ message: "Prompt is required" });
  }

  try {
    // First prompt: Generate conversational text
    const prompt1 = `
    Generate a conversational podcast script on ${givenAiPrompt} with 3 alternating voices Host and Guest. Total 2 short sentence exchanges.
    Don't use any markdown or code blocks, just plain text.
    First the host will introduce the topic and tell the guest about it, then generate a conversation between them.
    Start with the host introducing the topic, then the guest will respond.

    The guest name is arif, Thank arif First for coming to the podcast. 
    Just keep the conversation friendly and short, keep each conversation short like 1-2 sentences with 5-10 words.

    The host will ask a question, and the guest will respond with the words like well, I think that, or I believe that, or I feel that, etc.
    Make the question and response natural and engaging, as if they are having a real conversation.
    Also Keep the question short and to the point, and the response should be 1-2 sentences long.
    The host will introduce an interesting fact on the ${givenAiPrompt} and will ask questions like a normal host would do. 

    Use the following format for the conversation:
    Format:
    Host: First Text
    Guest: Second Text
    Host: Third Text
    Guest: Fourth Text
    `;

    const prompt1Response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt1
    });

    // Second prompt: Convert to JSON format with voices
    // const prompt2 = `
    // Convert this podcast script to JSON with voices "Fritz-PlayAI" and "Arista-PlayAI":
    // ${prompt1Response.text}
    
    // Output example:
    // [
    //   { "text": "Welcome to our podcast.", "voice": "Fritz-PlayAI" },
    //   { "text": "Thank you for joining us today.", "voice": "Arista-PlayAI" },
    //   { "text": "Let's dive into the topic.", "voice": "Fritz-PlayAI" },
    //   { "text": "Absolutely, let's begin!", "voice": "Arista-PlayAI" }
    // ]

    // Only output the JSON array, no extra text, no explanations, no markdown, just plain text.
    // `;

    // const prompt2Response = await gemini.models.generateContent({
    //   model: "gemini-2.5-flash",
    //   contents: prompt2
    // });

    // Parse the JSON safely
    // let script;
    // console.log("Response from Gemini:", prompt2Response.text);
    // try {
    //   script = JSON.parse(prompt2Response.text);
    // } catch (err) {
    //   console.error("Failed to parse JSON from Gemini:", prompt2Response.text);
    //   return res.status(500).json({ message: "Invalid JSON response from AI" });
    // }
    // console.log("Generated script:", script);

    // if (!Array.isArray(script) || script.length === 0) {
    //   return res.status(400).json({ message: "Generated script is empty or invalid" });
    // }

    // Final response
    // console.log("Generated script:",  prompt1Response.text);
    // console.log("Generated script:", script);
    // console.log("Generated script:", cloudinaryResult.secure_url);

    res.json({
      scriptDescription: prompt1Response.text,//textarea of the box generation
      //generatedScript: script, //json of the script
    });

  } catch (error) {
    console.error("Error generating podcast:", error);
    res.status(500).json({ message: "Error generating podcast", error: error.message });
  }
};




export const createPodcast = async (req, res, next) => {
  //console.log("Creating podcast with body:", req.body);
  //console.log("Creating podcast with body:", req.body);
 
  //console.log("Files in request:", req.files.imageFile);

  try {
    const { userName, title, category, description, aiVoice, aiGuestVoice, aiPodcastPrompt, aiThumbnailPrompt, aiThumbnailURL, audiourl } = req.body;
      //console.log(aiThumbnailURL);
     //const image = req.files.imageFile;
    //  console.log("Files in request:", req.files);
    //  console.log("Files in request:", aiThumbnailPrompt);
    //  console.log("Files in request:", audioFile);

    if (!userName || !title || !category || !description || !aiVoice || !aiGuestVoice || !aiPodcastPrompt || !aiThumbnailURL || !audiourl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for uploaded files url
    // console.log("Files in request:", req.body);
    // console.log("Files in request:", req.files.audioFile, req.files.imageFile);
    // if (!req.files.audioFile || !req.files.imageFile) {
    //   return res.status(400).json({ message: "Please upload both audio and image files" });
    // }

    // // Upload audio and image to Cloudinary
    // console.log(aiThumbnailURL);
    // console.log(req.files.imageFile);
    //const audioUrl = await uploadToCloudinary(req.files.audioFile);
    const uploadResult = await uploadToCloudinaryIMG(aiThumbnailURL);
    const thumbnailUrl = uploadResult.secure_url;
    // audioUrl: must be provided from frontend (Cloudinary URL)
    const audioUrl = audiourl;
    // aiThumbnailPrompt: must be provided from frontend
    // Create podcast document in MongoDB
    const podcast = new Podcast({
      userName,
      title,
      category,
      description,
      aiVoice,//host voice
      aiGuestVoice,//guest voice
      aiPodcastPrompt,
      aiThumbnailPrompt,
      audioUrl,
      thumbnailUrl
    });
    await podcast.save();
    res.status(201).json({ message: "Created podcast successfully", podcast });
  } catch (error) {
    console.error("Error creating podcast:", error);
    next(error);
  }
};

export const getAllPodcasts = async (req, res, next) => {
  //find all podcast by users
  try {
    const podcasts = await Podcast.find().sort({ createdAt: -1 });
    res.status(200).json(podcasts);
  } catch (error) {
    console.error("Error fetching podcasts:", error);
    next(error);
  }
};

// Upload audio file to Cloudinary and return the URL
export const uploadAudioFile = async (req, res, next) => {
  try {
    console.log('req.files:', req.files);
    if (!req.files || !req.files.audioFile) {
      console.log('No audioFile found in req.files');
      return res.status(400).json({ message: "No audio file uploaded" });
    }
    const audioFile = req.files.audioFile;
    console.log('audioFile:', audioFile);
    const audioUrl = await uploadToCloudinary(audioFile);
    res.json({ audioUrl });
  } catch (error) {
    console.error('Error in uploadAudioFile:', error);
    next(error);
  }
};

// Upload image file to Cloudinary and return the URL
export const uploadImageFile = async (req, res, next) => {
  try {
    if (!req.files || !req.files.imageFile) {
      return res.status(400).json({ message: "No image file uploaded" });
    }
    let imageFile = req.files.imageFile;
    // If multiple files, take the first one
    if (Array.isArray(imageFile)) imageFile = imageFile[0];
    const imageUrl = await uploadToCloudinary(imageFile);
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error in uploadImageFile:', error);
    next(error);
  }
};