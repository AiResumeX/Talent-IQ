import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.post("/", protectRoute, async (req, res) => {
  try {
    const { language, code } = req.body;

    const PAIZA_API = "https://api.paiza.io";
    const LANGUAGE_MAPPING = {
      javascript: "javascript",
      python: "python3",
      java: "java",
      cpp: "cpp",
    };

    const paizaLanguage = LANGUAGE_MAPPING[language];
    if (!paizaLanguage) {
      return res
        .status(400)
        .json({ message: `Unsupported language: ${language}` });
    }

    const params = new URLSearchParams({
      api_key: "guest",
      language: paizaLanguage,
      source_code: code,
      input: "",
    });

    const response = await fetch(`${PAIZA_API}/runners/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ message: `Paiza API error: status ${response.status}` });
    }

    const createData = await response.json();
    if (!createData.id) {
      return res
        .status(500)
        .json({ message: "Failed to create runner session" });
    }

    const sessionId = createData.id;

    // Poll for the execution details (from backend)
    const maxRetries = 10;
    const pollInterval = 1000;

    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const detailsResponse = await fetch(
        `${PAIZA_API}/runners/get_details?id=${sessionId}&api_key=guest`,
      );

      if (!detailsResponse.ok) {
        continue;
      }

      const details = await detailsResponse.json();

      if (details.status === "completed") {
        return res.status(200).json(details);
      }
    }

    return res.status(504).json({ message: "Execution timed out" });
  } catch (error) {
    console.error("Error in executeCode backend:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
