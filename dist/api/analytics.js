"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_1 = require("../application/analytics");
const authorization_middleware_1 = require("../api/middlewares/authorization-middleware");
const analyticsRouter = express_1.default.Router();
// Admin analytics (admin only)
analyticsRouter.get("/admin", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, analytics_1.getAdminAnalytics)(req, res, next).catch(next);
});
// User progress (authenticated user)
analyticsRouter.get("/user/progress", (req, res, next) => {
    (0, analytics_1.getUserProgress)(req, res, next).catch(next);
});
// User task analytics (user or admin)
analyticsRouter.get("/user/:userId/tasks", (req, res, next) => {
    (0, analytics_1.getUserTaskAnalytics)(req, res, next).catch(next);
});
exports.default = analyticsRouter;
//# sourceMappingURL=analytics.js.map