import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { google } from 'googleapis';

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uri = "https://developers.google.com/oauthplayground";
const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uri);
oAuth2Client.setCredentials({ refresh_token });

export default async function handler(req, res) {
  try {
    const sheetUrl = req.query.url;
    if (!sheetUrl) return res.status(400).send("Missing ?url=<sheet_url>");

    const token = (await oAuth2Client.getAccessToken()).token;

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ Authorization: `Bearer ${token}` });
    await page.goto(sheetUrl, { waitUntil: 'networkidle2' });

    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to capture screenshot");
  }
}
