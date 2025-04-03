
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Fund, User } from "@/types";
import { Clock, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface FundCardProps {
  fund: Fund;
}

export function FundCard({ fund }: FundCardProps) {
  const { setSelectedFund } = useApp();
  const navigate = useNavigate();

  const handleViewFund = () => {
    setSelectedFund(fund);
    navigate(`/funds/${fund.id}`);
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="text-3xl">{fund.icon}</div>
            <CardTitle>{fund.name}</CardTitle>
          </div>
        </div>
        <CardDescription>{fund.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{fund.members.length} thành viên</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <Clock className="h-4 w-4" />
          <span>Tạo {formatDistanceToNow(fund.createdAt, { addSuffix: true, locale: vi })}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-4 flex justify-between">
        <div className="flex -space-x-2">
          {fund.members.slice(0, 4).map((member) => (
            <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
              <AvatarImage src={member.photoURL} alt={member.displayName} />
              <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
          {fund.members.length > 4 && (
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted text-xs">
              +{fund.members.length - 4}
            </div>
          )}
        </div>
        <Button size="sm" onClick={handleViewFund}>
          Xem chi tiết
        </Button>
      </CardFooter>
    </Card>
  );
}
