import express from "express";
import { getAdminAnalytics, getUserProgress, getUserTaskAnalytics } from "../application/analytics";
import { isAdmin } from "../api/middlewares/authorization-middleware";

const analyticsRouter = express.Router();

// Admin analytics (admin only)
analyticsRouter.get("/admin", isAdmin, (req, res, next) => {
  getAdminAnalytics(req, res, next).catch(next);
});

// User progress (authenticated user)
analyticsRouter.get("/user/progress", (req, res, next) => {
  getUserProgress(req, res, next).catch(next);
});

// User task analytics (user or admin)
analyticsRouter.get("/user/:userId/tasks", (req, res, next) => {
  getUserTaskAnalytics(req, res, next).catch(next);
});

export default analyticsRouter;