import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  password: text("password").notNull(),
  partnerId: varchar("partner_id"),
  inviteCode: text("invite_code").unique(),
  avatarUrl: text("avatar_url"),
  isActive: text("is_active").default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  emotion: text("emotion").notNull(),
  storeName: text("store_name").notNull(),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  displayName: true,
  password: true,
});

export const updateUserSchema = createInsertSchema(users).pick({
  displayName: true,
  avatarUrl: true,
}).partial();

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 999999;
  }, {
    message: "金額は0より大きく999999以下の有効な数値である必要があります"
  }),
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0 && num <= 9999999;
  }, {
    message: "予算額は0より大きく9999999以下の有効な数値である必要があります"
  }),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;
