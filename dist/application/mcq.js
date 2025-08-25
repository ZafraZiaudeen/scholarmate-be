"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMCQ = exports.deleteMCQ = exports.createMCQ = exports.getMCQById = exports.getAllMCQs = void 0;
const Questions_1 = __importDefault(require("../infrastructure/schemas/Questions"));
const not_found_error_1 = __importDefault(require("../domain/errors/not-found-error"));
const validation_error_1 = __importDefault(require("../domain/errors/validation-error"));
const MCQDTO_1 = require("../domain/dto/MCQDTO");
const getAllMCQs = async (req, res, next) => {
    try {
        const mcqs = await Questions_1.default.find();
        res.status(200).json(mcqs);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getAllMCQs = getAllMCQs;
const getMCQById = async (req, res, next) => {
    try {
        const mcqId = req.params.id;
        const mcq = await Questions_1.default.findById(mcqId);
        if (!mcq) {
            throw new not_found_error_1.default("MCQ not found");
        }
        res.status(200).json(mcq);
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.getMCQById = getMCQById;
const createMCQ = async (req, res, next) => {
    try {
        const mcq = MCQDTO_1.CreateMCQDTO.safeParse(req.body);
        if (!mcq.success) {
            throw new validation_error_1.default(mcq.error.message);
        }
        await Questions_1.default.create({
            year: mcq.data.year,
            questionNumber: mcq.data.questionNumber,
            question: mcq.data.question,
            options: mcq.data.options,
            correctAnswer: mcq.data.correctAnswer,
            chapter: mcq.data.chapter || "Web Designing Using Multimedia",
        });
        res.status(201).send();
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.createMCQ = createMCQ;
const deleteMCQ = async (req, res, next) => {
    try {
        const mcqId = req.params.id;
        await Questions_1.default.findByIdAndDelete(mcqId);
        res.status(200).send();
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.deleteMCQ = deleteMCQ;
const updateMCQ = async (req, res, next) => {
    try {
        const mcqId = req.params.id;
        const updatedMCQ = req.body;
        if (!updatedMCQ.year || !updatedMCQ.questionNumber || !updatedMCQ.question || !updatedMCQ.options || !updatedMCQ.correctAnswer) {
            throw new validation_error_1.default("Invalid MCQ data");
        }
        await Questions_1.default.findByIdAndUpdate(mcqId, updatedMCQ);
        res.status(200).send();
        return;
    }
    catch (error) {
        next(error);
    }
};
exports.updateMCQ = updateMCQ;
//# sourceMappingURL=mcq.js.map