
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Fund, User } from "@/types";
import { Clock, Users, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface FundCardProps {
  fund: Fund;
  delay?: number;
}

export function FundCard({ fund, delay = 0 }: FundCardProps) {
  const { setSelectedFund, getUserById } = useApp();
  const navigate = useNavigate();

  // Convert member IDs to user objects for display
  const memberUsers = useMemo(() => {
    return (fund.members || []).map(memberId => {
      const user = getUserById(memberId);
      return user || {
        id: memberId,
        displayName: 'User',
        email: '',
        photoURL: ''
      };
    }).slice(0, 5); // Only get first 5 members for display
  }, [fund.members, getUserById]);

  const handleViewFund = () => {
    setSelectedFund(fund);
    navigate(`/funds/${fund.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: delay * 0.1,
        type: "spring",
        stiffness: 100 
      }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group">
        <CardHeader className="pb-2 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">{fund.icon}</div>
              <div>
                <CardTitle className="text-lg sm:text-xl">{fund.name}</CardTitle>
                <CardDescription className="line-clamp-2">{fund.description}</CardDescription>
              </div>
            </div>
          </div>
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-200 animate-pulse-subtle"></div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{fund.members.length} thành viên</span>
            </div>
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <Clock className="h-4 w-4" />
              <span>Tạo {formatDistanceToNow(fund.createdAt, { addSuffix: true, locale: vi })}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex -space-x-3">
            {memberUsers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
              >
                <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-white">
                  <AvatarImage src={member.photoURL} alt={member.displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {member.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            ))}
            {fund.members.length > 5 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-xs font-medium border-2 border-background ring-2 ring-white"
              >
                +{fund.members.length - 5}
              </motion.div>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={handleViewFund}
            className="w-full sm:w-auto group-hover:bg-blue-600 transition-colors duration-300"
          >
            Xem chi tiết
            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
