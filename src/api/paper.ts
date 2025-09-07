import express from "express";
import multer from "multer";
import { uploadPaper, getAllPapers, getPaperById, downloadFile, updatePaper, deletePaper } from "../application/paper";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { isAdmin } from "./middlewares/authorization-middleware";

const paperRouter = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Apply authentication middleware to all routes
paperRouter.use(isAuthenticated);

// Admin-only routes (upload, update, delete)
paperRouter.post('/upload',
  isAdmin,
  upload.fields([
    { name: 'paper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
  ]),
  (req, res, next) => {
    uploadPaper(req, res, next).catch(next);
  }
);

paperRouter.patch('/:id',
  isAdmin,
  upload.fields([
    { name: 'paper', maxCount: 1 },
    { name: 'answerSheet', maxCount: 1 }
  ]),
  (req, res, next) => {
    updatePaper(req, res, next).catch(next);
  }
);

paperRouter.delete('/:id',
  isAdmin,
  (req, res, next) => {
    deletePaper(req, res, next).catch(next);
  }
);

// Public routes (accessible by students and admins)
paperRouter.get('/', (req, res, next) => {
  getAllPapers(req, res, next).catch(next);
});
paperRouter.get('/download/:fileId', (req, res, next) => {
  downloadFile(req, res, next).catch(next);
});
paperRouter.get('/:id', (req, res, next) => {
  getPaperById(req, res, next).catch(next);
});

export default paperRouter;