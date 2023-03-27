import express from "express";
import auth from "../middlewares/auth";
import blogController from "../controllers/blog.controller";
const router = express.Router();

router.post("/", auth, blogController.createBlog);
router.get("/home/blogs", blogController.getHomeBlogs);
router.get("/blogs/category/:category_id", blogController.getBlogsByCategory);
router.get("/blogs/user/:user_id", blogController.getBlogsByUser);
router.get("/:blog_id", blogController.getBlogById);
router.put("/:blog_id", auth, blogController.updateBlogById);
router.delete("/:blog_id", auth, blogController.deleteBlogById);
router.get("/search/blogs", blogController.searchBlogs);
export default router;
