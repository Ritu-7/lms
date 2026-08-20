const YOUTUBE_ID_PATTERN =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/;

const extractYouTubeId = (url = "") => {
  const match = String(url).match(YOUTUBE_ID_PATTERN);
  return match?.[1] || "";
};

const parseYouTubeDurationMinutes = (html = "") => {
  const lengthMatch = html.match(/"lengthSeconds":"(\d+)"/);
  if (lengthMatch) {
    const seconds = Number(lengthMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.max(1, Math.ceil(seconds / 60));
    }
  }

  const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
  if (approxMatch) {
    const milliseconds = Number(approxMatch[1]);
    if (Number.isFinite(milliseconds) && milliseconds > 0) {
      return Math.max(1, Math.ceil(milliseconds / 60000));
    }
  }

  return null;
};

export const getVideoDuration = async (req, res) => {
  try {
    const url = String(req.query.url || "").trim();
    if (!url) {
      return res.status(400).json({ success: false, message: "Video URL is required" });
    }

    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        message: "Only YouTube URLs are supported for server-side duration detection",
      });
    }

    const response = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: "Unable to fetch YouTube video metadata" });
    }

    const html = await response.text();
    const durationMinutes = parseYouTubeDurationMinutes(html);

    if (!durationMinutes) {
      return res.status(404).json({ success: false, message: "Could not detect video duration" });
    }

    return res.json({
      success: true,
      durationMinutes,
      source: "youtube",
      videoId: youtubeId,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to detect video duration",
    });
  }
};
