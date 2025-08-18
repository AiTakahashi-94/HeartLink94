// ocr.js
import vision from '@google-cloud/vision';
import path from 'path';

// Secret File のパスを Render 環境用に指定
const keyFilePath = '/etc/secrets/service-account.json';

const client = new vision.ImageAnnotatorClient({
  keyFilename: keyFilePath
});

export async function detectText(imagePath) {
  const [result] = await client.textDetection(imagePath);
  return result.textAnnotations;
}
