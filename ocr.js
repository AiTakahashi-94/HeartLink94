// ocr.js
require("dotenv").config();
const fs = require("fs");
const { ImageAnnotatorClient } = require("@google-cloud/vision");

// Renderの環境変数からサービスアカウントJSONを読み込む
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

// Vision APIクライアントを作成
const client = new ImageAnnotatorClient({ credentials });

// OCR対象の画像
const imagePath = "receipt.png";

async function runOCR() {
  // 画像を読み込む
  const imageBuffer = fs.readFileSync(imagePath);

  // OCR実行
  const [result] = await client.textDetection({ image: { content: imageBuffer } });
  const detections = result.textAnnotations;
  const text = detections[0]?.description;

  console.log("\n=== OCRの結果 ===\n");
  console.log(text || "文字を読み取れませんでした");

  if (text) {
    // 行ごとに分解して「合計」を探す
    const lines = text.split("\n");
    const totalLine = lines.find(line => line.includes("合計"));

    let totalAmount = null;
    if (totalLine) {
      const match = totalLine.match(/(?:¥|\\|Y)?\s?\d{2,6}/);
      totalAmount = match?.[0] || null;
    }

    console.log("\n--- 合計金額 ---");
    console.log(totalAmount || "見つかりませんでした");
  }
}

// 実行
runOCR();
