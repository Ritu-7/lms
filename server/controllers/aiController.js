import User from "../models/User.js";
import AIUsageLog from "../models/AIUsageLog.js";
import {
  analyzeCode,
  generateStructuredSummary,
  generateTutorReply,
  retryWithBackoff,
  runCodeViaPiston,
} from "../services/aiService.js";

const resolveCurrentUser = async (clerkUserId) => {
  const user = await User.findOne({ clerkUserId }).lean();
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user;
};

const logUsage = async ({ user, feature, model, status, inputLength = 0, outputLength = 0, title = "", sourceType = "", metadata = {}, errorMessage = "" }) => {
  try {
    await AIUsageLog.create({
      user: user._id,
      feature,
      model: model || "",
      status,
      inputLength,
      outputLength,
      title,
      sourceType,
      metadata,
      errorMessage,
    });
  } catch {
    // Logging failures must never break the primary AI response.
  }
};

const buildSummaryResponse = (data, fallbackTitle = "") => ({
  title: data?.title || fallbackTitle || "Summary",
  summary: data?.summary || "",
  keyPoints: Array.isArray(data?.keyPoints) ? data.keyPoints : [],
  concepts: Array.isArray(data?.concepts) ? data.concepts : [],
  formulas: Array.isArray(data?.formulas) ? data.formulas : [],
  chapters: Array.isArray(data?.chapters) ? data.chapters : [],
  notes: data?.notes || "",
  flashcards: Array.isArray(data?.flashcards) ? data.flashcards : [],
});

export const chatTutor = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { messages = [], model = "gemini-2.0-flash", courseTitle = "" } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Message history is required" });
    }

    const responseText = await retryWithBackoff(() => generateTutorReply({ messages, model, courseTitle }), 1);
    await logUsage({
      user,
      feature: "tutor_chat",
      model,
      status: "success",
      inputLength: JSON.stringify(messages).length,
      outputLength: responseText.length,
      title: courseTitle || "AI Tutor",
    });

    res.json({ success: true, data: { response: responseText, model } });
  } catch (error) {
    if (req.clerkUserId) {
      const user = await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null);
      if (user) {
        await logUsage({
          user,
          feature: "tutor_chat",
          model: req.body?.model || "",
          status: "error",
          inputLength: JSON.stringify(req.body?.messages || []).length,
          title: req.body?.courseTitle || "AI Tutor",
          errorMessage: error.message,
        });
      }
    }
    next(error);
  }
};

export const summarizePdf = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { text = "", fileName = "", model = "gemini-2.0-flash" } = req.body || {};

    if (!String(text || "").trim()) {
      return res.status(400).json({ success: false, message: "PDF text is required" });
    }

    const summary = await retryWithBackoff(
      () => generateStructuredSummary({ model, title: fileName, sourceType: "PDF document", sourceText: text, mode: "pdf summary" }),
      1
    );

    const normalized = buildSummaryResponse(summary, fileName || "PDF Summary");
    await logUsage({
      user,
      feature: "pdf_summary",
      model,
      status: "success",
      inputLength: String(text).length,
      outputLength: JSON.stringify(normalized).length,
      title: fileName || "PDF Summary",
      sourceType: "pdf",
    });

    res.json({ success: true, data: normalized });
  } catch (error) {
    const user = req.clerkUserId ? await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null) : null;
    if (user) {
      await logUsage({
        user,
        feature: "pdf_summary",
        model: req.body?.model || "",
        status: "error",
        inputLength: String(req.body?.text || "").length,
        title: req.body?.fileName || "PDF Summary",
        sourceType: "pdf",
        errorMessage: error.message,
      });
    }
    next(error);
  }
};

export const summarizeVideo = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { title = "", sourceText = "", videoUrl = "", model = "gemini-2.0-flash" } = req.body || {};
    const cleanText = String(sourceText || "").trim();

    if (!cleanText) {
      return res.status(400).json({ success: false, message: "Video transcript or source text is required" });
    }

    const summary = await retryWithBackoff(
      () => generateStructuredSummary({ model, title, sourceType: "video lecture", sourceText: cleanText, mode: "video summary" }),
      1
    );

    const normalized = buildSummaryResponse(summary, title || "Video Summary");
    await logUsage({
      user,
      feature: "video_summary",
      model,
      status: "success",
      inputLength: cleanText.length,
      outputLength: JSON.stringify(normalized).length,
      title: title || "Video Summary",
      sourceType: "video",
      metadata: { videoUrl },
    });

    res.json({ success: true, data: normalized });
  } catch (error) {
    const user = req.clerkUserId ? await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null) : null;
    if (user) {
      await logUsage({
        user,
        feature: "video_summary",
        model: req.body?.model || "",
        status: "error",
        inputLength: String(req.body?.sourceText || "").length,
        title: req.body?.title || "Video Summary",
        sourceType: "video",
        errorMessage: error.message,
      });
    }
    next(error);
  }
};

