import mongoose from "mongoose";

const mcqSchema = new mongoose.Schema({
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

const MCQ = mongoose.model("MCQ", mcqSchema);

export default MCQ;