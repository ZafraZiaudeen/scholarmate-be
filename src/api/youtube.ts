import express from "express";
import { searchVideos, getVideoDetails, getPlaylistVideos } from "../application/youtube";

const youtubeRouter = express.Router();

// Search for educational videos
youtubeRouter.get("/search", (req, res, next) => {
	searchVideos(req, res, next).catch(next);
});

// Get video details
youtubeRouter.get("/video/:videoId", (req, res, next) => {
	getVideoDetails(req, res, next).catch(next);
});

// Get curated playlist videos
youtubeRouter.get("/playlist/:playlistId", (req, res, next) => {
	getPlaylistVideos(req, res, next).catch(next);
});

// Get recommended videos for specific topics
youtubeRouter.get("/recommendations/:topic", (req, res, next) => {
	searchVideos(req, res, next).catch(next);
});

export default youtubeRouter;