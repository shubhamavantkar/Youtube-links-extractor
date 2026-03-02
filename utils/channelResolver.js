const axios = require("axios");

const YT_API_KEY = process.env.YT_API_KEY;

function extractIdentifier(url) {
  try {
    const parsed = new URL(url);

    const path = parsed.pathname;

    if (path.startsWith("/@")) {
      return { type: "handle", value: path.replace("/", "") };
    }

    if (path.startsWith("/channel/")) {
      return { type: "id", value: path.split("/")[2] };
    }

    if (path.startsWith("/c/")) {
      return { type: "custom", value: path.split("/")[2] };
    }

    if (path.startsWith("/user/")) {
      return { type: "username", value: path.split("/")[2] };
    }

    throw new Error("Unsupported YouTube URL format");

  } catch (err) {
    throw new Error("Invalid URL");
  }
}

async function resolveChannelId(url) {
  const identifier = extractIdentifier(url);

  let apiUrl;

  switch (identifier.type) {
    case "handle":
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${identifier.value}&key=${YT_API_KEY}`;
      break;

    case "username":
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${identifier.value}&key=${YT_API_KEY}`;
      break;

    case "id":
      return identifier.value;

    case "custom":
      // Custom URLs require search fallback
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${identifier.value}&key=${YT_API_KEY}`;
      const searchRes = await axios.get(apiUrl);
      return searchRes.data.items[0].snippet.channelId;

    default:
      throw new Error("Cannot resolve channel");
  }

  const res = await axios.get(apiUrl);

  if (!res.data.items.length) {
    throw new Error("Channel not found");
  }

  return res.data.items[0].id;
}

module.exports = { resolveChannelId };