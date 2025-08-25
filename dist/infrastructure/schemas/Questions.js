"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mcqSchema = new mongoose_1.default.Schema({
    year: {
        type: String,
        required: true,
    },
    questionNumber: {
        type: String,
        required: true,
    },
    question: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
    },
    correctAnswer: {
        type: String,
        required: true,
    },
    chapter: {
        type: String,
        default: "Web Designing Using Multimedia",
    },
});
const MCQ = mongoose_1.default.model("MCQ", mcqSchema);
exports.default = MCQ;
//# sourceMappingURL=Questions.js.map