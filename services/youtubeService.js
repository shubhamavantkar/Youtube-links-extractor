const axios = require("axios");

const YT_API_KEY = process.env.YT_API_KEY;

async function getUploadsPlaylist(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YT_API_KEY}`;
  const res = await axios.get(url);
  return res.data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getAllVideos(playlistId) {
  let videos = [];
  let nextPageToken = "";

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${YT_API_KEY}`;
    const res = await axios.get(url);

    res.data.items.forEach(item => {
      const videoId = item.snippet.resourceId.videoId;
      videos.push({
        title: item.snippet.title,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: item.snippet.publishedAt
      });
    });

    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return videos;
}

module.exports = { getUploadsPlaylist, getAllVideos };