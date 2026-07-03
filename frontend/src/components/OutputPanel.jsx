import { useState, useEffect } from "react";
import { CheckCircle2Icon, XCircleIcon, TerminalIcon, CpuIcon, ClockIcon } from "lucide-react";

function OutputPanel({ output, problem, selectedLanguage }) {
  const [activeTab, setActiveTab] = useState("result"); // "testcase" | "result"
  const [activeCase, setActiveCase] = useState(0);

  // Sync activeTab when new output arrives
  useEffect(() => {
    if (output) {
      setActiveTab("result");
    }
  }, [output]);

  const examples = problem?.examples || [];

  // Helper to normalize strings for comparison (remove whitespace, brackets, quotes, trailing commas)
  const normalize = (str) => {
    if (!str) return "";
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[\[\]\(\)\{\}'"]/g, "")
      .replace(/,$/, "");
  };

  const getIndividualTestResults = () => {
    if (!output || !output.success) return [];
    
    const lines = output.output
      .trim()
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return examples.map((example, idx) => {
      const actual = lines[idx] || "";
      
      // Get the expected output for the current language or fallback to default example output
      const expectedFull = problem.expectedOutput?.[selectedLanguage] || "";
      const expectedLines = expectedFull.trim().split("\n");
      const expected = expectedLines[idx] || example.output || "";

      const passed = normalize(actual) === normalize(expected);

      return {
        input: example.input,
        actual,
        expected,
        passed,
      };
    });
  };

  const testResults = getIndividualTestResults();
  const allPassed = testResults.length > 0 && testResults.every(r => r.passed);

  // Format execution metrics
  const formatTime = (time) => {
    if (time === undefined || time === null) return "N/A";
    const ms = parseFloat(time) * 1000;
    return `${ms.toFixed(0)} ms`;
  };

  const formatMemory = (mem) => {
    if (mem === undefined || mem === null) return "N/A";
    const kb = parseFloat(mem) / 1024;
    if (kb > 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    }
    return `${kb.toFixed(0)} KB`;
  };

  return (
    <div className="h-full bg-base-100 flex flex-col border-t border-base-300">
      {/* PANEL TABS */}
      <div className="flex items-center justify-between px-4 bg-base-200 border-b border-base-300">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("testcase")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "testcase"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            Testcases
          </button>
          <button
            onClick={() => setActiveTab("result")}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "result"
                ? "border-primary text-primary"
                : "border-transparent text-base-content/60 hover:text-base-content"
            }`}
          >
            Test Result
          </button>
        </div>
      </div>

      {/* PANEL CONTENT */}
      <div className="flex-1 overflow-auto p-5 font-sans">
        {activeTab === "testcase" ? (
          <div>
            <div className="flex gap-2 mb-4">
              {examples.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveCase(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCase === idx
                      ? "bg-base-300 text-base-content"
                      : "bg-base-200 text-base-content/60 hover:bg-base-300"
                  }`}
                >
                  Case {idx + 1}
                </button>
              ))}
            </div>

            {examples[activeCase] && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-base-content/50 font-semibold mb-1">Input</div>
                  <pre className="p-3 bg-base-200 rounded-lg text-sm font-mono text-base-content overflow-x-auto border border-base-300">
                    {examples[activeCase].input}
                  </pre>
                </div>
                <div>
                  <div className="text-xs text-base-content/50 font-semibold mb-1">Expected Output</div>
                  <pre className="p-3 bg-base-200 rounded-lg text-sm font-mono text-base-content overflow-x-auto border border-base-300">
                    {examples[activeCase].output}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* RESULT TAB */
          <div className="h-full">
            {output === null ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <TerminalIcon className="size-10 text-base-content/30 mb-2" />
                <p className="text-base-content/50 text-sm">
                  Click "Run Code" to execute tests and view results...
                </p>
              </div>
            ) : !output.success ? (
              /* COMPILE / RUNTIME ERROR STATE */
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-error font-bold text-lg">
                  <XCircleIcon className="size-6" />
                  <span>Runtime / Compilation Error</span>
                </div>
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
                  <pre className="text-sm font-mono text-error whitespace-pre-wrap overflow-x-auto">
                    {output.error || "No error details available."}
                  </pre>
                </div>
                {output.output && (
                  <div>
                    <div className="text-xs text-base-content/50 font-semibold mb-1">Console Output (stdout)</div>
                    <pre className="p-3 bg-base-200 rounded-lg text-sm font-mono text-base-content/70 overflow-x-auto border border-base-300">
                      {output.output}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* SUCCESSFUL COMPILE STATE (ACCEPTED OR WRONG ANSWER) */
              <div className="space-y-5">
                {/* STATUS BAR */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-base-200/50 rounded-xl border border-base-300">
                  <div className="flex items-center gap-2">
                    {allPassed ? (
                      <div className="flex items-center gap-1.5 text-success font-black text-xl">
                        <CheckCircle2Icon className="size-6" />
                        <span>Accepted</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-error font-black text-xl">
                        <XCircleIcon className="size-6" />
                        <span>Wrong Answer</span>
                      </div>
                    )}
                  </div>

                  {/* METRICS */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-base-content/70">
                    <div className="flex items-center gap-1 bg-base-200 px-3 py-1.5 rounded-lg border border-base-300">
                      <ClockIcon className="size-3.5 text-primary" />
                      <span>Runtime:</span>
                      <span className="text-base-content font-mono">{formatTime(output.time)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-base-200 px-3 py-1.5 rounded-lg border border-base-300">
                      <CpuIcon className="size-3.5 text-secondary" />
                      <span>Memory:</span>
                      <span className="text-base-content font-mono">{formatMemory(output.memory)}</span>
                    </div>
                  </div>
                </div>

                {/* TEST CASES SELECTOR */}
                <div>
                  <div className="flex gap-2 mb-3">
                    {testResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCase(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          activeCase === idx
                            ? "bg-base-300 text-base-content"
                            : "bg-base-200 text-base-content/60 hover:bg-base-300"
                        }`}
                      >
                        <span className={`size-2 rounded-full ${result.passed ? "bg-success" : "bg-error"}`}></span>
                        Case {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* INDIVIDUAL CASE COMPARISON */}
                  {testResults[activeCase] && (
                    <div className="space-y-3 p-4 bg-base-200/30 rounded-xl border border-base-300/50">
                      <div>
                        <div className="text-xs text-base-content/50 font-semibold mb-1">Input</div>
                        <pre className="p-3 bg-base-200/50 rounded-lg text-sm font-mono text-base-content overflow-x-auto border border-base-300/30">
                          {testResults[activeCase].input}
                        </pre>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-base-content/50 font-semibold mb-1">Output</div>
                          <pre className={`p-3 rounded-lg text-sm font-mono overflow-x-auto border ${
                            testResults[activeCase].passed
                              ? "bg-success/5 border-success/20 text-success"
                              : "bg-error/5 border-error/20 text-error"
                          }`}>
                            {testResults[activeCase].actual || "Empty output"}
                          </pre>
                        </div>
                        <div>
                          <div className="text-xs text-base-content/50 font-semibold mb-1">Expected</div>
                          <pre className="p-3 bg-base-200/50 rounded-lg text-sm font-mono text-base-content overflow-x-auto border border-base-300/30">
                            {testResults[activeCase].expected}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RAW STDOUT LOGS */}
                {output.output && (
                  <div className="collapse collapse-arrow bg-base-200 border border-base-300">
                    <input type="checkbox" className="peer" />
                    <div className="collapse-title text-sm font-semibold flex items-center gap-2">
                      <TerminalIcon className="size-4 text-base-content/70" />
                      <span>Console Logs (stdout)</span>
                    </div>
                    <div className="collapse-content">
                      <pre className="p-3 bg-base-300 rounded-lg text-xs font-mono text-base-content/85 overflow-x-auto border border-base-300 max-h-40 overflow-y-auto">
                        {output.output}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;
