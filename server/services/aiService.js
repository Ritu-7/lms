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

const requestGemini = async ({ model, contents, systemInstruction, generationConfig, responseMimeType }) => {
  if (!GEMINI_API_KEY) {
    const error = new Error("AI service is not configured");
    error.statusCode = 503;
    throw error;
  }

  const resolvedModel = model || "gemini-2.0-flash";
  const response = await fetch(`${GEMINI_BASE_URL}/models/${resolvedModel}:generateContent?key=${GEMINI_API_KEY}`, {
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

const callGeminiText = async ({ model, contents, systemInstruction, generationConfig }) => {
  const payload = await requestGemini({ model, contents, systemInstruction, generationConfig });
  const text = extractGeminiText(payload);
  if (!text) {
    const error = new Error("Empty response from AI");
    error.statusCode = 502;
    throw error;
  }
  return text;
};

const callGeminiJson = async ({ model, contents, systemInstruction, generationConfig }) => {
  const text = await callGeminiText({
    model,
    contents,
    systemInstruction,
    generationConfig: {
      ...generationConfig,
      responseMimeType: "application/json",
    },
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

export const generateTutorReply = async ({ messages, model, courseTitle }) => {
  const contents = messages.map((message) => ({
    role: message.role === "user" ? "user" : "model",
    parts: [{ text: String(message.content || "") }],
  }));

  return callGeminiText({
    model,
    contents,
    systemInstruction: buildTutorSystemPrompt(courseTitle),
    generationConfig: { temperature: 0.6, maxOutputTokens: 4096 },
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

export const generateStructuredSummary = async ({ model, title, sourceType, sourceText, mode }) => {
  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: buildSummaryPrompt({ title, sourceType, sourceText, mode }) }] }],
    systemInstruction: "You are a precise educational summarization engine.",
    generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
  });
};

export const analyzeCode = async ({ model, code, language, tool }) => {
  const prompt = `You are an expert ${language} engineer.
Task: ${tool} the following code.
Return markdown with clear headings, concrete findings, and corrected snippets when useful.
Do not invent runtime output.

\`\`\`${language}
${code}
\`\`\``;

  return callGeminiText({
    model: model || "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `You analyze ${language} code carefully and explain only what is supported by the input.`,
    generationConfig: { temperature: 0.25, maxOutputTokens: 3072 },
  });
};

export const runCodeViaPiston = async ({ code, language }) => {
  const runtimeMap = {
    javascript: { language: "javascript", version: "18.15.0", ext: "js" },
    python: { language: "python", version: "3.10.0", ext: "py" },
    java: { language: "java", version: "15.0.2", ext: "java" },
    cpp: { language: "c++", version: "10.2.0", ext: "cpp" },
    typescript: { language: "typescript", version: "5.0.3", ext: "ts" },
    go: { language: "go", version: "1.16.2", ext: "go" },
    rust: { language: "rust", version: "1.68.2", ext: "rs" },
  };

  const runtime = runtimeMap[language];
  if (!runtime) {
    const error = new Error(`Running ${language} is not supported yet.`);
    error.statusCode = 400;
    throw error;
  }

  if (!String(code || "").trim()) {
    const error = new Error("NO_CODE");
    error.statusCode = 400;
    throw error;
  }

  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
      files: [{ name: `main.${runtime.ext}`, content: code }],
    }),
  });

  if (!response.ok) {
    const error = new Error(`Execution service error ${response.status}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const stdout = data?.run?.stdout || "";
  const stderr = data?.run?.stderr || "";
  const compileErr = data?.compile?.stderr || "";
  const signal = data?.run?.signal;

  let output = "";
  if (compileErr) output += `${compileErr}\n`;
  if (stdout) output += stdout;
  if (stderr) output += `${output ? "\n" : ""}${stderr}`;
  if (signal) output += `\n[terminated by signal: ${signal}]`;
  if (!output.trim()) output = "[Program ran with no output]";

  return output;
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