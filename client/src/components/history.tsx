import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, Calendar, Store, Tag, Heart, Trash2 } from "lucide-react";
import { EMOTIONS } from "../lib/constants";
import MobileAccountMenu from "./mobile-account-menu";
import type { Expense } from "@shared/schema";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const isMobile = useIsMobile();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

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

  // Calculate monthly spending data from actual expenses
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const monthNames = ["", "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  
  // Calculate spending for last 6 months using actual expense data
  const monthlyExpenseData = [];
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
    
    // Filter expenses for this specific month and year
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate.getFullYear() === year && 
             expenseDate.getMonth() + 1 === month;
    });
    
    const monthAmount = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const monthCount = monthExpenses.length;
    
    monthlyExpenseData.push({
      month: monthNames[month],
      year,
      amount: monthAmount,
      count: monthCount
    });
  }
  
  const maxExpenseAmount = Math.max(...monthlyExpenseData.map(m => m.amount), 1);

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="custom-gradient-header text-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">お金の履歴</h1>
              <p className="text-gray-600 text-sm">すべてのお金の記録</p>
            </div>
            <MobileAccountMenu />
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">お金の履歴</h1>
            <p className="text-gray-500 mt-1">過去のすべてのお金と感情記録</p>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 space-y-6">
        {/* Monthly Spending Chart - Rebuilt with actual data */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">月ごとの支出 (2025年)</h3>
              <span className="text-sm text-gray-500">過去6ヶ月の実際のデータ</span>
            </div>
            
            {/* Vertical Bar Chart with Real Data */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-end justify-center h-64 space-x-3 sm:space-x-5 overflow-x-auto min-w-0 px-2">
                {monthlyExpenseData.map((data, index) => {
                  // Ensure proper height calculation with minimum visibility
                  const percentage = maxExpenseAmount > 0 
                    ? Math.max((data.amount / maxExpenseAmount) * 100, data.amount > 0 ? 12 : 0) 
                    : data.amount > 0 ? 12 : 0;
                  const isCurrentMonth = index === monthlyExpenseData.length - 1;
                  
                  return (
                    <div key={`${data.month}-${data.year}-${index}`} className="flex flex-col items-center flex-shrink-0 w-16">
                      {/* Amount label above bar - always visible */}
                      <div className="mb-2 text-center min-h-[3rem] flex flex-col justify-end w-full">
                        <div className={`text-xs font-bold leading-tight break-words ${isCurrentMonth ? 'text-green-600' : 'text-gray-700'}`}>
                          ¥{data.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {data.count}回
                        </div>
                      </div>
                      
                      {/* Vertical bar with proper sizing */}
                      <div className="flex flex-col justify-end h-40 w-full relative">
                        <div className="w-full bg-gray-100 rounded border border-gray-200 relative overflow-hidden shadow-sm min-h-[2px]">
                          <div 
                            className={`w-full transition-all duration-1000 ease-out ${
                              isCurrentMonth 
                                ? 'bg-gradient-to-t from-green-700 to-green-400 shadow-md' 
                                : data.amount > 0
                                  ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm'
                                  : 'bg-gray-200'
                            } absolute bottom-0 rounded`}
                            style={{ 
                              height: `${percentage}%`,
                              minHeight: data.amount > 0 ? '12px' : '2px'
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Month label below bar */}
                      <div className="mt-3 text-center w-full">
                        <div className={`text-xs font-medium ${isCurrentMonth ? 'text-green-600' : 'text-gray-600'}`}>
                          {data.month}
                        </div>
                        {isCurrentMonth && (
                          <div className="text-xs text-green-500 font-semibold mt-1">
                            2025
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Chart baseline */}
              <div className="mt-2 border-t border-gray-300 w-full"></div>
            </div>
            
            {/* Summary with actual data */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">今月の実際の支出</span>
                  <p className="font-bold text-green-600">¥{monthlyExpenseData[monthlyExpenseData.length - 1].amount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">前月との差額</span>
                  <p className={`font-bold ${
                    monthlyExpenseData.length > 1 && monthlyExpenseData[monthlyExpenseData.length - 1].amount > monthlyExpenseData[monthlyExpenseData.length - 2].amount 
                      ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {monthlyExpenseData.length > 1 ? (
                      <>
                        {monthlyExpenseData[monthlyExpenseData.length - 1].amount > monthlyExpenseData[monthlyExpenseData.length - 2].amount ? '+' : ''}
                        ¥{(monthlyExpenseData[monthlyExpenseData.length - 1].amount - monthlyExpenseData[monthlyExpenseData.length - 2].amount).toLocaleString()}
                      </>
                    ) : (
                      '¥0'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">お金の記録</h3>
              <span className="text-sm text-gray-500">総計: {expenses.length}件</span>
            </div>

            <div className="divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">お金の記録がありません</p>
                </div>
              ) : (
                expenses.map((expense) => {
                  const emotionData = getEmotionData(expense.emotion);
                  return (
                    <div key={expense.id} className="py-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex items-center justify-center w-8 h-8">
                            <span className="text-lg">{emotionData.emoji}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-semibold text-gray-900">{expense.storeName}</h4>
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {expense.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatDate(expense.createdAt)} • {getEmotionLabel(expense.emotion)}
                            </p>
                            {expense.notes && (
                              <p className="text-sm text-gray-600 mt-1">{expense.notes}</p>
                            )}
                          </div>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="text-right ml-4 cursor-pointer">
                              <p className="text-lg font-bold text-gray-900">
                                ¥{parseFloat(expense.amount).toLocaleString()}
                              </p>
                              {/* Desktop: Show buttons */}
                              {!isMobile && (
                                <div className="flex space-x-1 mt-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={() => setSelectedExpense(expense)}
                                  >
                                    <Eye size={14} className="mr-1" />
                                    詳細
                                  </Button>
                                </div>
                              )}
                              {/* Mobile: Show tap hint */}
                              {isMobile && (
                                <p className="text-xs text-gray-400 mt-1">タップで詳細</p>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className={isMobile ? "mx-4 max-h-[80vh] overflow-y-auto" : "sm:max-w-md"}>
                            <DialogHeader>
                              <DialogTitle>支出詳細</DialogTitle>
                              <DialogDescription>
                                この支出の詳細情報を確認できます
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <Store className="text-gray-500" size={20} />
                                <div>
                                  <p className="text-sm text-gray-500">店舗名</p>
                                  <p className="font-semibold">{expense.storeName}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">💰</span>
                                <div>
                                  <p className="text-sm text-gray-500">金額</p>
                                  <p className="text-xl font-bold text-red-600">¥{parseFloat(expense.amount).toLocaleString()}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Tag className="text-gray-500" size={20} />
                                <div>
                                  <p className="text-sm text-gray-500">カテゴリ</p>
                                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                                    {expense.category}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">{getEmotionData(expense.emotion).emoji || "😊"}</span>
                                <div>
                                  <p className="text-sm text-gray-500">気分</p>
                                  <p className="font-semibold">{getEmotionData(expense.emotion).label}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <Calendar className="text-gray-500" size={20} />
                                <div>
                                  <p className="text-sm text-gray-500">日時</p>
                                  <p className="font-semibold">{formatDate(expense.createdAt)}</p>
                                </div>
                              </div>
                              
                              {expense.notes && (
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-500">メモ</p>
                                  <p className="text-sm bg-gray-50 p-3 rounded-lg">{expense.notes}</p>
                                </div>
                              )}
                              
                              {/* Delete button in detail view */}
                              <div className="pt-4 border-t">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size={isMobile ? "default" : "sm"}
                                      className="w-full text-gray-600 hover:text-red-600 hover:border-red-300 border-gray-200"
                                    >
                                      <Trash2 size={14} className="mr-2" />
                                      この支出を削除
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className={isMobile ? "mx-4" : ""}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>支出を削除しますか？</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        この操作は取り消せません。支出記録「{expense.storeName} ¥{parseFloat(expense.amount).toLocaleString()}」が完全に削除されます。
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className={isMobile ? "flex-col space-y-2 sm:space-y-0" : ""}>
                                      <AlertDialogCancel className={isMobile ? "w-full sm:w-auto" : ""}>キャンセル</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                        disabled={deleteExpenseMutation.isPending}
                                        className={`bg-red-600 hover:bg-red-700 ${isMobile ? "w-full sm:w-auto" : ""}`}
                                      >
                                        {deleteExpenseMutation.isPending ? "削除中..." : "削除する"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Summary */}
            {expenses.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-center">
                  <p className="text-sm text-gray-500">
                    全{expenses.length}件のお金の記録
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
