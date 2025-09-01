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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStats = exports.Achievement = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AchievementSchema = new mongoose_1.Schema({
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
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true
});
const UserStatsSchema = new mongoose_1.Schema({
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
exports.Achievement = mongoose_1.default.model('Achievement', AchievementSchema);
exports.UserStats = mongoose_1.default.model('UserStats', UserStatsSchema);
//# sourceMappingURL=Achievement.js.map