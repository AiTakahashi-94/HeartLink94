import express from 'express';
import { detectText } from './ocr.js';

const app = express();
app.use(express.json());

app.post('/api/ocr', async (req, res) => {
  try {
    const { imagePath } = req.body;
    const annotations = await detectText(imagePath);
    res.json({ success: true, annotations });
  } catch (error) {
    console.error('Google Vision API error:', error);
    res.status(500).json({ success: false, error: 'OCR処理中にエラーが発生しました' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[express] serving on port ${PORT}`));
