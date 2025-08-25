import { createEmbeddings } from './embedding';
import express from "express";
  import { getAllBooks, getBookById, createBook, deleteBook, updateBook,  } from "../application/book";
import { isAdmin } from "./middlewares/authorization-middleware";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { createBookEmbeddings } from './bookEmbedding';
const bookRouter = express.Router();



// Put specific routes before parameterized routes
bookRouter.get("/", getAllBooks);
bookRouter.post("/", createBook);
bookRouter.post("/bookembeddings/create", createBookEmbeddings);

bookRouter.get("/:id", getBookById);
bookRouter.put("/:id", updateBook);
bookRouter.delete("/:id", deleteBook);

export default bookRouter;