import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from "lucide-react";

interface User {
  id: string;
  displayName: string;
  photoURL?: string;
}

interface ParticipantSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  memberUsers: User[];
  currentUserId: string;
  onConfirm: (selectedParticipantIds: string[]) => void;
  currency?: { code: string; name: string; symbol: string; flag?: string };
  convertedAmount?: number | null;
}

export function ParticipantSelectionPopup({
  isOpen,
  onClose,
  memberUsers,
  currentUserId,
  onConfirm,
  currency,
  convertedAmount
}: ParticipantSelectionPopupProps) {
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reset state when popup opens and pre-select current user
  useEffect(() => {
    if (isOpen) {
      // Pre-select all members including current user
      setSelectedParticipantIds(memberUsers.map(user => user.id));
      setSearchQuery("");
    }
  }, [isOpen, memberUsers, currentUserId]);

  const handleToggleParticipant = (userId: string) => {
    setSelectedParticipantIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedParticipantIds(memberUsers.map(user => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedParticipantIds([]);
  };

  const handleConfirm = () => {
    console.log("ParticipantSelectionPopup - handleConfirm:", {
      currency,
      convertedAmount,
      selectedParticipants: selectedParticipantIds.length
    });
    onConfirm(selectedParticipantIds);
    onClose();
  };

  const filteredMembers = memberUsers.filter(member => 
    member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn người tham gia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thành viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex justify-between mb-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Chọn tất cả
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Bỏ chọn tất cả
            </Button>
          </div>
          
          <div className="max-h-[40vh] overflow-y-auto space-y-2">
            {filteredMembers.map((member) => (
              <div 
                key={member.id} 
                className={`flex items-center space-x-3 p-2 rounded-md ${
                  member.id === currentUserId ? "bg-accent/50" : "hover:bg-accent/20"
                }`}
              >
                <Checkbox 
                  id={`participant-${member.id}`}
                  checked={selectedParticipantIds.includes(member.id)}
                  onCheckedChange={() => handleToggleParticipant(member.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                  <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <label 
                  htmlFor={`participant-${member.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {member.displayName}
                  {member.id === currentUserId && (
                    <span className="ml-2 text-xs text-muted-foreground">(Tôi)</span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button 
            type="button" 
            onClick={handleConfirm}
            disabled={selectedParticipantIds.length === 0}
          >
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
