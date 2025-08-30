import { Request, Response, NextFunction } from "express";
import Contact from "../infrastructure/schemas/Contact";
import ValidationError from "../domain/errors/validation-error";
import NotFoundError from "../domain/errors/not-found-error";
import emailService from "../utils/email";

// Submit a new contact form
export const submitContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, subject, message, category, priority } = req.body;
    const userId = req.user?.id || null;

    // Validation
    if (!name || !email || !subject || !message) {
      throw new ValidationError("Name, email, subject, and message are required");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError("Please provide a valid email address");
    }

    // Create new contact
    const contact = new Contact({
      userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      category: category || 'general',
      priority: priority || 'medium'
    });

    await contact.save();

    // Send confirmation email to user (fire and forget - don't wait for response)
    emailService.sendContactConfirmation({
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      category: contact.category,
      priority: contact.priority
    }).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });

    // Send notification email to admin (fire and forget - don't wait for response)
    emailService.sendAdminNotification({
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      category: contact.category,
      priority: contact.priority
    }).catch(error => {
      console.error('Failed to send admin notification email:', error);
    });

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully. We'll get back to you soon!",
      data: {
        id: contact._id,
        status: contact.status,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all contacts (Admin only)
export const getAllContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      priority,
      search 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get contact by ID (Admin only)
export const getContactById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    res.json({
      success: true,
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// Update contact status (Admin only)
export const updateContactStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;
    const { status, adminResponse } = req.body;
    const adminUserId = req.user?.id;

    const contact = await Contact.findById(contactId);
    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    // Update status
    if (status) {
      contact.status = status;
    }

    // Add admin response if provided
    if (adminResponse) {
      contact.adminResponse = {
        message: adminResponse,
        respondedBy: adminUserId,
        respondedAt: new Date()
      };

      // Send response email to user when admin replies (fire and forget)
      emailService.sendUserResponse({
        userName: contact.name,
        userEmail: contact.email,
        originalSubject: contact.subject,
        originalMessage: contact.message,
        adminResponse: adminResponse,
        adminName: "Scholarmate Support Team" // You might want to get admin name from user service
      }).catch(error => {
        console.error('Failed to send response email to user:', error);
      });
    }

    await contact.save();

    res.json({
      success: true,
      message: "Contact updated successfully",
      data: contact
    });
  } catch (error) {
    next(error);
  }
};

// Get user's own contacts
export const getUserContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const contacts = await Contact.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Contact.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete contact (Admin only)
export const deleteContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contactId } = req.params;

    const contact = await Contact.findByIdAndDelete(contactId);
    if (!contact) {
      throw new NotFoundError("Contact not found");
    }

    res.json({
      success: true,
      message: "Contact deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Get contact statistics (Admin only)
export const getContactStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: { $sum: { $cond: [{ $eq: ["$status", "new"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Contact.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Contact.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          total: 0,
          new: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0
        },
        byCategory: categoryStats,
        byPriority: priorityStats
      }
    });
  } catch (error) {
    next(error);
  }
};