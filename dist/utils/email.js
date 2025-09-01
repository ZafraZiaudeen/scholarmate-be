"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }
    async sendEmail(options) {
        try {
            const mailOptions = {
                from: process.env.SMTP_FROM || `"Scholarmate Support" <${process.env.SMTP_USER}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text || options.html.replace(/<[^>]*>/g, ''),
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return true;
        }
        catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }
    // Send confirmation email to user when they submit contact form
    async sendContactConfirmation(data) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Scholarmate!</h1>
          </div>
          <div class="content">
            <p>Hello ${data.name},</p>
            <p>We've received your message and will get back to you within 24 hours.</p>
            
            <h3>Your Message Details:</h3>
            <p><strong>Subject:</strong> ${data.subject}</p>
            <p><strong>Category:</strong> ${data.category || 'General'}</p>
            <p><strong>Priority:</strong> ${data.priority || 'Medium'}</p>
            
            <blockquote style="background: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              ${data.message}
            </blockquote>
            
            <p>Our support team will review your inquiry and respond as soon as possible.</p>
            
            <p>Best regards,<br>The Scholarmate Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        return this.sendEmail({
            to: data.email,
            subject: `Contact Confirmation: ${data.subject}`,
            html,
        });
    }
    // Send notification email to admin when new contact is submitted
    async sendAdminNotification(data) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .urgent { background: #fff5f5; border: 2px solid #ff6b6b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
          </div>
          <div class="content ${data.priority === 'urgent' ? 'urgent' : ''}">
            <h2>New message from ${data.name}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
              <p><strong>Subject:</strong> ${data.subject}</p>
              <p><strong>Category:</strong> ${data.category || 'General'}</p>
              <p><strong>Priority:</strong> ${data.priority || 'Medium'}</p>
              <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <h3>Message:</h3>
            <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;">
              ${data.message}
            </blockquote>
            
            <p style="color: ${data.priority === 'urgent' ? '#e74c3c' : '#666'}; font-weight: bold;">
              ${data.priority === 'urgent' ? '⚠️ URGENT: Please respond within 4 hours' : 'Please respond within 24 hours'}
            </p>
            
            <p><a href="${process.env.ADMIN_URL || 'http://localhost:3000/admin/contact'}" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View in Admin Panel</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
        const adminEmail = process.env.ADMIN_EMAIL || 'zafra.fp12@gmail.com';
        return this.sendEmail({
            to: adminEmail,
            subject: `[${data.priority?.toUpperCase() || 'MEDIUM'}] New Contact: ${data.subject}`,
            html,
        });
    }
    // Send response email to user when admin replies
    async sendUserResponse(data) {
        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .response { background: #e8f4f8; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Response to Your Inquiry</h1>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>Thank you for contacting Scholarmate. Here's our response to your inquiry:</p>
            
            <h3>Your Original Message:</h3>
            <p><strong>Subject:</strong> ${data.originalSubject}</p>
            <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0;">
              ${data.originalMessage}
            </blockquote>
            
            <h3>Our Response:</h3>
            <div class="response">
              ${data.adminResponse}
            </div>
            
            <p>This inquiry has been marked as resolved. If you need further assistance, please don't hesitate to contact us again.</p>
            
            <p>Best regards,<br>${data.adminName}<br>Scholarmate Support Team</p>
          </div>
          <div class="footer" style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
        return this.sendEmail({
            to: data.userEmail,
            subject: `Re: ${data.originalSubject}`,
            html,
        });
    }
    // Test email connection
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('SMTP connection verified successfully');
            return true;
        }
        catch (error) {
            console.error('SMTP connection failed:', error);
            return false;
        }
    }
}
exports.default = new EmailService();
//# sourceMappingURL=email.js.map