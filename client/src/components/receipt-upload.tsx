import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Camera, FolderOpen, User, Eye, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EmotionSelector from "./emotion-selector";
import { CATEGORIES, EMOTIONS } from "../lib/constants";


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



  // Enhanced OCR processing with Google Vision API
  const extractInvoiceInfo = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Google Vision API Response:", data);
    
    if (!data.success) {
      console.error("OCR Error:", data.error);
      throw new Error(`OCR処理エラー: ${data.error}`);
    }
    
    const text = data.rawText || "";
    
    if (!text || text.trim() === "") {
      console.warn("OCR returned empty text");
      throw new Error("画像からテキストを読み取れませんでした");
    }

    // Use server-extracted data directly
    return {
      storeName: data.storeName || "",
      date: data.date || null,
      amount: data.amount || null,
      raw: text,
    };
  };

  const processReceiptOCR = async (file: File) => {
    setIsProcessing(true);
    
    try {
      toast({
        title: "OCR処理開始",
        description: "Google Vision APIでレシートから文字を読み取っています...",
      });

      const result = await extractInvoiceInfo(file);
      
      setOcrText(result.raw);
      console.log("抽出されたテキスト:", result.raw);
      console.log("抽出結果:", result);

      // Auto-populate form fields with extracted data
      const cleanAmount = result.amount ? result.amount.replace(/[¥\\,円]/g, '') : "";
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
      
      let errorMessage = "OCR.space APIでの処理中にエラーが発生しました。";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "OCR処理エラー",
        description: `${errorMessage} 手動で入力してください。`,
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
    console.log("File uploaded:", file.name, file.type, file.size);
    
    // Check if file is a valid image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "ファイルエラー",
        description: "画像ファイルを選択してください。",
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ファイルサイズエラー",
        description: "ファイルサイズは5MB以下にしてください。",
        variant: "destructive",
      });
      return;
    }
    
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



  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="custom-gradient-header text-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">レシートアップロード</h1>
              <p className="text-gray-600 text-sm">支出を記録しましょう</p>
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
                  ¥0
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
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E5FBF3' }}>
                <Camera className="" style={{ color: '#1AB676' }} size={32} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">レシートをアップロード</h3>
              <p className="text-gray-500 mb-4">写真を撮るかファイルを選択してください</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  className="hover:opacity-90"
                  style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
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
        {ocrText && (
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

        {/* Expense Form - Always visible for manual input */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">支出の詳細</h3>
              {!ocrText && (
                <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  手入力モード
                </span>
              )}
            </div>

              
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金額
                    {formData.amount && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        OCR自動入力済み
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
                    <Input
                      type="number"
                      placeholder="1,000"
                      className={`pl-8 ${formData.amount ? 'border-green-300 bg-green-50' : ''}`}
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.amount 
                      ? "OCRで自動入力されました。金額が間違っている場合は直接編集してください。" 
                      : "OCR.space APIで自動入力されます。必要に応じて修正してください。"
                    }
                  </p>
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
                    className="flex-1 hover:opacity-90 h-10"
                    style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                    disabled={createExpenseMutation.isPending}
                  >
                    {createExpenseMutation.isPending ? "登録中..." : "登録"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 h-10"
                    onClick={() => {
                      setFormData({
                        amount: "",
                        storeName: "",
                        category: "",
                        notes: ""
                      });
                      setSelectedEmotion("");
                      setOcrText("");
                    }}
                  >
                    リセット
                  </Button>
                </div>
              </form>
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
