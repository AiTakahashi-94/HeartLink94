import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, JapaneseYen, Receipt, TrendingUp } from "lucide-react";
import { EMOTIONS } from "@/lib/constants";
import type { Expense } from "@shared/schema";

export default function Dashboard() {
  const isMobile = useIsMobile();

  // Fetch expenses
  const { data: expenses = [] } = useQuery({
    queryKey: ["/api/expenses"],
  });

  // Calculate dashboard metrics
  const totalSpent = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const expenseCount = expenses.length;
  const averageSpent = expenseCount > 0 ? totalSpent / expenseCount : 0;

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  // Emotion analysis
  const emotionBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.emotion] = (acc[expense.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getEmotionData = (emotionId: string) => {
    return EMOTIONS.find(e => e.id === emotionId) || EMOTIONS[0];
  };

  const getEmotionPercentage = (emotionId: string) => {
    const count = emotionBreakdown[emotionId] || 0;
    return expenseCount > 0 ? Math.round((count / expenseCount) * 100) : 0;
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">ダッシュボード</h1>
              <p className="text-blue-100 text-sm">今月の支出状況</p>
            </div>
            <Select>
              <SelectTrigger className="bg-white bg-opacity-20 text-white border-none w-32">
                <SelectValue placeholder="2024年1月" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">2024年1月</SelectItem>
                <SelectItem value="2023-12">2023年12月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
              <p className="text-gray-500 mt-1">支出の概要と感情の分析</p>
            </div>
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="2024年1月" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">2024年1月</SelectItem>
                <SelectItem value="2023-12">2023年12月</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">今月の総支出</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">¥{totalSpent.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <JapaneseYen className="text-blue-600" size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">-8.2%</span>
                <span className="text-gray-500 ml-1">前月比</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">支出回数</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{expenseCount}回</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Receipt className="text-green-600" size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">+3回</span>
                <span className="text-gray-500 ml-1">前月比</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">平均支出額</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">¥{Math.round(averageSpent).toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="text-purple-600" size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-red-600 font-medium">-¥312</span>
                <span className="text-gray-500 ml-1">前月比</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">カテゴリー別支出</h3>
              
              <div className="space-y-3">
                {Object.entries(categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([category, amount]) => {
                    const percentage = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span className="text-sm font-medium text-gray-700">{category}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          ¥{amount.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                {Object.keys(categoryBreakdown).length === 0 && (
                  <p className="text-gray-500 text-center py-4">データがありません</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emotion Analysis */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">感情分析</h3>
              
              <div className="space-y-4">
                {EMOTIONS.map((emotion) => {
                  const percentage = getEmotionPercentage(emotion.id);
                  return (
                    <div key={emotion.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: emotion.color }}
                        >
                          <emotion.icon className="text-white" size={14} />
                        </div>
                        <span className="font-medium text-gray-700">{emotion.label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              backgroundColor: emotion.color,
                              width: `${percentage}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-12">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">✨ 今月の感情傾向</h4>
                <p className="text-sm text-blue-800">
                  ポジティブな感情での支出が多く、健全な家計管理ができています。
                  罪悪感を感じる支出が少ないのは良い傾向です。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
