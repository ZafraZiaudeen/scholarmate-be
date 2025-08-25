import pdfParse from "pdf-parse";
import axios from "axios";
import fs from "fs";
import path from "path";

async function parsePdfAndAddToDB() {
  const pdfPath = path.join(__dirname, "../document/mcqs_tex.pdf"); 

  // Check if file exists
  if (!fs.existsSync(pdfPath)) {
    console.error("PDF file not found at:", pdfPath);
    return;
  }

  // Read and parse PDF
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(dataBuffer);
  console.log("Raw PDF text length:", pdfData.text.length);
  console.log("Raw PDF text sample (first 1000 chars):", pdfData.text.substring(0, 1000));

  const text = pdfData.text.trim();
  const mcqs: any[] = [];

  // Split text by year/section (assuming new year starts with "20\d\d paper")
  const sections = text.split(/(?=20\d\d paper)/).filter(section => section.trim());

  for (const section of sections) {
    // Extract year from the start of the section
    const yearMatch = section.match(/(\d{4}) paper/);
    if (!yearMatch) continue;
    const year = yearMatch[1];

    // Split by "Question" to get individual questions, preserving context
    const questionBlocks = section.split(/(?=Question \d+[:\s])/).filter(block => block.trim() && block.includes("Question"));

    for (const block of questionBlocks) {
      const lines = block.trim().split("\n").map(line => line.trim()).filter(line => line);

      // Extract question number and question
      const questionMatch = block.match(/Question (\d+):(.+)/);
      if (!questionMatch) continue;
      const questionNumber = questionMatch[1];
      let question = questionMatch[2].trim().replace(/\s+/g, " "); 

      let options: string[] = [];
      let correctAnswer = "";
      let collectingOptions = false;

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line.startsWith("•")) {
          collectingOptions = true;
          options.push(line.replace("•", "").trim());
        } else if (line.startsWith("Correct Answer:")) {
          correctAnswer = line.replace("Correct Answer:", "").trim();
          break; // Stop after finding correct answer
        } else if (collectingOptions && !line.startsWith("Correct Answer:")) {
          options[options.length - 1] += " " + line.trim(); 
        }
      }

      if (questionNumber && question && options.length > 0 && correctAnswer) {
        mcqs.push({
          year,
          questionNumber: `Q${questionNumber}`,
          question,
          options,
          correctAnswer,
        });
      } else {
        console.warn(`Skipped incomplete MCQ in ${year} Q${questionNumber}:`, { question, options, correctAnswer });
      }
    }
  }

  console.log("Total parsed MCQs:", mcqs.length); // Debug: Log total parsed
  console.log("Parsed MCQs:", mcqs); // Debug: Log all parsed MCQs

  // Send to API
  for (const mcq of mcqs) {
    try {
      await axios.post("http://localhost:8000/api/mcq", {
        year: mcq.year,
        questionNumber: mcq.questionNumber,
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correctAnswer,
        chapter: "Web Designing Using Multimedia",
      });
      console.log(`Successfully added MCQ: ${mcq.year} ${mcq.questionNumber}`);
    } catch (error: any) {
      console.error(`Failed to add ${mcq.year} ${mcq.questionNumber}:`, error.response?.status, error.response?.data || error.message);
    }
  }
}

parsePdfAndAddToDB().catch(console.error);