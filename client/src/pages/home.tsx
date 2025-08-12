import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNav from "../components/mobile-nav";
import DesktopSidebar from "../components/desktop-sidebar";
import ReceiptUpload from "../components/receipt-upload";
import Dashboard from "../components/dashboard";
import Comparison from "../components/comparison";
import History from "../components/history";
import ProfileManager from "../components/profile-manager";

type ActiveTab = "upload" | "dashboard" | "comparison" | "history" | "account";

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("upload");
  const isMobile = useIsMobile();

  const renderTabContent = () => {
    switch (activeTab) {
      case "upload":
        return <ReceiptUpload />;
      case "dashboard":
        return <Dashboard />;
      case "comparison":
        return <Comparison />;
      case "history":
        return <History />;
      case "account":
        return (
          <div className="p-4 lg:p-8 max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">共同アカウント</h1>
              <p className="text-gray-600">カップルのプロフィール設定とアカウント管理</p>
            </div>
            <ProfileManager />
          </div>
        );
      default:
        return <ReceiptUpload />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation */}
      {isMobile && (
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <DesktopSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      {/* Main Content */}
      <div className={`${!isMobile ? 'lg:ml-64' : ''} min-h-screen pb-16 lg:pb-0`}>
        {renderTabContent()}
      </div>
    </div>
  );
}
