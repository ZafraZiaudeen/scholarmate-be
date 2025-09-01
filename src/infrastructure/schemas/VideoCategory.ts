import mongoose from "mongoose";

const videoCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  searchQuery: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true,
    default: 'BookOpen'
  },
  color: {
    type: String,
    required: true,
    default: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
videoCategorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
videoCategorySchema.index({ isActive: 1, order: 1 });
videoCategorySchema.index({ createdBy: 1, createdAt: -1 });

const VideoCategory = mongoose.model("VideoCategory", videoCategorySchema);

export default VideoCategory;