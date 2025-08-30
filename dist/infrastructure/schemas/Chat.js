"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const chatSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    query: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    contentExplanation: {
        type: String,
        required: false
    },
    answerExplanation: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    savedAsTask: {
        type: Boolean,
        default: false
    },
    taskId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Task',
        default: null
    },
    isTask: {
        type: Boolean,
        default: false
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
    }
});
// Index for efficient querying
chatSchema.index({ userId: 1, timestamp: -1 });
chatSchema.index({ userId: 1, savedAsTask: 1 });
const Chat = mongoose_1.default.model("Chat", chatSchema);
exports.default = Chat;
//# sourceMappingURL=Chat.js.map