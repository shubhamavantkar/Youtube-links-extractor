const axios = require("axios");

const YT_API_KEY = process.env.YT_API_KEY;

function getDaysSinceUpload(uploadDate) {
  const now = new Date();
  const uploaded = new Date(uploadDate);
  const diff = now - uploaded;
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24)), 1);
}

function calculateViewsPerDay(views, uploadDate) {
  const days = getDaysSinceUpload(uploadDate);
  return Math.floor(views / days);
}

function calculateEngagementRate(views, likes, comments) {
  if (!views) return 0;
  return (((likes + comments) / views) * 100).toFixed(2);
}

function durationToSeconds(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const h = parseInt(match[1]) || 0;
  const m = parseInt(match[2]) || 0;
  const s = parseInt(match[3]) || 0;

  return h * 3600 + m * 60 + s;
}

function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

  const hours = (match[1] || "").replace("H", "");
  const minutes = (match[2] || "").replace("M", "");
  const seconds = (match[3] || "").replace("S", "");

  return `${hours ? hours + ":" : ""}${minutes || "0"}:${seconds || "00"}`;
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function resolveChannelId(channelUrl) {
  const handle = channelUrl.split("@")[1];

  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${handle}&key=${YT_API_KEY}`;

  const res = await axios.get(url);

  return res.data.items[0].id;
}

async function getUploadsPlaylist(channelId) {

  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`;

  const res = await axios.get(url);

  return res.data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getAllVideos(playlistId) {

  let videos = [];
  let videoIds = [];
  let nextPageToken = "";

  do {

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${YT_API_KEY}`;

    const res = await axios.get(url);

    res.data.items.forEach(item => {

      const videoId = item.snippet.resourceId.videoId;

      videos.push({
        title: item.snippet.title,
        videoId,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        uploadDate: item.snippet.publishedAt
      });

      videoIds.push(videoId);

    });

    nextPageToken = res.data.nextPageToken;

  } while (nextPageToken);

  const chunks = chunkArray(videoIds, 50);

  const statsMap = {};

  for (const chunk of chunks) {

    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${chunk.join(",")}&key=${YT_API_KEY}`;

    const statsRes = await axios.get(statsUrl);

    statsRes.data.items.forEach(video => {

      statsMap[video.id] = {
        views: video.statistics?.viewCount || 0,
        likes: video.statistics?.likeCount || 0,
        comments: video.statistics?.commentCount || 0,
        duration: formatDuration(video.contentDetails.duration)
      };

    });

  }

  const finalVideos = videos.map(video => ({
    title: video.title,
    link: video.link,
    uploadDate: video.uploadDate,
    views: statsMap[video.videoId]?.views || 0,
    likes: statsMap[video.videoId]?.likes || 0,
    comments: statsMap[video.videoId]?.comments || 0,
    duration: statsMap[video.videoId]?.duration || "0:00"
  }));

  return finalVideos;
}

module.exports = {
  resolveChannelId,
  getUploadsPlaylist,
  getAllVideos
};