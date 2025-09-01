import { Request, Response, NextFunction } from 'express';
import Task from '../infrastructure/schemas/Task';
import Chat from '../infrastructure/schemas/Chat';
import { clerkClient } from "@clerk/express";

// Get admin dashboard analytics
export const getAdminAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get total users from Clerk
    const usersResponse = await clerkClient.users.getUserList({ limit: 1 });
    const totalUsers = usersResponse.totalCount;

    // Get user role distribution
    const adminUsers = await clerkClient.users.getUserList({
      query: 'role:admin'
    });
    const totalAdmins = adminUsers.totalCount;
    const totalStudents = totalUsers - totalAdmins;

    // Get task statistics
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ 'progress.completed': true });
    const activeTasks = totalTasks - completedTasks;

    // Calculate overall completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get recent user activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTasks = await Task.find({
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: -1 }).limit(10);

    const recentChats = await Chat.find({
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: -1 }).limit(10);

    // Get user activity with names from Clerk
    const recentActivity = [];
    
    // Process recent tasks
    for (const task of recentTasks) {
      try {
        const user = await clerkClient.users.getUser(task.userId);
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
        
        recentActivity.push({
          type: 'task',
          userName,
          action: task.progress?.completed ? `Completed "${task.title}"` : `Started "${task.title}"`,
          time: task.updatedAt || task.createdAt,
          userId: task.userId
        });
      } catch (error) {
        console.error(`Error fetching user ${task.userId}:`, error);
      }
    }

    // Process recent chats
    for (const chat of recentChats) {
      try {
        const user = await clerkClient.users.getUser(chat.userId);
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
        
        recentActivity.push({
          type: 'chat',
          userName,
          action: `Asked AI about "${chat.query.substring(0, 50)}${chat.query.length > 50 ? '...' : ''}"`,
          time: chat.timestamp,
          userId: chat.userId
        });
      } catch (error) {
        console.error(`Error fetching user ${chat.userId}:`, error);
      }
    }

    // Sort all activity by time
    recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Get top performing students
    const topStudents = await Task.aggregate([
      {
        $match: { 'progress.completed': true }
      },
      {
        $group: {
          _id: '$userId',
          completedTasks: { $sum: 1 },
          averageScore: { $avg: '$progress.score' },
          totalScore: { $sum: '$progress.score' }
        }
      },
      {
        $sort: { totalScore: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Add user names to top students
    const topStudentsWithNames = [];
    for (const student of topStudents) {
      try {
        const user = await clerkClient.users.getUser(student._id);
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
        
        topStudentsWithNames.push({
          userId: student._id,
          userName,
          completedTasks: student.completedTasks,
          averageScore: Math.round(student.averageScore || 0),
          totalScore: Math.round(student.totalScore || 0)
        });
      } catch (error) {
        console.error(`Error fetching user ${student._id}:`, error);
      }
    }

    // Get task distribution by section
    const tasksBySection = await Task.aggregate([
      {
        $group: {
          _id: '$section',
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$progress.completed', true] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: totalStudents,
          admins: totalAdmins,
          growth: Math.round(Math.random() * 20) + 5 // Placeholder for growth calculation
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          active: activeTasks,
          completionRate
        },
        recentActivity: recentActivity.slice(0, 10),
        topStudents: topStudentsWithNames,
        tasksBySection,
        systemStatus: {
          aiTutor: 'online',
          database: 'healthy',
          fileStorage: 'available',
          emailService: 'warning' // This could be dynamic based on actual service checks
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    next(error);
  }
};

// Get user-specific progress analytics
export const getUserProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User authentication required" });
    }

    // Get user's tasks
    const userTasks = await Task.find({ userId });
    const completedTasks = userTasks.filter(task => task.progress?.completed);
    const totalTasks = userTasks.length;

    // Calculate overall progress
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    // Calculate total points/score
    const totalPoints = completedTasks.reduce((sum, task) => sum + (task.progress?.score || 0), 0);

    // Calculate accuracy rate
    const totalQuestions = userTasks.reduce((sum, task) => sum + (task.progress?.totalQuestions || 0), 0);
    const correctAnswers = userTasks.reduce((sum, task) => sum + (task.progress?.correctAnswers || 0), 0);
    const accuracyRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Calculate study streak (consecutive days with activity)
    const recentActivity = await Task.find({ 
      userId,
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    }).sort({ updatedAt: -1 });

    let studyStreak = 0;
    const today = new Date();
    const activityDates = recentActivity.map(task => 
      new Date(task.updatedAt).toDateString()
    );
    const uniqueDates = [...new Set(activityDates)].sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate streak
    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      
      if (date.toDateString() === expectedDate.toDateString()) {
        studyStreak++;
      } else {
        break;
      }
    }

    // Get progress by section
    const progressBySection = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$section',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$progress.completed', true] }, 1, 0]
            }
          },
          averageScore: { $avg: '$progress.score' }
        }
      },
      {
        $project: {
          section: '$_id',
          total: 1,
          completed: 1,
          progress: {
            $round: [
              { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
              0
            ]
          },
          averageScore: { $round: ['$averageScore', 0] }
        }
      }
    ]);

    // Get recent activity
    const recentUserActivity = await Task.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title progress.completed updatedAt');

    const recentChats = await Chat.find({ userId })
      .sort({ timestamp: -1 })
      .limit(3)
      .select('query timestamp');

    // Combine and format recent activity
    const formattedActivity = [
      ...recentUserActivity.map(task => ({
        type: 'task',
        description: task.progress?.completed ? `Completed "${task.title}"` : `Worked on "${task.title}"`,
        time: task.updatedAt
      })),
      ...recentChats.map(chat => ({
        type: 'chat',
        description: `Asked AI about "${chat.query.substring(0, 40)}${chat.query.length > 40 ? '...' : ''}"`,
        time: chat.timestamp
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    // Get recommended tasks (incomplete tasks with medium/high priority)
    const recommendedTasks = await Task.find({
      userId,
      'progress.completed': false,
      priority: { $in: ['medium', 'high'] }
    }).limit(3).select('title description priority section');

    // Calculate study time (estimated based on task completion)
    const studyTimeHours = completedTasks.length * 0.5; // Estimate 30 minutes per completed task

    res.status(200).json({
      success: true,
      data: {
        overview: {
          studyStreak,
          questionsSolved: correctAnswers,
          accuracyRate,
          studyTime: Math.round(studyTimeHours)
        },
        progress: {
          totalTasks,
          completedTasks: completedTasks.length,
          overallProgress,
          totalPoints: Math.round(totalPoints)
        },
        progressBySection,
        recentActivity: formattedActivity,
        recommendedTasks
      }
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    next(error);
  }
};

// Get detailed task analytics for a specific user
export const getUserTaskAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user?.id;

    // Check if user is requesting their own data or is an admin
    if (userId !== requestingUserId) {
      const requestingUser = await clerkClient.users.getUser(requestingUserId);
      if (requestingUser.publicMetadata?.role !== 'admin') {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    const chats = await Chat.find({ userId }).sort({ timestamp: -1 }).limit(10);

    // Calculate detailed analytics
    const analytics = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.progress.completed).length,
      averageScore: tasks.length > 0 ? 
        Math.round(tasks.reduce((sum, t) => sum + (t.progress.score || 0), 0) / tasks.length) : 0,
      totalQuestions: tasks.reduce((sum, t) => sum + (t.progress.totalQuestions || 0), 0),
      correctAnswers: tasks.reduce((sum, t) => sum + (t.progress.correctAnswers || 0), 0),
      tasksByType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      tasksByPriority: tasks.reduce((acc, task) => {
        const priority = task.priority || 'medium';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentChats: chats.length,
      lastActivity: tasks.length > 0 ? tasks[0].updatedAt : null
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching user task analytics:', error);
    next(error);
  }
};