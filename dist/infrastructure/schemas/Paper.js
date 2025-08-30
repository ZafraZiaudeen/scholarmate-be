"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const pastPaperSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['part 1', 'part 2', 'both'],
        required: true
    },
    duration: {
        type: Number,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    paperFileId: {
        type: String,
        required: true
    },
    answerSheetFileId: {
        type: String,
        required: false
    },
    paperType: {
        type: String,
        enum: ['model paper', 'past paper'],
        default: 'past paper'
    },
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    },
    createdBy: {
        type: String,
        required: true
    },
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
pastPaperSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Index for efficient querying
pastPaperSchema.index({ year: 1, type: 1 });
pastPaperSchema.index({ createdBy: 1, createdAt: -1 });
const PastPaper = mongoose_1.default.model("PastPaper", pastPaperSchema);
exports.default = PastPaper;
//# sourceMappingURL=Paper.js.map