import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Copy, Heart, UserPlus, Settings, Check } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UserData {
  user: User;
  partner: User | null;
}

export default function ProfileManager() {
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
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = userData?.user;
  const partner = userData?.partner;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              プロフィール
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">表示名</p>
              <p className="text-lg font-medium">{user?.displayName}</p>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  編集
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>表示名を変更</DialogTitle>
                  <DialogDescription>
                    アプリ内で表示される名前を変更できます。
                  </DialogDescription>
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
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleUpdateName}
                    disabled={updateNameMutation.isPending}
                  >
                    {updateNameMutation.isPending ? "保存中..." : "保存"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <p className="text-sm text-gray-500">アカウント</p>
            <p className="text-sm text-gray-700">{user?.username}</p>
          </div>
        </CardContent>
      </Card>

      {/* Partner Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Heart className="mr-2 h-5 w-5" />
              カップル連携
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {partner ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-green-800">{partner.displayName}</p>
                  <p className="text-sm text-green-600">パートナー</p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                連携済み
              </Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center py-4">
                まだパートナーと連携していません
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Generate Invite Code */}
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <UserPlus className="mr-2 h-4 w-4" />
                      招待する
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
                          <p className="text-sm text-gray-500">
                            このコードをパートナーに共有して、アプリに招待してください。
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => generateInviteMutation.mutate()}
                          disabled={generateInviteMutation.isPending}
                          className="w-full"
                        >
                          {generateInviteMutation.isPending ? "生成中..." : "招待コードを生成"}
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Join by Code */}
                <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <Heart className="mr-2 h-4 w-4" />
                      参加する
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
                      >
                        {joinMutation.isPending ? "参加中..." : "参加"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}