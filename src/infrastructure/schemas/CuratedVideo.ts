import mongoose from "mongoose";

const curatedVideoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    required: true
  },
  publishedAt: {
    type: String,
    required: true
  },
  duration: {
    type: String
  },
  viewCount: {
    type: String
  },
  likeCount: {
    type: String
  },
  url: {
    type: String,
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VideoCategory',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [String],
  adminNotes: {
    type: String
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
curatedVideoSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
curatedVideoSchema.index({ categoryId: 1, isActive: 1, order: 1 });
curatedVideoSchema.index({ createdBy: 1, createdAt: -1 });
curatedVideoSchema.index({ videoId: 1 });
curatedVideoSchema.index({ tags: 1 });

const CuratedVideo = mongoose.model("CuratedVideo", curatedVideoSchema);

export default CuratedVideo;