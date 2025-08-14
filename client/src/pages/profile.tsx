import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import ProfileManager from "@/components/profile-manager";

interface UserData {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    partnerId?: string;
  };
  partner?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
}

export default function ProfilePage() {
  const { data: userData, isLoading, error } = useQuery<UserData>({
    queryKey: ["/api/user"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !userData?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-gray-600">
            ユーザー情報を取得できませんでした。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">プロフィール設定</h1>
          <p className="text-gray-600 mt-2">
            アカウント情報とプロフィール写真を管理できます。
          </p>
        </div>
        
        <ProfileManager user={userData.user} />
      </div>
    </div>
  );
}