export const generateNotes = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { title = "", sourceText = "", model = "gemini-2.0-flash" } = req.body || {};

    if (!String(sourceText || "").trim()) {
      return res.status(400).json({ success: false, message: "Source text is required" });
    }

    const summary = await retryWithBackoff(
      () => generateStructuredSummary({ model, title, sourceType: "study notes", sourceText, mode: "notes generator" }),
      1
    );

    const normalized = buildSummaryResponse(summary, title || "Generated Notes");
    await logUsage({
      user,
      feature: "notes_generator",
      model,
      status: "success",
      inputLength: String(sourceText).length,
      outputLength: JSON.stringify(normalized).length,
      title: title || "Generated Notes",
      sourceType: "notes",
    });

    res.json({ success: true, data: normalized });
  } catch (error) {
    const user = req.clerkUserId ? await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null) : null;
    if (user) {
      await logUsage({
        user,
        feature: "notes_generator",
        model: req.body?.model || "",
        status: "error",
        inputLength: String(req.body?.sourceText || "").length,
        title: req.body?.title || "Generated Notes",
        sourceType: "notes",
        errorMessage: error.message,
      });
    }
    next(error);
  }
};

export const analyzeCodingTask = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { code = "", language = "javascript", model = "gemini-2.0-flash", tool = "analyze" } = req.body || {};

    if (!String(code || "").trim()) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    const analysis = await retryWithBackoff(() => analyzeCode({ model, code, language, tool }), 1);
    await logUsage({
      user,
      feature: "coding_assistant",
      model,
      status: "success",
      inputLength: String(code).length,
      outputLength: analysis.length,
      title: `${tool} ${language}`,
      sourceType: "code",
      metadata: { language, tool },
    });

    res.json({ success: true, data: { analysis, model } });
  } catch (error) {
    const user = req.clerkUserId ? await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null) : null;
    if (user) {
      await logUsage({
        user,
        feature: "coding_assistant",
        model: req.body?.model || "",
        status: "error",
        inputLength: String(req.body?.code || "").length,
        title: `${req.body?.tool || "analyze"} ${req.body?.language || "code"}`,
        sourceType: "code",
        errorMessage: error.message,
      });
    }
    next(error);
  }
};

export const runCodingTask = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const { code = "", language = "javascript" } = req.body || {};

    const output = await retryWithBackoff(() => runCodeViaPiston({ code, language }), 1);
    await logUsage({
      user,
      feature: "coding_run",
      status: "success",
      inputLength: String(code).length,
      outputLength: output.length,
      title: `${language} run`,
      sourceType: "code",
      metadata: { language },
    });

    res.json({ success: true, data: { output } });
  } catch (error) {
    const user = req.clerkUserId ? await User.findOne({ clerkUserId: req.clerkUserId }).lean().catch(() => null) : null;
    if (user) {
      await logUsage({
        user,
        feature: "coding_run",
        status: "error",
        inputLength: String(req.body?.code || "").length,
        title: `${req.body?.language || "code"} run`,
        sourceType: "code",
        errorMessage: error.message,
      });
    }
    next(error);
  }
};

export const getAIAnalytics = async (req, res, next) => {
  try {
    const user = await resolveCurrentUser(req.clerkUserId);
    const [byFeature, byDay, byModel, recent, totals] = await Promise.all([
      AIUsageLog.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: "$feature", count: { $sum: 1 }, success: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      AIUsageLog.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            output: { $sum: "$outputLength" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      AIUsageLog.aggregate([
        { $match: { user: user._id, model: { $ne: "" } } },
        { $group: { _id: "$model", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AIUsageLog.find({ user: user._id }).sort({ createdAt: -1 }).limit(12).lean(),
      AIUsageLog.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successfulRequests: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
            totalInputLength: { $sum: "$inputLength" },
            totalOutputLength: { $sum: "$outputLength" },
          },
        },
      ]),
    ]);

    const total = totals[0] || { totalRequests: 0, successfulRequests: 0, totalInputLength: 0, totalOutputLength: 0 };
    const requestCount = total.totalRequests || 0;
    const successRate = requestCount > 0 ? Math.round(((total.successfulRequests || 0) / requestCount) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalRequests: requestCount,
        successfulRequests: total.successfulRequests || 0,
        successRate,
        totalInputLength: total.totalInputLength || 0,
        totalOutputLength: total.totalOutputLength || 0,
        byFeature: byFeature.map((item) => ({
          feature: item._id,
          count: item.count,
          success: item.success,
        })),
        byDay: byDay.map((item) => ({
          date: item._id,
          count: item.count,
          output: item.output,
        })),
        byModel: byModel.map((item) => ({ model: item._id, count: item.count })),
        recent: recent.map((item) => ({
          id: item._id,
          feature: item.feature,
          model: item.model,
          status: item.status,
          title: item.title,
          sourceType: item.sourceType,
          createdAt: item.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};