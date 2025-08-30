"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const paper_1 = require("../application/paper");
const authentication_middleware_1 = require("./middlewares/authentication-middleware");
const authorization_middleware_1 = require("./middlewares/authorization-middleware");
const paperRouter = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});
// Apply authentication middleware to all routes
paperRouter.use(authentication_middleware_1.isAuthenticated);
// Admin-only routes (upload, update, delete)
paperRouter.post('/upload', authorization_middleware_1.isAdmin, upload.fields([
    { name: 'paper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
]), paper_1.uploadPaper);
paperRouter.patch('/:id', authorization_middleware_1.isAdmin, upload.fields([
    { name: 'paper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
]), paper_1.updatePaper);
paperRouter.delete('/:id', authorization_middleware_1.isAdmin, paper_1.deletePaper);
// Public routes (accessible by students and admins)
paperRouter.get('/', paper_1.getAllPapers);
paperRouter.get('/download/:fileId', paper_1.downloadFile);
paperRouter.get('/:id', paper_1.getPaperById);
exports.default = paperRouter;
//# sourceMappingURL=paper.js.map