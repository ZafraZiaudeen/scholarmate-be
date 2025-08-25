"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBook = exports.deleteBook = exports.createBook = exports.getBookById = exports.getAllBooks = void 0;
const Book_1 = __importDefault(require("../infrastructure/schemas/Book"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const BookDTO_1 = require("../domain/dto/BookDTO");
const embeddings_1 = require("@langchain/core/embeddings");
class SentenceTransformerEmbeddings extends embeddings_1.Embeddings {
    constructor(params) {
        super(params ?? {});
    }
    async embedDocuments(texts) {
        throw new Error("Embedding generation should be handled by a separate service.");
    }
    async embedQuery(text) {
        throw new Error("Embedding generation should be handled by a separate service.");
    }
}
const getAllBooks = async (req, res, next) => {
    try {
        const books = await Book_1.default.find();
        res.status(200).json(books);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getAllBooks = getAllBooks;
const getBookById = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const book = await Book_1.default.findById(bookId);
        if (!book) {
            throw new not_found_error_1.default("Book not found");
        }
        res.status(200).json(book);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getBookById = getBookById;
const createBook = async (req, res, next) => {
    try {
        const book = BookDTO_1.CreateBookDTO.safeParse(req.body);
        if (!book.success) {
            throw new validation_error_1.default(book.error.message);
        }
        const { title, pageNumber, content, chapter } = book.data;
        // Check if book page already exists
        const existingBook = await Book_1.default.findOne({ title, pageNumber });
        if (existingBook) {
            res.status(200).json({ message: `Book page ${pageNumber} already exists`, book: existingBook });
            return;
        }
        await Book_1.default.create({
            title,
            pageNumber,
            content,
            chapter: chapter || "Web Designing Using Multimedia",
        });
        res.status(201).json({ message: `Book page ${pageNumber} created successfully` });
        return;
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(409).json({ message: "Duplicate entry detected, skipping", error: error.message });
        }
        else {
            next(error);
        }
    }
};
exports.createBook = createBook;
const deleteBook = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        await Book_1.default.findByIdAndDelete(bookId);
        res.status(200).send();
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.deleteBook = deleteBook;
const updateBook = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        const updatedBook = req.body;
        if (!updatedBook.title || !updatedBook.pageNumber || !updatedBook.content) {
            throw new validation_error_1.default("Invalid Book data");
        }
        await Book_1.default.findByIdAndUpdate(bookId, updatedBook);
        res.status(200).send();
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.updateBook = updateBook;
//# sourceMappingURL=book.js.map