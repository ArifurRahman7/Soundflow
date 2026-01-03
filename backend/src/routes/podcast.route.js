import express from "express";
import { generatePodcastAudio, createPodcast, generateThumbnail, getAllPodcasts, uploadAudioFile, uploadImageFile, generatePodcastText, generatePodcastScript, generatePodcastAudioSample } from "../controller/podcast.controller.js";
// import multer from "multer";
// const storage = multer.memoryStorage(); // You can use diskStorage if needed
// const upload = multer({ storage });



const router = express.Router();

router.post("/generate", generatePodcastAudio);

router.post("/generate-sample", generatePodcastAudioSample);

router.post("/thumbnail", generateThumbnail);

router.post("/create-script", generatePodcastScript);

router.post("/description", generatePodcastText);

router.post("/create",createPodcast);// Create a new podcast episode

router.get("/all-podcasts", getAllPodcasts);// Get all podcast episodes

router.post("/upload-audio", uploadAudioFile); // Upload audio file and get Cloudinary URL

router.post("/upload-image", uploadImageFile); // Upload image file and get Cloudinary URL

export default router;