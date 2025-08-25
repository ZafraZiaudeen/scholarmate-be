"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const embedding_1 = require("./embedding");
const express_1 = __importDefault(require("express"));
const mcq_1 = require("../application/mcq");
const mcqRouter = express_1.default.Router();
// Put specific routes before parameterized routes
mcqRouter.get("/", mcq_1.getAllMCQs);
mcqRouter.post("/", mcq_1.createMCQ);
mcqRouter.post("/embeddings/create", embedding_1.createEmbeddings);
mcqRouter.get("/:id", mcq_1.getMCQById);
mcqRouter.put("/:id", mcq_1.updateMCQ);
mcqRouter.delete("/:id", mcq_1.deleteMCQ);
exports.default = mcqRouter;
//# sourceMappingURL=mcs.js.map