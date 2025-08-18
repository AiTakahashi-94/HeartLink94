import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema, insertBudgetSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { enhancedOcrService } from "./ocr-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
  });

  // Enhanced Google Vision OCR endpoint
  app.post("/api/ocr", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "画像ファイルが提供されていません"
        });
      }

      // Use enhanced OCR service
      const result = await enhancedOcrService.processImageBuffer(req.file.buffer);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error("Enhanced OCR error:", error);
      res.status(500).json({
        success: false,
        error: "OCR処理中にエラーが発生しました"
      });
    }
  });



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

  // Get monthly expense summary for charts
  app.get("/api/expenses/monthly-summary", async (req, res) => {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      
      // Get last 6 months of data
      const startMonth = currentMonth - 5;
      const startYear = startMonth <= 0 ? currentYear - 1 : currentYear;
      const adjustedStartMonth = startMonth <= 0 ? startMonth + 12 : startMonth;
      
      const summary = await storage.getMonthlyExpenseSummary(
        "default-user", 
        startYear, 
        adjustedStartMonth, 
        currentYear, 
        currentMonth
      );
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      res.status(500).json({ error: "Failed to fetch monthly expense summary" });
    }
  });

  // User management endpoints
  
  // Get current user
  app.get("/api/user", async (req, res) => {
    try {
      // For demo, always return default user
      const user = await storage.getUser("default-user");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Include partner info if exists
      let partner = null;
      if (user.partnerId) {
        partner = await storage.getUser(user.partnerId);
      }
      
      res.json({ user, partner });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Update user display name
  app.patch("/api/user", async (req, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser("default-user", validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
    }
  });

  // Generate invite code
  app.post("/api/invite/generate", async (req, res) => {
    try {
      const inviteCode = await storage.generateInviteCode("default-user");
      if (!inviteCode) {
        return res.status(500).json({ error: "Failed to generate invite code" });
      }
      
      res.json({ inviteCode });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invite code" });
    }
  });

  // Join by invite code
  app.post("/api/invite/join", async (req, res) => {
    try {
      const { inviteCode } = req.body;
      
      if (!inviteCode) {
        return res.status(400).json({ error: "Invite code is required" });
      }
      
      const inviter = await storage.getUserByInviteCode(inviteCode);
      if (!inviter) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      
      const success = await storage.linkPartner("default-user", inviter.id);
      if (!success) {
        return res.status(500).json({ error: "Failed to link partners" });
      }
      
      res.json({ success: true, partner: inviter });
    } catch (error) {
      res.status(500).json({ error: "Failed to join" });
    }
  });

  // Object storage endpoints for avatar uploads
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      console.log("Getting upload URL...");
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Generated upload URL:", uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/avatars", async (req, res) => {
    if (!req.body.avatarURL) {
      return res.status(400).json({ error: "avatarURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.avatarURL);
      
      // Update user avatar URL in database
      const updatedUser = await storage.updateUser("default-user", { avatarUrl: objectPath });
      
      res.status(200).json({
        objectPath: objectPath,
        user: updatedUser
      });
    } catch (error) {
      console.error("Error setting avatar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
