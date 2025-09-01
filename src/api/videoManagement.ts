import express from "express";
import { 
  createVideoCategory,
  getAllVideoCategories,
  getVideoCategoryById,
  updateVideoCategory,
  deleteVideoCategory,
  addCuratedVideo,
  getAllCuratedVideos,
  getCuratedVideosByCategory,
  updateCuratedVideo,
  deleteCuratedVideo,
  searchYouTubeForCuration
} from "../application/videoManagement";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { isAdmin } from "./middlewares/authorization-middleware";

const videoManagementRouter = express.Router();

// Apply authentication middleware to all routes
videoManagementRouter.use(isAuthenticated);

// Video Categories Routes

// Admin-only routes for category management
videoManagementRouter.post('/categories', isAdmin, createVideoCategory);
videoManagementRouter.patch('/categories/:id', isAdmin, updateVideoCategory);
videoManagementRouter.delete('/categories/:id', isAdmin, deleteVideoCategory);

// Public routes for categories (accessible by students and admins)
videoManagementRouter.get('/categories', getAllVideoCategories);
videoManagementRouter.get('/categories/:id', getVideoCategoryById);

// Curated Videos Routes

// Admin-only routes for video management
videoManagementRouter.post('/videos', isAdmin, addCuratedVideo);
videoManagementRouter.patch('/videos/:id', isAdmin, updateCuratedVideo);
videoManagementRouter.delete('/videos/:id', isAdmin, deleteCuratedVideo);

// Admin helper route for YouTube search
videoManagementRouter.get('/search-youtube', isAdmin, searchYouTubeForCuration);

// Public routes for curated videos (accessible by students and admins)
videoManagementRouter.get('/videos', getAllCuratedVideos);
videoManagementRouter.get('/videos/category/:categoryId', getCuratedVideosByCategory);

export default videoManagementRouter;