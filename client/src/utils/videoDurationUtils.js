const YOUTUBE_ID_PATTERN =
  /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?(?:.*&)?v=))([a-zA-Z0-9_-]{11})/;

export const extractYouTubeId = (url = "") => {
  if (!url || typeof url !== "string") return "";
  const match = url.match(YOUTUBE_ID_PATTERN);
  return match?.[1] || "";
};

const isDirectVideoUrl = (url = "") => /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);

export const getDurationFromVideoFile = (file) =>
  new Promise((resolve) => {
    if (!file || !file.type?.startsWith("video/")) {
      resolve(null);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const seconds = Number(video.duration);
      cleanup();
      resolve(Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : null);
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = objectUrl;
  });

export const getDurationFromDirectVideoUrl = (url) =>
  new Promise((resolve) => {
    if (!url || !isDirectVideoUrl(url)) {
      resolve(null);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const seconds = Number(video.duration);
      cleanup();
      resolve(Number.isFinite(seconds) && seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : null);
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = url;
  });

export const fetchVideoDurationMinutes = async (url, { backendURL, getToken } = {}) => {
  if (!url?.trim()) return null;

  const trimmedUrl = url.trim();
  const youtubeId = extractYouTubeId(trimmedUrl);

  if (youtubeId && backendURL && typeof getToken === "function") {
    try {
      const token = await getToken();
      const response = await fetch(
        `${backendURL}/api/educator/video-duration?url=${encodeURIComponent(trimmedUrl)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();

      if (data?.success && Number(data.durationMinutes) > 0) {
        return Number(data.durationMinutes);
      }
    } catch {
      // Fall through to client-side detection.
    }
  }

  return getDurationFromDirectVideoUrl(trimmedUrl);
};
