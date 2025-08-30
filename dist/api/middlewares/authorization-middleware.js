"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const forbidden_error_1 = __importDefault(require("../../domain/errors/forbidden-error"));
const isAdmin = (req, res, next) => {
    const auth = req.auth();
    console.log('Auth object:', auth);
    console.log('Session claims:', JSON.stringify(auth?.sessionClaims, null, 2));
    console.log('Req.user:', req.user);
    if (!auth || !auth.userId) {
        console.log('Authentication data is missing');
        throw new forbidden_error_1.default('Unauthorized');
    }
    // Check if user extraction middleware has populated req.user
    if (!req.user) {
        console.log('User data not extracted');
        throw new forbidden_error_1.default('User data not available');
    }
    // Access role from req.user (populated by extractUserInfo middleware)
    const role = req.user.role;
    if (!role) {
        console.log('No role found in user data');
        throw new forbidden_error_1.default('No role specified');
    }
    if (typeof role !== 'string' || role.toLowerCase() !== 'admin') {
        console.log('Role is not admin, got:', role);
        throw new forbidden_error_1.default('User is not an admin');
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=authorization-middleware.js.map