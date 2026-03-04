require("dotenv").config();

const express = require("express");
const path = require("path");
const { Parser } = require("json2csv");

const {
  resolveChannelId,
  getUploadsPlaylist,
  getAllVideos
} = require("./services/youtubeService");

const {
  saveToSheet,
  getAllSheetData
} = require("./services/sheetsService");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let isProcessing = false;

app.post("/fetch-channel", async (req, res) => {

  if (isProcessing) {
    return res.status(429).json({
      error: "Another request is currently processing"
    });
  }

  isProcessing = true;

  try {

    const { channelUrl } = req.body;

    const channelId = await resolveChannelId(channelUrl);
    const playlistId = await getUploadsPlaylist(channelId);
    const videos = await getAllVideos(playlistId);

    await saveToSheet(videos);

    res.json({
      success: true,
      totalVideos: videos.length
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  } finally {

    isProcessing = false;

  }

});

app.get("/videos", async (req, res) => {

  const rows = await getAllSheetData();

  const formatted = rows.slice(1).map(row => ({
    title: row[0],
    link: row[1],
    uploadDate: row[2],
    views: row[3],
    likes: row[4],
    comments: row[5],
    duration: row[6]
  }));

  res.json(formatted);

});

app.get("/download-csv", async (req, res) => {

  const rows = await getAllSheetData();

  const data = rows.slice(1).map(row => ({
    title: row[0],
    link: row[1],
    uploadDate: row[2],
    views: row[3],
    likes: row[4],
    comments: row[5],
    duration: row[6]
  }));

  const parser = new Parser();
  const csv = parser.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment("videos.csv");
  res.send(csv);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});