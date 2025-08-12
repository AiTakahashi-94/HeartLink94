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
import { User, JapaneseYen, Receipt, TrendingUp, AlertTriangle, CheckCircle, Target, Settings, Smile, Frown, Minus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EMOTIONS } from "../lib/constants";
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
  
  // Calculate daily average based on days elapsed in current month
  const currentDate = new Date();
  const daysElapsed = currentDate.getDate();
  const dailyAverageSpent = daysElapsed > 0 ? totalSpent / daysElapsed : 0;

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
    const category = getEmotionCategory(expense.emotion);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, { positive: 0, negative: 0, basic: 0 });

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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">ダッシュボード</h1>
              <p className="text-blue-100 text-sm">今月の支出状況と予算管理</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-white hover:bg-opacity-30">
                  <Settings className="h-4 w-4 mr-2" />
                  予算変更
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

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-500 mt-1">今月の支出状況と予算管理</p>
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
        {/* 上部：今月使えるお金（予算進捗） */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-2xl">
              <span className="flex items-center">
                <Target className="mr-2 h-6 w-6" />
                今月使えるお金
                {budgetStatus?.budget && (
                  <span className="ml-3 text-2xl font-bold text-gray-600">
                    ¥{parseInt(budgetStatus.budget.amount).toLocaleString()}
                  </span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetStatus?.budget ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">使用済み</p>
                    <p className="text-xl font-bold text-blue-600">¥{budgetStatus.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">残り</p>
                    <p className="text-xl font-bold text-green-600">¥{budgetStatus.remaining.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">使用率</p>
                    <p className="text-xl font-bold text-purple-600">{budgetStatus.usagePercentage}%</p>
                  </div>
                </div>
                
                <Progress 
                  value={budgetStatus.usagePercentage} 
                  className="w-full h-4"
                />

                {alertConfig && (
                  <Alert variant={alertConfig.variant}>
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
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">まだ予算が設定されていません</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  予算を設定する
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 中央：今月の支出サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今月の支出合計</p>
                  <p className="text-2xl font-bold text-gray-900">¥{totalSpent.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <JapaneseYen className="text-blue-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">1日平均支出額</p>
                  <p className="text-2xl font-bold text-gray-900">¥{Math.round(dailyAverageSpent).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">（{expenseCount}回の支出、{currentDate.getDate()}日経過）</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 下部：分析データ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* カテゴリ別支出 */}
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別支出</CardTitle>
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
                              className="w-4 h-4 rounded-full bg-blue-500"
                              style={{ backgroundColor: `hsl(${Object.keys(categoryBreakdown).indexOf(category) * 360 / Object.keys(categoryBreakdown).length}, 70%, 50%)` }}
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
              <CardTitle>感情分類</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smile className="text-green-600" size={20} />
                    <span className="font-medium">ポジティブ</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700">{emotionCategories.positive}回</div>
                    <div className="text-xs text-green-600">
                      {expenseCount > 0 ? Math.round((emotionCategories.positive / expenseCount) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Frown className="text-red-600" size={20} />
                    <span className="font-medium">ネガティブ</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-700">{emotionCategories.negative}回</div>
                    <div className="text-xs text-red-600">
                      {expenseCount > 0 ? Math.round((emotionCategories.negative / expenseCount) * 100) : 0}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Minus className="text-gray-600" size={20} />
                    <span className="font-medium">基本支出</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-700">{emotionCategories.basic}回</div>
                    <div className="text-xs text-gray-600">
                      {expenseCount > 0 ? Math.round((emotionCategories.basic / expenseCount) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}