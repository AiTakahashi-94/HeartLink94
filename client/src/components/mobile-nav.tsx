import { Camera, PieChart, TrendingUp, History } from "lucide-react";

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: "upload" | "dashboard" | "comparison" | "history") => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: "upload", label: "アップロード", icon: Camera },
    { id: "dashboard", label: "ダッシュボード", icon: PieChart },
    { id: "comparison", label: "比較", icon: TrendingUp },
    { id: "history", label: "履歴", icon: History },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
      <div className="flex justify-around py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center py-2 px-3 ${
              activeTab === id ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <Icon className="text-xl mb-1" size={20} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
