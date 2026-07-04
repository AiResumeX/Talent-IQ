import { requireAuth, getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = getAuth(req).userId;

      if (!clerkId)
        return res
          .status(401)
          .json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });

      if (!user) {
        // Automatically sync user from Clerk backend if they exist in Clerk but not in MongoDB
        try {
          const clerkUser = await clerkClient.users.getUser(clerkId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const name =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "User";
          const profileImage = clerkUser.imageUrl;

          user = await User.create({
            clerkId,
            email,
            name,
            profileImage,
          });

          console.log("✅ Auto-synced user from Clerk to MongoDB:", user.email);

          // Sync user to Stream
          try {
            await upsertStreamUser({
              id: clerkId,
              name,
              image: profileImage,
            });
          } catch (streamErr) {
            console.error(
              "❌ Failed to sync user to Stream during auto-sync:",
              streamErr,
            );
          }
        } catch (clerkErr) {
          console.error("❌ Failed to auto-sync user from Clerk:", clerkErr);
          return res.status(404).json({ message: "User not found" });
        }
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
