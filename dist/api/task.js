"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const task_1 = require("../application/task");
const taskRouter = express_1.default.Router();
// Task routes
taskRouter.post("/generate", (req, res, next) => {
    (0, task_1.generateTask)(req, res, next).catch(next);
});
taskRouter.patch("/progress", (req, res, next) => {
    (0, task_1.updateTaskProgress)(req, res, next).catch(next);
});
taskRouter.get("/user/:userId", (req, res, next) => {
    (0, task_1.getUserTasks)(req, res, next).catch(next);
});
taskRouter.get("/:taskId", (req, res, next) => {
    (0, task_1.getTaskById)(req, res, next).catch(next);
});
taskRouter.delete("/:taskId", (req, res, next) => {
    (0, task_1.deleteTask)(req, res, next).catch(next);
});
// Chat routes
taskRouter.get("/chat/user/:userId", (req, res, next) => {
    (0, task_1.getChatHistory)(req, res, next).catch(next);
});
taskRouter.get("/chat/:chatId", (req, res, next) => {
    (0, task_1.getChatById)(req, res, next).catch(next);
});
taskRouter.post("/chat/:chatId/save-as-task", (req, res, next) => {
    (0, task_1.saveChatAsTask)(req, res, next).catch(next);
});
exports.default = taskRouter;
//# sourceMappingURL=task.js.map