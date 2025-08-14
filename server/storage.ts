import { type User, type InsertUser, type UpdateUser, type Expense, type InsertExpense, type Budget, type InsertBudget } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: UpdateUser): Promise<User | undefined>;
  linkPartner(userId: string, partnerId: string): Promise<boolean>;
  generateInviteCode(userId: string): Promise<string | null>;
  getUserByInviteCode(inviteCode: string): Promise<User | undefined>;
  
  createExpense(expense: InsertExpense): Promise<Expense>;
  getExpensesByUserId(userId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  getExpensesByMonth(userId: string, year: number, month: number): Promise<Expense[]>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  createBudget(budget: InsertBudget): Promise<Budget>;
  getBudgetByMonth(userId: string, year: number, month: number): Promise<Budget | undefined>;
  updateBudget(id: string, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private expenses: Map<string, Expense>;
  private budgets: Map<string, Budget>;

  constructor() {
    this.users = new Map();
    this.expenses = new Map();
    this.budgets = new Map();
    
    // Create a default user for demo purposes
    const defaultUser: User = {
      id: "default-user",
      username: "couple@example.com",
      displayName: "田中さん",
      password: "password",
      partnerId: null,
      inviteCode: null,
      isActive: "true",
      createdAt: new Date()
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Add some sample expenses for demonstration
    this.seedExpenses();
    
    // Add sample budget for demonstration
    this.seedBudgets();
  }

  private seedExpenses() {
    const sampleExpenses: Expense[] = [
      {
        id: "exp-1",
        userId: "default-user",
        amount: "3240.00",
        category: "食費",
        emotion: "positive",
        storeName: "スーパーマーケット田中",
        notes: "今日の夕食の材料を購入。新鮮な魚が安く買えました。",
        receiptUrl: null,
        createdAt: new Date("2025-08-05T14:32:00")
      },
      {
        id: "exp-2",
        userId: "default-user",
        amount: "1580.00",
        category: "医療費",
        emotion: "neutral",
        storeName: "ABC薬局",
        notes: "風邪薬と体温計を購入",
        receiptUrl: null,
        createdAt: new Date("2025-08-04T16:45:00")
      },
      {
        id: "exp-3",
        userId: "default-user",
        amount: "3600.00",
        category: "娯楽",
        emotion: "positive",
        storeName: "TOHOシネマズ",
        notes: "デートで映画鑑賞。最新作がとても面白かった！",
        receiptUrl: null,
        createdAt: new Date("2025-08-03T19:20:00")
      },
      {
        id: "exp-4",
        userId: "default-user",
        amount: "4990.00",
        category: "その他",
        emotion: "positive",
        storeName: "ユニクロ渋谷店",
        notes: "夏用のTシャツを購入。涼しくて着心地が良い。",
        receiptUrl: null,
        createdAt: new Date("2025-08-02T15:30:00")
      },
      {
        id: "exp-5",
        userId: "default-user",
        amount: "890.00",
        category: "日用品",
        emotion: "negative",
        storeName: "コンビニエンスストア",
        notes: "急いでいて高い商品を買ってしまった",
        receiptUrl: null,
        createdAt: new Date("2025-08-01T22:15:00")
      },
      {
        id: "exp-6",
        userId: "default-user",
        amount: "2500.00",
        category: "わんちゃん",
        emotion: "positive",
        storeName: "ペットショップ",
        notes: "愛犬のドッグフードとおもちゃを購入。とても喜んでくれました。",
        receiptUrl: null,
        createdAt: new Date("2025-08-06T10:30:00")
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
    const user: User = { 
      ...insertUser, 
      id,
      partnerId: null,
      inviteCode: null,
      isActive: "true",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async linkPartner(userId: string, partnerId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    const partner = await this.getUser(partnerId);
    
    if (!user || !partner) return false;
    
    // Link both users as partners
    user.partnerId = partnerId;
    partner.partnerId = userId;
    
    this.users.set(userId, user);
    this.users.set(partnerId, partner);
    
    return true;
  }

  async generateInviteCode(userId: string): Promise<string | null> {
    const user = await this.getUser(userId);
    if (!user) return null;
    
    const inviteCode = randomUUID().substring(0, 8).toUpperCase();
    user.inviteCode = inviteCode;
    this.users.set(userId, user);
    
    return inviteCode;
  }

  async getUserByInviteCode(inviteCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.inviteCode === inviteCode,
    );
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

  // Budget methods
  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      ...insertBudget,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async getBudgetByMonth(userId: string, year: number, month: number): Promise<Budget | undefined> {
    return Array.from(this.budgets.values())
      .find(budget => 
        budget.userId === userId && 
        budget.year === year && 
        budget.month === month
      );
  }

  async updateBudget(id: string, updates: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { 
      ...budget, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.budgets.delete(id);
  }

  private seedBudgets() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Add current month budget
    const currentBudget: Budget = {
      id: "budget-current",
      userId: "default-user",
      amount: "80000.00", // 8万円の予算
      year: currentYear,
      month: currentMonth,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.budgets.set(currentBudget.id, currentBudget);

    // Add previous month budget for comparison
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const prevBudget: Budget = {
      id: "budget-previous",
      userId: "default-user",
      amount: "90000.00", // 9万円の予算
      year: prevYear,
      month: prevMonth,
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      updatedAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    };
    this.budgets.set(prevBudget.id, prevBudget);
  }
}

export const storage = new MemStorage();
