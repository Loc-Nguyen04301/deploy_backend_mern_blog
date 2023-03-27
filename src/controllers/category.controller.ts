import { IReqAuth } from "./../config/interface";
import { Request, Response } from "express";
import Categories from "../models/category.model";
import Blogs from "../models/blog.model";

const categoryController = {
  getCategories: async (req: IReqAuth, res: Response) => {
    try {
      const categories = await Categories.find().sort("-createdAt");
      return res.json({ categories });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
  createCategory: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    if (req.user.role !== "admin")
      return res.status(400).json({ message: "Invalid Authentication." });
    try {
      const name = req.body.name.toLowerCase();
      const newCategory = new Categories({ name });
      await newCategory.save();

      return res.json({ newCategory });
    } catch (err: any) {
      let errorMessage;
      if (err.code === 11000) {
        errorMessage = err.keyValue.name + " already exists.";
        console.log(errorMessage);
      }
      return res.status(500).json({ message: errorMessage });
    }
  },
  updateCategory: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    if (req.user.role !== "admin")
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      console.log(req.body);
      await Categories.findOneAndUpdate(
        {
          _id: req.params.id,
        },
        { name: req.body.name.toLowerCase() }
      );

      res.json({ message: "Update Success!" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
  deleteCategory: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    if (req.user.role !== "admin")
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      const blog = await Blogs.find({ category: req.params.id });

      if (blog.length > 0)
        return res.status(400).json({
          message: "Can't delete. In this category also exists blogs",
        });

      await Categories.findByIdAndDelete(req.params.id);
      return res.json({ message: "Delete Success!" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
};

export default categoryController;
