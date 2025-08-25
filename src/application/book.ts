import { NextFunction, Request, Response } from "express";
import Book from "../infrastructure/schemas/Book";
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateBookDTO } from "../domain/dto/BookDTO";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import mongoose from "mongoose";

// Define an interface for the Book document
interface BookDocument extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  pageNumber: string;
  content: string;
  chapter: string;
}

class SentenceTransformerEmbeddings extends Embeddings {
  constructor(params?: ConstructorParameters<typeof Embeddings>[0]) {
    super(params ?? {});
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    throw new Error("Embedding generation should be handled by a separate service.");
  }

  async embedQuery(text: string): Promise<number[]> {
    throw new Error("Embedding generation should be handled by a separate service.");
  }
}

export const getAllBooks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
    return;
  } catch (error) {
    next(error);
  }
};

export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);
    if (!book) {
      throw new NotFoundError("Book not found");
    }
    res.status(200).json(book);
    return;
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = CreateBookDTO.safeParse(req.body);
    if (!book.success) {
      throw new ValidationError(book.error.message);
    }

    const { title, pageNumber, content, chapter } = book.data;

    // Check if book page already exists
    const existingBook = await Book.findOne({ title, pageNumber });
    if (existingBook) {
      res.status(200).json({ message: `Book page ${pageNumber} already exists`, book: existingBook });
      return;
    }

    await Book.create({
      title,
      pageNumber,
      content,
      chapter: chapter || "Web Designing Using Multimedia",
    });

    res.status(201).json({ message: `Book page ${pageNumber} created successfully` });
    return;
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: "Duplicate entry detected, skipping", error: error.message });
    } else {
      next(error);
    }
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId: string = req.params.id;
    await Book.findByIdAndDelete(bookId);
    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId: string = req.params.id;
    const updatedBook = req.body;

    if (!updatedBook.title || !updatedBook.pageNumber || !updatedBook.content) {
      throw new ValidationError("Invalid Book data");
    }

    await Book.findByIdAndUpdate(bookId, updatedBook);
    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};

