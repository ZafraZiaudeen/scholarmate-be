import { NextFunction, Request, Response } from "express";
import MCQ from "../infrastructure/schemas/Questions"; 
import NotFoundError from "../domain/errors/not-found-error";
import ValidationError from "../domain/errors/validation-error";
import { CreateMCQDTO } from "../domain/dto/MCQDTO";

export const getAllMCQs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcqs = await MCQ.find();
    res.status(200).json(mcqs);
    return;
  } catch (error) {
    next(error);
  }
};

export const getMCQById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcqId = req.params.id;
    const mcq = await MCQ.findById(mcqId);
    if (!mcq) {
      throw new NotFoundError("MCQ not found");
    }
    res.status(200).json(mcq);
    return;
  } catch (error) {
    next(error);
  }
};

export const createMCQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcq = CreateMCQDTO.safeParse(req.body);
    if (!mcq.success) {
      throw new ValidationError(mcq.error.message);
    }

    await MCQ.create({
      year: mcq.data.year,
      questionNumber: mcq.data.questionNumber,
      question: mcq.data.question,
      options: mcq.data.options,
      correctAnswer: mcq.data.correctAnswer,
      chapter: mcq.data.chapter || "Web Designing Using Multimedia",
    });

    res.status(201).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const deleteMCQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcqId = req.params.id;
    await MCQ.findByIdAndDelete(mcqId);
    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};

export const updateMCQ = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mcqId = req.params.id;
    const updatedMCQ = req.body;

    if (!updatedMCQ.year || !updatedMCQ.questionNumber || !updatedMCQ.question || !updatedMCQ.options || !updatedMCQ.correctAnswer) {
      throw new ValidationError("Invalid MCQ data");
    }

    await MCQ.findByIdAndUpdate(mcqId, updatedMCQ);
    res.status(200).send();
    return;
  } catch (error) {
    next(error);
  }
};