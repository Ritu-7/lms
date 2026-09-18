import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getJsonText = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/i);
  return (fenced?.[1] || trimmed).trim();
};

const repairJson = (jsonStr) => {
  let str = getJsonText(jsonStr);
  if (!str) return null;

  // Try standard JSON.parse first
  try {
    return JSON.parse(str);
  } catch (e) {
    // Continue with repair attempts
  }

  // Locate the outermost object or array
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let start = 0;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }
  str = str.slice(start);

  // Substring between first { and last }
  const lastBrace = str.lastIndexOf('}');
  if (lastBrace > 0) {
    try {
      return JSON.parse(str.slice(0, lastBrace + 1));
    } catch {}
  }

  // State machine to repair broken strings and unclosed brackets
  let inString = false;
  let isEscaped = false;
  const stack = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length && stack[stack.length - 1] === '{') stack.pop();
      } else if (char === ']') {
        if (stack.length && stack[stack.length - 1] === '[') stack.pop();
      }
    }
  }

  let repaired = str;
  if (inString) {
    repaired += '"';
  }

  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/:\s*$/, ': null');
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  while (stack.length > 0) {
    const open = stack.pop();
    if (open === '{') repaired += '}';
    else if (open === '[') repaired += ']';
  }

  try {
    return JSON.parse(repaired);
  } catch (e) {
    const cleaned = repaired.replace(/,\s*\{[^}]*$/g, '').replace(/,\s*\[[^\]]*$/g, '');
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
};

const safeParseJson = (value) => {
  return repairJson(value);
};

const requestGemini = async ({ model, contents, systemInstruction, generationConfig, responseMimeType, userApiKey }) => {
  const activeKey = userApiKey || GEMINI_API_KEY;
  if (!activeKey) {
    const error = new Error("NO_API_KEY");
    error.statusCode = 403;
    throw error;
  }

  const resolvedModel = model || "gemini-3.6-flash";
  const ai = new GoogleGenAI({ apiKey: activeKey });

  try {
    const response = await ai.models.generateContent({
      model: resolvedModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        ...(generationConfig || {}),
        ...(responseMimeType ? { responseMimeType } : {}),
      },
    });

    return response;
  } catch (err) {
    const message = err.message || "Gemini API error";
    const error = new Error(message);
    error.statusCode = err.status || 502;
    throw error;
  }
};

const extractGeminiText = (payload) => {
  if (typeof payload?.text === "string" && payload.text.trim()) {
    return payload.text.trim();
  }
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const combined = parts
      .map((p) => (typeof p?.text === "string" ? p.text : ""))
      .join("")
      .trim();
    if (combined) return combined;
  }
  const fallback = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return typeof fallback === "string" ? fallback.trim() : "";
};

export const callGeminiText = async ({ model, contents, systemInstruction, generationConfig, userApiKey }) => {
  const payload = await requestGemini({ model, contents, systemInstruction, generationConfig, userApiKey });
  const text = extractGeminiText(payload);
  if (!text) {
    const error = new Error("Empty response from AI");
    error.statusCode = 502;
    throw error;
  }
  return text;
};

