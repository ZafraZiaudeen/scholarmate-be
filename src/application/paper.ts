import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {GridFSBucket} from 'mongodb';
import PastPaper from "../infrastructure/schemas/Paper";
import { Readable } from 'stream';

// Initialize GridFS
const conn = mongoose.connection;
let gfs: GridFSBucket;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'pastPapers'
  });
});

// Upload past paper and answer sheet
export const uploadPaper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, year, type, duration, description, paperType } = req.body;
    const files = req.files as { paper?: Express.Multer.File[], answerSheet?: Express.Multer.File[] };

    if (!title || !year || !type || !files?.paper?.[0]) {
      res.status(400).json({ error: 'Title, year, type, and paper file are required' });
      return;
    }

    // Upload paper to GridFS
    const paperFile = files.paper[0];
    const paperUploadStream = gfs.openUploadStream(paperFile.originalname, {
      metadata: { type: 'paper' }
    });
    const paperReadableStream = Readable.from(paperFile.buffer);
    paperReadableStream.pipe(paperUploadStream);

    const paperId = await new Promise<string>((resolve, reject) => {
      paperUploadStream.on('finish', () => resolve(paperUploadStream.id.toString()));
      paperUploadStream.on('error', reject);
    });

    // Upload answer sheet to GridFS (if provided)
    let answerSheetId: string | null = null;
    if (files.answerSheet?.[0]) {
      const answerSheetFile = files.answerSheet[0];
      const answerSheetUploadStream = gfs.openUploadStream(answerSheetFile.originalname, {
        metadata: { type: 'answerSheet' }
      });
      const answerSheetReadableStream = Readable.from(answerSheetFile.buffer);
      answerSheetReadableStream.pipe(answerSheetUploadStream);

      answerSheetId = await new Promise<string>((resolve, reject) => {
        answerSheetUploadStream.on('finish', () => resolve(answerSheetUploadStream.id.toString()));
        answerSheetUploadStream.on('error', reject);
      });
    }

    // Create past paper document
    const pastPaper = new PastPaper({
      title,
      year,
      type,
      duration: duration ? Number(duration) : undefined,
      description,
      paperType: paperType || 'past paper',
      paperFileId: paperId,
      answerSheetFileId: answerSheetId,
      status: 'Draft',
      createdBy: req.user?.id,
    });

    await pastPaper.save();

    res.status(201).json({
      success: true,
      message: 'Past paper uploaded successfully',
      data: pastPaper
    });
  } catch (error) {
    console.error('Error uploading past paper:', error);
    next(error);
  }
};

// Get all past papers (for both admin and students)
export const getAllPapers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { year, type, paperType, status } = req.query;
    const query: any = {};
    
    if (year) query.year = year;
    if (type) query.type = type;
    if (paperType) query.paperType = paperType;
    if (status && req.user?.isAdmin) query.status = status; // Only admins can filter by status

    const pastPapers = await PastPaper.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: pastPapers
    });
  } catch (error) {
    console.error('Error fetching past papers:', error);
    next(error);
  }
};

// Get past paper by ID
export const getPaperById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      res.status(404).json({ error: 'Past paper not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: pastPaper
    });
  } catch (error) {
    console.error('Error fetching past paper:', error);
    next(error);
  }
};

// Download paper or answer sheet
export const downloadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fileId } = req.params;
    const file = await gfs.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();

    if (!file || file.length === 0) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    res.set({
      'Content-Type': file[0].contentType || 'application/pdf',
      'Content-Disposition': `attachment; filename="${file[0].filename}"`
    });

    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error downloading file:', error);
    next(error);
  }
};

// Update past paper
export const updatePaper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, year, type, duration, description, paperType, status } = req.body;
    const files = req.files as { paper?: Express.Multer.File[], answerSheet?: Express.Multer.File[] };

    const updateData: any = {};
    if (title) updateData.title = title;
    if (year) updateData.year = year;
    if (type) updateData.type = type;
    if (duration) updateData.duration = Number(duration);
    if (description) updateData.description = description;
    if (paperType) updateData.paperType = paperType;
    if (status) updateData.status = status;

    // Update paper file if provided
    if (files?.paper?.[0]) {
      const paperFile = files.paper[0];
      const paperUploadStream = gfs.openUploadStream(paperFile.originalname, {
        metadata: { type: 'paper' }
      });
      const paperReadableStream = Readable.from(paperFile.buffer);
      paperReadableStream.pipe(paperUploadStream);

      updateData.paperFileId = await new Promise<string>((resolve, reject) => {
        paperUploadStream.on('finish', () => resolve(paperUploadStream.id.toString()));
        paperUploadStream.on('error', reject);
      });
    }

    // Update answer sheet file if provided
    if (files?.answerSheet?.[0]) {
      const answerSheetFile = files.answerSheet[0];
      const answerSheetUploadStream = gfs.openUploadStream(answerSheetFile.originalname, {
        metadata: { type: 'answerSheet' }
      });
      const answerSheetReadableStream = Readable.from(answerSheetFile.buffer);
      answerSheetReadableStream.pipe(answerSheetUploadStream);

      updateData.answerSheetFileId = await new Promise<string>((resolve, reject) => {
        answerSheetUploadStream.on('finish', () => resolve(answerSheetUploadStream.id.toString()));
        answerSheetUploadStream.on('error', reject);
      });
    }

    const pastPaper = await PastPaper.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    if (!pastPaper) {
      res.status(404).json({ error: 'Past paper not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Past paper updated successfully',
      data: pastPaper
    });
  } catch (error) {
    console.error('Error updating past paper:', error);
    next(error);
  }
};

// Delete past paper
export const deletePaper = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const pastPaper = await PastPaper.findById(id);

    if (!pastPaper) {
      res.status(404).json({ error: 'Past paper not found' });
      return;
    }

    // Delete associated files from GridFS
    if (pastPaper.paperFileId) {
      await gfs.delete(new mongoose.Types.ObjectId(pastPaper.paperFileId));
    }
    if (pastPaper.answerSheetFileId) {
      await gfs.delete(new mongoose.Types.ObjectId(pastPaper.answerSheetFileId));
    }

    await PastPaper.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Past paper deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting past paper:', error);
    next(error);
  }
};