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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, JapaneseYen, Receipt, TrendingUp, AlertTriangle, CheckCircle, Target, Settings, Smile, Frown, Minus, DollarSign, ChevronRight, Store, Calendar, Eye, Heart, Trash2, Tag } from "lucide-react";
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
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  


  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Get current budget status
  const { data: budgetStatus } = useQuery<BudgetStatus>({
    queryKey: ["/api/budgets/current"],
  });

  // Filter expenses based on selected filters
  const filteredExpenses = expenses.filter(expense => {
    let passesFilter = true;
    
    // Month filter
    if (selectedMonth && selectedMonth !== "all") {
      const expenseDate = new Date(expense.createdAt);
      const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      passesFilter = passesFilter && expenseMonth === selectedMonth;
    }
    
    // Category filter  
    if (selectedCategory && selectedCategory !== "all") {
      passesFilter = passesFilter && expense.category === selectedCategory;
    }
    
    return passesFilter;
  });

  // Get unique months from all expenses for filter dropdown
  const availableMonths = Array.from(new Set(expenses.map(expense => {
    const date = new Date(expense.createdAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();
  
  // Get unique categories from all expenses for filter dropdown
  const availableCategories = Array.from(new Set(expenses.map(expense => expense.category))).sort();

  // Calculate dashboard metrics
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const expenseCount = expenses.length;
  


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

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/budgets/current"] });
      toast({
        title: "支出を削除しました",
        description: "支出記録が正常に削除されました。",
      });
    },
    onError: () => {
      toast({
        title: "削除に失敗しました",
        description: "支出の削除中にエラーが発生しました。",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEmotionData = (emotionId: string) => {
    return EMOTIONS.find(e => e.id === emotionId) || EMOTIONS[0];
  };

  const getEmotionLabel = (emotionId: string) => {
    const emotion = getEmotionData(emotionId);
    return `${emotion.label}気分`;
  };

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
                    <DialogContent className="sm:max-w-md mx-4 w-[calc(100vw-2rem)]">
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

        {/* フィルターと支出リスト */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>支出の詳細管理</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Filter Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">フィルター</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSelectedMonth("all");
                  setSelectedCategory("all");
                }}
                disabled={selectedMonth === "all" && selectedCategory === "all"}
              >
                リセット
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Month Filter */}
              <div className="space-y-2">
                <Label htmlFor="month-filter">月で絞り込み</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべての月" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての月</SelectItem>
                    {availableMonths.map((month) => {
                      const [year, monthNum] = month.split('-');
                      const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long'
                      });
                      return (
                        <SelectItem key={month} value={month}>
                          {monthName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category-filter">カテゴリで絞り込み</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべてのカテゴリ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのカテゴリ</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtered Expenses List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-medium text-gray-900">
                  支出詳細 ({filteredExpenses.length}件)
                </h4>
                {filteredExpenses.length > 0 && (
                  <p className="text-sm text-gray-600">
                    合計: ¥{filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toLocaleString()}
                  </p>
                )}
              </div>
              
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">条件に合う支出がありません</p>
                  {(selectedMonth !== "all" || selectedCategory !== "all") && (
                    <p className="text-sm text-gray-400 mt-1">
                      フィルター条件を変更してみてください
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredExpenses.map((expense) => {
                    const emotion = getEmotionData(expense.emotion);
                    return (
                      <div key={expense.id} className="border border-gray-200 bg-white p-4 rounded-lg shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#9CA3AF' }}
                              />
                              <span className="font-semibold text-gray-800">{expense.storeName}</span>
                              <span className="text-2xl font-bold text-gray-900">¥{parseFloat(expense.amount).toLocaleString()}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(expense.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Tag className="h-3 w-3" />
                                <span>{expense.category}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className={`h-3 w-3 ${emotion.color}`} />
                                <span>{getEmotionLabel(expense.emotion)}</span>
                              </div>
                            </div>
                            
                            {expense.notes && (
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                {expense.notes}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedExpense(expense)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>支出の詳細</DialogTitle>
                                </DialogHeader>
                                {selectedExpense && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm text-gray-600">金額</Label>
                                      <p className="text-2xl font-bold text-gray-900">¥{parseFloat(selectedExpense.amount).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">店名</Label>
                                      <p className="font-medium">{selectedExpense.storeName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">カテゴリ</Label>
                                      <p className="font-medium">{selectedExpense.category}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">気分</Label>
                                      <p className="font-medium">{getEmotionLabel(selectedExpense.emotion)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm text-gray-600">日時</Label>
                                      <p className="font-medium">{formatDate(selectedExpense.createdAt)}</p>
                                    </div>
                                    {selectedExpense.notes && (
                                      <div>
                                        <Label className="text-sm text-gray-600">メモ</Label>
                                        <p className="font-medium">{selectedExpense.notes}</p>
                                      </div>
                                    )}
                                    {selectedExpense.receiptUrl && (
                                      <div>
                                        <Label className="text-sm text-gray-600">レシート</Label>
                                        <p className="text-blue-600 underline cursor-pointer">レシート画像を表示</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>支出を削除しますか？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    この操作は取り消すことができません。支出記録を完全に削除します。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    削除する
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}