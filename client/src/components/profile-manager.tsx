import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Camera, Edit2, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "./ObjectUploader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UploadResult } from "@uppy/core";

interface ProfileManagerProps {
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
  };
}

export default function ProfileManager({ user }: ProfileManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: async (data: { displayName?: string; avatarUrl?: string }) => {
      return apiRequest("PATCH", "/api/user", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "プロフィールを更新しました",
        description: "変更が正常に保存されました",
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プロフィールの更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (avatarURL: string) => {
      return apiRequest("PUT", "/api/avatars", { avatarURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "プロフィール写真を更新しました",
        description: "新しいプロフィール写真が設定されました",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "プロフィール写真の更新に失敗しました",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (displayName.trim() !== user.displayName) {
      updateUserMutation.mutate({ displayName: displayName.trim() });
    } else {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user.displayName);
    setIsEditing(false);
  };

  const handleGetUploadParameters = async () => {
    const data = await apiRequest("POST", "/api/objects/upload", {});
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      if (uploadedFile.uploadURL) {
        updateAvatarMutation.mutate(uploadedFile.uploadURL);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* プロフィール写真セクション */}
      <Card>
        <CardHeader>
          <CardTitle>プロフィール写真</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="プロフィール写真"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </div>
          
          <ObjectUploader
            maxNumberOfFiles={1}
            maxFileSize={5 * 1024 * 1024} // 5MB
            onGetUploadParameters={handleGetUploadParameters}
            onComplete={handleUploadComplete}
            buttonClassName="bg-green-600 hover:bg-green-700"
          >
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>写真を変更</span>
            </div>
          </ObjectUploader>
        </CardContent>
      </Card>

      {/* プロフィール情報セクション */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            プロフィール情報
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                編集
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">ユーザー名</Label>
            <Input
              id="username"
              value={user.username}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <Label htmlFor="displayName">表示名</Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateUserMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Input
                id="displayName"
                value={user.displayName}
                disabled
                className="bg-gray-50"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}