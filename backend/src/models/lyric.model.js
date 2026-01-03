import mongoose from "mongoose";

const lyricSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    lyrics: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Lyric = mongoose.model("Lyric", lyricSchema);

export default Lyric;