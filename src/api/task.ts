import express from "express";
import { generateTask, getUserTasks, getTaskById, updateTaskProgress, deleteTask } from "../application/task";

const taskRouter = express.Router();

// Task routes
// Put specific routes before parameterized routes
taskRouter.post("/generate", generateTask);
taskRouter.patch("/progress", updateTaskProgress);
taskRouter.get("/user/:userId", getUserTasks);
taskRouter.get("/:taskId", getTaskById);
taskRouter.delete("/:taskId", deleteTask);

export default taskRouter;
