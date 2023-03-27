import { IReqAuth } from "./../config/interface";
import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { IDecodedToken } from "../config/interface";
import Users from "../models/user.model";

const auth = async (req: IReqAuth, res: Response, next: NextFunction) => {
  try {
    console.log(req.header("Authorization"));
    const token = req.header("Authorization");
    if (!token)
      return res.status(400).json({ message: "Invalid Authentication." });

    const decoded = <IDecodedToken>(
      jwt.verify(token, `${process.env.ACCESS_TOKEN_SECRET}`)
    );

    if (!decoded)
      return res.status(400).json({ message: "Invalid Authentication." });

    const { id } = decoded;

    const user = await Users.findOne({ _id: id });

    if (!user) return res.status(400).json({ message: "User does not exist." });

    req.user = user;

    next();
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "JWT access token : " + error.message });
  }
};

export default auth;
