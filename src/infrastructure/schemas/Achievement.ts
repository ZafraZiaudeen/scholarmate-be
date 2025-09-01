import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  userId: string;
  type: 'first_task' | 'streak_3' | 'streak_7' | 'streak_30' | 'tasks_10' | 'tasks_50' | 'tasks_100' | 'perfect_score' | 'perfect_scores_10' | 'accuracy_90' | 'video_watcher' | 'videos_10' | 'study_time_60' | 'study_time_300' | 'weekly_goal' | 'monthly_goal';
  title: string;
  description: string;
  icon: string;
  color: string;
  points: number;
  unlockedAt: Date;
  progress?: {
    current: number;
    target: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

export interface IUserStats extends Document {
  userId: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  averageAccuracy: number;
  totalStudyTime: number; // in minutes
  videosWatched: number;
  perfectScores: number;
  lastActivityDate: Date;
  weeklyGoal: {
    target: number;
    current: number;
    weekStart: Date;
  };
  monthlyGoal: {
    target: number;
    current: number;
    monthStart: Date;
  };
  badges: string[];
  level: number;
  experiencePoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'first_task', 'streak_3', 'streak_7', 'streak_30', 'tasks_10', 'tasks_50', 'tasks_100',
      'perfect_score', 'perfect_scores_10', 'accuracy_90', 'video_watcher', 'videos_10',
      'study_time_60', 'study_time_300', 'weekly_goal', 'monthly_goal'
    ]
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  points: { type: Number, required: true },
  unlockedAt: { type: Date, default: Date.now },
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, default: 1 }
  },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

const UserStatsSchema = new Schema<IUserStats>({
  userId: { type: String, required: true, unique: true, index: true },
  totalPoints: { type: Number, default: 0 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 },
  totalStudyTime: { type: Number, default: 0 },
  videosWatched: { type: Number, default: 0 },
  perfectScores: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  weeklyGoal: {
    target: { type: Number, default: 5 },
    current: { type: Number, default: 0 },
    weekStart: { type: Date, default: Date.now }
  },
  monthlyGoal: {
    target: { type: Number, default: 20 },
    current: { type: Number, default: 0 },
    monthStart: { type: Date, default: Date.now }
  },
  badges: [{ type: String }],
  level: { type: Number, default: 1 },
  experiencePoints: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes for better performance
AchievementSchema.index({ userId: 1, type: 1 });
AchievementSchema.index({ unlockedAt: -1 });

UserStatsSchema.index({ totalPoints: -1 });
UserStatsSchema.index({ level: -1 });
UserStatsSchema.index({ currentStreak: -1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
export const UserStats = mongoose.model<IUserStats>('UserStats', UserStatsSchema);