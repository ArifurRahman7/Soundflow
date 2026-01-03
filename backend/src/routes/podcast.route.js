import express from "express";
import {
  generatePodcastAudio,
  generatePodcastAudioSample,
  generateThumbnail,
  generatePodcastScript,
  createPodcast,
  getAllPodcasts,
  uploadAudioFile,
  uploadImageFile,
} from "../controller/podcast.controller.js";

const router = express.Router();

router.post("/generate", generatePodcastAudio);
router.post("/generate-sample", generatePodcastAudioSample);
router.post("/thumbnail", generateThumbnail);
router.post("/create-script", generatePodcastScript);
router.post("/create", createPodcast);
router.get("/all-podcasts", getAllPodcasts);
router.post("/upload-audio", uploadAudioFile);
router.post("/upload-image", uploadImageFile);

export default router;
