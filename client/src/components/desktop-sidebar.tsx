import { Camera, PieChart, TrendingUp, History, Heart, User } from "lucide-react";

interface DesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: "upload" | "dashboard" | "comparison" | "history") => void;
}

export default function DesktopSidebar({ activeTab, onTabChange }: DesktopSidebarProps) {
  const tabs = [
    { id: "upload", label: "レシートアップロード", icon: Camera },
    { id: "dashboard", label: "ダッシュボード", icon: PieChart },
    { id: "comparison", label: "月間比較", icon: TrendingUp },
    { id: "history", label: "支出履歴", icon: History },
  ] as const;

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Heart className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">CoupleFinance</h1>
            <p className="text-sm text-gray-500">二人の家計管理</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium ${
                activeTab === id
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      {/* Partner Info */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                <User className="text-white" size={12} />
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full border-2 border-white flex items-center justify-center">
                <User className="text-white" size={12} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">田中夫妻</p>
              <p className="text-xs text-gray-500">共同アカウント</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
