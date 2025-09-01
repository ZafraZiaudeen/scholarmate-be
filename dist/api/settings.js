"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const settings_1 = require("../application/settings");
const authorization_middleware_1 = require("../api/middlewares/authorization-middleware");
const settingsRouter = express_1.default.Router();
// All settings routes require admin access
settingsRouter.use(authorization_middleware_1.isAdmin);
// Get system settings
settingsRouter.get("/", (req, res, next) => {
    (0, settings_1.getSystemSettings)(req, res, next).catch(next);
});
// Update system settings
settingsRouter.put("/", (req, res, next) => {
    (0, settings_1.updateSystemSettings)(req, res, next).catch(next);
});
// Reset settings to defaults
settingsRouter.post("/reset", (req, res, next) => {
    (0, settings_1.resetSystemSettings)(req, res, next).catch(next);
});
// Test email configuration
settingsRouter.post("/test-email", (req, res, next) => {
    (0, settings_1.testEmailConfiguration)(req, res, next).catch(next);
});
// Create system backup
settingsRouter.post("/backup", (req, res, next) => {
    (0, settings_1.createSystemBackup)(req, res, next).catch(next);
});
// Clear system cache
settingsRouter.post("/clear-cache", (req, res, next) => {
    (0, settings_1.clearSystemCache)(req, res, next).catch(next);
});
// Get system health status
settingsRouter.get("/health", (req, res, next) => {
    (0, settings_1.getSystemHealth)(req, res, next).catch(next);
});
exports.default = settingsRouter;
//# sourceMappingURL=settings.js.map