import { Request, Response, NextFunction } from "express";
import { Achievement, UserStats, IAchievement, IUserStats } from "../infrastructure/schemas/Achievement";

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
  first_task: {
    title: "First Steps",
    description: "Complete your first learning task",
    icon: "🎯",
    color: "bg-green-100 text-green-700",
    points: 10
  },
  streak_3: {
    title: "Getting Started",
    description: "Maintain a 3-day study streak",
    icon: "🔥",
    color: "bg-orange-100 text-orange-700",
    points: 25
  },
  streak_7: {
    title: "Week Warrior",
    description: "Maintain a 7-day study streak",
    icon: "⚡",
    color: "bg-yellow-100 text-yellow-700",
    points: 50
  },
  streak_30: {
    title: "Consistency Champion",
    description: "Maintain a 30-day study streak",
    icon: "👑",
    color: "bg-purple-100 text-purple-700",
    points: 200
  },
  tasks_10: {
    title: "Task Master",
    description: "Complete 10 learning tasks",
    icon: "📚",
    color: "bg-blue-100 text-blue-700",
    points: 50
  },
  tasks_50: {
    title: "Learning Machine",
    description: "Complete 50 learning tasks",
    icon: "🤖",
    color: "bg-cyan-100 text-cyan-700",
    points: 150
  },
  tasks_100: {
    title: "Century Club",
    description: "Complete 100 learning tasks",
    icon: "💯",
    color: "bg-indigo-100 text-indigo-700",
    points: 300
  },
  perfect_score: {
    title: "Perfectionist",
    description: "Get 100% on a task",
    icon: "⭐",
    color: "bg-yellow-100 text-yellow-700",
    points: 30
  },
  perfect_scores_10: {
    title: "Excellence Expert",
    description: "Get 10 perfect scores",
    icon: "🌟",
    color: "bg-amber-100 text-amber-700",
    points: 100
  },
  accuracy_90: {
    title: "Sharp Shooter",
    description: "Maintain 90% average accuracy",
    icon: "🎯",
    color: "bg-red-100 text-red-700",
    points: 75
  },
  video_watcher: {
    title: "Visual Learner",
    description: "Watch your first educational video",
    icon: "📺",
    color: "bg-pink-100 text-pink-700",
    points: 15
  },
  videos_10: {
    title: "Video Enthusiast",
    description: "Watch 10 educational videos",
    icon: "🎬",
    color: "bg-rose-100 text-rose-700",
    points: 40
  },
  study_time_60: {
    title: "Hour Scholar",
    description: "Study for 60 minutes total",
    icon: "⏰",
    color: "bg-slate-100 text-slate-700",
    points: 20
  },
  study_time_300: {
    title: "Dedicated Student",
    description: "Study for 5 hours total",
    icon: "📖",
    color: "bg-emerald-100 text-emerald-700",
    points: 80
  },
  weekly_goal: {
    title: "Weekly Winner",
    description: "Complete your weekly goal",
    icon: "🏆",
    color: "bg-gold-100 text-gold-700",
    points: 60
  },
  monthly_goal: {
    title: "Monthly Master",
    description: "Complete your monthly goal",
    icon: "🥇",
    color: "bg-yellow-100 text-yellow-700",
    points: 200
  }
};

// Calculate level from experience points
const calculateLevel = (experiencePoints: number): number => {
  // Level formula: level = floor(sqrt(xp / 100)) + 1
  return Math.floor(Math.sqrt(experiencePoints / 100)) + 1;
};

// Calculate XP needed for next level
const getXPForNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

// Get or create user stats
const getOrCreateUserStats = async (userId: string): Promise<IUserStats> => {
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
    await userStats.save();
  }
  
  return userStats;
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userStats = await getOrCreateUserStats(userId);
    
    const currentLevel = calculateLevel(userStats.experiencePoints);
    const nextLevelXP = getXPForNextLevel(currentLevel);
    const currentLevelXP = currentLevel > 1 ? getXPForNextLevel(currentLevel - 1) : 0;
    const progressToNextLevel = ((userStats.experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    res.json({
      success: true,
      data: {
        ...userStats.toObject(),
        level: currentLevel,
        progressToNextLevel: Math.max(0, Math.min(100, progressToNextLevel)),
        xpToNextLevel: Math.max(0, nextLevelXP - userStats.experiencePoints)
      }
    });
  } catch (error: any) {
    console.error("Error getting user stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user statistics"
    });
  }
};

