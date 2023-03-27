import express from "express";
import userController from "../controllers/user.controller";
import auth from "../middlewares/auth";

const router = express.Router();
// auth function to check authentication status when call API
router.patch("/", auth, userController.updateUser);
router.patch("/reset_password", auth, userController.resetPassword);
router.get("/:id", userController.getUser);

export default router;
