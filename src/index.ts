import "dotenv/config";
import express from "express";
import connectDB from "./infrastructure/db";

import { clerkMiddleware } from "@clerk/express";

import cors from "cors";
import globalErrorHandlingMiddleware from "./api/middlewares/global-error-handling-middleware";
import mcqRouter from "./api/mcs";
import bookRouter from "./api/book";
import taskRouter from "./api/task";
import openRouter from "./api/openRouter";
import { extractUserInfo } from "./api/middlewares/user-extraction-middleware";

// Create an Express instance
const app = express();

app.use(clerkMiddleware());
// Middleware to parse the JSON data in the request body
app.use(express.json());
app.use(cors());
app.use(extractUserInfo);

connectDB();

app.use("/api/book", bookRouter);
app.use("/api/mcq", mcqRouter);
app.use("/api/task", taskRouter);
app.use("/api/openrouter", openRouter);


app.use(globalErrorHandlingMiddleware);

// Define the port to run the server
const PORT = 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
