
import express from "express";
import {
  generateLyrics,
  getAllLyrics,
} from "../controller/lyric.controller.js";

const router = express.Router();

router.post("/", generateLyrics);
router.get("/", getAllLyrics);

export default router;

