import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";

// Get all users from Clerk
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    
    const users = await clerkClient.users.getUserList({
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      query: search as string,
    });

    // Transform users to include relevant information
    const transformedUsers = users.data.map(user => ({
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.publicMetadata?.role || 'user',
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      imageUrl: user.imageUrl,
      banned: user.banned,
      locked: user.locked,
    }));

    res.status(200).json({
      success: true,
      data: transformedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: users.totalCount,
        totalPages: Math.ceil(users.totalCount / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users",
    });
  }
};

// Get user by ID from Clerk
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    const user = await clerkClient.users.getUser(userId);

    const transformedUser = {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.publicMetadata?.role || 'user',
      createdAt: user.createdAt,
      lastSignInAt: user.lastSignInAt,
      imageUrl: user.imageUrl,
      banned: user.banned,
      locked: user.locked,
      emailAddresses: user.emailAddresses,
      phoneNumbers: user.phoneNumbers,
    };

    res.status(200).json({
      success: true,
      data: transformedUser,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(404).json({
      success: false,
      error: "User not found",
    });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be 'user' or 'admin'",
      });
    }

    const updatedUser = await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress || '',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
      role: updatedUser.publicMetadata?.role || 'user',
      createdAt: updatedUser.createdAt,
      lastSignInAt: updatedUser.lastSignInAt,
      imageUrl: updatedUser.imageUrl,
      banned: updatedUser.banned,
      locked: updatedUser.locked,
    };

    res.status(200).json({
      success: true,
      data: transformedUser,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user role",
    });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account",
      });
    }

    await clerkClient.users.deleteUser(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete user",
    });
  }
};

// Ban/Unban user
export const toggleUserBan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;

    // Prevent admin from banning themselves
    if (userId === req.user?.id) {
      return res.status(400).json({
        success: false,
        error: "Cannot ban your own account",
      });
    }

    const user = await clerkClient.users.getUser(userId);
    
    let updatedUser;
    if (user.banned) {
      updatedUser = await clerkClient.users.unbanUser(userId);
    } else {
      updatedUser = await clerkClient.users.banUser(userId);
    }

    const transformedUser = {
      id: updatedUser.id,
      email: updatedUser.emailAddresses[0]?.emailAddress || '',
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
      role: updatedUser.publicMetadata?.role || 'user',
      createdAt: updatedUser.createdAt,
      lastSignInAt: updatedUser.lastSignInAt,
      imageUrl: updatedUser.imageUrl,
      banned: updatedUser.banned,
      locked: updatedUser.locked,
    };

    res.status(200).json({
      success: true,
      data: transformedUser,
      message: `User ${updatedUser.banned ? 'banned' : 'unbanned'} successfully`,
    });
  } catch (error) {
    console.error("Error toggling user ban:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update user ban status",
    });
  }
};