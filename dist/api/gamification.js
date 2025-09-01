"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const gamification_1 = require("../application/gamification");
const gamificationRouter = express_1.default.Router();
// Get user statistics
gamificationRouter.get("/stats/:userId", (req, res, next) => {
    (0, gamification_1.getUserStats)(req, res, next).catch(next);
});
// Get user achievements
gamificationRouter.get("/achievements/:userId", (req, res, next) => {
    (0, gamification_1.getUserAchievements)(req, res, next).catch(next);
});
// Update user statistics (internal use)
gamificationRouter.post("/stats/update", (req, res, next) => {
    (0, gamification_1.updateUserStats)(req, res, next).catch(next);
});
// Check and unlock achievements
gamificationRouter.post("/achievements/check", (req, res, next) => {
    (0, gamification_1.checkAndUnlockAchievements)(req, res, next).catch(next);
});
// Get leaderboard
gamificationRouter.get("/leaderboard", (req, res, next) => {
    (0, gamification_1.getLeaderboard)(req, res, next).catch(next);
});
// Get user level and progress
gamificationRouter.get("/level/:userId", (req, res, next) => {
    (0, gamification_1.getUserLevel)(req, res, next).catch(next);
});
// Award points to user
gamificationRouter.post("/points/award", (req, res, next) => {
    (0, gamification_1.awardPoints)(req, res, next).catch(next);
});
exports.default = gamificationRouter;
//# sourceMappingURL=gamification.js.map