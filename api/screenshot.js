const puppeteer = require("puppeteer");
const { google } = require("googleapis");

// Load OAuth2 client from env
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = "https://developers.google.com/oauthplayground";
const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
oAuth2Client.setCredentials({ refresh_token });

module.exports = async (req, res) => {
  try {
    const sheetUrl = req.query.url;
    if (!sheetUrl) {
      return res.status(400).send("Missing ?url=<spreadsheet_url>");
    }

    // Launch puppeteer
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Use OAuth2 token to login
    const accessToken = (await oAuth2Client.getAccessToken()).token;
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    await page.goto(sheetUrl, { waitUntil: "networkidle2" });

    // Take screenshot
    const buffer = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating screenshot");
  }
};
