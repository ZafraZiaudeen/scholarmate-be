
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  isTask: {
    type: Boolean,
    default: false
  },
  content: {
    bookContent: {
      bookId: mongoose.Schema.Types.ObjectId,
      title: String,
      pageNumber: String,
      content: String,
      chapter: String
    },
    questions: [{
      mcqId: mongoose.Schema.Types.ObjectId,
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

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;