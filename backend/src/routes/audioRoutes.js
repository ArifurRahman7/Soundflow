import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `recorded-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

// POST route to upload audio
router.post('/upload', upload.single('file'), (req, res) => {
  console.log('✅ File received:', req.file.filename);
  res.json({ status: 'success', filename: req.file.filename });
});

export default router;