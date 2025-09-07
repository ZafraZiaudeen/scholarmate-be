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
    res.status(200).json({
      success: true,
      data: books,
      count: books.length
    });
    return;
  } catch (error: any) {
    console.error('Error fetching books:', error);
    next(error);
  }
};

export const getBookById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId = req.params.id;
    
    // Validate ObjectId format
    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ValidationError("Invalid book ID format");
    }
    
    const book = await Book.findById(bookId);
    if (!book) {
      throw new NotFoundError("Book not found");
    }
    
    res.status(200).json({
      success: true,
      data: book
    });
    return;
  } catch (error: any) {
    console.error('Error fetching book by ID:', error);
    next(error);
  }
};

export const createBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const book = CreateBookDTO.safeParse(req.body);
    if (!book.success) {
      throw new ValidationError("Invalid book data", book.error.errors);
    }

    const { title, pageNumber, content, chapter } = book.data;

    // Validate required fields
    if (!title || !pageNumber || !content) {
      throw new ValidationError("Title, page number, and content are required");
    }

    // Check if book page already exists
    const existingBook = await Book.findOne({ title, pageNumber });
    if (existingBook) {
      res.status(200).json({ 
        success: true,
        message: `Book page ${pageNumber} already exists`, 
        data: existingBook 
      });
      return;
    }

    const newBook = await Book.create({
      title,
      pageNumber,
      content,
      chapter: chapter || "Web Designing Using Multimedia",
    });

    res.status(201).json({ 
      success: true,
      message: `Book page ${pageNumber} created successfully`,
      data: newBook
    });
    return;
  } catch (error: any) {
    console.error('Error creating book:', error);
    next(error);
  }
};

export const deleteBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId: string = req.params.id;
    
    // Validate ObjectId format
    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ValidationError("Invalid book ID format");
    }
    
    const deletedBook = await Book.findByIdAndDelete(bookId);
    if (!deletedBook) {
      throw new NotFoundError("Book not found");
    }
    
    res.status(200).json({
      success: true,
      message: "Book deleted successfully"
    });
    return;
  } catch (error: any) {
    console.error('Error deleting book:', error);
    next(error);
  }
};

export const updateBook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookId: string = req.params.id;
    const updatedBook = req.body;

    // Validate ObjectId format
    if (!bookId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ValidationError("Invalid book ID format");
    }

    // Validate required fields
    if (!updatedBook.title || !updatedBook.pageNumber || !updatedBook.content) {
      throw new ValidationError("Title, page number, and content are required");
    }

    const book = await Book.findByIdAndUpdate(bookId, updatedBook, { new: true });
    if (!book) {
      throw new NotFoundError("Book not found");
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book
    });
    return;
  } catch (error: any) {
    console.error('Error updating book:', error);
    next(error);
  }
};

