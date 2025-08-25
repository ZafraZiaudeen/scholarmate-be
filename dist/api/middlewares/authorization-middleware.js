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
    if (!auth) {
        console.log('Authentication data is missing');
        throw new forbidden_error_1.default('Forbidden');
    }
    // Access role from sessionClaims.metadata
    const role = auth.sessionClaims?.metadata?.role;
    console.log('Role from sessionClaims.metadata:', role);
    if (!role) {
        console.log('No role found in sessionClaims.metadata');
        throw new forbidden_error_1.default('Forbidden');
    }
    if (typeof role !== 'string' || role.toLowerCase() !== 'admin') {
        console.log('Role is not admin, got:', role);
        throw new forbidden_error_1.default('Forbidden');
    }
    next();
};
exports.isAdmin = isAdmin;
//# sourceMappingURL=authorization-middleware.js.map