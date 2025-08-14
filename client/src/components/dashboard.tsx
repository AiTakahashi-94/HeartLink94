import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, JapaneseYen, Receipt, TrendingUp, AlertTriangle, CheckCircle, Target, Settings, Smile, Frown, Minus, DollarSign, ChevronRight, Store, Calendar } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EMOTIONS, CATEGORY_COLORS } from "../lib/constants";
import MobileAccountMenu from "./mobile-account-menu";
import type { Expense } from "@shared/schema";

interface BudgetStatus {
  budget: {
    id: string;
    amount: string;
    year: number;
    month: number;
  } | null;
  totalSpent: number;
  remaining: number;
  usagePercentage: number;
  alertLevel: "safe" | "warning" | "over_budget";
  year: number;
  month: number;
  expenseCount: number;
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Get current budget status
  const { data: budgetStatus } = useQuery<BudgetStatus>({
    queryKey: ["/api/budgets/current"],
  });

  // Calculate dashboard metrics
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const expenseCount = expenses.length;
  
  // Calculate monthly spending data for the last 6 months
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const monthNames = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const targetMonth = currentMonth - i;
    const targetYear = currentYear;
    
    let month, year;
    if (targetMonth <= 0) {
      month = 12 + targetMonth;
      year = targetYear - 1;
    } else {
      month = targetMonth;
      year = targetYear;
    }
    
