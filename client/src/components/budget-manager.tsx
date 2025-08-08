import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Target, TrendingUp, Settings } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function BudgetManager() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [budgetAmount, setBudgetAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get current budget status
  const { data: budgetStatus, isLoading } = useQuery<BudgetStatus>({
    queryKey: ["/api/budgets/current"],
  });

  // Create/update budget mutation
  const budgetMutation = useMutation({
    mutationFn: async (amount: string) => {
      const currentDate = new Date();
      console.log("Sending budget request:", {
        userId: "default-user",
        amount,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
      });
      
      try {
        const result = await apiRequest("POST", "/api/budgets", {
          userId: "default-user",
          amount,
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
        });
        console.log("Budget request successful:", result);
        return result;
      } catch (error) {
        console.error("Budget request failed:", error);
        throw error;
      }
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
      console.error("Budget mutation error:", error);
      
      let errorMessage = "予算の設定に失敗しました。";
      if (error?.message) {
        errorMessage += ` エラー: ${error.message}`;
      }
      
      toast({
        title: "エラー",
        description: errorMessage,
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
          bgColor: "bg-red-50",
        };
      case "warning":
        return {
          variant: "default" as const,
          icon: AlertTriangle,
          title: "予算警告",
          message: "今月の支出が予算の80%に達しました。残りの支出にご注意ください。",
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
        };
      default:
        return {
          variant: "default" as const,
          icon: CheckCircle,
          title: "予算内",
          message: "今月の支出は予算内に収まっています。このまま計画的な支出を心がけましょう。",
          color: "text-green-500",
          bgColor: "bg-green-50",
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const monthName = budgetStatus
    ? `${budgetStatus.year}年${budgetStatus.month}月`
    : "";

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetStatus) return null;

  const alertConfig = getAlertConfig(budgetStatus.alertLevel);
  const AlertIcon = alertConfig.icon;

  return (
    <div className="space-y-6">
      {/* Budget Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span>{monthName}の予算管理</span>
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  予算設定
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>月間予算を設定</DialogTitle>
                  <DialogDescription>
                    今月の支出予算を設定してください。設定した予算を元に使用率を追跡します。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="budget-amount">予算金額</Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      placeholder="100000"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      円単位で入力してください
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleSaveBudget}
                      disabled={budgetMutation.isPending}
                      className="flex-1"
                    >
                      {budgetMutation.isPending ? "保存中..." : "保存"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Budget Overview */}
          {budgetStatus.budget ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">予算</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(budgetStatus.budget.amount))}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">使用済み</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetStatus.totalSpent)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">残り</p>
                <p className={`text-2xl font-bold ${
                  budgetStatus.remaining >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(budgetStatus.remaining)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                予算が設定されていません
              </h3>
              <p className="text-gray-500 mb-4">
                月間予算を設定して支出を管理しましょう
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                予算を設定する
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {budgetStatus.budget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">使用率</span>
                <span className={`font-medium ${
                  budgetStatus.usagePercentage >= 100 ? "text-red-600" : 
                  budgetStatus.usagePercentage >= 80 ? "text-yellow-600" : "text-green-600"
                }`}>
                  {budgetStatus.usagePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={Math.min(budgetStatus.usagePercentage, 100)}
                  className="h-3"
                />
                <div
                  className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(budgetStatus.usagePercentage)}`}
                  style={{ width: `${Math.min(budgetStatus.usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Alert */}
          {budgetStatus.budget && (
            <Alert variant={alertConfig.variant} className={alertConfig.bgColor}>
              <AlertIcon className={`h-4 w-4 ${alertConfig.color}`} />
              <AlertDescription>
                <strong>{alertConfig.title}:</strong> {alertConfig.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Quick Stats */}
          {budgetStatus.budget && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">支出回数</p>
                  <p className="text-sm text-gray-500">{budgetStatus.expenseCount}回</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Target className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">平均支出</p>
                  <p className="text-sm text-gray-500">
                    {budgetStatus.expenseCount > 0 
                      ? formatCurrency(Math.round(budgetStatus.totalSpent / budgetStatus.expenseCount))
                      : "¥0"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}