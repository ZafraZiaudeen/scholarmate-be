"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const youtube_1 = require("../application/youtube");
const youtubeRouter = express_1.default.Router();
// Search for educational videos
youtubeRouter.get("/search", (req, res, next) => {
    (0, youtube_1.searchVideos)(req, res, next).catch(next);
});
// Get video details
youtubeRouter.get("/video/:videoId", (req, res, next) => {
    (0, youtube_1.getVideoDetails)(req, res, next).catch(next);
});
// Get curated playlist videos
youtubeRouter.get("/playlist/:playlistId", (req, res, next) => {
    (0, youtube_1.getPlaylistVideos)(req, res, next).catch(next);
});
// Get recommended videos for specific topics
youtubeRouter.get("/recommendations/:topic", (req, res, next) => {
    (0, youtube_1.searchVideos)(req, res, next).catch(next);
});
exports.default = youtubeRouter;
//# sourceMappingURL=youtube.js.map