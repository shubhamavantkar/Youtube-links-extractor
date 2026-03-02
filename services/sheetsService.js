const { google } = require("googleapis");

const SHEET_ID = process.env.SHEET_ID;

async function getAllSheetData() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:C",
  });

  return res.data.values || [];
}

async function saveToSheet(videoData) {
  const auth = new google.auth.GoogleAuth({
    keyFile: "service-account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });

  // 1️⃣ Clear existing data
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A:C",
  });

  // 2️⃣ Prepare new data
  const values = videoData.map(video => [
    video.title,
    video.link,
    video.publishedAt
  ]);

  // Optional: Add header row
  values.unshift(["Title", "Link", "Published At"]);

  // 3️⃣ Write fresh data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: {
      values,
    },
  });
}

module.exports = { saveToSheet, getAllSheetData };