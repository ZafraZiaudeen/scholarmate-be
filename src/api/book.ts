import { createEmbeddings } from './embedding';
import express from "express";
  import { getAllBooks, getBookById, createBook, deleteBook, updateBook,  } from "../application/book";
import { isAdmin } from "./middlewares/authorization-middleware";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { createBookEmbeddings } from './bookEmbedding';
const bookRouter = express.Router();



// Put specific routes before parameterized routes
bookRouter.get("/", (req, res, next) => {
  getAllBooks(req, res, next).catch(next);
});
bookRouter.post("/", (req, res, next) => {
  createBook(req, res, next).catch(next);
});
bookRouter.post("/bookembeddings/create", (req, res, next) => {
  createBookEmbeddings(req, res, next).catch(next);
});

bookRouter.get("/:id", (req, res, next) => {
  getBookById(req, res, next).catch(next);
});
bookRouter.put("/:id", (req, res, next) => {
  updateBook(req, res, next).catch(next);
});
bookRouter.delete("/:id", (req, res, next) => {
  deleteBook(req, res, next).catch(next);
});

export default bookRouter;