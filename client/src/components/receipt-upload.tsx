import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Camera, FolderOpen, User, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmotionSelector from "./emotion-selector";
import { CATEGORIES, EMOTIONS } from "../lib/constants";
import type { Expense } from "@shared/schema";

export default function ReceiptUpload() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    storeName: "",
    notes: "",
  });

  // Fetch recent expenses
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  const recentExpenses = expenses.slice(0, 3);

  // Enhanced OCR processing with OCR.space API
  const extractInvoiceInfo = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", "jpn");
    formData.append("apikey", "K81622020088957");

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    const text = data.ParsedResults?.[0]?.ParsedText || "";

    // Extract specific data from text using improved logic
    const lines = text.split("\n").map(l => l.trim());

    // 💰 Find total amount by looking for keywords with amounts
    let totalAmount = null;
    
    // First try to find amount near keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line contains keywords
      if (/合計|決済金額|お支払い|金額/.test(line)) {
        console.log(`Found keyword in line ${i}: "${line}"`);
        
        // Enhanced regex to match ¥, \, and numbers
        const amountRegex = /[¥\\]\d{1,3}(,\d{3})*/g;
        
        // First check if amount is on the same line
        const sameLineMatch = line.match(amountRegex);
        if (sameLineMatch) {
          totalAmount = sameLineMatch[0];
          console.log(`Found amount on same line: ${totalAmount}`);
          break;
        }
        
        // If not found on same line, check next few lines
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          const nextLineMatch = nextLine.match(amountRegex);
          if (nextLineMatch) {
            totalAmount = nextLineMatch[0];
            console.log(`Found amount on line ${j}: ${totalAmount}`);
            break;
          }
        }
        if (totalAmount) break;
      }
    }
    
    // If still not found, try to find the largest amount in the text
    if (!totalAmount) {
      console.log("No amount found near keywords, searching for largest amount");
      const allAmounts = text.match(/[¥\\]\d{1,3}(,\d{3})*/g);
      if (allAmounts) {
        console.log("All amounts found:", allAmounts);
        // Convert to numbers and find the largest
        const amounts = allAmounts.map(amt => {
          const num = parseInt(amt.replace(/[¥\\,]/g, ''));
          return { original: amt, value: num };
        });
        amounts.sort((a, b) => b.value - a.value);
        totalAmount = amounts[0]?.original;
        console.log("Selected largest amount:", totalAmount);
      }
    }

    // 📅 Date extraction (e.g., 2025年7月28日)
    const date = text.match(/\d{4}年\s?\d{1,2}月\s?\d{1,2}日/)?.[0];

    // 🏪 Store name: extract from first 3 lines
    const store = lines.slice(0, 3).join(" ");

    return {
      storeName: store,
      date,
      amount: totalAmount,
      raw: text,
    };
  };

  const processReceiptOCR = async (file: File) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "OCR処理開始",
        description: "OCR.space APIでレシートから文字を読み取っています...",
      });

      const result = await extractInvoiceInfo(file);
      
      setOcrText(result.raw);
      console.log("抽出されたテキスト:", result.raw);
      console.log("抽出結果:", result);

      // Auto-populate form fields with extracted data
      const cleanAmount = result.amount ? result.amount.replace(/[¥\\,]/g, '') : "";
      console.log("Original amount:", result.amount);
      console.log("Cleaned amount:", cleanAmount);
      
      setFormData(prev => ({
        ...prev,
        amount: cleanAmount,
        storeName: result.storeName || "",
        notes: result.date ? `日付: ${result.date}` : "",
      }));

      setShowForm(true);
      
      if (result.amount) {
        toast({
          title: "OCR処理完了",
          description: `金額を自動入力しました: ${result.amount}`,
        });
      } else {
        toast({
          title: "OCR処理完了",
          description: "テキストを抽出しましたが、金額を特定できませんでした。手動で入力してください。",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error("OCR処理エラー:", error);
      setShowForm(true);
      toast({
        title: "OCR処理エラー",
        description: "OCR.space APIでの処理中にエラーが発生しました。手動で入力してください。",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/expenses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setShowForm(false);
      setFormData({ amount: "", category: "", storeName: "", notes: "" });
      setSelectedEmotion("");
      toast({
        title: "保存完了",
        description: "支出を記録しました。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "支出の保存に失敗しました。",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (file: File) => {
    processReceiptOCR(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.storeName || !selectedEmotion) {
      toast({
        title: "入力エラー",
        description: "必須項目をすべて入力してください。",
        variant: "destructive",
      });
      return;
    }

    createExpenseMutation.mutate({
      userId: "default-user",
      amount: formData.amount,
      category: formData.category,
      emotion: selectedEmotion,
      storeName: formData.storeName,
      notes: formData.notes || null,
      receiptUrl: null,
    });
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return "今日";
    } else if (d.toDateString() === yesterday.toDateString()) {
      return "昨日";
    } else {
      return `${Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))}日前`;
    }
  };

  const getEmotionColor = (emotion: string) => {
    const emotionData = EMOTIONS.find((e) => e.id === emotion);
    return emotionData?.color || "#6B7280";
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">レシートアップロード</h1>
              <p className="text-blue-100 text-sm">支出を記録しましょう</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">レシートアップロード</h1>
              <p className="text-gray-500 mt-1">写真を撮るかファイルを選択して支出を記録</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">今月の支出</p>
                <p className="text-xl font-bold text-gray-900">
                  ¥{expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        {/* Upload Area */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Camera className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">レシートをアップロード</h3>
              <p className="text-gray-500 mb-4">写真を撮るかファイルを選択してください</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => document.getElementById('camera-input')?.click()}
                >
                  <Camera className="mr-2" size={16} />
                  写真を撮る
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <FolderOpen className="mr-2" size={16} />
                  ファイル選択
                </Button>
              </div>
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <input
                id="file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* OCR Results Display */}
        {ocrText && showForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">OCR抽出結果</h3>
                <FileText className="text-blue-600" size={20} />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{ocrText}</pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                抽出されたテキストから自動的にフォームに入力しました。必要に応じて修正してください。
              </p>
            </CardContent>
          </Card>
        )}

        {/* Expense Form */}
        {showForm && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">支出の詳細</h3>
              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">金額</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <Input
                      type="number"
                      placeholder="1,000"
                      className="pl-8"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">OCR.space APIで自動入力されます。必要に応じて修正してください。</p>
                </div>

                {/* Store Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">店名</label>
                  <Input
                    placeholder="スーパーマーケット田中"
                    value={formData.storeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                    required
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Emotion Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">この支出への感情</label>
                  <EmotionSelector
                    selectedEmotion={selectedEmotion}
                    onEmotionChange={setSelectedEmotion}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">メモ（オプション）</label>
                  <Textarea
                    placeholder="この支出について何か記録したいことはありますか？"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={createExpenseMutation.isPending}
                  >
                    {createExpenseMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Expenses Preview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">最近の支出</h3>
              <Button variant="ghost" size="sm" className="text-blue-600">
                すべて見る
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentExpenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">まだ支出がありません</p>
              ) : (
                recentExpenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEmotionColor(expense.emotion) }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{expense.storeName}</p>
                        <p className="text-sm text-gray-500">{expense.category} • {formatDate(expense.createdAt)}</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">¥{parseFloat(expense.amount).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-sm mx-4">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">OCR処理中...</h3>
              <p className="text-gray-500 text-sm">OCR.space APIでレシートから文字を読み取っています</p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
