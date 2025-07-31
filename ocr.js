require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");

const imagePath = "receipt.png"; // アップロードしたレシート画像名

async function runOCR() {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: "TEXT_DETECTION" }]
      }
    ]
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const json = await response.json();
  const text = json.responses[0]?.fullTextAnnotation?.text;

  console.log("\n=== OCR結果 ===\n");
  console.log(text || "文字が読み取れませんでした");

  const total = text?.match(/¥?\d{3,6}/g)?.[0];
  const date = text?.match(/\d{4}年\d{1,2}月\d{1,2}日/)?.[0];

  console.log("\n--- 抽出 ---");
  console.log("合計金額:", total || "見つかりませんでした");
  console.log("日付:", date || "見つかりませんでした");
}

runOCR();