// Get user achievements
export const getUserAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const achievements = await Achievement.find({ userId }).sort({ unlockedAt: -1 });
    
    res.json({
      success: true,
      data: achievements
    });
  } catch (error: any) {
    console.error("Error getting user achievements:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user achievements"
    });
  }
};

// Update user statistics
export const updateUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      userId, 
      tasksCompleted, 
      accuracy, 
      studyTime, 
      videosWatched, 
      perfectScore 
    } = req.body;
    
    const userStats = await getOrCreateUserStats(userId);
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
    
    // Update stats
    if (tasksCompleted) userStats.tasksCompleted += tasksCompleted;
    if (studyTime) userStats.totalStudyTime += studyTime;
    if (videosWatched) userStats.videosWatched += videosWatched;
    if (perfectScore) userStats.perfectScores += 1;
    
    // Update accuracy (running average)
    if (accuracy !== undefined) {
      const totalTasks = userStats.tasksCompleted;
      userStats.averageAccuracy = ((userStats.averageAccuracy * (totalTasks - 1)) + accuracy) / totalTasks;
    }
    
    // Update weekly/monthly goals
    const weekStart = new Date(userStats.weeklyGoal.weekStart);
    const weeksDiff = Math.floor((today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
    if (weeksDiff >= 1) {
      userStats.weeklyGoal.current = 0;
      userStats.weeklyGoal.weekStart = today;
    }
    if (tasksCompleted) userStats.weeklyGoal.current += tasksCompleted;
    
    const monthStart = new Date(userStats.monthlyGoal.monthStart);
    const monthsDiff = today.getMonth() - monthStart.getMonth() + (12 * (today.getFullYear() - monthStart.getFullYear()));
    if (monthsDiff >= 1) {
      userStats.monthlyGoal.current = 0;
      userStats.monthlyGoal.monthStart = today;
    }
    if (tasksCompleted) userStats.monthlyGoal.current += tasksCompleted;
    
    userStats.lastActivityDate = today;
    await userStats.save();
    
    // Check for new achievements
    await checkAndUnlockAchievementsInternal(userId);
    
    res.json({
      success: true,
      data: userStats
    });
  } catch (error: any) {
    console.error("Error updating user stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user statistics"
    });
  }
};

