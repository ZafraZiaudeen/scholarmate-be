"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookEmbeddings = void 0;
const mongodb_1 = require("@langchain/mongodb");
const documents_1 = require("@langchain/core/documents");
const embeddings_1 = require("@langchain/core/embeddings");
const mongoose_1 = __importDefault(require("mongoose"));
const Book_1 = __importDefault(require("../infrastructure/schemas/Book"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Custom Embeddings class for sentence-transformers
class SentenceTransformerEmbeddings extends embeddings_1.Embeddings {
    constructor(params) {
        super(params || {});
    }
    async embedDocuments(texts) {
        const batchSize = 100; // Adjust based on your needs
        const embeddings = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const pythonExePath = path.join(__dirname, "../../scripts/venv/Scripts/python.exe");
            const pythonScriptPath = path.join(__dirname, "../../scripts/generate_embeddings.py");
            if (!fs.existsSync(pythonExePath)) {
                throw new Error(`Python executable not found at: ${pythonExePath}`);
            }
            if (!fs.existsSync(pythonScriptPath)) {
                throw new Error(`Python script not found at: ${pythonScriptPath}`);
            }
            const pythonProcess = (0, child_process_1.spawn)(pythonExePath, [pythonScriptPath, JSON.stringify(batch)]);
            let output = "";
            await new Promise((resolve, reject) => {
                pythonProcess.stdout.on("data", (data) => {
                    output += data.toString();
                });
                pythonProcess.stderr.on("data", (data) => {
                    console.error(`Python error: ${data}`);
                });
                pythonProcess.on("close", (code) => {
                    if (code === 0) {
                        try {
                            const batchEmbeddings = JSON.parse(output);
                            embeddings.push(...batchEmbeddings);
                            resolve();
                        }
                        catch (e) {
                            reject(new Error("Failed to parse embeddings"));
                        }
                    }
                    else {
                        reject(new Error(`Python script failed with code ${code}`));
                    }
                });
            });
        }
        return embeddings;
    }
    async embedQuery(text) {
        const embeddings = await this.embedDocuments([text]);
        return embeddings[0];
    }
}
const createBookEmbeddings = async (req, res, next) => {
    console.log("[DEBUG] /api/book/embeddings/create endpoint hit");
    try {
        // Initialize custom embeddings
        const embeddingModel = new SentenceTransformerEmbeddings();
        // Initialize MongoDB Atlas Vector Search for Books
        const bookVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("booksVectors"),
            indexName: "vector_index",
        });
        // Fetch all Books from the database
        const books = await Book_1.default.find({});
        if (!books.length) {
            res.status(200).json({ message: "No Books found to embed" });
            return;
        }
        // Prepare Book documents for embedding
        const bookDocs = books.map((book) => {
            const { _id, title, pageNumber, content, chapter } = book;
            const pageContent = `${content} Title: ${title} Page: ${pageNumber} Chapter: ${chapter}`;
            return new documents_1.Document({
                pageContent,
                metadata: { _id: _id.toString(), title, pageNumber },
            });
        });
        // Check for existing embeddings
        const existingBookIds = new Set((await mongoose_1.default.connection.collection("booksVectors").distinct("_id")).map((id) => id.toString()));
        const newBookDocs = bookDocs.filter((doc) => !existingBookIds.has(doc.metadata._id));
        if (newBookDocs.length === 0) {
            res.status(200).json({ message: "All Books already embedded" });
            return;
        }
        // Generate embeddings and add to vector index
        const embeddings = await embeddingModel.embedDocuments(newBookDocs.map((doc) => doc.pageContent));
        const documentsWithEmbeddings = newBookDocs.map((doc, index) => ({
            ...doc,
            pageContent: doc.pageContent,
            metadata: { ...doc.metadata, embedding: embeddings[index] },
        }));
        await bookVectorIndex.addDocuments(documentsWithEmbeddings);
        res.status(200).json({
            message: `Embeddings created for ${newBookDocs.length} new Books`,
            embeddedCount: newBookDocs.length,
        });
    }
    catch (error) {
        console.error("Error creating embeddings:", error);
        next(error);
    }
};
exports.createBookEmbeddings = createBookEmbeddings;
//# sourceMappingURL=bookEmbedding.js.map