import { createEmbeddings } from './embedding';
import express from "express";
import { createMCQ, getAllMCQs, getMCQById, deleteMCQ, updateMCQ } from "../application/mcq";

import { isAdmin } from "./middlewares/authorization-middleware";
import { isAuthenticated } from "./middlewares/authentication-middleware";

const mcqRouter = express.Router();



// Put specific routes before parameterized routes
mcqRouter.get("/", (req, res, next) => {
  getAllMCQs(req, res, next).catch(next);
});
mcqRouter.post("/", (req, res, next) => {
  createMCQ(req, res, next).catch(next);
});
mcqRouter.post("/embeddings/create", (req, res, next) => {
  createEmbeddings(req, res, next).catch(next);
});

mcqRouter.get("/:id", (req, res, next) => {
  getMCQById(req, res, next).catch(next);
});
mcqRouter.put("/:id", (req, res, next) => {
  updateMCQ(req, res, next).catch(next);
});
mcqRouter.delete("/:id", (req, res, next) => {
  deleteMCQ(req, res, next).catch(next);
});

export default mcqRouter;