
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon } from "lucide-react";

const icons = ["💰", "🍽️", "🏠", "🏖️", "🎮", "🎬", "🚗", "🎁", "🏋️", "📚", "🛒", "👕"];

export function CreateFundForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("💰");
  const { createFund, currentUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    createFund({
      name,
      description,
      icon: selectedIcon,
      members: [currentUser],
    });
    
    navigate("/");
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Tạo quỹ mới</CardTitle>
          <CardDescription>
            Tạo một quỹ mới để theo dõi chi tiêu của nhóm bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <div className="grid grid-cols-6 gap-2">
              {icons.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? "default" : "outline"}
                  className="h-12 w-12 text-2xl relative"
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                  {selectedIcon === icon && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <CheckIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate("/")}>
            Hủy
          </Button>
          <Button type="submit" disabled={!name}>
            Tạo quỹ
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
