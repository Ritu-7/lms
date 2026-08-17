const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJsonText = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] || trimmed).trim();
};

const safeParseJson = (value) => {
  try {
    return JSON.parse(getJsonText(value));
  } catch {
    return null;
  }
};

const requestGemini = async ({ model, contents, systemInstruction, generationConfig, responseMimeType, userApiKey }) => {
  const activeKey = userApiKey || GEMINI_API_KEY;
  if (!activeKey) {
    const error = new Error("NO_API_KEY");
    error.statusCode = 403;
    throw error;
  }

  const resolvedModel = model || "gemini-3.5-flash";
  const response = await fetch(`${GEMINI_BASE_URL}/models/${resolvedModel}:generateContent?key=${activeKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        ...(generationConfig || {}),
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const message = body?.error?.message || `Gemini API error ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status >= 500 ? 502 : response.status;
    throw error;
  }

  return response.json();
};

const extractGeminiText = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return typeof text === "string" ? text.trim() : "";
};

const callGeminiText = async ({ model, contents, systemInstruction, generationConfig, userApiKey }) => {
  const payload = await requestGemini({ model, contents, systemInstruction, generationConfig, userApiKey });
  const text = extractGeminiText(payload);
  if (!text) {
    const error = new Error("Empty response from AI");
    error.statusCode = 502;
    throw error;
  }
  return text;
};

const callGeminiJson = async ({ model, contents, systemInstruction, generationConfig, userApiKey }) => {
  const text = await callGeminiText({
    model,
    contents,
    systemInstruction,
    generationConfig: {
      ...generationConfig,
      responseMimeType: "application/json",
    },
    userApiKey,
  });

  const parsed = safeParseJson(text);
  if (parsed) return parsed;

  const error = new Error("AI returned an unreadable response");
  error.statusCode = 502;
  throw error;
};

const buildTutorSystemPrompt = (courseTitle = "") => `You are LearnSphereAI's expert AI Tutor.
Help the student clearly and accurately.
Use markdown formatting for structure and code blocks for examples.
Be concise when the user asks a short question and thorough when they ask for depth.
If the question is ambiguous, ask one clarifying question before answering.
${courseTitle ? `The current course is: ${courseTitle}.` : ""}`;

export const generateTutorReply = async ({ messages, model, courseTitle, userApiKey }) => {
  const contents = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: String(message.content || "") }],
  }));

  return callGeminiText({
    model,
    contents,
    systemInstruction: buildTutorSystemPrompt(courseTitle),
    generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
    userApiKey,
  });
};

const buildSummaryPrompt = ({ title, sourceType, sourceText, mode }) => {
  const sourceLabel = sourceType || mode || "source";
  return `You are summarizing a ${sourceLabel} for LearnSphereAI.
Return valid JSON only with these keys:
{
  "title": string,
  "summary": string,
  "keyPoints": string[],
  "concepts": string[],
  "formulas": string[],
  "chapters": [{ "title": string, "time": string, "summary": string }],
  "notes": string,
  "flashcards": [{ "front": string, "back": string }]
}

Rules:
- Base the response only on the provided content.
- If a field is not relevant, return an empty array or an empty string.
- Keep the output professional and concise.
- ${title ? `Content title: ${title}.` : ""}

Content:
${sourceText}`;
};

export const generateStructuredSummary = async ({ model, title, sourceType, sourceText, mode, userApiKey }) => {
  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: buildSummaryPrompt({ title, sourceType, sourceText, mode }) }] }],
    systemInstruction: "You are a precise educational summarization engine.",
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    userApiKey,
  });
};

export const analyzeCode = async ({ model, code, language, tool, userApiKey }) => {
  const prompt = `You are an expert ${language} engineer.
Task: ${tool} the following code.
Return markdown with clear headings, concrete findings, and corrected snippets when useful.
Do not invent runtime output.

\`\`\`${language}
${code}
\`\`\``;

  return callGeminiText({
    model: model || "gemini-3.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `You analyze ${language} code carefully and explain only what is supported by the input.`,
    generationConfig: { temperature: 0.25, maxOutputTokens: 3072 },
    userApiKey,
  });
};

// Wandbox compiler map — Piston API went whitelist-only on 2026-02-15
const WANDBOX_COMPILERS = {
  javascript: "nodejs-20.17.0",
  python:     "cpython-3.12.7",
  java:       "openjdk-jdk-22+36",
  cpp:        "gcc-13.2.0",
  typescript: "typescript-5.6.2",
  go:         "go-1.23.2",
  rust:       "rust-1.82.0",
};

export const runCodeViaPiston = async ({ code, language }) => {
  const compiler = WANDBOX_COMPILERS[language];
  if (!compiler) {
    const error = new Error(`Running ${language} is not supported yet.`);
    error.statusCode = 400;
    throw error;
  }

  if (!String(code || "").trim()) {
    const error = new Error("No code provided.");
    error.statusCode = 400;
    throw error;
  }

  let response;
  try {
    response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        options: "",
        stdin: "",
        "compiler-option-raw": "",
        "runtime-option-raw": "",
      }),
      signal: AbortSignal.timeout(25000), // 25 s hard timeout
    });
  } catch (fetchErr) {
    const error = new Error(`Code execution service unreachable: ${fetchErr.message}`);
    error.statusCode = 502;
    throw error;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    const error = new Error(`Execution service error ${response.status}${text ? ": " + text.slice(0, 120) : ""}`);
    error.statusCode = 502;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error("Execution service returned an unreadable response.");
    error.statusCode = 502;
    throw error;
  }

  // Wandbox response fields
  const exitCode   = data?.status ?? "?";   // "0" = success, non-"0" = error
  const stdout     = data?.program_output || "";
  const stderr     = data?.program_error  || "";
  const compileErr = data?.compiler_error || "";
  const signal     = data?.signal         || "";

  let output = "";
  if (compileErr) output += compileErr.trimEnd() + "\n";
  if (stdout)     output += stdout;
  if (stderr)     output += (output ? "\n" : "") + stderr.trimEnd();
  if (signal)     output += `\n[terminated by signal: ${signal}]`;
  if (exitCode !== "0" && exitCode !== 0) {
    output += `\n[exit code ${exitCode}]`;
  }
  if (!output.trim()) output = "[Program ran with no output]";

  return output.trimEnd();
};

export const retryWithBackoff = async (fn, retries = 1, delayMs = 350) => {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const status = error?.statusCode || error?.response?.status || 0;
      const retriable = !status || status >= 500 || status === 429;
      if (attempt >= retries || !retriable) break;
      await wait(delayMs * (attempt + 1));
    }
  }
  throw lastError;
};