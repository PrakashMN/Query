import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import puppeteer from "puppeteer";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "..");
const backendUploadsDir = path.join(workspaceRoot, "backend", "uploads");
const templatePath = path.join(__dirname, "templates", "deal-template.js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

async function getRenderDealHtml() {
  const templateUrl = new URL(pathToFileURL(templatePath).href);
  templateUrl.searchParams.set("v", `${Date.now()}`);
  const module = await import(templateUrl.href);
  return module.renderDealHtml;
}

app.get("/health", async (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/generate-pdf", async (req, res) => {
  const property = req.body?.property;
  if (!property?.id) {
    return res.status(400).json({ detail: "Property payload with id is required" });
  }

  const renderDealHtml = await getRenderDealHtml();

  const propertyDir = path.join(backendUploadsDir, "properties", property.id);
  await fs.mkdir(propertyDir, { recursive: true });

  const pdfPath = path.join(propertyDir, "deal_document.pdf");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });

  try {
    const page = await browser.newPage();
    
    // Pipe browser console logs to Node console for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    // Let the images load naturally. Since we now compress at source (Frontend), 
    // these images are already optimized 150KB JPEGs 1000px wide.
    await page.setContent(renderDealHtml(property), { waitUntil: "networkidle0" });

    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
    });
  } finally {
    await browser.close();
  }

  res.json({ pdf_path: pdfPath });
});

app.listen(3001, () => {
  console.log("MyMane PDF service listening on http://localhost:3001");
});
