import express from "express";
import { generateTask, getUserTasks, getTaskById, updateTaskProgress, deleteTask, getChatHistory, getChatById, saveChatAsTask } from "../application/task";

const taskRouter = express.Router();

// Task routes
taskRouter.post("/generate", (req, res, next) => {
	generateTask(req, res, next).catch(next);
});
taskRouter.patch("/progress", (req, res, next) => {
	updateTaskProgress(req, res, next).catch(next);
});
taskRouter.get("/user/:userId", (req, res, next) => {
	getUserTasks(req, res, next).catch(next);
});
taskRouter.get("/:taskId", (req, res, next) => {
	getTaskById(req, res, next).catch(next);
});
taskRouter.delete("/:taskId", (req, res, next) => {
	deleteTask(req, res, next).catch(next);
});

// Chat routes
taskRouter.get("/chat/user/:userId", (req, res, next) => {
	getChatHistory(req, res, next).catch(next);
});
taskRouter.get("/chat/:chatId", (req, res, next) => {
	getChatById(req, res, next).catch(next);
});
taskRouter.post("/chat/:chatId/save-as-task", (req, res, next) => {
	saveChatAsTask(req, res, next).catch(next);
});

export default taskRouter;
