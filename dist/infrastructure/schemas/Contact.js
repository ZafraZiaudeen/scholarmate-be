"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const contactSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: false, // Allow anonymous contacts
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'technical', 'feedback', 'bug_report', 'feature_request'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    adminResponse: {
        message: String,
        respondedBy: String,
        respondedAt: Date
    },
    attachments: [{
            filename: String,
            url: String,
            uploadedAt: {
                type: Date,
                default: Date.now
            }
        }],
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
contactSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Index for efficient querying
contactSchema.index({ userId: 1, createdAt: -1 });
contactSchema.index({ status: 1, priority: 1 });
contactSchema.index({ category: 1, createdAt: -1 });
contactSchema.index({ email: 1 });
const Contact = mongoose_1.default.model("Contact", contactSchema);
exports.default = Contact;
//# sourceMappingURL=Contact.js.map