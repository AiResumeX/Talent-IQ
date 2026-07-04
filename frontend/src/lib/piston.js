import axiosInstance from "./axios.js";

/**
 * @param {string} language - programming language
 * @param {string} code - source code to execute
 * @returns {Promise<{success:boolean, output?:string, error?: string}>}
 */
export async function executeCode(language, code) {
  try {
    const response = await axiosInstance.post("/execute", {
      language,
      code,
    });

    const details = response.data;

    const buildError = details.build_stderr || details.build_stdout;
    const buildFailed =
      details.build_result === "failure" || details.build_result === "error";

    if (buildFailed && buildError) {
      return {
        success: false,
        output: details.build_stdout || "",
        error: details.build_stderr || "Build failed",
        time: details.build_time,
        memory: details.build_memory,
      };
    }

    const runFailed =
      details.result === "failure" || details.result === "error";
    const runError = details.stderr;

    if (runFailed && runError) {
      return {
        success: false,
        output: details.stdout || "",
        error: details.stderr,
        time: details.time,
        memory: details.memory,
      };
    }

    return {
      success: true,
      output: details.stdout || "No output",
      time: details.time,
      memory: details.memory,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.message ||
        `Failed to execute code: ${error.message}`,
    };
  }
}
