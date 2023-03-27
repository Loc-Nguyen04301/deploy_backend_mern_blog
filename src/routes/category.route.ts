import express from "express";
import categoryController from "../controllers/category.controller";
import auth from "../middlewares/auth";
const router = express.Router();

// auth function to check authentication status when call API
router
  .route("/")
  .get(categoryController.getCategories)
  .post(auth, categoryController.createCategory);

router
  .route("/:id")
  .patch(auth, categoryController.updateCategory)
  .delete(auth, categoryController.deleteCategory);

export default router;
