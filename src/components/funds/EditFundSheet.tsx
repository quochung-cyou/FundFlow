import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { useState, ReactNode, useEffect } from "react";
import { Fund, AIApiKey } from "@/types";
import { toast } from "sonner";
import { CheckIcon, PlusIcon, Trash2Icon, EyeIcon, EyeOffIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Same icons as in CreateFundForm
const icons = ["💰", "🍽️", "🏠", "🏖️", "🎮", "🎬", "🚗", "🎁", "🏋️", "📚", "🛒", "👕"];

interface EditFundSheetProps {
  fund: Fund;
  children: ReactNode;
}

export function EditFundSheet({ fund, children }: EditFundSheetProps) {
  // State for form fields
  const [name, setName] = useState(fund.name);
  const [description, setDescription] = useState(fund.description || "");
  const [selectedIcon, setSelectedIcon] = useState(fund.icon);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // AI API key management state
  const [apiKeys, setApiKeys] = useState<AIApiKey[]>(fund.aiApiKeys || []);
  const [newApiKey, setNewApiKey] = useState<Partial<AIApiKey>>({
    provider: 'google',
    label: '',
    key: '',
    isActive: true
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const { funds, setSelectedFund } = useApp();

  // Access the updateFund function from the context
  const { updateFund } = useApp();

  // Toggle API key visibility
  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Add a new API key
  const addApiKey = () => {
    if (!newApiKey.label || !newApiKey.key) {
      toast.error("Vui lòng nhập nhãn và key");
      return;
    }

    const newKey: AIApiKey = {
      id: uuidv4(),
      provider: newApiKey.provider as 'google' | 'openai' | 'groq',
      label: newApiKey.label,
      key: newApiKey.key,
      isActive: newApiKey.isActive || true,
      createdAt: Date.now()
    };

    setApiKeys(prev => [...prev, newKey]);
    setNewApiKey({
      provider: 'google',
      label: '',
      key: '',
      isActive: true
    });

    toast.success("Đã thêm API key");
  };

  // Remove an API key
  const removeApiKey = (id: string) => {
    setApiKeys(prev => prev.filter(key => key.id !== id));
    toast.success("Đã xóa API key");
  };

  // Toggle active state of an API key
  const toggleApiKeyActive = (id: string) => {
    setApiKeys(prev => prev.map(key => 
      key.id === id ? {...key, isActive: !key.isActive} : key
    ));
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update the fund in Firebase with all fields including API keys
      await updateFund(fund.id, {
        name,
        description,
        icon: selectedIcon,
        aiApiKeys: apiKeys
      });

      // Update the selected fund in the local state
      const updatedFund = {
        ...fund,
        name,
        description,
        icon: selectedIcon,
        aiApiKeys: apiKeys
      };
      
      setSelectedFund(updatedFund);
      
      // Close the sheet
      setIsOpen(false);
      toast.success("Cập nhật quỹ thành công!");
    } catch (error) {
      console.error("Error updating fund:", error);
      toast.error("Không thể cập nhật quỹ. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form values when the sheet opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setName(fund.name);
      setDescription(fund.description || "");
      setSelectedIcon(fund.icon);
      setApiKeys(fund.aiApiKeys || []);
      setActiveTab("general");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Chỉnh sửa quỹ</SheetTitle>
            <SheetDescription>
              Cập nhật thông tin của quỹ
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">Thông tin chung</TabsTrigger>
              <TabsTrigger value="ai">AI & API Keys</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="pt-4">
              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Tên quỹ</Label>
                  <Input
                    id="name"
                    placeholder="Nhập tên quỹ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Nhập mô tả về quỹ này"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {icons.map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={selectedIcon === icon ? "default" : "outline"}
                        className="h-10 w-10 sm:h-12 sm:w-12 text-xl sm:text-2xl relative p-0"
                        onClick={() => setSelectedIcon(icon)}
                      >
                        <span className="flex items-center justify-center">{icon}</span>
                        {selectedIcon === icon && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                            <CheckIcon className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ai" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quản lý API Keys</CardTitle>
                  <CardDescription>
                    Thêm các API Key từ Google (Gemini), Groq hoặc OpenAI để sử dụng trong quỹ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add new API key */}
                  <div className="space-y-4 mb-6 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Thêm API Key mới</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="api-provider">Nhà cung cấp</Label>
                        <div className="flex gap-2">
                          <Button 
                            type="button" 
                            variant={newApiKey.provider === 'google' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setNewApiKey({...newApiKey, provider: 'google'})}
                          >
                            Google
                          </Button>
                          <Button 
                            type="button" 
                            variant={newApiKey.provider === 'groq' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setNewApiKey({...newApiKey, provider: 'groq'})}
                          >
                            Groq
                          </Button>
                          <Button 
                            type="button" 
                            variant={newApiKey.provider === 'openai' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => setNewApiKey({...newApiKey, provider: 'openai'})}
                          >
                            OpenAI
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="api-label">Nhãn</Label>
                        <Input
                          id="api-label"
                          placeholder="Nhãn cho API key (ví dụ: Key chung)"
                          value={newApiKey.label || ''}
                          onChange={(e) => setNewApiKey({...newApiKey, label: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          placeholder={`Nhập API key của ${newApiKey.provider === 'google' ? 'Google Gemini' : newApiKey.provider === 'groq' ? 'Groq' : 'OpenAI'}`}
                          value={newApiKey.key || ''}
                          onChange={(e) => setNewApiKey({...newApiKey, key: e.target.value})}
                          type="password"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="api-active"
                          checked={newApiKey.isActive}
                          onCheckedChange={(checked) => setNewApiKey({...newApiKey, isActive: checked})}
                        />
                        <Label htmlFor="api-active">Đang hoạt động</Label>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="default" 
                        onClick={addApiKey}
                        className="mt-2 w-full"
                        disabled={!newApiKey.label || !newApiKey.key}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Thêm API Key
                      </Button>
                    </div>
                  </div>
                  
                  {/* List current API keys */}
                  <div>
                    <h4 className="text-sm font-medium mb-3">API Keys hiện tại</h4>
                    {apiKeys.length > 0 ? (
                      <div className="space-y-3">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${key.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="font-medium">{key.label}</span>
                              </div>
                              <Badge variant="outline">{key.provider}</Badge>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex-1 mr-2">
                                <Input 
                                  value={key.key} 
                                  readOnly 
                                  type={showKeys[key.id] ? "text" : "password"}
                                  className="text-xs bg-muted/30"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleKeyVisibility(key.id)}
                              >
                                {showKeys[key.id] ? (
                                  <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span>Thêm ngày: {formatDate(key.createdAt)}</span>
                              <div className="flex gap-2">
                                <div className="flex items-center">
                                  <Switch
                                    id={`api-active-${key.id}`}
                                    checked={key.isActive}
                                    onCheckedChange={() => toggleApiKeyActive(key.id)}
                                    className="scale-75 data-[state=checked]:bg-primary"
                                  />
                                  <Label htmlFor={`api-active-${key.id}`} className="ml-2">
                                    {key.isActive ? "Bật" : "Tắt"}
                                  </Label>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeApiKey(key.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive/90"
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground">
                        Chưa có API key nào được thêm vào quỹ này
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Usage Statistics */}
              {fund.aiUsageStats && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Thống kê sử dụng AI</CardTitle>
                    <CardDescription>
                      Thông kê lượt gọi API AI trong quỹ của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Gọi API hôm nay:</span>
                        <span className="font-bold">{fund.aiUsageStats.todayCalls || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tổng số lượt gọi:</span>
                        <span className="font-bold">{fund.aiUsageStats.totalCalls || 0}</span>
                      </div>
                      {fund.aiUsageStats.history && fund.aiUsageStats.history.length > 0 && (
                        <div className="pt-4">
                          <h4 className="text-sm font-medium mb-2">Lịch sử sử dụng (30 ngày gần đây)</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-2">
                            {fund.aiUsageStats.history.map((day, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{day.date}</span>
                                <span>{day.calls} lượt</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <SheetFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </SheetClose>
            <Button 
              type="submit" 
              disabled={!name || isLoading}
              className={isLoading ? "opacity-70" : ""}
            >
              {isLoading ? "Đang cập nhật..." : "Lưu thay đổi"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
