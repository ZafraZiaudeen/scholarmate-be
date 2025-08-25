import { createEmbeddings } from './embedding';
import express from "express";
import { createMCQ, getAllMCQs, getMCQById, deleteMCQ, updateMCQ } from "../application/mcq";

import { isAdmin } from "./middlewares/authorization-middleware";
import { isAuthenticated } from "./middlewares/authentication-middleware";

const mcqRouter = express.Router();



// Put specific routes before parameterized routes
mcqRouter.get("/", getAllMCQs);
mcqRouter.post("/", createMCQ);
mcqRouter.post("/embeddings/create", createEmbeddings);

mcqRouter.get("/:id", getMCQById);
mcqRouter.put("/:id", updateMCQ);
mcqRouter.delete("/:id", deleteMCQ);

export default mcqRouter;