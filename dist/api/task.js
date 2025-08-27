"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Task_1 = __importDefault(require("../infrastructure/schemas/Task"));
const Questions_1 = __importDefault(require("../infrastructure/schemas/Questions"));
const Book_1 = __importDefault(require("../infrastructure/schemas/Book"));
const mongodb_1 = require("@langchain/mongodb");
const bookEmbedding_1 = require("./bookEmbedding"); // Import from local file
const mongoose_1 = __importDefault(require("mongoose"));
const taskRouter = express_1.default.Router();
// Generate task based on user query
taskRouter.post("/generate", async (req, res, next) => {
    try {
        const { query, section, maxBooks = 3, maxQuestions = 5 } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User authentication required" });
        }
        if (!query) {
            return res.status(400).json({ error: "query is required" });
        }
        // Initialize embeddings model
        const embeddingModel = new bookEmbedding_1.SentenceTransformerEmbeddings();
        // Search for relevant books
        const bookVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("booksVectors"),
            indexName: "vector_index",
        });
        const bookResults = await bookVectorIndex.similaritySearch(query, maxBooks);
        // Search for relevant MCQs (placeholder - need to implement MCQ vector search)
        const mcqVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("mcqVectors"),
            indexName: "vector_index",
        });
        const mcqResults = await mcqVectorIndex.similaritySearch(query, maxQuestions);
        // Get full document details for books
        const bookDetails = await Promise.all(bookResults.map(async (result) => {
            const book = await Book_1.default.findById(result.metadata._id);
            return {
                _id: result.metadata._id,
                title: book?.title || result.metadata.title,
                pageNumber: book?.pageNumber || result.metadata.pageNumber,
                content: book?.content || result.pageContent,
                chapter: book?.chapter || result.metadata.chapter,
                score: result.score
            };
        }));
        // Get full document details for MCQs
        const mcqDetails = await Promise.all(mcqResults.map(async (result) => {
            const mcq = await Questions_1.default.findById(result.metadata._id);
            return {
                _id: result.metadata._id,
                question: mcq?.question || result.pageContent.split('Options:')[0],
                options: mcq?.options || [],
                correctAnswer: mcq?.correctAnswer || '',
                chapter: mcq?.chapter || result.metadata.chapter,
                year: mcq?.year || result.metadata.year,
                questionNumber: mcq?.questionNumber || result.metadata.questionNumber,
                score: result.score
            };
        }));
        // Prepare search results
        const searchResults = {
            bookResults: bookDetails,
            mcqResults: mcqDetails,
        };
        // Create a new task
        const newTask = new Task_1.default({
            userId,
            title: `Study Task: ${query}`,
            description: `Personalized learning task generated based on your interest in: ${query}`,
            type: 'learning',
            section: section || 'General Web Development',
            content: {
                bookContent: searchResults.bookResults.length > 0 ? {
                    bookId: searchResults.bookResults[0]._id,
                    title: searchResults.bookResults[0].title,
                    pageNumber: searchResults.bookResults[0].pageNumber,
                    content: searchResults.bookResults[0].content,
                    chapter: searchResults.bookResults[0].chapter
                } : undefined,
                questions: searchResults.mcqResults.map(mcq => ({
                    mcqId: mcq._id,
                    question: mcq.question,
                    options: mcq.options,
                    correctAnswer: mcq.correctAnswer,
                    explanation: `This question covers concepts related to ${mcq.chapter}`,
                    completed: false
                }))
            },
            progress: {
                completed: false,
                score: 0,
                totalQuestions: searchResults.mcqResults.length,
                correctAnswers: 0
            }
        });
        await newTask.save();
        res.status(201).json({
            message: "Task created successfully",
            task: newTask,
            searchResults
        });
    }
    catch (error) {
        console.error("Error generating task:", error);
        next(error);
    }
});
// Get all tasks for a user
taskRouter.get("/user/:userId", async (req, res, next) => {
    try {
        const { userId } = req.params;
        const tasks = await Task_1.default.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    }
    catch (error) {
        next(error);
    }
});
// Get specific task
taskRouter.get("/:taskId", async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await Task_1.default.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(200).json({ task });
    }
    catch (error) {
        next(error);
    }
});
// Update task progress
taskRouter.patch("/progress", async (req, res, next) => {
    try {
        const { taskId, userId, questionId, isCorrect, completed } = req.body;
        const task = await Task_1.default.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        if (questionId && isCorrect !== undefined) {
            // Update specific question completion
            const questionIndex = task.content.questions.findIndex(q => q.mcqId.toString() === questionId);
            if (questionIndex !== -1) {
                task.content.questions[questionIndex].completed = true;
                if (isCorrect) {
                    task.progress.correctAnswers += 1;
                }
            }
        }
        if (completed !== undefined) {
            task.progress.completed = completed;
            if (completed) {
                task.progress.completedAt = new Date();
                task.progress.score = task.progress.totalQuestions > 0
                    ? (task.progress.correctAnswers / task.progress.totalQuestions) * 100
                    : 0;
            }
        }
        await task.save();
        res.status(200).json({
            message: "Task progress updated successfully",
            task
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete task
taskRouter.delete("/:taskId", async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const task = await Task_1.default.findByIdAndDelete(taskId);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        res.status(200).json({ message: "Task deleted successfully" });
    }
    catch (error) {
        next(error);
    }
});
exports.default = taskRouter;
//# sourceMappingURL=task.js.map