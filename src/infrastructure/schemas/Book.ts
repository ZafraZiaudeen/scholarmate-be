import mongoose from "mongoose";

    const bookSchema = new mongoose.Schema({
      title: {
        type: String,
        required: true,
      },
      pageNumber: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      chapter: {
        type: String,
        default: "Web Designing Using Multimedia",
      },
    });

    // Add unique index on title and pageNumber
    bookSchema.index({ title: 1, pageNumber: 1 }, { unique: true });

    const Book = mongoose.model("Book", bookSchema);

    export default Book;