import express from "express";
import { 
  getUserStats, 
  getUserAchievements, 
  updateUserStats, 
  checkAndUnlockAchievements,
  getLeaderboard,
  getUserLevel,
  awardPoints
} from "../application/gamification";

const gamificationRouter = express.Router();

// Get user statistics
gamificationRouter.get("/stats/:userId", (req, res, next) => {
  getUserStats(req, res, next).catch(next);
});

// Get user achievements
gamificationRouter.get("/achievements/:userId", (req, res, next) => {
  getUserAchievements(req, res, next).catch(next);
});

// Update user statistics (internal use)
gamificationRouter.post("/stats/update", (req, res, next) => {
  updateUserStats(req, res, next).catch(next);
});

// Check and unlock achievements
gamificationRouter.post("/achievements/check", (req, res, next) => {
  checkAndUnlockAchievements(req, res, next).catch(next);
});

// Get leaderboard
gamificationRouter.get("/leaderboard", (req, res, next) => {
  getLeaderboard(req, res, next).catch(next);
});

// Get user level and progress
gamificationRouter.get("/level/:userId", (req, res, next) => {
  getUserLevel(req, res, next).catch(next);
});

// Award points to user
gamificationRouter.post("/points/award", (req, res, next) => {
  awardPoints(req, res, next).catch(next);
});

export default gamificationRouter;