import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMOTIONS } from "../lib/constants";
import MobileAccountMenu from "./mobile-account-menu";
import type { Expense } from "@shared/schema";

export default function Comparison() {
  const isMobile = useIsMobile();

  // Fetch expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // Calculate current month metrics
  const currentMonthTotal = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const currentMonthCount = expenses.length;
  const currentMonthAverage = currentMonthCount > 0 ? currentMonthTotal / currentMonthCount : 0;

  // Mock previous month data for comparison
  const previousMonthTotal = 138900;
  const previousMonthCount = 44;
  const previousMonthAverage = 3157;

  // Calculate changes
  const totalChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
  const countChange = currentMonthCount - previousMonthCount;
  const avgChange = currentMonthAverage - previousMonthAverage;

  // Current month emotion breakdown
  const emotionBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.emotion] = (acc[expense.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getEmotionPercentage = (emotionId: string) => {
    const count = emotionBreakdown[emotionId] || 0;
    return currentMonthCount > 0 ? Math.round((count / currentMonthCount) * 100) : 0;
  };

  // Current month category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="custom-gradient-header text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">月間お金の比較</h1>
              <p className="text-white text-opacity-80 text-sm">過去の月との比較</p>
            </div>
            <MobileAccountMenu />
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">月間お金の比較</h1>
              <p className="text-gray-500 mt-1">月ごとのお金のパターンと感情の変化を比較</p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8">
        {/* Comparison Period Selector */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">比較期間</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">基準月</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="2024年1月" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-01">2024年1月</SelectItem>
                    <SelectItem value="2023-12">2023年12月</SelectItem>
                    <SelectItem value="2023-11">2023年11月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">比較月</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="2023年12月" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-12">2023年12月</SelectItem>
                    <SelectItem value="2023-11">2023年11月</SelectItem>
                    <SelectItem value="2023-10">2023年10月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">お金の総額の変化</p>
              <p className={`text-3xl font-bold ${totalChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                ¥{Math.abs(currentMonthTotal - previousMonthTotal).toLocaleString()} {totalChange < 0 ? '減少' : '増加'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">ポジティブ感情の変化</p>
              <p className="text-3xl font-bold text-blue-600">+12%</p>
              <p className="text-sm text-gray-600 mt-2">より良い気分でお金を使った</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">お金を使った回数の変化</p>
              <p className={`text-3xl font-bold ${countChange > 0 ? 'text-purple-600' : 'text-green-600'}`}>
                {countChange > 0 ? '+' : ''}{countChange}回
              </p>
              <p className="text-sm text-gray-600 mt-2">{Math.abs(countChange)}回{countChange > 0 ? '増加' : '減少'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Side by Side Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Month */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">2024年1月（基準月）</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">使ったお金の総額</span>
                  <span className="text-lg font-bold text-gray-900">¥{currentMonthTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">お金を使った回数</span>
                  <span className="text-lg font-bold text-gray-900">{currentMonthCount}回</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">1回で使ったお金の平均</span>
                  <span className="text-lg font-bold text-gray-900">¥{Math.round(currentMonthAverage).toLocaleString()}</span>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">カテゴリー別</h4>
              <div className="space-y-2">
                {Object.entries(categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([category, amount]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium">¥{amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Previous Month */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">2023年12月（比較月）</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">使ったお金の総額</span>
                  <span className="text-lg font-bold text-gray-900">¥{previousMonthTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">お金を使った回数</span>
                  <span className="text-lg font-bold text-gray-900">{previousMonthCount}回</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">1回で使ったお金の平均</span>
                  <span className="text-lg font-bold text-gray-900">¥{previousMonthAverage.toLocaleString()}</span>
                </div>
              </div>

              <h4 className="font-semibold text-gray-900 mb-3">カテゴリー別</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">食費</span>
                  <span className="font-medium">¥52,100</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">交通費</span>
                  <span className="font-medium">¥31,200</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">娯楽</span>
                  <span className="font-medium">¥28,800</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emotion Comparison */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">感情の変化</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {['happy', 'necessary', 'guilty'].map((emotionId) => {
                const emotion = EMOTIONS.find(e => e.id === emotionId);
                if (!emotion) return null;
                
                const currentPercentage = getEmotionPercentage(emotionId);
                const previousPercentage = emotionId === 'happy' ? 58 : emotionId === 'necessary' ? 52 : 15;
                const change = currentPercentage - previousPercentage;
                
                return (
                  <div key={emotionId} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: emotion.color }}
                    >
                      <emotion.icon className="text-white" size={20} />
                    </div>
                    <h4 className="font-semibold text-gray-900">{emotion.label}</h4>
                    <p className="text-2xl font-bold mt-2" style={{ color: emotion.color }}>
                      {currentPercentage}%
                    </p>
                    <p className="text-sm text-gray-500">
                      前月: {previousPercentage}% ({change > 0 ? '+' : ''}{change}%)
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">📈 改善ポイント</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• ポジティブな感情での支出が増加し、健全な消費パターンになっています</li>
                <li>• 罪悪感を感じる支出が半減しており、計画的な支出ができています</li>
                <li>• 支出総額は減少しているのに満足度は向上しています</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
