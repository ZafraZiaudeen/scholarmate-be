"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contact_1 = require("../application/contact");
const authentication_middleware_1 = require("./middlewares/authentication-middleware");
const authorization_middleware_1 = require("./middlewares/authorization-middleware");
const contactRouter = express_1.default.Router();
// Public routes
contactRouter.post("/submit", (req, res, next) => {
    (0, contact_1.submitContact)(req, res, next).catch(next);
});
// User routes (authenticated)
contactRouter.get("/user", authentication_middleware_1.isAuthenticated, (req, res, next) => {
    (0, contact_1.getUserContacts)(req, res, next).catch(next);
});
// Admin routes
contactRouter.get("/", authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, contact_1.getAllContacts)(req, res, next).catch(next);
});
contactRouter.get("/stats", authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, contact_1.getContactStats)(req, res, next).catch(next);
});
contactRouter.get("/:contactId", authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, contact_1.getContactById)(req, res, next).catch(next);
});
contactRouter.patch("/:contactId", authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, contact_1.updateContactStatus)(req, res, next).catch(next);
});
contactRouter.delete("/:contactId", authentication_middleware_1.isAuthenticated, authorization_middleware_1.isAdmin, (req, res, next) => {
    (0, contact_1.deleteContact)(req, res, next).catch(next);
});
exports.default = contactRouter;
//# sourceMappingURL=contact.js.map