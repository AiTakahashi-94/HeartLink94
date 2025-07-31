import { type User, type InsertUser, type Expense, type InsertExpense } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByUserId(userId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  getExpensesByMonth(userId: string, year: number, month: number): Promise<Expense[]>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private expenses: Map<string, Expense>;

  constructor() {
    this.users = new Map();
    this.expenses = new Map();
    
    // Create a default user for demo purposes
    const defaultUser: User = {
      id: "default-user",
      username: "couple@example.com",
      password: "password"
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Add some sample expenses for demonstration
    this.seedExpenses();
  }

  private seedExpenses() {
    const sampleExpenses: Expense[] = [
      {
        id: "exp-1",
        userId: "default-user",
        amount: "3240.00",
        category: "食費",
        emotion: "happy",
        storeName: "スーパーマーケット田中",
        notes: "今日の夕食の材料を購入。新鮮な魚が安く買えました。",
        receiptUrl: null,
        createdAt: new Date("2024-01-15T14:32:00")
      },
      {
        id: "exp-2",
        userId: "default-user",
        amount: "1580.00",
        category: "医療費",
        emotion: "necessary",
        storeName: "ABC薬局",
        notes: "風邪薬と体温計を購入",
        receiptUrl: null,
        createdAt: new Date("2024-01-14T16:45:00")
      },
      {
        id: "exp-3",
        userId: "default-user",
        amount: "3600.00",
        category: "娯楽",
        emotion: "excited",
        storeName: "TOHOシネマズ",
        notes: "デートで映画鑑賞。最新作がとても面白かった！",
        receiptUrl: null,
        createdAt: new Date("2024-01-13T19:20:00")
      },
      {
        id: "exp-4",
        userId: "default-user",
        amount: "4990.00",
        category: "衣類",
        emotion: "satisfied",
        storeName: "ユニクロ渋谷店",
        notes: "冬用のセーターを購入。暖かくて質も良い。",
        receiptUrl: null,
        createdAt: new Date("2024-01-12T15:30:00")
      },
      {
        id: "exp-5",
        userId: "default-user",
        amount: "890.00",
        category: "日用品",
        emotion: "worried",
        storeName: "コンビニエンスストア",
        notes: "急いでいて高い商品を買ってしまった",
        receiptUrl: null,
        createdAt: new Date("2024-01-11T22:15:00")
      }
    ];
    
    sampleExpenses.forEach(expense => {
      this.expenses.set(expense.id, expense);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = {
      ...insertExpense,
      id,
      notes: insertExpense.notes ?? null,
      receiptUrl: insertExpense.receiptUrl ?? null,
      createdAt: new Date(),
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async getExpensesByUserId(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => expense.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpensesByMonth(userId: string, year: number, month: number): Promise<Expense[]> {
    return Array.from(this.expenses.values())
      .filter(expense => {
        if (expense.userId !== userId) return false;
        const expenseDate = new Date(expense.createdAt);
        return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateExpense(id: string, updates: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...updates };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }
}

export const storage = new MemStorage();