export const callGeminiJson = async ({ model, contents, systemInstruction, generationConfig, userApiKey }) => {
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

  console.error("AI returned unreadable JSON. Raw text:", text);
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

export const analyzeCode = async ({ model, code, language, tool, userApiKey, execution = null }) => {
  const executionBlock = execution && typeof execution === "object"
    ? `
Actual execution result (do not invent a different run):
- success: ${Boolean(execution.success)}
- exitCode: ${execution.exitCode ?? "unknown"}
- stdout: ${String(execution.stdout || "").slice(0, 2000) || "(empty)"}
- stderr: ${String(execution.stderr || "").slice(0, 1200) || "(empty)"}
- compileError: ${String(execution.compileError || "").slice(0, 800) || "(none)"}
`
    : `
No execution result was provided. Do not invent stdout, stderr, test results, or exit codes.
Discuss complexity only from the source.`;

  const prompt = `You are an expert ${language} engineer.
Task: ${tool} the following code.
Return markdown with clear headings, concrete findings, and corrected snippets when useful.
Never fabricate runtime output, test results, or errors.
${executionBlock}

\`\`\`${language}
${code}
\`\`\``;

  return callGeminiText({
    model: model || "gemini-3.6-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: `You analyze ${language} code carefully and explain only what is supported by the source and the provided execution result.`,
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
  const result = await runCodeExecution({ code, language });
  return result.output;
};

export const runCodeExecution = async ({ code, language }) => {
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

  const normalizedExit = exitCode === "0" || exitCode === 0 ? 0 : Number(exitCode) || 1;

  return {
    output: output.trimEnd(),
    stdout: String(stdout || ""),
    stderr: String(stderr || ""),
    compileError: String(compileErr || ""),
    exitCode: normalizedExit,
    signal: String(signal || ""),
    success: !compileErr && normalizedExit === 0,
    language,
    compiler,
  };
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

// ─────────────────────────────────────────────────────────────────
//  AI COURSE GENERATION FUNCTIONS
// ─────────────────────────────────────────────────────────────────

const COURSE_JSON_SCHEMA = `{
  "courseTitle": "string",
  "courseDescription": "string (HTML paragraph tags allowed)",
  "category": "one of: Development, AI & ML, Data Science, Design, Business, Marketing, Cyber Security, Cloud & DevOps, Other",
  "courseFeatures": ["string"],
  "prerequisites": ["string"],
  "learningObjectives": ["string"],
  "modules": [
    {
      "moduleTitle": "string",
      "moduleDescription": "string",
      "lessons": [
        {
          "lessonTitle": "string",
          "lessonType": "rich_text",
          "lessonContent": "string (clear HTML overview with h2, p, ul, li, strong tags)",
          "lessonSummary": "string (1-2 sentences)",
          "estimatedMinutes": 15
        }
      ],
      "quiz": {
        "title": "string",
        "description": "string",
        "questions": [
          {
            "prompt": "string",
            "questionType": "mcq",
            "options": [
              { "optionId": "a", "label": "string", "isCorrect": false },
              { "optionId": "b", "label": "string", "isCorrect": false },
              { "optionId": "c", "label": "string", "isCorrect": true },
              { "optionId": "d", "label": "string", "isCorrect": false }
            ],
            "explanation": "string",
            "points": 1,
            "difficulty": "easy or medium or hard"
          }
        ]
      },
      "assignment": {
        "title": "string",
        "description": "string",
        "instructions": "string (clear HTML with h3, p, ol, li tags)",
        "rubric": [
          { "rubricId": "r1", "title": "string", "description": "string", "maxScore": 25, "order": 1 },
          { "rubricId": "r2", "title": "string", "description": "string", "maxScore": 25, "order": 2 },
          { "rubricId": "r3", "title": "string", "description": "string", "maxScore": 25, "order": 3 },
          { "rubricId": "r4", "title": "string", "description": "string", "maxScore": 25, "order": 4 }
        ],
        "totalPoints": 100
      }
    }
  ],
  "finalAssessment": {
    "title": "string",
    "description": "string",
    "questions": [
      {
        "prompt": "string",
        "questionType": "mcq",
        "options": [
          { "optionId": "a", "label": "string", "isCorrect": false },
          { "optionId": "b", "label": "string", "isCorrect": false },
          { "optionId": "c", "label": "string", "isCorrect": true },
          { "optionId": "d", "label": "string", "isCorrect": false }
        ],
        "explanation": "string",
        "points": 1,
        "difficulty": "medium"
      }
    ]
  }
}`;

export const generateCourseStructure = async ({
  topic, level = "Beginner", numModules = 3, lessonsPerModule = 3,
  targetAudience = "", instructions = "", model = "gemini-3.6-flash", userApiKey,
}) => {
  const prompt = `You are an expert instructional designer creating a complete online course.

Create a comprehensive ${level} course about: "${topic}"
- Modules: ${numModules}
- Lessons per module: ${lessonsPerModule}
- Target audience: ${targetAudience || "general learners"}
${instructions ? `- Special instructions: ${instructions}` : ""}

Rules:
1. Each lesson must include a concise, well-structured HTML summary/content with h2, p, ul, li, strong tags.
2. Each module must have exactly ${lessonsPerModule} lessons, 1 quiz with 5 MCQ questions, and 1 assignment.
3. The finalAssessment must have 5-10 MCQ questions covering the course.
4. Content must be accurate, practical, and appropriate for ${level} level.

Return ONLY valid JSON matching this schema (no markdown fences, no extra text):
${COURSE_JSON_SCHEMA}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: "You are a precise instructional design AI. Output only valid JSON matching the provided schema exactly.",
    generationConfig: { temperature: 0.35, maxOutputTokens: 32768 },
    userApiKey,
  });
};

export const generateLessonContent = async ({
  courseTitle, moduleTitle, lessonTitle, level = "Beginner",
  action = "generate", existingContent = "", model = "gemini-3.6-flash", userApiKey,
}) => {
  const actionMap = {
    generate: "Create detailed educational content for this lesson.",
    easier: "Rewrite the following content to be simpler and easier to understand.",
    harder: "Rewrite the following content to be more advanced and technically rigorous.",
    improve: "Improve the following content: make it clearer, add examples, and enhance structure.",
  };
  const prompt = `Course: "${courseTitle}" (${level})
Module: "${moduleTitle}"
Lesson: "${lessonTitle}"
Task: ${actionMap[action] || actionMap.generate}
${existingContent ? `Existing content:\n${existingContent}\n` : ""}

Return ONLY valid JSON:
{
  "lessonTitle": "string",
  "lessonContent": "string (rich HTML min 400 words, h2 p ul li strong code tags)",
  "lessonSummary": "string (2-3 sentences)",
  "estimatedMinutes": 15,
  "keyTakeaways": ["string"]
}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
    userApiKey,
  });
};

export const generateQuizQuestions = async ({
  topic, courseTitle, lessonTitle = "", numQuestions = 5,
  difficulty = "medium", level = "Beginner", model = "gemini-3.6-flash", userApiKey,
}) => {
  const prompt = `Generate ${numQuestions} high-quality MCQ questions about "${topic}" for a ${level} course titled "${courseTitle}".
${lessonTitle ? `Lesson: "${lessonTitle}"` : ""}
Difficulty: ${difficulty}.

Return ONLY valid JSON:
{
  "title": "string",
  "description": "string",
  "questions": [
    {
      "prompt": "string",
      "questionType": "mcq",
      "options": [
        { "optionId": "a", "label": "string", "isCorrect": false },
        { "optionId": "b", "label": "string", "isCorrect": false },
        { "optionId": "c", "label": "string", "isCorrect": true },
        { "optionId": "d", "label": "string", "isCorrect": false }
      ],
      "explanation": "string",
      "points": 1,
      "difficulty": "${difficulty}"
    }
  ]
}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
    userApiKey,
  });
};

export const generateAssignmentDetails = async ({
  topic, courseTitle, moduleTitle = "", level = "Beginner", model = "gemini-3.6-flash", userApiKey,
}) => {
  const prompt = `Create a practical assignment for topic "${topic}" in a ${level} course titled "${courseTitle}".
${moduleTitle ? `Module: "${moduleTitle}"` : ""}

Return ONLY valid JSON:
{
  "title": "string",
  "description": "string",
  "instructions": "string (detailed HTML with h3 p ol li tags)",
  "rubric": [
    { "rubricId": "r1", "title": "string", "description": "string", "maxScore": 25, "order": 1 },
    { "rubricId": "r2", "title": "string", "description": "string", "maxScore": 25, "order": 2 },
    { "rubricId": "r3", "title": "string", "description": "string", "maxScore": 25, "order": 3 },
    { "rubricId": "r4", "title": "string", "description": "string", "maxScore": 25, "order": 4 }
  ],
  "totalPoints": 100
}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    userApiKey,
  });
};

