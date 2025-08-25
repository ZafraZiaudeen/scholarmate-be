"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bookSchema = new mongoose_1.default.Schema({
    title: {
        type: String,
        required: true,
    },
    pageNumber: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    chapter: {
        type: String,
        default: "Web Designing Using Multimedia",
    },
});
// Add unique index on title and pageNumber
bookSchema.index({ title: 1, pageNumber: 1 }, { unique: true });
const Book = mongoose_1.default.model("Book", bookSchema);
exports.default = Book;
//# sourceMappingURL=Book.js.map