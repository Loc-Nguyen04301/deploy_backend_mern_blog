import mongoose from "mongoose";
import { IReqAuth } from "./../config/interface";
import { Request, Response } from "express";
import Blogs from "../models/blog.model";
import Comments from "../models/comment.model";

const Pagination = (req: IReqAuth) => {
  let page = Number(req.query.page) * 1 || 1;
  // 1 page is {limit} blog
  let limit = Number(req.query.limit) * 1 || 4;
  let skip = (page - 1) * limit;

  return { page, limit, skip };
};

const blogController = {
  createBlog: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });
    try {
      const { title, content, description, thumbnail, category } = req.body;
      console.log(req.body);

      const newBlog = new Blogs({
        user: req.user._id,
        title,
        content,
        description,
        thumbnail,
        category,
      });

      await newBlog.save();
      console.log({ newBlog });
      return res.json({
        newBlog,
      });
    } catch (err: any) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
  },

  getHomeBlogs: async (req: Request, res: Response) => {
    try {
      const blogs = await Blogs.aggregate([
        //User
        {
          $lookup: {
            from: "users",
            let: { user_id: "$user" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
              { $project: { password: 0 } },
            ],
            as: "user",
          },
        },
        // array => object
        { $unwind: "$user" },
        // Category
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "category",
          },
        },
        // array -> object
        { $unwind: "$category" },
        // Sorting
        { $sort: { createdAt: -1 } },
        // Group by category
        {
          $group: {
            _id: "$category._id",
            name: { $first: "$category.name" },
            blogs: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        // Pagination for blogs
        {
          $project: {
            blogs: {
              $slice: ["$blogs", 0, 4],
            },
            count: 1,
            name: 1,
          },
        },
      ]);
      return res.json(blogs);
    } catch (err: any) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
  },

  getBlogsByCategory: async (req: Request, res: Response) => {
    console.log(req);
    const { limit, skip } = Pagination(req);
    try {
      const Data = await Blogs.aggregate([
        {
          $facet: {
            totalData: [
              {
                $match: {
                  category: new mongoose.Types.ObjectId(req.params.category_id),
                },
              },
              // User
              {
                $lookup: {
                  from: "users",
                  let: { user_id: "$user" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                    { $project: { password: 0 } },
                  ],
                  as: "user",
                },
              },
              // array -> object
              { $unwind: "$user" },
              // Sorting
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [
              {
                $match: {
                  category: new mongoose.Types.ObjectId(req.params.category_id),
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $project: {
            count: { $arrayElemAt: ["$totalCount.count", 0] },
            totalData: 1,
          },
        },
      ]);

      const blogs = Data[0].totalData;
      const count = Data[0].count;

      //Pagination
      let total = 0;

      if (count % limit === 0) {
        total = count / limit;
      } else {
        total = Math.floor(count / limit) + 1;
      }

      return res.json({ blogs, total });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  getBlogsByUser: async (req: Request, res: Response) => {
    const { limit, skip } = Pagination(req);

    try {
      const Data = await Blogs.aggregate([
        {
          $facet: {
            totalData: [
              {
                $match: {
                  user: new mongoose.Types.ObjectId(req.params.user_id),
                },
              },
              // User
              {
                $lookup: {
                  from: "users",
                  let: { user_id: "$user" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                    { $project: { password: 0 } },
                  ],
                  as: "user",
                },
              },
              // array -> object
              { $unwind: "$user" },
              // Sorting
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [
              {
                $match: {
                  user: new mongoose.Types.ObjectId(req.params.user_id),
                },
              },
              { $count: "count" },
            ],
          },
        },
        {
          $project: {
            count: { $arrayElemAt: ["$totalCount.count", 0] },
            totalData: 1,
          },
        },
      ]);

      const blogs = Data[0].totalData;
      const count = Data[0].count;

      // Pagination
      let total = 0;

      if (count % limit === 0) {
        total = count / limit;
      } else {
        total = Math.floor(count / limit) + 1;
      }

      res.json({ blogs, total });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  getBlogById: async (req: Request, res: Response) => {
    try {
      const blog = await Blogs.findOne({ _id: req.params.blog_id }).populate(
        "user",
        "-password"
      );
      if (!blog) return res.status(400).json({ msg: "Blog does not exist." });
      return res.json(blog);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  updateBlogById: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      const blog = await Blogs.findOneAndUpdate(
        {
          _id: req.params.blog_id,
        },
        req.body
      );
      if (!blog)
        return res.status(400).json({ message: "Can't Update This Blog." });

      return res.json({ message: "Update Success!" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  deleteBlogById: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      // Delete Blog
      const blog = await Blogs.findOneAndDelete({
        _id: req.params.blog_id,
      });

      if (!blog)
        return res.status(400).json({ message: "Can't Delete This Blog." });

      // Delete Comments
      await Comments.deleteMany({ blog_id: blog._id });

      return res.json({ message: "Delete Success!" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },

  searchBlogs: async (req: Request, res: Response) => {
    try {
      const { title } = req.query;
      if (!title) return res.json([]);
      const searchBlogs = await Blogs.find({
        title: { $regex: ".*" + `${title}` + ".*" },
      });
      return res.json(searchBlogs);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  },
};

export default blogController;
