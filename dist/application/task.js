"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveChatAsTask = exports.getChatById = exports.getChatHistory = exports.deleteTask = exports.updateTaskProgress = exports.getTaskById = exports.getUserTasks = exports.generateTask = void 0;
const Task_1 = __importDefault(require("../infrastructure/schemas/Task"));
const Questions_1 = __importDefault(require("../infrastructure/schemas/Questions"));
const Book_1 = __importDefault(require("../infrastructure/schemas/Book"));
const Chat_1 = __importDefault(require("../infrastructure/schemas/Chat"));
const mongodb_1 = require("@langchain/mongodb");
const bookEmbedding_1 = require("../api/bookEmbedding");
const mongoose_1 = __importDefault(require("mongoose"));
const openRouter_1 = require("../utils/openRouter");
// Generate task based on user query (but save as Chat initially)
const generateTask = async (req, res, next) => {
    try {
        const { query, section, maxBooks = 3, maxQuestions = 5 } = req.body;
        // Use the authenticated user's ID
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User authentication required" });
        }
        if (!query) {
            return res.status(400).json({ error: "query is required" });
        }
        // Initialize embeddings model
        const embeddingModel = new bookEmbedding_1.SentenceTransformerEmbeddings();
        // Search for relevant books with similarity scores
        const bookVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("booksVectors"),
            indexName: "vector_index",
        });
        // Get book embeddings for the query to use with similaritySearchVectorWithScore
        const queryEmbedding = await embeddingModel.embedQuery(query);
        const bookResultsWithScores = await bookVectorIndex.similaritySearchVectorWithScore(queryEmbedding, maxBooks * 2 // Get more results to filter by threshold
        );
        // Filter books by similarity threshold (0.7 = 70% similarity)
        const MIN_SIMILARITY_THRESHOLD = 0.7;
        const filteredBookResults = bookResultsWithScores
            .filter(([_, score]) => score >= MIN_SIMILARITY_THRESHOLD)
            .slice(0, maxBooks)
            .map(([doc]) => doc);
        // Check if no related content found
        if (filteredBookResults.length === 0) {
            return res.status(404).json({
                error: "This topic is not related to the module. Please try another topic related to ICT Grade 11 curriculum."
            });
        }
        // Search for relevant MCQs with similarity scores
        const mcqVectorIndex = new mongodb_1.MongoDBAtlasVectorSearch(embeddingModel, {
            collection: mongoose_1.default.connection.collection("mcqVectors"),
            indexName: "vector_index",
        });
        const mcqResultsWithScores = await mcqVectorIndex.similaritySearchVectorWithScore(queryEmbedding, maxQuestions * 3 // Get more results to filter by threshold and chapter
        );
        // Filter MCQs by similarity threshold and optionally by chapter context
        const filteredMcqResults = mcqResultsWithScores
            .filter(([doc, score]) => {
            // Minimum similarity threshold
            if (score < MIN_SIMILARITY_THRESHOLD)
                return false;
            // If we have book results, prioritize questions from the same chapter
            if (filteredBookResults.length > 0) {
                const bookChapter = filteredBookResults[0].metadata.chapter;
                const mcqChapter = doc.metadata.chapter;
                return bookChapter === mcqChapter || score >= 0.85; // Higher threshold for different chapters
            }
            return true;
        })
            .slice(0, maxQuestions)
            .map(([doc]) => doc);
        // Get full document details for books with similarity scores
        const bookDetails = await Promise.all(filteredBookResults.map(async (result) => {
            const book = await Book_1.default.findById(result.metadata._id);
            const similarityScore = bookResultsWithScores.find(([doc]) => doc.metadata._id === result.metadata._id)?.[1] || 0;
            return {
                _id: result.metadata._id,
                title: book?.title || result.metadata.title,
                pageNumber: book?.pageNumber || result.metadata.pageNumber,
                content: book?.content || result.pageContent,
                chapter: book?.chapter || result.metadata.chapter,
                similarityScore: Math.round(similarityScore * 100) // Convert to percentage
            };
        }));
        // Get full document details for MCQs with similarity scores
        let mcqDetails = await Promise.all(filteredMcqResults.map(async (result) => {
            const mcq = await Questions_1.default.findById(result.metadata._id);
            const similarityScore = mcqResultsWithScores.find(([doc]) => doc.metadata._id === result.metadata._id)?.[1] || 0;
            return {
                _id: result.metadata._id,
                question: mcq?.question || result.pageContent.split('Options:')[0],
                options: mcq?.options || [],
                correctAnswer: mcq?.correctAnswer || '',
                chapter: mcq?.chapter || result.metadata.chapter,
                year: mcq?.year || result.metadata.year,
                questionNumber: mcq?.questionNumber || result.metadata.questionNumber,
                similarityScore: Math.round(similarityScore * 100) // Convert to percentage
            };
        }));
        // Check if no past paper questions found and generate practice questions
        let practiceQuestions = [];
        let isPracticeQuestions = false;
        if (mcqDetails.length === 0 && process.env.OPENROUTER_API_KEY) {
            try {
                console.log("DEBUG: No past paper questions found, generating practice questions");
                const prompt = `As an expert ICT tutor, create 3-5 practice questions based on the following topic: "${query}"
        
Book Content Reference from Chapter "${bookDetails[0].chapter}", Page ${bookDetails[0].pageNumber}:
${bookDetails[0].content}

Create practice questions that:
1. Test understanding of key concepts from the chapter
2. Include 4 multiple-choice options (A, B, C, D)
3. Provide the correct answer with a brief explanation
4. Are appropriate for Grade 11 ICT students
5. Cover different aspects of the topic

Format your response as a JSON array with each question having:
- question: the question text
- options: array of 4 options
- correctAnswer: the letter of the correct option (A, B, C, or D)
- explanation: brief explanation of why the answer is correct

Example format:
[
  {
    "question": "What is the main purpose of a database?",
    "options": ["To store and organize data", "To create websites", "To play games", "To send emails"],
    "correctAnswer": "A",
    "explanation": "Databases are designed to store, organize, and manage large amounts of data efficiently."
  }
]`;
                const aiResponse = await (0, openRouter_1.callOpenRouter)(prompt, {
                    max_tokens: 2000,
                    temperature: 0.7,
                    model: "deepseek/deepseek-r1:free"
                });
                if (aiResponse && aiResponse.trim()) {
                    try {
                        practiceQuestions = JSON.parse(aiResponse);
                        isPracticeQuestions = true;
                        console.log("DEBUG: Successfully generated practice questions");
                    }
                    catch (parseError) {
                        console.error("DEBUG: Failed to parse AI-generated questions:", parseError);
                        // Fallback to simple practice questions
                        practiceQuestions = [
                            {
                                question: `Practice question about ${query}`,
                                options: ["Option A", "Option B", "Option C", "Option D"],
                                correctAnswer: "A",
                                explanation: "This is a practice question. Review the chapter content to understand the concepts better."
                            }
                        ];
                        isPracticeQuestions = true;
                    }
                }
            }
            catch (error) {
                console.error("DEBUG: Error generating practice questions:", error);
            }
        }
        if (isPracticeQuestions) {
            mcqDetails = practiceQuestions.map(pq => ({
                _id: null,
                question: pq.question,
                options: pq.options,
                correctAnswer: pq.correctAnswer,
                chapter: bookDetails[0]?.chapter || 'Generated',
                year: null,
                questionNumber: null,
                similarityScore: 100,
                explanation: pq.explanation // Pre-generated explanation
            }));
        }
        // Generate AI explanation for book content if available
        let bookContentToUse = "";
        let isAIExplanation = false;
        if (bookDetails.length > 0 && process.env.OPENROUTER_API_KEY) {
            try {
                const prompt = `You are a top-notch ICT tutor helping a student who is struggling with: "${query}". 
Based on the following textbook content from Chapter "${bookDetails[0].chapter}", explain the concepts in a clear, engaging way.

Content reference from Page ${bookDetails[0].pageNumber}:
${bookDetails[0].content}

Create a comprehensive tutorial that:
1. Explains the core concepts in simple terms
2. Provides practical, real-world examples
3. Includes relevant code snippets or technical demonstrations
4. Lists common mistakes to avoid
5. Gives tips for best practices
6. Relates these concepts to modern technology and applications

Focus on making it extremely clear and engaging for a student who is struggling with the topic.`;
                console.log("DEBUG: Sending request to OpenRouter API for book explanation");
                const aiExplanation = await (0, openRouter_1.callOpenRouter)(prompt, {
                    max_tokens: 2000,
                    temperature: 0.7,
                    model: "deepseek/deepseek-r1:free"
                });
                if (aiExplanation && aiExplanation.trim()) {
                    console.log("DEBUG: Successfully generated AI explanation for book content");
                    bookContentToUse = aiExplanation;
                    isAIExplanation = true;
                }
                else {
                    console.log("DEBUG: No AI explanation generated, providing reference");
                    bookContentToUse = `For detailed information about this topic, please refer to page ${bookDetails[0].pageNumber} in your textbook, Chapter: ${bookDetails[0].chapter}.`;
                }
            }
            catch (error) {
                console.error('DEBUG: Error generating book explanation with OpenRouter:', error);
                if (error instanceof Error) {
                    console.error('DEBUG: Error details:', error.message, error.stack);
                }
                // Fallback to reference if AI explanation fails
                bookContentToUse = `For detailed information about this topic, please refer to page ${bookDetails[0].pageNumber} in your textbook, Chapter: ${bookDetails[0].chapter}.`;
            }
        }
        // Create a new chat with task content
        const newChat = new Chat_1.default({
            userId,
            query,
            response: `Personalized learning content generated based on your interest in: ${query}`,
            contentExplanation: bookContentToUse,
            answerExplanation: '', // Can be used if needed, but structured content is in content field
            savedAsTask: false,
            taskId: null,
            isTask: true,
            content: {
                bookContent: bookDetails.length > 0 ? {
                    bookId: bookDetails[0]._id,
                    title: bookDetails[0].title,
                    pageNumber: bookDetails[0].pageNumber,
                    content: bookContentToUse,
                    chapter: bookDetails[0].chapter,
                    // Note: reference and isAIExplanation are not in schema, but can be added to content if needed
                } : undefined,
                questions: await Promise.all(mcqDetails.map(async (mcq) => {
                    // Generate explanation for each MCQ if not already present (e.g., for practice questions)
                    let explanation = mcq.explanation || `This question tests your understanding of ${mcq.chapter}. The correct answer is "${mcq.correctAnswer}" because it best addresses the concept being tested. Review the related content to understand why this is the correct choice.`;
                    if (!mcq.explanation && process.env.OPENROUTER_API_KEY) {
                        try {
                            const prompt = `As an expert ICT tutor, explain this question from Chapter "${mcq.chapter}":

Question: "${mcq.question}"
Options: ${mcq.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}
Correct Answer: ${mcq.correctAnswer}
Question Number: ${mcq.questionNumber}
Year: ${mcq.year}

Create a detailed explanation that:
1. Explains why "${mcq.correctAnswer}" is the correct answer using clear, simple language
2. Points out why each incorrect option is wrong, helping prevent common misconceptions
3. Provides a real-world example showing where and how this concept is applied
4. If relevant to the topic, includes a practical demonstration
5. Gives a memorable tip or trick to help remember this specific concept
6. Connects this topic to its importance in ${mcq.chapter}

Make your explanation engaging and crystal clear. Focus on helping the student who asked about: ${query}`;
                            console.log(`DEBUG: Generating explanation for Question ${mcq.questionNumber} (${mcq.year})`);
                            // Add delay between requests to avoid rate limiting
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            const aiResponse = await (0, openRouter_1.callOpenRouter)(prompt, {
                                max_tokens: 1500,
                                temperature: 0.7,
                                model: "deepseek/deepseek-r1:free"
                            });
                            if (aiResponse && aiResponse.trim()) {
                                explanation = aiResponse;
                                console.log(`DEBUG: Successfully generated explanation for Question ${mcq.questionNumber}`);
                            }
                            else {
                                console.log(`DEBUG: No explanation generated for Question ${mcq.questionNumber}, using fallback`);
                                explanation = `For Question ${mcq.questionNumber} (${mcq.year}): The correct answer is "${mcq.correctAnswer}". This question from Chapter "${mcq.chapter}" tests your understanding of key concepts. Review the chapter content and provided examples to better understand this topic.`;
                            }
                        }
                        catch (error) {
                            console.error('DEBUG: Error generating explanation with OpenRouter:', error);
                            if (error instanceof Error) {
                                console.error('DEBUG: Error details:', error.message, error.stack);
                            }
                        }
                    }
                    return {
                        mcqId: mcq._id,
                        question: mcq.question,
                        options: mcq.options,
                        correctAnswer: mcq.correctAnswer,
                        explanation: explanation,
                        completed: false
                    };
                }))
            }
        });
        await newChat.save();
        res.status(201).json({
            message: "Task content generated and saved to chat successfully",
            task: newChat, // Returning chat as 'task' for compatibility
            searchResults: {
                bookResults: bookDetails,
                mcqResults: mcqDetails
            }
        });
    }
    catch (error) {
        console.error("Error generating task:", error);
        next(error);
    }
};
exports.generateTask = generateTask;
// Get all tasks for a user
const getUserTasks = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const tasks = await Task_1.default.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserTasks = getUserTasks;
// Get specific task
const getTaskById = async (req, res, next) => {
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
};
exports.getTaskById = getTaskById;
// Update task progress
const updateTaskProgress = async (req, res, next) => {
    try {
        const { taskId, questionId, isCorrect, completed } = req.body;
        // Use the authenticated user's ID
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: "User authentication required" });
        }
        const task = await Task_1.default.findOne({ _id: taskId, userId });
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }
        // Use type assertion to handle Mongoose document arrays
        const taskDoc = task;
        if (questionId && isCorrect !== undefined) {
            // Update specific question completion
            const questions = taskDoc.content?.questions || [];
            const questionIndex = questions.findIndex((q) => q.mcqId?.toString() === questionId);
            if (questionIndex !== -1) {
                questions[questionIndex].completed = true;
                if (isCorrect) {
                    taskDoc.progress.correctAnswers += 1;
                }
            }
        }
        if (completed !== undefined) {
            taskDoc.progress.completed = completed;
            if (completed) {
                taskDoc.progress.completedAt = new Date();
                taskDoc.progress.score = taskDoc.progress.totalQuestions > 0
                    ? (taskDoc.progress.correctAnswers / taskDoc.progress.totalQuestions) * 100
                    : 0;
            }
        }
        await taskDoc.save();
        res.status(200).json({
            message: "Task progress updated successfully",
            task: taskDoc
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateTaskProgress = updateTaskProgress;
// Delete task
const deleteTask = async (req, res, next) => {
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
};
exports.deleteTask = deleteTask;
// Get chat history for a specific user
const getChatHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const chats = await Chat_1.default.find({ userId })
            .sort({ timestamp: -1 })
            .limit(50); // Limit to last 50 chats
        res.status(200).json({
            success: true,
            data: chats
        });
    }
    catch (error) {
        console.error('Error fetching chat history:', error);
        next(error);
    }
};
exports.getChatHistory = getChatHistory;
// Get specific chat message by ID
const getChatById = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        if (!chatId) {
            return res.status(400).json({ error: "Chat ID is required" });
        }
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat message not found" });
        }
        res.status(200).json({
            success: true,
            data: chat
        });
    }
    catch (error) {
        console.error('Error fetching chat message:', error);
        next(error);
    }
};
exports.getChatById = getChatById;
// Save chat as task
const saveChatAsTask = async (req, res, next) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id; // Get user ID from authenticated user
        if (!userId) {
            return res.status(401).json({ error: "User authentication required" });
        }
        // Find the chat
        const chat = await Chat_1.default.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        if (chat.savedAsTask) {
            return res.status(400).json({ error: "Chat already saved as task" });
        }
        // Create a new task from the chat content
        const task = new Task_1.default({
            userId,
            title: `Study Task: ${chat.query}`,
            description: `Task created from chat conversation about: ${chat.query}`,
            type: 'learning',
            section: 'AI Generated',
            content: chat.isTask && chat.content ? chat.content : {
                questions: [{
                        question: chat.query,
                        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                        correctAnswer: 'Option 1',
                        explanation: chat.response || "This task was created from your chat conversation. Review the content to understand the concepts better.",
                        completed: false
                    }]
            },
            progress: {
                completed: false,
                score: 0,
                totalQuestions: chat.isTask && chat.content ? (chat.content.questions?.length || 0) : 1,
                correctAnswers: 0
            }
        });
        await task.save();
        // Update chat to mark it as saved
        chat.savedAsTask = true;
        chat.taskId = task._id;
        await chat.save();
        res.status(201).json({
            success: true,
            message: "Chat successfully saved as task",
            data: task
        });
    }
    catch (error) {
        console.error('Error saving chat as task:', error);
        next(error);
    }
};
exports.saveChatAsTask = saveChatAsTask;
//# sourceMappingURL=task.js.map