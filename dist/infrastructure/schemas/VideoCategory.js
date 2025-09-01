"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const videoCategorySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    searchQuery: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true,
        default: 'BookOpen'
    },
    color: {
        type: String,
        required: true,
        default: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
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
videoCategorySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Index for efficient querying
videoCategorySchema.index({ isActive: 1, order: 1 });
videoCategorySchema.index({ createdBy: 1, createdAt: -1 });
const VideoCategory = mongoose_1.default.model("VideoCategory", videoCategorySchema);
exports.default = VideoCategory;
//# sourceMappingURL=VideoCategory.js.map