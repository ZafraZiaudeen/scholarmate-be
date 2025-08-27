export interface TaskContentDTO {
  bookContent?: {
    bookId: string;
    title: string;
    pageNumber: string;
    content: string;
    chapter: string;
  };
  questions?: Array<{
    mcqId: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    completed: boolean;
  }>;
}

export interface TaskProgressDTO {
  completed: boolean;
  completedAt?: Date;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface CreateTaskDTO {
  userId: string;
  title: string;
  description: string;
  type: 'learning' | 'practice' | 'assessment';
  section: string;
  content: TaskContentDTO;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface TaskDTO {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'learning' | 'practice' | 'assessment';
  section: string;
  content: TaskContentDTO;
  progress: TaskProgressDTO;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateTaskProgressDTO {
  taskId: string;
  userId: string;
  questionId?: string;
  isCorrect?: boolean;
  completed?: boolean;
}

export interface SearchResultDTO {
  bookResults: Array<{
    _id: string;
    title: string;
    pageNumber: string;
    content: string;
    chapter: string;
    score?: number;
  }>;
  mcqResults: Array<{
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    chapter: string;
    year: string;
    questionNumber: string;
    score?: number;
  }>;
}

export interface TaskGenerationRequestDTO {
  userId: string;
  query: string;
  section?: string;
  maxBooks?: number;
  maxQuestions?: number;
}
