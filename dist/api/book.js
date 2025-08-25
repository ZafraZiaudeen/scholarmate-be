"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const book_1 = require("../application/book");
const bookEmbedding_1 = require("./bookEmbedding");
const bookRouter = express_1.default.Router();
// Put specific routes before parameterized routes
bookRouter.get("/", book_1.getAllBooks);
bookRouter.post("/", book_1.createBook);
bookRouter.post("/bookembeddings/create", bookEmbedding_1.createBookEmbeddings);
bookRouter.get("/:id", book_1.getBookById);
bookRouter.put("/:id", book_1.updateBook);
bookRouter.delete("/:id", book_1.deleteBook);
exports.default = bookRouter;
//# sourceMappingURL=book.js.map