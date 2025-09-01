import { Request, Response, NextFunction } from 'express';
import Task from '../infrastructure/schemas/Task';
import MCQ from '../infrastructure/schemas/Questions';
import Book from '../infrastructure/schemas/Book';
import Chat from '../infrastructure/schemas/Chat';
import { UserStats } from '../infrastructure/schemas/Achievement';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { SentenceTransformerEmbeddings } from '../api/bookEmbedding';
import mongoose from 'mongoose';
import { callOpenRouter } from '../utils/openRouter';
import { Document } from '@langchain/core/documents';
import { checkAndUnlockAchievementsInternal } from './gamification';

const updateUserStatsAndAchievements = async (userId: string, taskCompleted: boolean, accuracy?: number, studyTime?: number, perfectScore?: boolean) => {
  try {
    // Get or create user stats
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      userStats = new UserStats({
        userId,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        tasksCompleted: 0,
        averageAccuracy: 0,
        totalStudyTime: 0,
        videosWatched: 0,
        perfectScores: 0,
        lastActivityDate: new Date(),
        weeklyGoal: {
          target: 5,
          current: 0,
          weekStart: new Date()
        },
        monthlyGoal: {
          target: 20,
          current: 0,
          monthStart: new Date()
        },
        badges: [],
        level: 1,
        experiencePoints: 0
      });
    }

    const today = new Date();
    const lastActivity = new Date(userStats.lastActivityDate);
    
    // Update streak
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      userStats.currentStreak += 1;
      userStats.longestStreak = Math.max(userStats.longestStreak, userStats.currentStreak);
    } else if (daysDiff > 1) {
      userStats.currentStreak = 1;
    }
    
    // Update stats if task was completed
    if (taskCompleted) {
      userStats.tasksCompleted += 1;
      
      // Award base points for task completion
      const basePoints = 10;
      userStats.totalPoints += basePoints;
      userStats.experiencePoints += basePoints;
      
      // Update accuracy (running average)
      if (accuracy !== undefined) {
        const totalTasks = userStats.tasksCompleted;
        userStats.averageAccuracy = ((userStats.averageAccuracy * (totalTasks - 1)) + accuracy) / totalTasks;
      }
      
      // Check for perfect score
      if (perfectScore) {
        userStats.perfectScores += 1;
        // Award bonus points for perfect score
        userStats.totalPoints += 20;
        userStats.experiencePoints += 20;
      }
      
      // Update study time if provided
      if (studyTime) {
        userStats.totalStudyTime += studyTime;
      }
      
      // Update weekly/monthly goals
      const weekStart = new Date(userStats.weeklyGoal.weekStart);
      const weeksDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
      if (weeksDiff >= 1) {
        userStats.weeklyGoal.current = 0;
        userStats.weeklyGoal.weekStart = today;
      }
      userStats.weeklyGoal.current += 1;
      
      const monthStart = new Date(userStats.monthlyGoal.monthStart);
      const monthsDiff = today.getMonth() - monthStart.getMonth() + (12 * (today.getFullYear() - monthStart.getFullYear()));
      if (monthsDiff >= 1) {
        userStats.monthlyGoal.current = 0;
        userStats.monthlyGoal.monthStart = today;
      }
      userStats.monthlyGoal.current += 1;
    }
    
    userStats.lastActivityDate = today;
    
    // Calculate level from experience points
    userStats.level = Math.floor(Math.sqrt(userStats.experiencePoints / 100)) + 1;
    
    await userStats.save();
    
    // Check for new achievements by calling the gamification system
    if (taskCompleted) {
      try {
        await checkAndUnlockAchievementsInternal(userId);
      } catch (error) {
        console.error('Error checking achievements:', error);
      }
    }
    
    return userStats;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return null;
  }
};