export const generateFromPdfText = async ({
  pdfText, numModules = 3, lessonsPerModule = 3, level = "Beginner",
  targetAudience = "", model = "gemini-3.6-flash", userApiKey,
}) => {
  const truncated = String(pdfText || "").slice(0, 25000);
  const prompt = `Based on the following document content, create a structured ${level} online course with ${numModules} modules and ${lessonsPerModule} lessons per module.
${targetAudience ? `Target audience: ${targetAudience}` : ""}

Document:
---
${truncated}
---

Return ONLY valid JSON matching this schema (no markdown, no extra text):
${COURSE_JSON_SCHEMA}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: "You are a precise instructional design AI. Output only valid JSON.",
    generationConfig: { temperature: 0.3, maxOutputTokens: 32768 },
    userApiKey,
  });
};

export const generateFromYouTubeTranscript = async ({
  transcript, videoTitle = "", model = "gemini-3.6-flash", userApiKey,
}) => {
  const truncated = String(transcript || "").slice(0, 15000);
  const prompt = `Based on this YouTube transcript, create a structured lesson with quiz.
${videoTitle ? `Video: "${videoTitle}"` : ""}

Transcript:
---
${truncated}
---

Return ONLY valid JSON:
{
  "lessonTitle": "string",
  "lessonContent": "string (rich HTML summary and explanation)",
  "lessonSummary": "string (2-3 sentences)",
  "estimatedMinutes": 15,
  "keyTakeaways": ["string"],
  "quiz": {
    "title": "string",
    "questions": [
      {
        "prompt": "string",
        "questionType": "mcq",
        "options": [
          { "optionId": "a", "label": "string", "isCorrect": false },
          { "optionId": "b", "label": "string", "isCorrect": true },
          { "optionId": "c", "label": "string", "isCorrect": false },
          { "optionId": "d", "label": "string", "isCorrect": false }
        ],
        "explanation": "string",
        "points": 1
      }
    ]
  }
}`;

  return callGeminiJson({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
    userApiKey,
  });
};
