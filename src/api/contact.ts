import express from "express";
import { 
  submitContact, 
  getAllContacts, 
  getContactById, 
  updateContactStatus, 
  getUserContacts, 
  deleteContact, 
  getContactStats 
} from "../application/contact";
import { isAuthenticated } from "./middlewares/authentication-middleware";
import { isAdmin } from "./middlewares/authorization-middleware";

const contactRouter = express.Router();

// Public routes
contactRouter.post("/submit", (req, res, next) => {
  submitContact(req, res, next).catch(next);
});

// User routes (authenticated)
contactRouter.get("/user", isAuthenticated, (req, res, next) => {
  getUserContacts(req, res, next).catch(next);
});

// Admin routes
contactRouter.get("/", isAuthenticated, isAdmin, (req, res, next) => {
  getAllContacts(req, res, next).catch(next);
});

contactRouter.get("/stats", isAuthenticated, isAdmin, (req, res, next) => {
  getContactStats(req, res, next).catch(next);
});

contactRouter.get("/:contactId", isAuthenticated, isAdmin, (req, res, next) => {
  getContactById(req, res, next).catch(next);
});

contactRouter.patch("/:contactId", isAuthenticated, isAdmin, (req, res, next) => {
  updateContactStatus(req, res, next).catch(next);
});

contactRouter.delete("/:contactId", isAuthenticated, isAdmin, (req, res, next) => {
  deleteContact(req, res, next).catch(next);
});

export default contactRouter;