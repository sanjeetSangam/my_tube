import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    await mongoose.set("strictQuery", true);
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `\n Mongodb connected!! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("mongosb error", error);
    process.exit(1);
  }
};

export default connectDB;
