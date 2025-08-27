"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserInfo = void 0;
const extractUserInfo = (req, res, next) => {
    try {
        const auth = req.auth?.();
        if (auth && auth.userId) {
            // Add user information to the request object
            req.user = {
                id: auth.userId,
                // Add other user properties if available from Clerk
                email: auth.sessionClaims?.email,
                firstName: auth.sessionClaims?.firstName,
                lastName: auth.sessionClaims?.lastName
            };
        }
        next();
    }
    catch (error) {
        console.error('Error extracting user info:', error);
        next();
    }
};
exports.extractUserInfo = extractUserInfo;
//# sourceMappingURL=user-extraction-middleware.js.map