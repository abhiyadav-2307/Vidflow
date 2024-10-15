//reqire("dotenv").config({ path: "./env" });
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERROR in server connection");
      //throw error;
    });
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`server is running at port ${port}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection failed!!! Error: ${error}`);
  });

/*
import express from "express";
const app = express();
//iffy function to connect Database
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
      console.log("ERROR in database connection");
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port: ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
})();
*/
