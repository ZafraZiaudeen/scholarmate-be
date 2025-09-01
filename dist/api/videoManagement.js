"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoManagement_1 = require("../application/videoManagement");
const authentication_middleware_1 = require("./middlewares/authentication-middleware");
const authorization_middleware_1 = require("./middlewares/authorization-middleware");
const videoManagementRouter = express_1.default.Router();
// Apply authentication middleware to all routes
videoManagementRouter.use(authentication_middleware_1.isAuthenticated);
// Video Categories Routes
// Admin-only routes for category management
videoManagementRouter.post('/categories', authorization_middleware_1.isAdmin, videoManagement_1.createVideoCategory);
videoManagementRouter.patch('/categories/:id', authorization_middleware_1.isAdmin, videoManagement_1.updateVideoCategory);
videoManagementRouter.delete('/categories/:id', authorization_middleware_1.isAdmin, videoManagement_1.deleteVideoCategory);
// Public routes for categories (accessible by students and admins)
videoManagementRouter.get('/categories', videoManagement_1.getAllVideoCategories);
videoManagementRouter.get('/categories/:id', videoManagement_1.getVideoCategoryById);
// Curated Videos Routes
// Admin-only routes for video management
videoManagementRouter.post('/videos', authorization_middleware_1.isAdmin, videoManagement_1.addCuratedVideo);
videoManagementRouter.patch('/videos/:id', authorization_middleware_1.isAdmin, videoManagement_1.updateCuratedVideo);
videoManagementRouter.delete('/videos/:id', authorization_middleware_1.isAdmin, videoManagement_1.deleteCuratedVideo);
// Admin helper route for YouTube search
videoManagementRouter.get('/search-youtube', authorization_middleware_1.isAdmin, videoManagement_1.searchYouTubeForCuration);
// Public routes for curated videos (accessible by students and admins)
videoManagementRouter.get('/videos', videoManagement_1.getAllCuratedVideos);
videoManagementRouter.get('/videos/category/:categoryId', videoManagement_1.getCuratedVideosByCategory);
exports.default = videoManagementRouter;
//# sourceMappingURL=videoManagement.js.map