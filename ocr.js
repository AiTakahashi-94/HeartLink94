// 環境変数を読み込む（.envからAPIキーを取得）
require("dotenv").config();
const fs = require("fs");
const fetch = require("node-fetch");

// OCR対象の画像ファイル名
const imagePath = "receipt.png";

async function runOCR() {
  // 画像をbase64に変換
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  // Vision APIに送るリクエストボディ
  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: "TEXT_DETECTION" }]
      }
    ]
  };

  // Vision APIにPOSTリクエスト
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  const json = await response.json();

  // OCRで読み取ったテキストを取得
  const text = json.responses[0]?.fullTextAnnotation?.text;

  console.log("\n=== OCRの結果 ===\n");
  console.log(text || "文字を読み取れませんでした");

  if (text) {
    // テキストを行ごとに分解
    const lines = text.split('\n');

    // 「合計」と書かれた行を探す
    const totalLine = lines.find(line => line.includes("合計"));

    let totalAmount = null;
    if (totalLine) {
      // 金額らしきもの（¥なしでも対応）の抽出
      const match = totalLine.match(/(?:¥|\\|Y)?\s?\d{2,6}/);
      totalAmount = match?.[0] || null;
    }

    console.log("\n--- 合計金額 ---");
    console.log(totalAmount || "見つかりませんでした");
  }
}

runOCR();