// Generate task based on user query (but save as Chat initially)
export const generateTask = async (req: Request, res: Response, next: NextFunction) => {
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
    const embeddingModel = new SentenceTransformerEmbeddings();

    // Search for relevant books with similarity scores
    const bookVectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
      collection: mongoose.connection.collection("booksVectors"),
      indexName: "vector_index",
    });

    // Get book embeddings for the query to use with similaritySearchVectorWithScore
    const queryEmbedding = await embeddingModel.embedQuery(query);
    const bookResultsWithScores = await bookVectorIndex.similaritySearchVectorWithScore(
      queryEmbedding, 
      maxBooks * 2 // Get more results to filter by threshold
    );

    // Filter books by similarity threshold (0.7 = 70% similarity)
    const MIN_SIMILARITY_THRESHOLD = 0.7;
    const filteredBookResults = bookResultsWithScores
      .filter(([_, score]: [Document, number]) => score >= MIN_SIMILARITY_THRESHOLD)
      .slice(0, maxBooks)
      .map(([doc]: [Document, number]) => doc);

    // Check if no related content found
    if (filteredBookResults.length === 0) {
      return res.status(404).json({ 
        error: "This topic is not related to the module. Please try another topic related to ICT Grade 11 curriculum." 
      });
    }

    // Search for relevant MCQs with similarity scores
    const mcqVectorIndex = new MongoDBAtlasVectorSearch(embeddingModel, {
      collection: mongoose.connection.collection("mcqVectors"),
      indexName: "vector_index",
    });

    const mcqResultsWithScores = await mcqVectorIndex.similaritySearchVectorWithScore(
      queryEmbedding,
      maxQuestions * 3 // Get more results to filter by threshold and chapter
    );

    // Filter MCQs by similarity threshold and optionally by chapter context
    const filteredMcqResults = mcqResultsWithScores
      .filter(([doc, score]: [Document, number]) => {
        // Minimum similarity threshold
        if (score < MIN_SIMILARITY_THRESHOLD) return false;
        
        // If we have book results, prioritize questions from the same chapter
        if (filteredBookResults.length > 0) {
          const bookChapter = filteredBookResults[0].metadata.chapter;
          const mcqChapter = doc.metadata.chapter;
          return bookChapter === mcqChapter || score >= 0.85; // Higher threshold for different chapters
        }
        
        return true;
      })
      .slice(0, maxQuestions)
      .map(([doc]: [Document, number]) => doc);

    // Get full document details for books with similarity scores
    const bookDetails = await Promise.all(
      filteredBookResults.map(async (result: Document) => {
        const book = await Book.findById(result.metadata._id);
        const similarityScore = bookResultsWithScores.find(
          ([doc]: [Document, number]) => doc.metadata._id === result.metadata._id
        )?.[1] || 0;
        
        return {
          _id: result.metadata._id,
          title: book?.title || result.metadata.title,
          pageNumber: book?.pageNumber || result.metadata.pageNumber,
          content: book?.content || result.pageContent,
          chapter: book?.chapter || result.metadata.chapter,
          similarityScore: Math.round(similarityScore * 100) // Convert to percentage
        };
      })
    );

    // Get full document details for MCQs with similarity scores
    let mcqDetails: any[] = await Promise.all(
      filteredMcqResults.map(async (result: Document) => {
        const mcq = await MCQ.findById(result.metadata._id);
        const similarityScore = mcqResultsWithScores.find(
          ([doc]: [Document, number]) => doc.metadata._id === result.metadata._id
        )?.[1] || 0;
        
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
      })
    );

    // Check if no past paper questions found and generate practice questions
    let practiceQuestions: any[] = [];
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
        
        const aiResponse = await callOpenRouter(prompt, {
          max_tokens: 2000,
          temperature: 0.7,
          model: "deepseek/deepseek-r1:free"
        });
        
        if (aiResponse && aiResponse.trim()) {
          try {
            practiceQuestions = JSON.parse(aiResponse);
            isPracticeQuestions = true;
            console.log("DEBUG: Successfully generated practice questions");
          } catch (parseError) {
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
      } catch (error) {
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

    // Create a new chat with task content
    const newChat = new Chat({
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
        questions: await Promise.all(mcqDetails.map(async (mcq: any) => {
          // Generate explanation for each MCQ if not already present (e.g., for practice questions)
          let explanation = mcq.explanation || `This question tests your understanding of ${mcq.chapter}. The correct answer is "${mcq.correctAnswer}" because it best addresses the concept being tested. Review the related content to understand why this is the correct choice.`;
          
          if (!mcq.explanation && process.env.OPENROUTER_API_KEY) {
            try {
              const prompt = `As an expert ICT tutor, explain this question from Chapter "${mcq.chapter}":

Question: "${mcq.question}"
Options: ${mcq.options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')}
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
              
              const aiResponse = await callOpenRouter(prompt, {
                max_tokens: 1500,
                temperature: 0.7,
                model: "deepseek/deepseek-r1:free"
              });
              
              if (aiResponse && aiResponse.trim()) {
                explanation = aiResponse;
                console.log(`DEBUG: Successfully generated explanation for Question ${mcq.questionNumber}`);
              } else {
                console.log(`DEBUG: No explanation generated for Question ${mcq.questionNumber}, using fallback`);
                explanation = `For Question ${mcq.questionNumber} (${mcq.year}): The correct answer is "${mcq.correctAnswer}". This question from Chapter "${mcq.chapter}" tests your understanding of key concepts. Review the chapter content and provided examples to better understand this topic.`;
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

// Get specific task - FIXED to handle both Task and Chat objects
export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;
    
    // Use 'any' to allow assigning either Task document, Chat document, or plain object
    let task: any = await Task.findById(taskId);
    
    // If not found as Task, try to find as Chat with isTask: true
    if (!task) {
      const chat = await Chat.findById(taskId);
      if (chat && chat.isTask) {
        // Convert Chat to Task format for frontend compatibility
        task = {
          _id: chat._id,
          userId: chat.userId,
          title: `Study Task: ${chat.query}`,
          description: `Task created from: ${chat.query}`,
          type: 'learning',
          section: 'AI Generated',
          content: chat.content || { questions: [] },
          progress: {
            completed: (chat as any).completed || false,
            score: 0,
            totalQuestions: chat.content?.questions?.length || 0,
            correctAnswers: 0,
            timeSpent: (chat as any).timeSpent || 0,
            pointsEarned: 0
          },
          priority: 'medium',
          createdAt: chat.timestamp,
          updatedAt: chat.timestamp
        };
        
        // Calculate progress from completed questions if content exists
        if (chat.content?.questions) {
          const completedQuestions = chat.content.questions.filter((q: any) => q.completed);
          const correctAnswers = completedQuestions.filter((q: any) => {
            if (!q.userAnswer || !q.correctAnswer) return false;
            const userAnswer = q.userAnswer.toString().trim();
            const correctAnswer = q.correctAnswer.toString().replace(/[()]/g, "").trim();
            return userAnswer === correctAnswer;
          });
          
          task.progress.correctAnswers = correctAnswers.length;
          task.progress.pointsEarned = correctAnswers.length * 10;
          task.progress.score = task.progress.totalQuestions > 0 
            ? Math.round((correctAnswers.length / task.progress.totalQuestions) * 100) 
            : 0;
        }
      }
    }
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json({ 
      success: true,
      data: task 
    });
  } catch (error) {
    next(error);
  }
};

export const updateTaskProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId, questionId, isCorrect, completed, userAnswer, timeSpent } = req.body;
    // Use the authenticated user's ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // Use 'any' to allow assigning either Task or Chat document
    let task: any = await Task.findOne({ _id: taskId, userId });
    let isChat = false;
    
    // If not found as Task, try to find as Chat with isTask: true
    if (!task) {
      task = await Chat.findOne({ _id: taskId, userId, isTask: true });
      if (task) {
        isChat = true;
      }
    }

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskDoc = task;

    // For Chat objects, we don't have a progress field, so we calculate it dynamically
    if (isChat) {
      // Update time spent in a custom field for chats
      if (timeSpent !== undefined) {
        taskDoc.timeSpent = timeSpent;
      }

      if (questionId && isCorrect !== undefined) {
        // Update specific question completion
        const questions = taskDoc.content?.questions || [];
        const questionIndex = questions.findIndex((q: any) =>
          q.mcqId?.toString() === questionId || q._id?.toString() === questionId
        );
        
        if (questionIndex !== -1) {
          // Store the user's answer
          if (userAnswer !== undefined) {
            questions[questionIndex].userAnswer = userAnswer;
          }
          
          // Only update if not already completed to avoid double counting
          if (!questions[questionIndex].completed) {
            questions[questionIndex].completed = true;
          }
        }
      }

      if (completed !== undefined && completed) {
        taskDoc.completed = completed;
        taskDoc.completedAt = new Date();
      }

      await taskDoc.save();

      // Calculate progress for response
      const totalQuestions = taskDoc.content?.questions?.length || 0;
      const completedQuestions = taskDoc.content?.questions?.filter((q: any) => q.completed) || [];
      const correctAnswers = completedQuestions.filter((q: any) => {
        if (!q.userAnswer || !q.correctAnswer) return false;
        const userAnswer = q.userAnswer.toString().trim();
        const correctAnswer = q.correctAnswer.toString().replace(/[()]/g, "").trim();
        return userAnswer === correctAnswer;
      });

      const progress = {
        completed: taskDoc.completed || false,
        completedAt: taskDoc.completedAt,
        score: totalQuestions > 0 ? Math.round((correctAnswers.length / totalQuestions) * 100) : 0,
        totalQuestions,
        correctAnswers: correctAnswers.length,
        timeSpent: taskDoc.timeSpent || 0,
        pointsEarned: correctAnswers.length * 10
      };

      // Update user stats and check for achievements if task was completed
      if (completed) {
        const accuracy = totalQuestions > 0 ? (correctAnswers.length / totalQuestions) * 100 : 0;
        const isPerfectScore = accuracy === 100;
        const studyTime = taskDoc.timeSpent || (totalQuestions * 2 || 5);
        
        await updateUserStatsAndAchievements(
          userId,
          true, 
          accuracy,
          studyTime,
          isPerfectScore
        );
      }

      // Convert to Task format for response
      const responseTask = {
        _id: taskDoc._id,
        userId: taskDoc.userId,
        title: `Study Task: ${taskDoc.query}`,
        description: `Task created from: ${taskDoc.query}`,
        type: 'learning',
        section: 'AI Generated',
        content: taskDoc.content,
        progress,
        priority: 'medium',
        createdAt: taskDoc.timestamp,
        updatedAt: taskDoc.timestamp
      };

      res.status(200).json({
        message: "Task progress updated successfully",
        task: responseTask
      });
    } else {
      
      if (!taskDoc.progress) {
        taskDoc.progress = {
          completed: false,
          score: 0,
          totalQuestions: taskDoc.content?.questions?.length || 0,
          correctAnswers: 0,
          timeSpent: 0,
          pointsEarned: 0
        };
      }

      // Update total questions count if not set
      if (taskDoc.progress.totalQuestions === 0 && taskDoc.content?.questions) {
        taskDoc.progress.totalQuestions = taskDoc.content.questions.length;
      }

      // Update time spent if provided
      if (timeSpent !== undefined) {
        taskDoc.progress.timeSpent = timeSpent;
      }

      if (questionId && isCorrect !== undefined) {
        // Update specific question completion
        const questions = taskDoc.content?.questions || [];
        const questionIndex = questions.findIndex((q: any) =>
          q.mcqId?.toString() === questionId || q._id?.toString() === questionId
        );
        
        if (questionIndex !== -1) {
          // Store the user's answer
          if (userAnswer !== undefined) {
            questions[questionIndex].userAnswer = userAnswer;
          }
          
          // Only update if not already completed to avoid double counting
          if (!questions[questionIndex].completed) {
            questions[questionIndex].completed = true;
            if (isCorrect) {
              taskDoc.progress.correctAnswers += 1;
              // Award 10 points per correct answer
              taskDoc.progress.pointsEarned += 10;
            }
          }
        }
      }

      if (completed !== undefined) {
        taskDoc.progress.completed = completed;
        if (completed) {
          taskDoc.progress.completedAt = new Date();
          // Calculate final score as percentage
          taskDoc.progress.score = taskDoc.progress.totalQuestions > 0
            ? Math.round((taskDoc.progress.correctAnswers / taskDoc.progress.totalQuestions) * 100)
            : 0;
        }
      }

      

      await taskDoc.save();

      // Update user stats and check for achievements if task was completed
      if (taskDoc.progress?.completed) {
        const accuracy = taskDoc.progress.totalQuestions > 0
          ? (taskDoc.progress.correctAnswers / taskDoc.progress.totalQuestions) * 100
          : 0;
        const isPerfectScore = accuracy === 100;
        
        // Use actual time spent or estimate if not provided
        const studyTime = taskDoc.progress.timeSpent || (taskDoc.content?.questions?.length * 2 || 5);
        
        await updateUserStatsAndAchievements(
          userId,
          true, // task completed
          accuracy,
          studyTime,
          isPerfectScore
        );
      }

      res.status(200).json({
        message: "Task progress updated successfully",
        task: taskDoc
      });
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
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

// Get chat history for a specific user
export const getChatHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const chats = await Chat.find({ userId })
      .sort({ timestamp: -1 })
      .limit(50); // Limit to last 50 chats

    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    next(error);
  }
};

// Get specific chat message by ID
export const getChatById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    
    if (!chatId) {
      return res.status(400).json({ error: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: "Chat message not found" });
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Error fetching chat message:', error);
    next(error);
  }
};

// Save chat as task
export const saveChatAsTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id; 
    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (chat.savedAsTask) {
      return res.status(400).json({ error: "Chat already saved as task" });
    }

    // Create a new task from the chat content
    const task = new Task({
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
  } catch (error) {
    console.error('Error saving chat as task:', error);
    next(error);
  }
};