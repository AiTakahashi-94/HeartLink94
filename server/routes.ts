import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBudgetSchema } from "@shared/schema";
import { z } from "zod";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google Vision API client
  const visionClient = new ImageAnnotatorClient({
    apiKey: process.env.GOOGLE_VISION_API_KEY,
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Google Vision OCR endpoint
  app.post("/api/ocr", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "画像ファイルが提供されていません"
        });
      }

      console.log("Processing image with Google Vision API...");
      
      // Call Google Vision API for text detection
      const [result] = await visionClient.textDetection({
        image: {
          content: req.file.buffer,
        },
      });

      const detections = result.textAnnotations;
      const fullText = detections?.[0]?.description || "";

      if (!fullText) {
        return res.status(400).json({
          success: false,
          error: "画像からテキストを検出できませんでした"
        });
      }

      console.log("Extracted text:", fullText);

      // Extract receipt information using enhanced logic
      const extractedInfo = extractReceiptInfo(fullText);

      res.json({
        success: true,
        ...extractedInfo,
        rawText: fullText
      });

    } catch (error) {
      console.error("Google Vision API error:", error);
      res.status(500).json({
        success: false,
        error: "OCR処理中にエラーが発生しました"
      });
    }
  });

  // Enhanced receipt information extraction
  function extractReceiptInfo(text: string) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    // Extract amount using multiple strategies
    let amount = null;
    let storeName = "";
    let date = null;

    // Strategy 1: Look for amounts near keywords with improved logic
    const keywords = ["合計", "決済金額", "お支払い", "金額"];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (keywords.some(keyword => line.includes(keyword))) {
        console.log(`Found keyword in line ${i}: "${line}"`);
        
        // First check if amount is on the same line as the keyword
        const sameLinePatterns = [
          /(?:合計|決済金額|お支払い|金額)\s*(\d{1,3}(?:[,.]?\d{3})*)円/,  // 合計 1,360円 or 合計 1.360円
          /(?:合計|決済金額|お支払い|金額)\s*[¥\\](\d{1,3}(?:[,.]?\d{3})*)/,  // 合計 ¥1,360 or ¥1.360
          /(?:合計|決済金額|お支払い|金額)\s*(\d{1,3}(?:[,.]?\d{3})*)/,  // 合計 1360
        ];
        
        for (const pattern of sameLinePatterns) {
          const match = line.match(pattern);
          if (match) {
            const numericValue = parseInt(match[1].replace(/[,.]/g, ""));
            if (numericValue >= 50 && numericValue <= 50000) {
              console.log(`Found amount on same line as keyword: ${match[1]} (${numericValue})`);
              amount = numericValue.toString();
              break;
            }
          }
        }
        
        if (amount) break;
        
        // If not found on same line, search next few lines (but prioritize immediate next line)
        for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
          const nextLine = lines[j];
          
          // Priority patterns for next lines
          const patterns = [
            /(\d{1,3}(?:[,.]?\d{3})*)円/,           // 1,360円 or 1.360円 (highest priority)
            /[¥\\](\d{1,3}(?:[,.]?\d{3})*)/,       // ¥1,360 or ¥1.360 or \1,360
            /(\d{1,3}(?:[,.]?\d{3})*)/,            // 1,360 or 1.360
          ];
          

          
          for (const pattern of patterns) {
            const match = nextLine.match(pattern);
            if (match) {
              const numericValue = parseInt(match[1].replace(/[,.]/g, ""));
              // For amounts near keywords, accept a wider range including small amounts like coffee
              if (numericValue >= 50 && numericValue <= 50000) {
                console.log(`Found amount on line ${j} after keyword: ${match[0]} (${numericValue})`);
                amount = numericValue.toString();
                break;
              }
            }
          }
          if (amount) break;
        }
        if (amount) break;
      }
    }

    // Strategy 2: If no amount found near keywords, find the most likely total
    if (!amount) {
      console.log("No amount found near keywords, searching for reasonable amounts");
      const allAmounts = [];
      
      for (const line of lines) {
        const patterns = [
          /(\d{1,3}(?:,\d{3})*)円/g,
          /¥(\d{1,3}(?:,\d{3})*)/g,
          /\\(\d{1,3}(?:,\d{3})*)/g,
        ];
        
        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const numericValue = parseInt(match[1].replace(/[,.]/g, ""));
            // Accept smaller amounts like coffee, drinks, etc.
            if (numericValue >= 50 && numericValue <= 50000) {
              allAmounts.push({ value: numericValue, original: match[0], line });
            }
          }
        }
      }
      
      if (allAmounts.length > 0) {
        console.log("All reasonable amounts found:", allAmounts);
        // Sort by value and pick the largest reasonable amount
        allAmounts.sort((a, b) => b.value - a.value);
        amount = allAmounts[0].value.toString();
        console.log(`Selected largest reasonable amount: ${amount} from line: ${allAmounts[0].line}`);
      }
    }

    // Extract store name (first few lines that don't contain numbers/dates)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (!line.match(/\d{4}[年\/\-]/) && !line.match(/TEL|電話/) && line.length > 2) {
        storeName = line;
        break;
      }
    }

    // Extract date
    const datePattern = /(\d{4})[年\/\-](\d{1,2})[月\/\-](\d{1,2})[日]?/;
    for (const line of lines) {
      const match = line.match(datePattern);
      if (match) {
        date = `${match[1]}年${match[2]}月${match[3]}日`;
        break;
      }
    }

    return {
      amount,
      storeName,
      date,
    };
  }

  // Create expense
  app.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create expense" });
      }
    }
  });

  // Get all expenses for user
  app.get("/api/expenses", async (req, res) => {
    try {
      // For demo purposes, use default user
      const expenses = await storage.getExpensesByUserId("default-user");
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expenses" });
    }
  });

  // Get expenses by month
  app.get("/api/expenses/month/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const expenses = await storage.getExpensesByMonth("default-user", year, month);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly expenses" });
    }
  });

  // Get single expense
  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.getExpenseById(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expense" });
    }
  });

  // Update expense
  app.patch("/api/expenses/:id", async (req, res) => {
    try {
      const updates = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, updates);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update expense" });
      }
    }
  });

  // Delete expense
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const success = await storage.deleteExpense(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete expense" });
    }
  });

  // Budget management endpoints
  
  // Create or update budget
  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      
      // Check if budget already exists for this month
      const existingBudget = await storage.getBudgetByMonth(
        validatedData.userId, 
        validatedData.year, 
        validatedData.month
      );
      
      if (existingBudget) {
        // Update existing budget
        const updatedBudget = await storage.updateBudget(existingBudget.id, {
          amount: validatedData.amount
        });
        res.json(updatedBudget);
      } else {
        // Create new budget
        const budget = await storage.createBudget(validatedData);
        res.json(budget);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create/update budget" });
      }
    }
  });

  // Get budget for specific month
  app.get("/api/budgets/:year/:month", async (req, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ error: "Invalid year or month" });
      }
      
      const budget = await storage.getBudgetByMonth("default-user", year, month);
      if (!budget) {
        return res.status(404).json({ error: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch budget" });
    }
  });

  // Get current month budget with spending summary
  app.get("/api/budgets/current", async (req, res) => {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // Get budget for current month
      const budget = await storage.getBudgetByMonth("default-user", year, month);
      
      // Get expenses for current month
      const expenses = await storage.getExpensesByMonth("default-user", year, month);
      
      // Calculate total spent
      const totalSpent = expenses.reduce((sum, expense) => 
        sum + parseFloat(expense.amount), 0
      );
      
      const budgetAmount = budget ? parseFloat(budget.amount) : 0;
      const remaining = budgetAmount - totalSpent;
      const usagePercentage = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0;
      
      // Determine alert level
      let alertLevel = "safe";
      if (usagePercentage >= 100) {
        alertLevel = "over_budget";
      } else if (usagePercentage >= 80) {
        alertLevel = "warning";
      }
      
      res.json({
        budget: budget || null,
        totalSpent,
        remaining,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        alertLevel,
        year,
        month,
        expenseCount: expenses.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current budget status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
