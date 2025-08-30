"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const openRouter = express_1.default.Router();
async function callOpenRouter(inputData, retries = 3, delay = 3000) {
    try {
        return await axios_1.default.post("https://openrouter.ai/api/v1/chat/completions", inputData, {
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "MyApp"
            }
        });
    }
    catch (error) {
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
openRouter.post("/", async (req, res) => {
    const inputData = req.body;
    try {
        const response = await callOpenRouter(inputData);
        res.json(response.data);
    }
    catch (error) {
        console.error("Error calling OpenRouter:", error);
        res.status(500).json({ error: "Failed to call OpenRouter" });
    }
});
exports.default = openRouter;
//# sourceMappingURL=openRouter.js.map