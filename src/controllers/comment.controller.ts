import { IReqAuth } from "./../config/interface";
import { Request, Response } from "express";
import mongoose from "mongoose";
import Comments from "../models/comment.model";

const Pagination = (req: IReqAuth) => {
  let page = Number(req.query.page) * 1 || 1;
  let limit = Number(req.query.limit) * 1 || 4;
  let skip = (page - 1) * limit;

  return { page, limit, skip };
};

const commentController = {
  createComment: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "invalid Authentication." });

    try {
      const { content, blog_id, blog_user_id } = req.body;

      const newComment = new Comments({
        user: req.user._id,
        blog_id,
        blog_user_id,
        content,
      });

      await newComment.save();

      return res.json(newComment);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  getComments: async (req: Request, res: Response) => {
    const { limit, skip } = Pagination(req);

    try {
      const data = await Comments.aggregate([
        {
          $facet: {
            totalData: [
              {
                $match: {
                  blog_id: new mongoose.Types.ObjectId(req.params.id),
                  comment_root: { $exists: false },
                  reply_user: { $exists: false },
                },
              },
              {
                $lookup: {
                  from: "users",
                  let: { user_id: "$user" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                    { $project: { name: 1, avatar: 1 } },
                  ],
                  as: "user",
                },
              },
              { $unwind: "$user" },
              {
                $lookup: {
                  from: "comments",
                  let: { cm_id: "$replyCM" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$cm_id"] } } },
                    {
                      $lookup: {
                        from: "users",
                        let: { user_id: "$user" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                          { $project: { name: 1, avatar: 1 } },
                        ],
                        as: "user",
                      },
                    },
                    { $unwind: "$user" },
                    {
                      $lookup: {
                        from: "users",
                        let: { user_id: "$reply_user" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$_id", "$$user_id"] } } },
                          { $project: { name: 1, avatar: 1 } },
                        ],
                        as: "reply_user",
                      },
                    },
                    { $unwind: "$reply_user" },
                  ],
                  as: "replyCM",
                },
              },
              { $sort: { createdAt: -1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalCount: [
              {
                $match: {
                  blog_id: new mongoose.Types.ObjectId(req.params.id),
                  comment_root: { $exists: false },
                  reply_user: { $exists: false },
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

      const comments = data[0].totalData;
      const count = data[0].count;

      let total = 0;

      if (count % limit === 0) {
        total = count / limit;
      } else {
        total = Math.floor(count / limit) + 1;
      }

      return res.json({ comments, total });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  replyComment: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "invalid Authentication." });
    try {
      const { blog_id, blog_user_id, content, reply_user, comment_root } =
        req.body;

      const newComment = new Comments({
        user: req.user._id,
        blog_id,
        blog_user_id,
        content,
        reply_user: reply_user._id,
        comment_root,
      });

      await Comments.findOneAndUpdate(
        { _id: comment_root },
        { $push: { replyCM: newComment._id } }
      );

      await newComment.save();

      return res.json(newComment);
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  updateComment: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "invalid Authentication." });
    try {
      const { content } = req.body;

      const comment = await Comments.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user.id,
        },
        { content: content }
      );

      if (!comment)
        return res.status(400).json({ message: "Comment not found" });

      return res.json({ message: "Update Success" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  deleteComment: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "invalid Authentication." });
    try {
      const comment = await Comments.findOneAndDelete({
        _id: req.params.id,
        $or: [{ user: req.user._id }, { blog_user_id: req.user._id }],
      });

      if (!comment)
        return res.status(400).json({ message: "Comment not found" });

      if (comment.comment_root) {
        // update replyCM
        await Comments.findOneAndUpdate(
          { _id: comment.comment_root },
          {
            $pull: { replyCM: comment._id },
          }
        );
      } else {
        // delete all comments in replyCM
        await Comments.deleteMany({ _id: { $in: comment.replyCM } });
      }

      return res.json({ message: "Delete Success" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },
};

export default commentController;
