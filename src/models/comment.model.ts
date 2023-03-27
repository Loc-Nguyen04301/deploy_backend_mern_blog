import mongoose from "mongoose";
import { IComment } from "../config/interface";

const commentSchema = new mongoose.Schema(
  {
    // ai comment
    user: { type: mongoose.Types.ObjectId, ref: "user" },
    // blog nào
    blog_id: mongoose.Types.ObjectId,
    // blog của ai
    blog_user_id: mongoose.Types.ObjectId,
    //nội dung là gì
    content: { type: String, required: true },
    // comment phản hồi
    replyCM: [{ type: mongoose.Types.ObjectId, ref: "comment" }],
    // người phản hồi là ai
    reply_user: { type: mongoose.Types.ObjectId, ref: "user" },
    // comment gốc
    comment_root: { type: mongoose.Types.ObjectId, ref: "comment" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IComment>("comment", commentSchema);
