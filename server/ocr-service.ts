// Enhanced OCR service combining multiple Google Vision API approaches
import { ImageAnnotatorClient } from "@google-cloud/vision";

interface OcrResult {
  success: boolean;
  amount?: string | null;
  storeName?: string | null;
  date?: string | null;
  rawText?: string;
  error?: string;
}

export class EnhancedOcrService {
  private visionClient: ImageAnnotatorClient;

  constructor() {
    // Support both authentication methods
    if (process.env.GOOGLE_VISION_API_KEY) {
      // API Key based authentication
      this.visionClient = new ImageAnnotatorClient({
        apiKey: process.env.GOOGLE_VISION_API_KEY,
      });
    } else {
      // Service account file based authentication
      const keyFilePath = '/etc/secrets/service-account.json';
      this.visionClient = new ImageAnnotatorClient({
        keyFilename: keyFilePath
      });
    }
  }

  /**
   * Process image buffer (for multipart uploads)
   */
  async processImageBuffer(buffer: Buffer): Promise<OcrResult> {
    try {
      console.log("Processing image buffer with enhanced Google Vision API...");
      
      const [result] = await this.visionClient.textDetection({
        image: { content: buffer },
      });

      return this.processVisionResult(result);
    } catch (error) {
      console.error("Enhanced OCR error:", error);
      return {
        success: false,
        error: "OCR処理中にエラーが発生しました"
      };
    }
  }

  /**
   * Process image file path (for file-based processing)
   */
  async processImagePath(imagePath: string): Promise<OcrResult> {
    try {
      console.log("Processing image path with enhanced Google Vision API...");
      
      const [result] = await this.visionClient.textDetection(imagePath);
      
      return this.processVisionResult(result);
    } catch (error) {
      console.error("Enhanced OCR error:", error);
      return {
        success: false,
        error: "OCR処理中にエラーが発生しました"
      };
    }
  }

  /**
   * Process Google Vision API result with enhanced extraction logic
   */
  private processVisionResult(result: any): OcrResult {
    const detections = result.textAnnotations;
    const fullText = detections?.[0]?.description || "";

    if (!fullText) {
      return {
        success: false,
        error: "画像からテキストを検出できませんでした"
      };
    }

    console.log("Extracted text:", fullText);

    // Enhanced receipt information extraction
    const extractedInfo = this.extractReceiptInfo(fullText);

    return {
      success: true,
      ...extractedInfo,
      rawText: fullText
    };
  }

  /**
   * Enhanced receipt information extraction with improved Japanese text processing
   */
  private extractReceiptInfo(text: string) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    console.log("All lines:", lines.map((line, index) => `${index}: ${line}`));

    // Enhanced amount extraction with priority keywords
    const amount = this.extractAmountWithPriority(lines);
    const storeName = this.extractStoreName(lines);
    const date = this.extractDate(text);

    return { amount, storeName, date };
  }

  /**
   * Enhanced amount extraction with priority-based selection
   */
  private extractAmountWithPriority(lines: string[]): string | null {
    // Priority keywords for total amount (highest to lowest priority)
    const priorityKeywords = [
      "合計", "総計", "計", "お支払い金額", "決済金額", "お会計", 
      "小計", "税込", "税込合計", "合計金額", "請求金額"
    ];

    // Find lines with priority keywords
    for (const keyword of priorityKeywords) {
      const keywordLine = lines.findIndex(line => 
        line.includes(keyword) && !line.includes("内消費税") && !line.includes("対象")
      );
      
      if (keywordLine !== -1) {
        console.log(`Found priority keyword in line ${keywordLine}: "${keyword}"`);
        
        // Look for amounts in the same line and nearby lines
        const searchLines = [
          lines[keywordLine],
          lines[keywordLine + 1],
          lines[keywordLine + 2]
        ].filter(Boolean);

        const amounts = this.extractAmountsFromLines(searchLines);
        if (amounts.length > 0) {
          // Select the largest amount when multiple candidates exist
          const selectedAmount = amounts.sort((a, b) => b.value - a.value)[0];
          console.log(`Multiple amounts found near keyword, selected largest: ¥${selectedAmount.text} (${selectedAmount.value}) on line ${keywordLine + amounts.indexOf(selectedAmount)}`);
          console.log(`All candidates: [`, amounts.map(a => `'¥${a.text} (${a.value})'`).join(', '), `]`);
          return selectedAmount.value.toString();
        }
      }
    }

    // Fallback: find largest amount in the text
    const allAmounts = this.extractAmountsFromLines(lines);
    if (allAmounts.length > 0) {
      const maxAmount = allAmounts.sort((a, b) => b.value - a.value)[0];
      console.log(`No priority keywords found, selected largest amount: ¥${maxAmount.text} (${maxAmount.value})`);
      return maxAmount.value.toString();
    }

    return null;
  }

  /**
   * Extract all amounts from given lines
   */
  private extractAmountsFromLines(lines: string[]): { text: string, value: number }[] {
    const amounts: { text: string, value: number }[] = [];
    
    for (const line of lines) {
      // Enhanced regex to match various Japanese currency formats
      const amountRegex = /[¥￥\\]?\s*([0-9]{1,3}(?:[,，][0-9]{3})*(?:\.[0-9]+)?)\s*[円¥￥\\]?/g;
      let match;
      
      while ((match = amountRegex.exec(line)) !== null) {
        const amountStr = match[1].replace(/[,，]/g, '');
        const amountValue = parseInt(amountStr);
        
        // Filter out unrealistic amounts (too small or too large)
        if (amountValue >= 10 && amountValue <= 1000000) {
          amounts.push({
            text: amountStr,
            value: amountValue
          });
        }
      }
    }
    
    return amounts;
  }

  /**
   * Enhanced store name extraction
   */
  private extractStoreName(lines: string[]): string | null {
    // Skip common headers and look for actual store names
    const skipPatterns = [
      /^[領レ][収シ][書證]/, /^receipt/i, /^株式会社$/,
      /^電話/, /^tel:/i, /^住所/, /^登録番号/, /^〒/
    ];

    // Look for store name in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      
      // Skip lines that match skip patterns
      if (skipPatterns.some(pattern => pattern.test(line))) {
        continue;
      }
      
      // Look for lines that likely contain store names
      if (line.length > 2 && line.length < 50) {
        // Filter out lines that are clearly not store names
        if (!/^[0-9\s\-\/\\]+$/.test(line) && 
            !/^[¥￥\\][0-9,，]+/.test(line) &&
            !line.includes('レジ') &&
            !line.includes('担当')) {
          return line;
        }
      }
    }

    return lines[0] || null;
  }

  /**
   * Enhanced date extraction
   */
  private extractDate(text: string): string | null {
    // Enhanced regex patterns for Japanese date formats
    const datePatterns = [
      /(\d{4})[\/\-年](\d{1,2})[\/\-月](\d{1,2})[日\s]/,
      /(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/,
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
      /令和(\d+)年(\d{1,2})月(\d{1,2})日/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          if (pattern.source.includes('令和')) {
            // Convert Reiwa era to Western calendar
            const reiwaYear = parseInt(match[1]);
            const year = 2018 + reiwaYear; // Reiwa started in 2019
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          } else {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]);
            const day = parseInt(match[3]);
            
            if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
              return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            }
          }
        } catch (error) {
          console.error("Date parsing error:", error);
        }
      }
    }

    return null;
  }
}

// Export singleton instance
export const enhancedOcrService = new EnhancedOcrService();