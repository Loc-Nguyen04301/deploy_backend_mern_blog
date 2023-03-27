import express from "express";
import authController from "../controllers/auth.controller";
import { validRegister } from "../middlewares/valid";

const router = express.Router();

router.post("/register", validRegister, authController.register);
router.post("/active", authController.activeAccount);
router.post("/login", authController.login);
router.get("/refresh_token", authController.refreshToken);
router.get("/logout", authController.logout);
router.post("/login_sms", authController.loginSMS);
// router.post("/sms_verify",authController.smsVerify)

export default router;
