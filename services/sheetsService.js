const { google } = require("googleapis");

const SHEET_ID = process.env.SHEET_ID;

async function getAuth() {

  return new google.auth.GoogleAuth({
    keyFile: "service-account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

}

async function saveToSheet(videoData) {

  const auth = await getAuth();

  const sheets = google.sheets({
    version: "v4",
    auth
  });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "Sheet1"
  });

  const values = videoData.map(video => [

    video.title,
    video.link,
    video.uploadDate,
    video.views,
    video.likes,
    video.comments,
    video.duration

  ]);

  values.unshift([
    "Title",
    "Video Link",
    "Upload Date",
    "Views",
    "Likes",
    "Comments",
    "Duration"
  ]);

  await sheets.spreadsheets.values.update({

    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: { values }

  });

}

async function getAllSheetData() {

  const auth = await getAuth();

  const sheets = google.sheets({
    version: "v4",
    auth
  });

  const res = await sheets.spreadsheets.values.get({

    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1:G"

  });

  return res.data.values || [];

}

module.exports = {
  saveToSheet,
  getAllSheetData
};