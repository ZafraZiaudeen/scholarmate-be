import { Request, Response, NextFunction } from 'express';
import Task from '../infrastructure/schemas/Task';
import MCQ from '../infrastructure/schemas/Questions';
import Book from '../infrastructure/schemas/Book';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { SentenceTransformerEmbeddings } from '../api/bookEmbedding';
import mongoose from 'mongoose';
import { callOpenRouter } from '../utils/openRouter';

// Generate task based on user query
export const generateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, section, maxBooks = 3, maxQuestions = 5 } = req.body;
    // For testing purposes, use a default user ID if authentication is not available
    const userId = req.user?.id || "test-user-123";

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    // Initialize embeddings model
    const embeddingModel = new SentenceTransformerEmbeddings();

    // Search for relevant books
    const bookVectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
      collection: mongoose.connection.collection("booksVectors"),
      indexName: "vector_index",
    });

    const bookResults = await bookVectorIndex.similaritySearch(query, maxBooks);

    // Search for relevant MCQs
    const mcqVectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
      collection: mongoose.connection.collection("mcqVectors"),
      indexName: "vector_index",
    });

    const mcqResults = await mcqVectorIndex.similaritySearch(query, maxQuestions);

    // Get full document details for books
    const bookDetails = await Promise.all(
      bookResults.map(async (result) => {
        const book = await Book.findById(result.metadata._id);
        return {
          _id: result.metadata._id,
          title: book?.title || result.metadata.title,
          pageNumber: book?.pageNumber || result.metadata.pageNumber,
          content: book?.content || result.pageContent,
          chapter: book?.chapter || result.metadata.chapter
        };
      })
    );

    // Get full document details for MCQs
    const mcqDetails = await Promise.all(
      mcqResults.map(async (result) => {
        const mcq = await MCQ.findById(result.metadata._id);
        return {
          _id: result.metadata._id,
          question: mcq?.question || result.pageContent.split('Options:')[0],
          options: mcq?.options || [],
          correctAnswer: mcq?.correctAnswer || '',
          chapter: mcq?.chapter || result.metadata.chapter,
          year: mcq?.year || result.metadata.year,
          questionNumber: mcq?.questionNumber || result.metadata.questionNumber
        };
      })
    );

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
        
        const aiExplanation = await callOpenRouter(prompt, {
          max_tokens: 2000,
          temperature: 0.7,
          model: "deepseek/deepseek-r1:free"
        });
        
        if (aiExplanation && aiExplanation.trim()) {
          console.log("DEBUG: Successfully generated AI explanation for book content");
          bookContentToUse = aiExplanation;
          isAIExplanation = true;
        } else {
          console.log("DEBUG: No AI explanation generated, providing reference");
          bookContentToUse = `For detailed information about this topic, please refer to page ${bookDetails[0].pageNumber} in your textbook, Chapter: ${bookDetails[0].chapter}.`;
        }
      } catch (error) {
        console.error('DEBUG: Error generating book explanation with OpenRouter:', error);
        if (error instanceof Error) {
          console.error('DEBUG: Error details:', error.message, error.stack);
        }
        // Fallback to reference if AI explanation fails
        bookContentToUse = `For detailed information about this topic, please refer to page ${bookDetails[0].pageNumber} in your textbook, Chapter: ${bookDetails[0].chapter}.`;
      }
    }

    // Create a new task
    const newTask = new Task({
      userId,
      title: `Study Task: ${query}`,
      description: `Personalized learning task generated based on your interest in: ${query}`,
      type: 'learning',
      section: section || 'General Web Development',
      content: {
        bookContent: bookDetails.length > 0 ? {
          bookId: bookDetails[0]._id,
          title: bookDetails[0].title,
          pageNumber: bookDetails[0].pageNumber,
          content: bookContentToUse,
          chapter: bookDetails[0].chapter,
          reference: `For additional details, refer to page ${bookDetails[0].pageNumber} in Chapter: ${bookDetails[0].chapter}`,
          isAIExplanation: isAIExplanation
        } : undefined,
        questions: await Promise.all(mcqDetails.map(async (mcq) => {
          // Generate better explanation using Gemini API if available
          let explanation = `This question tests your understanding of ${mcq.chapter}. The correct answer is "${mcq.correctAnswer}" because it best addresses the concept being tested. Review the related content to understand why this is the correct choice.`;
          
          if (process.env.OPENROUTER_API_KEY) {
            try {
              const prompt = `As an expert ICT tutor, help a student understand this concept through this question:

Question: "${mcq.question}"
Options: ${mcq.options.map((opt, idx) => `${idx + 1}. ${opt}`).join('\n')}
Correct Answer: ${mcq.correctAnswer}

Create a detailed explanation that:
1. Explains why "${mcq.correctAnswer}" is the correct answer using clear, simple language
2. Points out why each incorrect option is wrong, helping prevent common misconceptions
3. Provides a real-world example showing where and how this concept is applied
4. If relevant to the topic, includes a practical demonstration
5. Gives a memorable tip or trick to help remember this specific concept
6. Connects this topic to its importance in ${mcq.chapter}

Remember, you're helping a student who's asking about ${query} - make your explanation engaging and crystal clear.`;
              
              console.log("DEBUG: Sending request to OpenRouter API for MCQ explanation");
              
              const aiResponse = await callOpenRouter(prompt, {
                max_tokens: 1500,
                temperature: 0.7,
                model: "deepseek/deepseek-r1:free"
              });
              
              if (aiResponse && aiResponse.trim()) {
                explanation = aiResponse;
                console.log("DEBUG: Successfully generated AI explanation for MCQ");
              }
            } catch (error) {
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
      },
      progress: {
        completed: false,
        score: 0,
        totalQuestions: mcqDetails.length,
        correctAnswers: 0
      }
    });

    await newTask.save();

    res.status(201).json({
      message: "Task created successfully",
      task: newTask,
      searchResults: {
        bookResults: bookDetails,
        mcqResults: mcqDetails
      }
    });
  } catch (error) {
    console.error("Error generating task:", error);
    next(error);
  }
};

// Get all tasks for a user
export const getUserTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
};

// Get specific task
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ task });
  } catch (error) {
    next(error);
  }
};

// Update task progress
export const updateTaskProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, questionId, isCorrect, completed } = req.body;
    // For testing purposes, use a default user ID if authentication is not available
    const userId = req.user?.id || "test-user-123";

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Use type assertion to handle Mongoose document arrays
    const taskDoc = task as any;

    if (questionId && isCorrect !== undefined) {
      // Update specific question completion
      const questions = taskDoc.content?.questions || [];
      const questionIndex = questions.findIndex((q: any) => q.mcqId?.toString() === questionId);
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
  } catch (error) {
    next(error);
  }
};

// Delete task
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findByIdAndDelete(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
