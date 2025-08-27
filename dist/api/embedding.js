"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTextWithGroq = exports.createEmbeddings = void 0;
const mongodb_1 = require("@langchain/mongodb");
const documents_1 = require("@langchain/core/documents");
const embeddings_1 = require("@langchain/core/embeddings");
const mongoose_1 = __importDefault(require("mongoose"));
const Questions_1 = __importDefault(require("../infrastructure/schemas/Questions"));
const child_process_1 = require("child_process");
// Custom Embeddings class for sentence-transformers
class SentenceTransformerEmbeddings extends embeddings_1.Embeddings {
    constructor(params) {
        super(params);
    }
    async embedDocuments(texts) {
        return new Promise((resolve, reject) => {
            // Use the virtual environment's Python executable
            const pythonProcess = (0, child_process_1.spawn)("scripts/venv/Scripts/python.exe", ["scripts/generate_embeddings.py", JSON.stringify(texts)], { cwd: process.cwd() });
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
                        const embeddings = JSON.parse(output);
                        if (!Array.isArray(embeddings)) {
                            reject(new Error("Invalid embeddings format"));
                        }
                        resolve(embeddings);
                    }
                    catch (e) {
                        reject(new Error(`Failed to parse embeddings: ${e.message}`));
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
    }
    async embedQuery(text) {
        const embeddings = await this.embedDocuments([text]);
        return embeddings[0];
    }
}
const createEmbeddings = async (req, res, next) => {
    console.log("[DEBUG] /api/mcq/embeddings/create endpoint hit");
    try {
        // Initialize custom embeddings
        const embeddingModel = new SentenceTransformerEmbeddings();
        // Initialize MongoDB Atlas Vector Search
        const vectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("mcqVectors"),
            indexName: "vector_index",
        });
        // Fetch all MCQs from the database
        const mcqs = await Questions_1.default.find({});
        if (!mcqs.length) {
            res.status(200).json({ message: "No MCQs found to embed" });
            return;
        }
        // Prepare documents for embedding
        const docs = mcqs.map((mcq) => {
            const { _id, year, questionNumber, question, options, correctAnswer, chapter } = mcq;
            const optionsText = options.join(" ");
            const pageContent = `${question} Options: ${optionsText} Correct Answer: ${correctAnswer} Year: ${year} Chapter: ${chapter}`;
            return new documents_1.Document({
                pageContent,
                metadata: { _id: _id.toString(), year, questionNumber },
            });
        });
        // Check for existing embeddings
        const existingIds = new Set((await mongoose_1.default.connection.collection("mcqVectors").distinct("_id")).map(id => id.toString()));
        const newDocs = docs.filter(doc => !existingIds.has(doc.metadata._id));
        if (newDocs.length === 0) {
            res.status(200).json({ message: "All MCQs already embedded" });
            return;
        }
        // Generate embeddings and add to vector index
        const embeddings = await embeddingModel.embedDocuments(newDocs.map(doc => doc.pageContent));
        const documentsWithEmbeddings = newDocs.map((doc, index) => ({
            ...doc,
            pageContent: doc.pageContent,
            metadata: { ...doc.metadata, embedding: embeddings[index] },
        }));
        await vectorIndex.addDocuments(documentsWithEmbeddings);
        res.status(200).json({
            message: `Embeddings created for ${newDocs.length} new MCQs`,
            embeddedCount: newDocs.length,
        });
    }
    catch (error) {
        console.error("Error creating embeddings:", error);
        next(error);
    }
};
exports.createEmbeddings = createEmbeddings;
// Export Groq text generation function (for use in router)
const generateTextWithGroq = async (req, res, next) => {
    try {
        const { prompt } = req.body;
        if (!prompt)
            throw new Error("Prompt is required");
        const response = await fetch("https://api.groq.com/openai/v1/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                prompt,
                max_tokens: 100,
            }),
        });
        if (!response.ok)
            throw new Error("Groq API request failed");
        const data = await response.json(); // Type assertion
        res.status(200).json({ text: data.choices[0].text });
    }
    catch (error) {
        next(error);
    }
};
exports.generateTextWithGroq = generateTextWithGroq;
//# sourceMappingURL=embedding.js.map