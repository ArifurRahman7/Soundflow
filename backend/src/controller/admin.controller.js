import { Song } from "../models/song.model.js";
import {Album} from "../models/album.model.js";
import cloudinary from "../lib/cloudinary.js";

const uploadToCloudinary = async (file) => {
    try{
        const result = await cloudinary.uploader.upload(file.tempFilePath,{
            resource_type: "auto",
        })
        return result.secure_url;
    } catch (error) {
        console.log("Error uploading to Cloudinary:", error);
        throw new Error("Error uploading to Cloudinary");
    }
};


export const createSong = async (req, res,next) => {
    try{
        if(!req.files || !req.files.audioFile || !req.files.imageFile){
            return res.status(400).json({message: "Missing required files"});
        }
        const { title, artist, album, duration } = req.body;
        const audioFile = req.files.audioFile;
        const imageFile = req.files.imageFile;
        
        const audioUrl = await uploadToCloudinary(audioFile, "audio");
        const imageUrl = await uploadToCloudinary(imageFile, "image");

        const song = new Song({
            title,
            artist,
            audioUrl,
            imageUrl,
            duration,
            albumId: albumId || null
        })
        await song.save()
        
        //if song belongs to an album,update the album's song array
        if(albumId){
            await Album.findByIdAndUpdate(albumId, {
               $push:{songs:song._id},
            });
        }
     res.status(201).json({message: "Song created successfully", song: song});
        
    }catch(error){
        console.log("Error creating song:", error);
        next(error);
    }
};

export const deleteSong = async (req, res, next) => {
    try {
        const { id } = req.params;
        const song = await Song.findById(id);

        //if song belongs to an album, update the album's songs array
        if (song.albumId) {
            await Album.findByIdAndUpdate(song.albumId, {
                $pull: { songs: song._id },
            });
        }

        await Song.findByIdAndDelete(id);
        res.status(200).json({ message: "Song deleted successfully" });
    } catch (error) {
        console.log("Error deleting song:", error);
        next(error);
    }
};

export const createAlbum = async (req, res, next) => {
    try{
        const { title, artist, releaseDate } = req.body;
        const { imageFile } = req.files;
        const imageUrl = await uploadToCloudinary(imageFile, "image");
        const album = new Album({
            title,
            artist,
            releaseDate,
            imageUrl
        });
        await album.save();
        res.status(201).json(album)
    } catch (error) {
        console.log("Error creating album:", error);
        next(error);
    }
};

export const deleteAlbum = async (req, res, next) => {

    try {
        const { id } = req.params;
        await Song.deleteMany({ albumId: id });
        await Album.findByIdAndDelete(id);
        res.status(200).json({ message: "Album deleted successfully" });
    } catch (error) {
        console.log("Error deleting album:", error);
        next(error);
    }
};

export const checkAdmin = async (req, res,next) => {
    res.status(200).json({admin: true});
};