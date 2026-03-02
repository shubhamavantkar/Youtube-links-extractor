require("dotenv").config();
const express = require("express");
const { getUploadsPlaylist, getAllVideos } = require("./services/youtubeService");
const { saveToSheet } = require("./services/sheetsService");
const { resolveChannelId } = require("./utils/channelResolver");
const { getAllSheetData } = require("./services/sheetsService");
const { Parser } = require("json2csv");
const path = require("path");
const app = express();

app.use(express.static("public"));


app.use(express.json());

let isProcessing = false;

app.post("/fetch-channel", async (req, res) => {

    if (isProcessing) {
    return res.status(429).json({
      error: "Another request is currently processing. Please try again in a few moments."
    });
  }

  isProcessing = true;

   try {
    const { channelUrl } = req.body;

    if (!channelUrl) {
      return res.status(400).json({ error: "channelUrl is required" });
    }

    const channelId = await resolveChannelId(channelUrl);
    const playlistId = await getUploadsPlaylist(channelId);
    const videos = await getAllVideos(playlistId);

    await saveToSheet(videos);

    res.json({
      success: true,
      channelId,
      totalVideos: videos.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });

  } finally {
    isProcessing = false; // 🔥 ALWAYS releases lock
  }
});

app.get("/videos", async (req, res) => {
  try {
    const rows = await getAllSheetData();

    const formatted = rows.map(row => ({
      title: row[0],
      link: row[1],
      publishedAt: row[2],
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/download-csv", async (req, res) => {
  try {
    const rows = await getAllSheetData();

    const data = rows.map(row => ({
      title: row[0],
      link: row[1],
      publishedAt: row[2],
    }));

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("videos.csv");
    return res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);