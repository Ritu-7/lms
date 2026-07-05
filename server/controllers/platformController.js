import Announcement from "../models/Announcement.js";
import { getAdminOverview, getPublicHomeOverview } from "../services/platformService.js";
import { notifyAdminAnnouncement } from "../services/notificationService.js";

export const getPlatformHome = async (req, res) => {
  try {
    const data = await getPublicHomeOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminOverviewData = async (req, res) => {
  try {
    const data = await getAdminOverview();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isPublished: true }).sort({ publishAt: -1, createdAt: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience = "all", publishAt = null, isPublished = true } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const announcement = await Announcement.create({ title, message, audience, publishAt, isPublished });

    // ── Fire broadcast notification ───────────────────────────────────
    if (isPublished) {
      notifyAdminAnnouncement(announcement._id, title, message, audience, req.user?._id || null);
    }

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true, announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};