import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Calendar, Store, Tag, Heart, Trash2 } from "lucide-react";
import { EMOTIONS, CATEGORY_COLORS } from "../lib/constants";
import MobileAccountMenu from "./mobile-account-menu";
import type { Expense } from "@shared/schema";
import { queryClient, apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function History() {
  const isMobile = useIsMobile();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
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
      const expenseYear = expenseDate.getFullYear();
      const expenseMonth = expenseDate.getMonth() + 1;
      
      return expenseYear === year && expenseMonth === month;
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
        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            {/* Active Filters Display */}
            {(selectedMonth !== "all" || selectedCategory !== "all") && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">アクティブなフィルター:</span>
                  {selectedMonth !== "all" && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {new Date(selectedMonth + '-01').toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long'
                      })}
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {selectedCategory}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                  // Force minimum height for any data > 0, otherwise calculate percentage
                  const calculatedPercentage = maxExpenseAmount > 0 ? (data.amount / maxExpenseAmount) * 100 : 0;
                  const displayHeight = data.amount > 0 ? Math.max(calculatedPercentage, 25) : 0;
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
                      
                      {/* Vertical bar with forced visibility for data > 0 */}
                      <div className="flex flex-col justify-end h-40 w-full relative">
                        <div className="w-full h-full bg-gray-100 rounded border border-gray-200 relative overflow-hidden shadow-sm">
                          {data.amount > 0 && (
                            <div 
                              className={`w-full transition-all duration-500 ease-out ${
                                isCurrentMonth 
                                  ? 'bg-gradient-to-t from-green-700 to-green-400 shadow-md' 
                                  : 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-sm'
                              } absolute bottom-0 rounded`}
                              style={{ 
                                height: `${displayHeight}%`,
                                minHeight: '30px'
                              }}
                            />
                          )}
                        </div>
                      </div>
                      
                      {/* Month label below bar */}
                      <div className="mt-3 text-center w-full">
                        <div className={`text-xs font-medium ${isCurrentMonth ? 'text-green-600' : 'text-gray-600'}`}>
                          {data.month}
                        </div>
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
              <span className="text-sm text-gray-500">
                {selectedMonth !== "all" || selectedCategory !== "all" 
                  ? `フィルター結果: ${filteredExpenses.length}件（全${expenses.length}件中）`
                  : `総計: ${expenses.length}件`
                }
              </span>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedMonth !== "all" || selectedCategory !== "all" 
                      ? 'フィルター条件に一致する記録がありません' 
                      : 'お金の記録がありません'
                    }
                  </p>
                </div>
              ) : (
                filteredExpenses.map((expense) => {
                  const emotionData = getEmotionData(expense.emotion);
                  return (
                    <div key={expense.id} className="py-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-semibold text-gray-900">{expense.storeName}</h4>
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#9CA3AF' }}
                                />
                                <span className="text-xs font-medium text-gray-700">
                                  {expense.category}
                                </span>
                              </div>
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
                          <DialogContent className="sm:max-w-md mx-4 w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto">
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
                                  <div className="flex items-center space-x-2">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#9CA3AF' }}
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                      {expense.category}
                                    </span>
                                  </div>
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
