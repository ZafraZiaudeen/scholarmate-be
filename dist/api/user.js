"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../application/user");
const authorization_middleware_1 = require("../api/middlewares/authorization-middleware");
const userRouter = express_1.default.Router();
// Get all users (admin only)
userRouter.get("/", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, user_1.getAllUsers)(req, res, next).catch(next);
});
// Get user by ID (admin only)
userRouter.get("/:userId", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, user_1.getUserById)(req, res, next).catch(next);
});
// Update user role (admin only)
userRouter.patch("/:userId/role", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, user_1.updateUserRole)(req, res, next).catch(next);
});
// Ban/Unban user (admin only)
userRouter.patch("/:userId/ban", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, user_1.toggleUserBan)(req, res, next).catch(next);
});
// Delete user (admin only)
userRouter.delete("/:userId", authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, user_1.deleteUser)(req, res, next).catch(next);
});
exports.default = userRouter;
//# sourceMappingURL=user.js.map