// Internal function to check and unlock achievements
export const checkAndUnlockAchievementsInternal = async (userId: string): Promise<IAchievement[]> => {
  const userStats = await getOrCreateUserStats(userId);
  const existingAchievements = await Achievement.find({ userId });
  const existingTypes = existingAchievements.map(a => a.type);
  const newAchievements: IAchievement[] = [];
  
  // Check each achievement condition
  const checks = [
    { condition: userStats.tasksCompleted >= 1 && !existingTypes.includes('first_task'), type: 'first_task' },
    { condition: userStats.currentStreak >= 3 && !existingTypes.includes('streak_3'), type: 'streak_3' },
    { condition: userStats.currentStreak >= 7 && !existingTypes.includes('streak_7'), type: 'streak_7' },
    { condition: userStats.currentStreak >= 30 && !existingTypes.includes('streak_30'), type: 'streak_30' },
    { condition: userStats.tasksCompleted >= 10 && !existingTypes.includes('tasks_10'), type: 'tasks_10' },
    { condition: userStats.tasksCompleted >= 50 && !existingTypes.includes('tasks_50'), type: 'tasks_50' },
    { condition: userStats.tasksCompleted >= 100 && !existingTypes.includes('tasks_100'), type: 'tasks_100' },
    { condition: userStats.perfectScores >= 1 && !existingTypes.includes('perfect_score'), type: 'perfect_score' },
    { condition: userStats.perfectScores >= 10 && !existingTypes.includes('perfect_scores_10'), type: 'perfect_scores_10' },
    { condition: userStats.averageAccuracy >= 90 && !existingTypes.includes('accuracy_90'), type: 'accuracy_90' },
    { condition: userStats.videosWatched >= 1 && !existingTypes.includes('video_watcher'), type: 'video_watcher' },
    { condition: userStats.videosWatched >= 10 && !existingTypes.includes('videos_10'), type: 'videos_10' },
    { condition: userStats.totalStudyTime >= 60 && !existingTypes.includes('study_time_60'), type: 'study_time_60' },
    { condition: userStats.totalStudyTime >= 300 && !existingTypes.includes('study_time_300'), type: 'study_time_300' },
    { condition: userStats.weeklyGoal.current >= userStats.weeklyGoal.target && !existingTypes.includes('weekly_goal'), type: 'weekly_goal' },
    { condition: userStats.monthlyGoal.current >= userStats.monthlyGoal.target && !existingTypes.includes('monthly_goal'), type: 'monthly_goal' }
  ];
  
  for (const check of checks) {
    if (check.condition) {
      const achievementDef = ACHIEVEMENT_DEFINITIONS[check.type as keyof typeof ACHIEVEMENT_DEFINITIONS];
      if (achievementDef) {
        const achievement = new Achievement({
          userId,
          type: check.type,
          title: achievementDef.title,
          description: achievementDef.description,
          icon: achievementDef.icon,
          color: achievementDef.color,
          points: achievementDef.points
        });
        
        await achievement.save();
        newAchievements.push(achievement);
        
        // Award points and XP
        userStats.totalPoints += achievementDef.points;
        userStats.experiencePoints += achievementDef.points;
      }
    }
  }
  
  if (newAchievements.length > 0) {
    userStats.level = calculateLevel(userStats.experiencePoints);
    await userStats.save();
  }
  
  return newAchievements;
};

// Check and unlock achievements (API endpoint)
export const checkAndUnlockAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    const newAchievements = await checkAndUnlockAchievementsInternal(userId);
    
    res.json({
      success: true,
      data: {
        newAchievements,
        count: newAchievements.length
      }
    });
  } catch (error: any) {
    console.error("Error checking achievements:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check achievements"
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type = 'points', limit = 10 } = req.query;
    
    let sortField = 'totalPoints';
    if (type === 'streak') sortField = 'currentStreak';
    if (type === 'level') sortField = 'level';
    if (type === 'tasks') sortField = 'tasksCompleted';
    
    const leaderboard = await UserStats.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit as string))
      .select('userId totalPoints currentStreak level tasksCompleted averageAccuracy');
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error: any) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get leaderboard"
    });
  }
};

// Get user level
export const getUserLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const userStats = await getOrCreateUserStats(userId);
    
    const currentLevel = calculateLevel(userStats.experiencePoints);
    const nextLevelXP = getXPForNextLevel(currentLevel);
    const currentLevelXP = currentLevel > 1 ? getXPForNextLevel(currentLevel - 1) : 0;
    const progressToNextLevel = ((userStats.experiencePoints - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    res.json({
      success: true,
      data: {
        level: currentLevel,
        experiencePoints: userStats.experiencePoints,
        progressToNextLevel: Math.max(0, Math.min(100, progressToNextLevel)),
        xpToNextLevel: Math.max(0, nextLevelXP - userStats.experiencePoints),
        totalPoints: userStats.totalPoints
      }
    });
  } catch (error: any) {
    console.error("Error getting user level:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user level"
    });
  }
};

// Award points to user
export const awardPoints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, points, reason } = req.body;
    const userStats = await getOrCreateUserStats(userId);
    
    userStats.totalPoints += points;
    userStats.experiencePoints += points;
    userStats.level = calculateLevel(userStats.experiencePoints);
    
    await userStats.save();
    
    res.json({
      success: true,
      data: {
        totalPoints: userStats.totalPoints,
        experiencePoints: userStats.experiencePoints,
        level: userStats.level,
        pointsAwarded: points,
        reason
      }
    });
  } catch (error: any) {
    console.error("Error awarding points:", error);
    res.status(500).json({
      success: false,
      error: "Failed to award points"
    });
  }
};