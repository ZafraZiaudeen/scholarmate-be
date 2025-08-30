"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserInfo = void 0;
const backend_1 = require("@clerk/backend");
// Create Clerk client
const clerkClient = (0, backend_1.createClerkClient)({
    secretKey: process.env.CLERK_SECRET_KEY
});
const extractUserInfo = async (req, res, next) => {
    try {
        const auth = req.auth?.();
        if (auth && auth.userId) {
            console.log('Full auth object:', JSON.stringify(auth, null, 2));
            console.log('Session claims:', JSON.stringify(auth.sessionClaims, null, 2));
            try {
                const user = await clerkClient.users.getUser(auth.userId);
                console.log('Fetched user from Clerk API:', JSON.stringify(user, null, 2));
                req.user = {
                    id: auth.userId,
                    email: user.emailAddresses[0]?.emailAddress ?? undefined,
                    firstName: user.firstName ?? undefined,
                    lastName: user.lastName ?? undefined,
                    role: user.publicMetadata?.role,
                };
                console.log('Extracted user:', req.user);
            }
            catch (error) {
                console.error('Error fetching user from Clerk API:', error);
                req.user = {
                    id: auth.userId,
                    email: auth.sessionClaims?.email,
                    firstName: auth.sessionClaims?.first_name,
                    lastName: auth.sessionClaims?.last_name,
                    role: auth.sessionClaims?.public_metadata?.role,
                };
            }
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