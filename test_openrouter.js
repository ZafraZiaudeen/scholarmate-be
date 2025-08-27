const axios = require("axios");
require("dotenv").config();

async function testOpenRouter(retries = 3, delay = 3000) {
  try {
    console.log("Testing OpenRouter API endpoint...");
    console.log("API Key present:", !!process.env.OPENROUTER_API_KEY);

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1:free",
        messages: [{ role: "user", content: "Hello, can you introduce yourself?" }],
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:8000",
          "X-Title": "MyApp",
        },
      }
    );

    console.log("✅ OpenRouter API test successful!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.warn(`⚠️ Rate limited. Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
      return testOpenRouter(retries - 1, delay * 2); // exponential backoff
    }

    console.error("❌ OpenRouter API test failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

testOpenRouter();   


