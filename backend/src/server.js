import express from "express"
import path from "path";
import dns from "dns";

import {ENV} from "./lib/env.js";
import { connectDB } from "./lib/db.js";
dns.setDefaultResultOrder('ipv4first');

const app=express();
const __dirname = path.resolve();

console.log(process.env.PORT);


// make app ready for deployment

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
     await connectDB();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();