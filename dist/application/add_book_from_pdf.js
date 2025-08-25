"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
async function parsePdfAndAddToDB() {
    const pdfPath = path_1.default.join(__dirname, "../document/ICT G-11 E (1).pdf");
    if (!fs_1.default.existsSync(pdfPath)) {
        console.error("PDF file not found at:", pdfPath);
        return;
    }
    // Import pdfjs-dist CommonJS version
    const pdfjsLib = require("pdfjs-dist/build/pdf.js");
    // Set the worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.js");
    const dataBuffer = fs_1.default.readFileSync(pdfPath);
    const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log("Total pages in PDF:", numPages);
    const bookEntries = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str).join(" ").trim().replace(/\s+/g, " ");
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
            const response = await axios_1.default.post("http://localhost:8000/api/book", entry);
            console.log(`Successfully added book page: ${entry.pageNumber}`, response.data);
        }
        catch (error) {
            console.error(`Failed to add ${entry.pageNumber}:`, error.response?.status || "No status", error.response?.data || error.message);
        }
    }
}
parsePdfAndAddToDB().catch(console.error);
//# sourceMappingURL=add_book_from_pdf.js.map