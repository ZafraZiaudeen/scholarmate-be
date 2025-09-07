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
videoManagementRouter.post('/categories', isAdmin, (req, res, next) => {
  createVideoCategory(req, res, next).catch(next);
});
videoManagementRouter.patch('/categories/:id', isAdmin, (req, res, next) => {
  updateVideoCategory(req, res, next).catch(next);
});
videoManagementRouter.delete('/categories/:id', isAdmin, (req, res, next) => {
  deleteVideoCategory(req, res, next).catch(next);
});

// Public routes for categories (accessible by students and admins)
videoManagementRouter.get('/categories', (req, res, next) => {
  getAllVideoCategories(req, res, next).catch(next);
});
videoManagementRouter.get('/categories/:id', (req, res, next) => {
  getVideoCategoryById(req, res, next).catch(next);
});

// Curated Videos Routes

// Admin-only routes for video management
videoManagementRouter.post('/videos', isAdmin, (req, res, next) => {
  addCuratedVideo(req, res, next).catch(next);
});
videoManagementRouter.patch('/videos/:id', isAdmin, (req, res, next) => {
  updateCuratedVideo(req, res, next).catch(next);
});
videoManagementRouter.delete('/videos/:id', isAdmin, (req, res, next) => {
  deleteCuratedVideo(req, res, next).catch(next);
});

// Admin helper route for YouTube search
videoManagementRouter.get('/search-youtube', isAdmin, (req, res, next) => {
  searchYouTubeForCuration(req, res, next).catch(next);
});

// Public routes for curated videos (accessible by students and admins)
videoManagementRouter.get('/videos', (req, res, next) => {
  getAllCuratedVideos(req, res, next).catch(next);
});
videoManagementRouter.get('/videos/category/:categoryId', (req, res, next) => {
  getCuratedVideosByCategory(req, res, next).catch(next);
});

export default videoManagementRouter;