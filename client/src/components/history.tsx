import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Eye } from "lucide-react";
import { CATEGORIES, EMOTIONS } from "../lib/constants";
import type { Expense } from "@shared/schema";

export default function History() {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [emotionFilter, setEmotionFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Filter expenses based on current filters
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = !categoryFilter || expense.category === categoryFilter;
    const matchesEmotion = !emotionFilter || expense.emotion === emotionFilter;
    // For demo purposes, we'll ignore period filter since we don't have historical data
    
    return matchesSearch && matchesCategory && matchesEmotion;
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
              <h1 className="text-xl font-bold">支出履歴</h1>
              <p className="text-blue-100 text-sm">すべての支出記録</p>
            </div>
            <Button size="sm" variant="ghost" className="bg-white bg-opacity-20 text-white border-none">
              <Filter size={16} className="mr-1" />
              フィルター
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">支出履歴</h1>
              <p className="text-gray-500 mt-1">過去のすべての支出と感情記録</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter size={16} className="mr-2" />
                フィルター
              </Button>
              <Button size="sm">
                <Download size={16} className="mr-2" />
                エクスポート
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8">
        {/* Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">期間</label>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    <SelectItem value="this-month">今月</SelectItem>
                    <SelectItem value="last-month">先月</SelectItem>
                    <SelectItem value="last-3-months">過去3ヶ月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">感情</label>
                <Select value={emotionFilter} onValueChange={setEmotionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    {EMOTIONS.map((emotion) => (
                      <SelectItem key={emotion.id} value={emotion.id}>
                        {emotion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">金額範囲</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="すべて" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">すべて</SelectItem>
                    <SelectItem value="0-1000">¥0 - ¥1,000</SelectItem>
                    <SelectItem value="1000-5000">¥1,000 - ¥5,000</SelectItem>
                    <SelectItem value="5000+">¥5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="店名、メモで検索..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">支出記録</h3>
              <span className="text-sm text-gray-500">総計: {filteredExpenses.length}件</span>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">該当する支出記録がありません</p>
                </div>
              ) : (
                filteredExpenses.map((expense) => {
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
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 mt-1">
                            <Eye size={14} className="mr-1" />
                            詳細
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredExpenses.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    1-{Math.min(5, filteredExpenses.length)} / {filteredExpenses.length}件
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      前へ
                    </Button>
                    <Button size="sm">1</Button>
                    <Button variant="outline" size="sm">
                      2
                    </Button>
                    <Button variant="outline" size="sm">
                      3
                    </Button>
                    <span className="px-2 text-gray-500">...</span>
                    <Button variant="outline" size="sm">
                      次へ
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
