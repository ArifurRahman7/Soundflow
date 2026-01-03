import express from "express";
import {
  generateTTSAudio,
  generateThumbnail,
  generateTTSText,
  generateTTSScript,
  createTTS,
  getAllTTS,
  uploadAudioFile,
  uploadImageFile,
} from "../controller/tts.controller.js";

const router = express.Router();

router.post("/generate", generateTTSAudio);
router.post("/thumbnail", generateThumbnail);
router.post("/description", generateTTSText);
router.post("/generate-script", generateTTSScript);
router.post("/create", createTTS);
router.get("/all-tts", getAllTTS);
router.post("/upload-audio", uploadAudioFile);
router.post("/upload-image", uploadImageFile);

export default router;
