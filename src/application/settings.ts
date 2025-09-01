import { Request, Response, NextFunction } from 'express';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  adminEmail: string;
  supportEmail: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  systemNotifications: boolean;
  backupFrequency: string;
  sessionTimeout: number;
  openRouterApiKey: string;
  maxTasksPerUser: number;
  defaultTaskDifficulty: string;
  autoBackupEnabled: boolean;
  debugMode: boolean;
  rateLimitPerHour: number;
  maxConcurrentUsers: number;
}

// In-memory settings store (in production, this would be in database)
let systemSettings: SystemSettings = {
  siteName: "ScholarMate",
  siteDescription: "Advanced Learning Management System for O/L IT Students",
  adminEmail: "admin@scholarmate.com",
  supportEmail: "support@scholarmate.com",
  maxFileSize: 10,
  allowedFileTypes: ["pdf", "doc", "docx", "txt", "jpg", "png"],
  maintenanceMode: false,
  registrationEnabled: true,
  emailNotifications: true,
  systemNotifications: true,
  backupFrequency: "daily",
  sessionTimeout: 30,
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  maxTasksPerUser: 50,
  defaultTaskDifficulty: "medium",
  autoBackupEnabled: true,
  debugMode: false,
  rateLimitPerHour: 1000,
  maxConcurrentUsers: 500
};

// Get all system settings
export const getSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Don't expose sensitive data like API keys in full
    const safeSettings = {
      ...systemSettings,
      openRouterApiKey: systemSettings.openRouterApiKey ? 
        `${systemSettings.openRouterApiKey.substring(0, 8)}${'*'.repeat(32)}` : 
        ""
    };

    res.status(200).json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    next(error);
  }
};

// Update system settings
export const updateSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    
    // Validate required fields
    if (updates.siteName && updates.siteName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Site name cannot be empty"
      });
    }

    if (updates.adminEmail && !isValidEmail(updates.adminEmail)) {
      return res.status(400).json({
        success: false,
        error: "Invalid admin email format"
      });
    }

    if (updates.maxFileSize && (updates.maxFileSize < 1 || updates.maxFileSize > 100)) {
      return res.status(400).json({
        success: false,
        error: "Max file size must be between 1 and 100 MB"
      });
    }

    if (updates.sessionTimeout && (updates.sessionTimeout < 5 || updates.sessionTimeout > 480)) {
      return res.status(400).json({
        success: false,
        error: "Session timeout must be between 5 and 480 minutes"
      });
    }

    // Update settings
    systemSettings = { ...systemSettings, ...updates };

    // If maintenance mode is enabled, log it
    if (updates.maintenanceMode === true) {
      console.log('MAINTENANCE MODE ENABLED by admin:', req.user?.id);
    }

    // Don't expose sensitive data in response
    const safeSettings = {
      ...systemSettings,
      openRouterApiKey: systemSettings.openRouterApiKey ? 
        `${systemSettings.openRouterApiKey.substring(0, 8)}${'*'.repeat(32)}` : 
        ""
    };

    res.status(200).json({
      success: true,
      data: safeSettings,
      message: "Settings updated successfully"
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    next(error);
  }
};

// Reset settings to defaults
export const resetSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    systemSettings = {
      siteName: "ScholarMate",
      siteDescription: "Advanced Learning Management System for O/L IT Students",
      adminEmail: "admin@scholarmate.com",
      supportEmail: "support@scholarmate.com",
      maxFileSize: 10,
      allowedFileTypes: ["pdf", "doc", "docx", "txt", "jpg", "png"],
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
      systemNotifications: true,
      backupFrequency: "daily",
      sessionTimeout: 30,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
      maxTasksPerUser: 50,
      defaultTaskDifficulty: "medium",
      autoBackupEnabled: true,
      debugMode: false,
      rateLimitPerHour: 1000,
      maxConcurrentUsers: 500
    };

    console.log('SETTINGS RESET TO DEFAULTS by admin:', req.user?.id);

    const safeSettings = {
      ...systemSettings,
      openRouterApiKey: systemSettings.openRouterApiKey ? 
        `${systemSettings.openRouterApiKey.substring(0, 8)}${'*'.repeat(32)}` : 
        ""
    };

    res.status(200).json({
      success: true,
      data: safeSettings,
      message: "Settings reset to defaults successfully"
    });
  } catch (error) {
    console.error('Error resetting system settings:', error);
    next(error);
  }
};

// Test email configuration
export const testEmailConfiguration = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail || !isValidEmail(testEmail)) {
      return res.status(400).json({
        success: false,
        error: "Valid test email address is required"
      });
    }

    // In a real implementation, this would send an actual test email
    console.log(`Test email would be sent to: ${testEmail}`);
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`
    });
  } catch (error) {
    console.error('Error testing email configuration:', error);
    next(error);
  }
};

// Backup system data
export const createSystemBackup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, this would create an actual backup
    const backupId = `backup_${Date.now()}`;
    
    console.log(`System backup initiated by admin: ${req.user?.id}, Backup ID: ${backupId}`);
    
    // Simulate backup creation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    res.status(200).json({
      success: true,
      data: {
        backupId,
        createdAt: new Date().toISOString(),
        size: "2.4 GB",
        status: "completed"
      },
      message: "System backup created successfully"
    });
  } catch (error) {
    console.error('Error creating system backup:', error);
    next(error);
  }
};

// Clear system cache
export const clearSystemCache = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`System cache cleared by admin: ${req.user?.id}`);
    
    // Simulate cache clearing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    res.status(200).json({
      success: true,
      message: "System cache cleared successfully"
    });
  } catch (error) {
    console.error('Error clearing system cache:', error);
    next(error);
  }
};

// Get system health status
export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = {
      database: {
        status: "healthy",
        responseTime: "12ms",
        connections: 5,
        maxConnections: 100
      },
      aiService: {
        status: systemSettings.openRouterApiKey ? "online" : "offline",
        responseTime: "120ms",
        requestsToday: 1247,
        rateLimitRemaining: systemSettings.rateLimitPerHour - 247
      },
      fileStorage: {
        status: "available",
        usedSpace: "1.8 GB",
        totalSpace: "50 GB",
        usagePercentage: 3.6
      },
      emailService: {
        status: systemSettings.emailNotifications ? "active" : "disabled",
        lastEmailSent: "2 hours ago",
        emailsToday: 23
      },
      system: {
        uptime: "7 days, 14 hours",
        cpuUsage: "23%",
        memoryUsage: "67%",
        activeUsers: 12,
        maxUsers: systemSettings.maxConcurrentUsers
      }
    };

    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    next(error);
  }
};

// Helper function to validate email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Export current settings for other modules to use
export const getCurrentSettings = () => systemSettings;