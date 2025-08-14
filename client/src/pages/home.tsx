import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNav from "../components/mobile-nav";
import DesktopSidebar from "../components/desktop-sidebar";
import ReceiptUpload from "../components/receipt-upload";
import Dashboard from "../components/dashboard";
import Comparison from "../components/comparison";
import History from "../components/history";
import ProfilePage from "./profile";


type ActiveTab = "upload" | "dashboard" | "comparison" | "history" | "profile";

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
      case "profile":
        return <ProfilePage />;
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
