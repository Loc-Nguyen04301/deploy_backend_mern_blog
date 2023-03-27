import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { IReqAuth } from "../config/interface";
import Users from "../models/user.model";

const saltRound = 10;

const userController = {
  updateUser: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      const { avatar, name } = req.body;

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { avatar: avatar, name: name }
      );

      return res.json({ message: "Update Success" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  resetPassword: async (req: IReqAuth, res: Response) => {
    if (!req.user)
      return res.status(400).json({ message: "Invalid Authentication." });

    try {
      const { password } = req.body;
      const passwordHash = await bcrypt.hash(password, saltRound);

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        { password: passwordHash }
      );

      return res.json({ message: "Reset Password Success" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },

  getUser: async (req: IReqAuth, res: Response) => {
    try {
      const user = await Users.findById(req.params.id).select("-password");
      return res.json({ user });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },
};

export default userController;
