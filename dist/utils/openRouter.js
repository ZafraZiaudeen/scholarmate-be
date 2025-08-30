"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callOpenRouter = callOpenRouter;
const axios_1 = __importDefault(require("axios"));
async function callOpenRouter(prompt, options = {}) {
    const { max_tokens = 1000, temperature = 0.7, model = 'deepseek/deepseek-r1:free' } = options;
    try {
        const response = await axios_1.default.post('https://openrouter.ai/api/v1/chat/completions', {
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens,
            temperature
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0]?.message?.content || '';
    }
    catch (error) {
        console.error('Error calling OpenRouter:', error);
        // Log more details about the error
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        throw new Error('Failed to call OpenRouter API');
    }
}
//# sourceMappingURL=openRouter.js.map