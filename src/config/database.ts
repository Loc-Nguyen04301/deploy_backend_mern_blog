import mongoose from "mongoose";
const URL = process.env.MONGODB_URL;

mongoose.connect(`${URL}`, (err) => {
  if (err) throw err;
  console.log("Mongodb connection");
});
