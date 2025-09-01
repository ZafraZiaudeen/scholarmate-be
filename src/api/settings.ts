import express from "express";
import { 
  getSystemSettings, 
  updateSystemSettings, 
  resetSystemSettings,
  testEmailConfiguration,
  createSystemBackup,
  clearSystemCache,
  getSystemHealth
} from "../application/settings";
import { isAdmin } from "../api/middlewares/authorization-middleware";

const settingsRouter = express.Router();

// All settings routes require admin access
settingsRouter.use(isAdmin);

// Get system settings
settingsRouter.get("/", (req, res, next) => {
  getSystemSettings(req, res, next).catch(next);
});

// Update system settings
settingsRouter.put("/", (req, res, next) => {
  updateSystemSettings(req, res, next).catch(next);
});

// Reset settings to defaults
settingsRouter.post("/reset", (req, res, next) => {
  resetSystemSettings(req, res, next).catch(next);
});

// Test email configuration
settingsRouter.post("/test-email", (req, res, next) => {
  testEmailConfiguration(req, res, next).catch(next);
});

// Create system backup
settingsRouter.post("/backup", (req, res, next) => {
  createSystemBackup(req, res, next).catch(next);
});

// Clear system cache
settingsRouter.post("/clear-cache", (req, res, next) => {
  clearSystemCache(req, res, next).catch(next);
});

// Get system health status
settingsRouter.get("/health", (req, res, next) => {
  getSystemHealth(req, res, next).catch(next);
});

export default settingsRouter;