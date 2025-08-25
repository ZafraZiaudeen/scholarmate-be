import fs from "fs";
import path from "path";
import axios from "axios";

async function parsePdfAndAddToDB() {
  const pdfPath = path.join(__dirname, "../document/ICT G-11 E (1).pdf");
  if (!fs.existsSync(pdfPath)) {
    console.error("PDF file not found at:", pdfPath);
    return;
  }

  // Import pdfjs-dist CommonJS version
  const pdfjsLib = require("pdfjs-dist/build/pdf.js");
  // Set the worker source
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.js");

  const dataBuffer = fs.readFileSync(pdfPath);
  const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  console.log("Total pages in PDF:", numPages);

  const bookEntries: any[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ").trim().replace(/\s+/g, " ");

    bookEntries.push({
      title: "ICT G-11 E (1).pdf",
      pageNumber: `Page ${pageNum}`,
      content: pageText || "Empty page",
      chapter: "Web Designing Using Multimedia",
    });
  }

  console.log("Total parsed pages:", bookEntries.length);

  for (const entry of bookEntries) {
    try {
      const response = await axios.post("http://localhost:8000/api/book", entry);
      console.log(`Successfully added book page: ${entry.pageNumber}`, response.data);
    } catch (error: any) {
      console.error(`Failed to add ${entry.pageNumber}:`, error.response?.status || "No status", error.response?.data || error.message);
    }
  }
}

parsePdfAndAddToDB().catch(console.error);