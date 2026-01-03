import mongoose from 'mongoose';

const ttsSchema = new mongoose.Schema({
        userName: {
            type: String,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        }
        ,
        category: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        aiVoice: {
            type: String,
            required: true,
        },
        aiTTSPrompt: {
            type: String,
            required: true,
        },
        aiThumbnailPrompt: {
            type: String,
            required: true,
        },
        audioUrl: {
            type: String,
            required: true,
        },
        thumbnailUrl: {
            type: String,
            required: true,
        },
        
    },
    { timestamps: true }
);

export const TTS = mongoose.model('TTS', ttsSchema);