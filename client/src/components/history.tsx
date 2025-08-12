import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Calendar, Store, Tag, Heart } from "lucide-react";
import { EMOTIONS } from "../lib/constants";
import MobileAccountMenu from "./mobile-account-menu";
import type { Expense } from "@shared/schema";

export default function History() {
  const isMobile = useIsMobile();
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">お金の履歴</h1>
              <p className="text-blue-100 text-sm">すべてのお金の記録</p>
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
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900">
                            ¥{parseFloat(expense.amount).toLocaleString()}
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-800 mt-1"
                                onClick={() => setSelectedExpense(expense)}
                              >
                                <Eye size={14} className="mr-1" />
                                詳細
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
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
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
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
