"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBookEmbeddings = exports.SentenceTransformerEmbeddings = void 0;
const mongodb_1 = require("@langchain/mongodb");
const documents_1 = require("@langchain/core/documents");
const embeddings_1 = require("@langchain/core/embeddings");
const mongoose_1 = __importDefault(require("mongoose"));
const Book_1 = __importDefault(require("../infrastructure/schemas/Book"));
const child_process_1 = require("child_process");
class SentenceTransformerEmbeddings extends embeddings_1.Embeddings {
    constructor(params) {
        super(params || {});
    }
    async embedDocuments(texts) {
        const batchSize = 1;
        const embeddings = [];
        const failedIndices = [];
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            console.log(`[DEBUG] Processing batch of ${batch.length} texts at index ${i}`);
            batch.forEach((text, idx) => {
                console.log(`[DEBUG] Text ${i + idx}: type=${typeof text}, len=${text.length}, value=${JSON.stringify(text).slice(0, 50)}`);
            });
            try {
                const batchEmbeddings = await new Promise((resolve, reject) => {
                    const pythonProcess = (0, child_process_1.spawn)("scripts/venv/Scripts/python.exe", ["scripts/generate_embeddings.py"], { cwd: process.cwd() });
                    pythonProcess.stdin.write(JSON.stringify(batch));
                    pythonProcess.stdin.end();
                    let output = "";
                    let errorOutput = "";
                    pythonProcess.stdout.on("data", (data) => {
                        output += data.toString();
                    });
                    pythonProcess.stderr.on("data", (data) => {
                        errorOutput += data.toString();
                        console.error(`Python error: ${data.toString()}`);
                    });
                    pythonProcess.on("close", (code) => {
                        if (code === 0) {
                            try {
                                const batchEmbeddings = JSON.parse(output);
                                if (!Array.isArray(batchEmbeddings)) {
                                    reject(new Error("Invalid embeddings format"));
                                }
                                resolve(batchEmbeddings);
                            }
                            catch (e) {
                                const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
                                reject(new Error(`Failed to parse embeddings: ${errorMessage}`));
                            }
                        }
                        else {
                            reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
                        }
                    });
                    pythonProcess.on("error", (err) => {
                        reject(new Error(`Failed to spawn Python process: ${err.message}`));
                    });
                });
                embeddings.push(...batchEmbeddings);
            }
            catch (error) {
                console.error(`[ERROR] Failed to process batch at index ${i}: ${error}`);
                failedIndices.push(i);
            }
        }
        console.log(`[DEBUG] Completed embedding. Successful: ${embeddings.length}, Failed: ${failedIndices.length}`);
        if (failedIndices.length > 0) {
            console.log(`[DEBUG] Failed indices: ${failedIndices.join(', ')}`);
        }
        return embeddings;
    }
    async embedQuery(text) {
        const embeddings = await this.embedDocuments([text]);
        return embeddings[0];
    }
}
exports.SentenceTransformerEmbeddings = SentenceTransformerEmbeddings;
const createBookEmbeddings = async (req, res, next) => {
    console.log("[DEBUG] /api/book/embeddings/create endpoint hit");
    try {
        console.log("[DEBUG] Step 1: Initializing custom embeddings");
        const embeddingModel = new SentenceTransformerEmbeddings();
        console.log("[DEBUG] Step 2: Custom embeddings initialized");
        console.log("[DEBUG] Step 3: Initializing MongoDB Atlas Vector Search");
        const bookVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("booksVectors"),
            indexName: "vector_index",
        });
        console.log("[DEBUG] Step 4: MongoDB Atlas Vector Search initialized");
        console.log("[DEBUG] Fetching books from database");
        const books = await Book_1.default.find({});
        console.log(`[DEBUG] Found ${books.length} books in database`);
        if (!books.length) {
            console.log("[DEBUG] No Books found to embed");
            res.status(200).json({ message: "No Books found to embed" });
            return;
        }
        const bookDocs = [];
        const skippedBooks = [];
        books.forEach((book) => {
            const { _id, title, pageNumber, content, chapter } = book;
            const safeContent = typeof content === "string" ? content : "";
            const safeTitle = typeof title === "string" ? title : "";
            const safePageNumber = typeof pageNumber === "string" ? pageNumber : "";
            const safeChapter = typeof chapter === "string" ? chapter : "";
            const pageContent = `${safeContent} Title: ${safeTitle} Page: ${safePageNumber} Chapter: ${safeChapter}`.trim();
            if (!pageContent) {
                console.log(`[DEBUG] Skipping book ID ${_id}: Empty content after validation`);
                skippedBooks.push(_id.toString());
                return;
            }
            bookDocs.push(new documents_1.Document({
                pageContent,
                metadata: { _id: _id.toString(), title: safeTitle, pageNumber: safePageNumber },
            }));
        });
        console.log(`[DEBUG] Prepared ${bookDocs.length} valid documents, skipped ${skippedBooks.length} invalid`);
        if (!bookDocs.length) {
            console.log("[DEBUG] No valid Books to embed after filtering");
            res.status(200).json({
                message: "No valid Books to embed after filtering",
                skippedBooks,
            });
            return;
        }
        console.log("[DEBUG] Checking for existing embeddings");
        const existingBookIdsArray = await mongoose_1.default.connection.collection("booksVectors").distinct("metadata._id");
        const existingBookIds = new Set(existingBookIdsArray);
        console.log(`[DEBUG] Found ${existingBookIds.size} existing book IDs`);
        const newBookDocs = bookDocs.filter((doc) => !existingBookIds.has(doc.metadata._id));
        console.log(`[DEBUG] Found ${newBookDocs.length} new books to embed`);
        if (newBookDocs.length === 0) {
            console.log("[DEBUG] All Books already embedded");
            res.status(200).json({
                message: "All Books already embedded",
                skippedBooks,
            });
            return;
        }
        console.log("[DEBUG] Generating embeddings for new books");
        const texts = newBookDocs.map((doc) => doc.pageContent);
        console.log("[DEBUG] Texts to embed:", JSON.stringify(texts, null, 2));
        const embeddings = await embeddingModel.embedDocuments(texts);
        console.log(`[DEBUG] Generated ${embeddings.length} embeddings`);
        console.log("[DEBUG] Adding vectors to vector index");
        await bookVectorIndex.addVectors(embeddings, newBookDocs);
        console.log("[DEBUG] Vectors added to vector index successfully");
        res.status(200).json({
            message: `Embeddings created for ${newBookDocs.length} new Books`,
            embeddedCount: newBookDocs.length,
            skippedBooks,
        });
    }
    catch (error) {
        console.error("Error creating embeddings:", error);
        next(error);
    }
};
exports.createBookEmbeddings = createBookEmbeddings;
//# sourceMappingURL=bookEmbedding.js.map