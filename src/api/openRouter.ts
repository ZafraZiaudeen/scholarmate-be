import express from "express";
import axios from "axios";

const openRouter = express.Router();

async function callOpenRouter(inputData: any, retries = 3, delay = 3000) {
    try {
        return await axios.post("https://openrouter.ai/api/v1/chat/completions", inputData, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "MyApp"
            }
        });
    } catch (error: any) {
        if (error.response?.status === 429 && retries > 0) {
            // Wait for the specified delay
            await new Promise(resolve => setTimeout(resolve, delay));
            // Retry with exponential backoff
            return callOpenRouter(inputData, retries - 1, delay * 2);
        }
        throw error;
    }
}

// POST endpoint to interact with OpenRouter model
openRouter.post("/", async (req, res, next) => { 
    const inputData = req.body;

    try {
        const response = await callOpenRouter(inputData);
        res.json(response.data);
    } catch (error) {
        console.error("Error calling OpenRouter:", error);
        next(error); // Pass error to global error handler
    }
});

export default openRouter;
