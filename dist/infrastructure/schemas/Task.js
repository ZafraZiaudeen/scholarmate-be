"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const taskSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['learning', 'practice', 'assessment'],
        default: 'learning'
    },
    section: {
        type: String,
        required: true
    },
    content: {
        bookContent: {
            bookId: mongoose_1.default.Schema.Types.ObjectId,
            title: String,
            pageNumber: String,
            content: String,
            chapter: String
        },
        questions: [{
                mcqId: mongoose_1.default.Schema.Types.ObjectId,
                question: String,
                options: [String],
                correctAnswer: String,
                explanation: String,
                completed: {
                    type: Boolean,
                    default: false
                }
            }]
    },
    progress: {
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date,
        score: {
            type: Number,
            default: 0
        },
        totalQuestions: {
            type: Number,
            default: 0
        },
        correctAnswers: {
            type: Number,
            default: 0
        }
    },
    dueDate: Date,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
// Update the updatedAt field before saving
taskSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Index for efficient querying
taskSchema.index({ userId: 1, section: 1 });
taskSchema.index({ userId: 1, progress: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
const Task = mongoose_1.default.model("Task", taskSchema);
exports.default = Task;
//# sourceMappingURL=Task.js.map