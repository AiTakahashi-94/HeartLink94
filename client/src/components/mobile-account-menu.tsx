import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Edit, UserPlus, Copy, Check, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User as UserType } from "@shared/schema";

interface UserData {
  user: UserType;
  partner: UserType | null;
}

export default function MobileAccountMenu() {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get current user data
  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: ["/api/user"],
  });

  // Update display name mutation
  const updateNameMutation = useMutation({
    mutationFn: async (newDisplayName: string) => {
      return apiRequest("PATCH", "/api/user", {
        displayName: newDisplayName
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "名前を更新しました",
        description: "アカウント名が正常に変更されました。",
      });
      setIsEditDialogOpen(false);
      setDisplayName("");
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "名前の更新に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // Generate invite code mutation
  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/invite/generate", {});
    },
    onSuccess: (data: any) => {
      setInviteCode(data.inviteCode);
      toast({
        title: "招待コードを生成しました",
        description: "パートナーにコードを共有してください。",
      });
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "招待コードの生成に失敗しました。",
        variant: "destructive",
      });
    },
  });

  // Join by invite code mutation
  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/invite/join", {
        inviteCode: code
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "カップル連携完了",
        description: "パートナーとの連携が完了しました！",
      });
      setIsJoinDialogOpen(false);
      setJoinCode("");
    },
    onError: () => {
      toast({
        title: "エラー",
        description: "招待コードが無効または期限切れです。",
        variant: "destructive",
      });
    },
  });

  const copyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "コピーしました",
        description: "招待コードがクリップボードにコピーされました。",
      });
    }
  };

  const handleUpdateName = () => {
    if (!displayName.trim()) {
      toast({
        title: "入力エラー",
        description: "名前を入力してください。",
        variant: "destructive",
      });
      return;
    }
    updateNameMutation.mutate(displayName.trim());
  };

  const handleJoin = () => {
    if (!joinCode.trim()) {
      toast({
        title: "入力エラー",
        description: "招待コードを入力してください。",
        variant: "destructive",
      });
      return;
    }
    joinMutation.mutate(joinCode.trim().toUpperCase());
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" className="bg-white bg-opacity-90 text-gray-800 border-gray-300 shadow-sm" disabled>
        <User className="h-4 w-4 mr-2" />
        読込中...
      </Button>
    );
  }

  const user = userData?.user;
  const partner = userData?.partner;

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white bg-opacity-90 text-gray-800 border-gray-300 shadow-sm hover:bg-white hover:bg-opacity-100 hover:shadow-md">
          <User className="h-4 w-4 mr-2" />
          アカウント
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>アカウント設定</DialogTitle>
          <DialogDescription>
            プロフィール設定とパートナー連携を管理します。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
                {/* Profile Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">プロフィール</h4>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{user?.displayName}</p>
                      <p className="text-xs text-gray-500">{user?.username}</p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit size={14} className="mr-1" />
                          編集
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>表示名を変更</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="displayName">新しい表示名</Label>
                            <Input
                              id="displayName"
                              placeholder={user?.displayName}
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button variant="outline" onClick={() => setDisplayName("")}>
                            キャンセル
                          </Button>
                          <Button
                            onClick={handleUpdateName}
                            disabled={updateNameMutation.isPending}
                            style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                            className="hover:opacity-90"
                          >
                            {updateNameMutation.isPending ? "保存中..." : "保存"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Partner Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">パートナー連携</h4>
                  {partner ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Heart className="text-green-600" size={16} />
                        <div>
                          <p className="text-sm font-medium text-green-800">{partner.displayName}</p>
                          <p className="text-xs text-green-600">連携済み</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        パートナー
                      </Badge>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-500 text-center py-2">
                        パートナーと連携していません
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                              <UserPlus size={14} className="mr-1" />
                              招待
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>パートナーを招待</DialogTitle>
                              <DialogDescription>
                                招待コードを生成してパートナーに共有してください。
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              {inviteCode ? (
                                <div className="space-y-3">
                                  <Label>招待コード</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      value={inviteCode}
                                      readOnly
                                      className="font-mono text-center text-lg font-bold"
                                    />
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      onClick={copyInviteCode}
                                    >
                                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => generateInviteMutation.mutate()}
                                  disabled={generateInviteMutation.isPending}
                                  className="w-full hover:opacity-90"
                                  style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                                >
                                  {generateInviteMutation.isPending ? "生成中..." : "招待コードを生成"}
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              className="w-full hover:opacity-90"
                              style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                            >
                              <Heart size={14} className="mr-1" />
                              参加
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>招待コードで参加</DialogTitle>
                              <DialogDescription>
                                パートナーから受け取った招待コードを入力してください。
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="joinCode">招待コード</Label>
                                <Input
                                  id="joinCode"
                                  placeholder="XXXXXXXX"
                                  value={joinCode}
                                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                  className="font-mono text-center text-lg"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setIsJoinDialogOpen(false)}
                              >
                                キャンセル
                              </Button>
                              <Button
                                onClick={handleJoin}
                                disabled={joinMutation.isPending}
                                style={{ backgroundColor: '#1AB676', borderColor: '#1AB676' }}
                                className="hover:opacity-90"
                              >
                                {joinMutation.isPending ? "参加中..." : "参加"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}