import puppeteer from "puppeteer-core";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const { htmlContent } = JSON.parse(event.body || "{}");
  if (!htmlContent) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing htmlContent" }),
    };
  }

  try {
    // Lança browser headless
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();

    // Salva localmente (em produção subiria para S3/Cloudinary)
    const fileId = uuid();
    const filePath = path.resolve("/tmp", `${fileId}.pdf`);
    await fs.writeFile(filePath, pdfBuffer);

    return { statusCode: 200, body: JSON.stringify({ filePath }) };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Puppeteer error" }),
    };
  }
}
