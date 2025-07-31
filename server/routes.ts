import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock OCR endpoint
  app.post("/api/ocr", async (req, res) => {
    try {
      // Simulate OCR processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR result - in real implementation, this would process the image
      const mockAmount = Math.floor(Math.random() * 5000) + 500; // Random amount between 500-5500
      
      res.json({
        success: true,
        amount: mockAmount,
        extractedText: `合計 ${mockAmount}円`
      });
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
