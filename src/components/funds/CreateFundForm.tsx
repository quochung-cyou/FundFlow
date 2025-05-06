
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
      members: [currentUser.id],
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
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
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