    // Filter expenses for this month
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getFullYear() === year && 
             expenseDate.getMonth() + 1 === month;
    });
    
    const monthAmount = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const monthCount = monthExpenses.length;
    
    monthlyData.push({
      month: monthNames[month],
      year,
      amount: monthAmount,
      count: monthCount
    });
  }
  
  const maxAmount = Math.max(...monthlyData.map(m => m.amount), 1);

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  // Emotion analysis with 3 categories
  const emotionBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.emotion] = (acc[expense.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Classify emotions into 3 categories
  const getEmotionCategory = (emotionId: string) => {
    const positiveEmotions = ['happy', 'excited', 'satisfied'];
    const negativeEmotions = ['guilty', 'worried'];
    const basicEmotions = ['necessary'];
    
    if (positiveEmotions.includes(emotionId)) return 'positive';
    if (negativeEmotions.includes(emotionId)) return 'negative';
    return 'basic';
  };

  const emotionCategories = expenses.reduce((acc, expense) => {
    if (['positive', 'happy', 'excited', 'satisfied'].includes(expense.emotion)) {
      acc.positive++;
    } else if (['negative', 'guilty', 'worried'].includes(expense.emotion)) {
      acc.negative++;
    } else {
      acc.neutral++;
    }
    return acc;
  }, { positive: 0, negative: 0, neutral: 0 });

  // Budget mutation
  const budgetMutation = useMutation({
    mutationFn: async (amount: string) => {
      const currentDate = new Date();
      return apiRequest("POST", "/api/budgets", {
        userId: "default-user",
        amount,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      toast({
        title: "予算を更新しました",
        description: "月間予算が正常に設定されました。",
      });
      setIsDialogOpen(false);
      setBudgetAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "エラー",
        description: "予算の設定に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleSaveBudget = () => {
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "入力エラー",
        description: "有効な金額を入力してください。",
        variant: "destructive",
      });
      return;
    }
    budgetMutation.mutate(budgetAmount);
  };

  const getAlertConfig = (level: string) => {
    switch (level) {
      case "over_budget":
        return {
          variant: "destructive" as const,
          icon: AlertTriangle,
          title: "予算超過警告",
          message: "今月の支出が予算を超過しています。家計の見直しをお勧めします。",
          color: "text-red-500",
        };
      case "warning":
        return {
          variant: "default" as const,
          icon: AlertTriangle,
          title: "予算警告",
          message: "今月の支出が予算の80%に達しました。残りの支出にご注意ください。",
          color: "text-yellow-500",
        };
      default:
        return null;
    }
  };

  const alertConfig = budgetStatus ? getAlertConfig(budgetStatus.alertLevel) : null;

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="custom-gradient-header text-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">お金の管理</h1>
              <p className="text-gray-600 text-sm">今月のお金の状況と管理</p>
            </div>
            {/* Account Management Button */}
            <MobileAccountMenu />
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">お金の管理</h1>
              <p className="text-gray-500 mt-1">今月のお金の状況と管理</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  予算を変更する
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>月間予算を設定</DialogTitle>
                  <DialogDescription>
                    今月の支出予算を設定してください。設定した予算を元に使用率を追跡します。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="budget">予算金額（円）</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="100000"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSaveBudget}
                    disabled={budgetMutation.isPending}
                  >
                    {budgetMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* 上部：今月出ていったお金の合計 */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <span className="text-3xl block mb-2">💸</span>
              <p className="text-sm text-gray-500 mb-1">今月出ていったお金の合計</p>
              <p className="text-3xl font-bold text-gray-900">¥{totalSpent.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">{expenseCount}回お金を使いました</p>
            </div>
          </CardContent>
        </Card>

        {/* 予算進捗 */}
        <Card>
          <CardContent className="p-6">
            {budgetStatus?.budget ? (
              <>
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💰</span>
                    <h2 className="text-xl font-semibold text-gray-900">今月使えるお金</h2>
                  </div>
                  
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-2 border-gray-300">
                        予算変更
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>月間予算を設定</DialogTitle>
                        <DialogDescription>
                          今月のお金の予算を設定してください。設定した予算を元に使用率を追跡します。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="budget">予算金額（円）</Label>
                          <Input
                            id="budget"
                            type="number"
                            placeholder="100000"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          キャンセル
                        </Button>
                        <Button
                          onClick={handleSaveBudget}
                          disabled={budgetMutation.isPending}
                          style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                          className="hover:opacity-90"
                        >
                          {budgetMutation.isPending ? "保存中..." : "保存"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Budget Amount */}
                <div className="mb-4">
                  <p className="text-lg text-gray-700">
                    予算：<span className="font-semibold">¥{parseInt(budgetStatus.budget.amount).toLocaleString()}</span>
                  </p>
                </div>

                {/* Spent and Remaining - Side by Side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">使ったお金</p>
                    <p className="text-lg font-semibold text-red-600">¥{budgetStatus.totalSpent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">残りのお金</p>
                    <p className="text-lg font-semibold text-green-600">¥{budgetStatus.remaining.toLocaleString()}</p>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mt-4 space-y-3">
                  <div className="relative pt-10">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="bg-green-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(budgetStatus.usagePercentage, 100)}%` }}
                      />
                    </div>
                    <div 
                      className="absolute top-0 transform -translate-x-1/2"
                      style={{ left: `${Math.min(budgetStatus.usagePercentage, 100)}%` }}
                    >
                      <div className="bg-gray-700 text-white px-2 py-1 rounded text-sm">
                        {budgetStatus.usagePercentage}%使用中
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700 mx-auto"></div>
                    </div>
                  </div>
                </div>

                {alertConfig && (
                  <Alert variant={alertConfig.variant} className="mt-4">
                    <alertConfig.icon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">{alertConfig.title}</div>
                      <div>{alertConfig.message}</div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl block text-center mb-4">🎯</span>
                <p className="text-gray-500 mb-4">まだ予算が設定されていません</p>
                <Button 
                  onClick={() => setIsDialogOpen(true)}
                  style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                  className="hover:opacity-90"
                >
                  予算を設定する
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Spending Chart */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">月ごとの支出 (2025年)</h3>
              <span className="text-sm text-gray-500">過去6ヶ月</span>
            </div>
            
            {/* Vertical Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-end justify-center h-52 space-x-2 sm:space-x-4 overflow-x-auto min-w-0">
                {monthlyData.map((data, index) => {
                  const percentage = maxAmount > 0 ? Math.max((data.amount / maxAmount) * 100, 8) : 8; // Minimum 8% height for visibility
                  const isCurrentMonth = index === monthlyData.length - 1;
                  
                  return (
                    <div key={`${data.month}-${data.year}`} className="flex flex-col items-center flex-shrink-0">
                      {/* Amount label above bar */}
                      <div className="mb-1 text-center min-h-[2.5rem] flex flex-col justify-end">
                        <div className={`text-[10px] sm:text-xs font-bold leading-tight ${isCurrentMonth ? 'text-blue-600' : 'text-gray-700'}`}>
                          ¥{data.amount.toLocaleString()}
                        </div>
                        <div className="text-[9px] sm:text-xs text-gray-500">
                          {data.count}回
                        </div>
                      </div>
                      
                      {/* Vertical bar with base */}
                      <div className="flex flex-col justify-end h-36 sm:h-40 relative">
                        <div className="w-8 sm:w-10 lg:w-12 bg-gray-100 rounded border border-gray-200 relative overflow-hidden shadow-sm">
                          <div 
                            className={`w-full transition-all duration-1000 ease-out ${
                              isCurrentMonth 
                                ? 'bg-gradient-to-t from-blue-700 to-blue-400 shadow-md' 
                                : 'bg-gradient-to-t from-gray-600 to-gray-400 shadow-sm'
                            } absolute bottom-0 rounded`}
                            style={{ 
                              height: `${percentage}%`,
                              minHeight: data.amount > 0 ? '8px' : '0px'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Month label below bar with year indicator for current month */}
                      <div className="mt-2 text-center">
                        <div className={`text-[10px] sm:text-xs font-medium ${isCurrentMonth ? 'text-blue-600' : 'text-gray-600'}`}>
                          {data.month}
                        </div>
                        {isCurrentMonth && (
                          <div className="text-[8px] sm:text-xs text-blue-500 font-semibold">
                            2025
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Chart baseline */}
              <div className="mt-1 border-t border-gray-300 w-full"></div>
            </div>
            
            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">今月の支出</span>
                  <p className="font-bold text-blue-600">¥{monthlyData[monthlyData.length - 1].amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">前月との差額</span>
                  <p className={`font-bold ${
                    monthlyData[monthlyData.length - 1].amount > monthlyData[monthlyData.length - 2].amount 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {monthlyData[monthlyData.length - 1].amount > monthlyData[monthlyData.length - 2].amount ? '+' : ''}
                    ¥{(monthlyData[monthlyData.length - 1].amount - monthlyData[monthlyData.length - 2].amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 下部：分析データ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* カテゴリ別支出 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(categoryBreakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(categoryBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount]) => {
                      const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: CATEGORY_COLORS[category] || '#9CA3AF' }}
                            />
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">¥{amount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500">{percentage}%</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">まだ支出データがありません</p>
              )}
            </CardContent>
          </Card>

          {/* 感情分類 */}
          <Card>
            <CardHeader>
              <CardTitle>感情分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* ポジティブ */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors" style={{ backgroundColor: '#E5FBF3' }}>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">😊</span>
                        <span className="font-medium">ポジティブ</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="font-bold text-green-700">{emotionCategories.positive}回</div>
                          <div className="text-xs text-green-600">
                            {expenseCount > 0 ? Math.round((emotionCategories.positive / expenseCount) * 100) : 0}%
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-lg">😊</span>
                        <span>ポジティブな支出</span>
                      </DialogTitle>
                      <DialogDescription>
                        この気分で行った支出の詳細一覧です
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      {expenses.filter(e => e.emotion === 'positive').length === 0 ? (
                        <p className="text-center text-gray-500 py-8">この気分での支出はありません</p>
                      ) : (
                        expenses.filter(e => e.emotion === 'positive').map((expense) => (
                          <div key={expense.id} className="border border-gray-200 bg-white p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Store className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-gray-800">{expense.storeName}</span>
                              </div>
                              <span className="font-bold text-gray-900">¥{parseFloat(expense.amount).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(expense.createdAt).toLocaleDateString('ja-JP')}</span>
                              </div>
                              <div>カテゴリ: {expense.category}</div>
                              {expense.notes && <div>メモ: {expense.notes}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* ネガティブ */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors" style={{ backgroundColor: '#FDE7ED' }}>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">😔</span>
                        <span className="font-medium">ネガティブ</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="font-bold text-red-700">{emotionCategories.negative}回</div>
                          <div className="text-xs text-red-600">
                            {expenseCount > 0 ? Math.round((emotionCategories.negative / expenseCount) * 100) : 0}%
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-red-600" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-lg">😔</span>
                        <span>ネガティブな支出</span>
                      </DialogTitle>
                      <DialogDescription>
                        この気分で行った支出の詳細一覧です
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      {expenses.filter(e => e.emotion === 'negative').length === 0 ? (
                        <p className="text-center text-gray-500 py-8">この気分での支出はありません</p>
                      ) : (
                        expenses.filter(e => e.emotion === 'negative').map((expense) => (
                          <div key={expense.id} className="border border-gray-200 bg-white p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Store className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-gray-800">{expense.storeName}</span>
                              </div>
                              <span className="font-bold text-gray-900">¥{parseFloat(expense.amount).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(expense.createdAt).toLocaleDateString('ja-JP')}</span>
                              </div>
                              <div>カテゴリ: {expense.category}</div>
                              {expense.notes && <div>メモ: {expense.notes}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* ニュートラル */}
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:opacity-80 transition-colors" style={{ backgroundColor: '#E4E3E8' }}>
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">😐</span>
                        <span className="font-medium">ニュートラル</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="font-bold text-gray-700">{emotionCategories.neutral}回</div>
                          <div className="text-xs text-gray-600">
                            {expenseCount > 0 ? Math.round((emotionCategories.neutral / expenseCount) * 100) : 0}%
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <span className="text-lg">😐</span>
                        <span>ニュートラルな支出</span>
                      </DialogTitle>
                      <DialogDescription>
                        この気分で行った支出の詳細一覧です
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                      {expenses.filter(e => e.emotion === 'neutral').length === 0 ? (
                        <p className="text-center text-gray-500 py-8">この気分での支出はありません</p>
                      ) : (
                        expenses.filter(e => e.emotion === 'neutral').map((expense) => (
                          <div key={expense.id} className="border border-gray-200 bg-white p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Store className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold text-gray-800">{expense.storeName}</span>
                              </div>
                              <span className="font-bold text-gray-900">¥{parseFloat(expense.amount).toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(expense.createdAt).toLocaleDateString('ja-JP')}</span>
                              </div>
                              <div>カテゴリ: {expense.category}</div>
                              {expense.notes && <div>メモ: {expense.notes}</div>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}