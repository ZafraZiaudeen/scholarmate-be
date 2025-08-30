import express from "express";
import { getAllUsers, getUserById, updateUserRole, deleteUser, toggleUserBan } from "../application/user";
import { isAdmin } from "../api/middlewares/authorization-middleware";

const userRouter = express.Router();

// Get all users (admin only)
userRouter.get("/", isAdmin, (req, res, next) => {
  getAllUsers(req, res, next).catch(next);
});

// Get user by ID (admin only)
userRouter.get("/:userId", isAdmin, (req, res, next) => {
  getUserById(req, res, next).catch(next);
});

// Update user role (admin only)
userRouter.patch("/:userId/role", isAdmin, (req, res, next) => {
  updateUserRole(req, res, next).catch(next);
});

// Ban/Unban user (admin only)
userRouter.patch("/:userId/ban", isAdmin, (req, res, next) => {
  toggleUserBan(req, res, next).catch(next);
});

// Delete user (admin only)
userRouter.delete("/:userId", isAdmin, (req, res, next) => {
  deleteUser(req, res, next).catch(next);
});

export default userRouter;