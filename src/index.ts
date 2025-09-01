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
import paperRouter from "./api/paper";
import userRouter from "./api/user";
import contactRouter from "./api/contact";
import analyticsRouter from "./api/analytics";
import settingsRouter from "./api/settings";
import youtubeRouter from "./api/youtube";
import gamificationRouter from "./api/gamification";
import videoManagementRouter from "./api/videoManagement";
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
app.use("/api/paper", paperRouter);
app.use("/api/user", userRouter);
app.use("/api/contact", contactRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api/video-management", videoManagementRouter);


app.use(globalErrorHandlingMiddleware);

// Define the port to run the server
const PORT = 8000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));
