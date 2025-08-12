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

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-gradient-to-br from-teal-400 via-blue-500 via-purple-500 to-pink-400 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">お金の履歴</h1>
              <p className="text-teal-100 text-sm">すべてのお金の記録</p>
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

      <div className="p-4 lg:p-8">

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
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: emotionData.color }}
                          />
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
