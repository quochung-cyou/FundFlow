
import { Button } from "@/components/ui/button";
import { FundCard } from "@/components/funds/FundCard";
import { useApp } from "@/context/AppContext";
import { PlusIcon } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { funds, currentUser } = useApp();

  return (
    <div className="container mx-auto max-w-5xl py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Xin chào, {currentUser?.displayName}</h1>
          <p className="text-muted-foreground">Quản lý chi tiêu nhóm của bạn một cách dễ dàng</p>
        </div>
        <Button asChild>
          <Link to="/funds/new" className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4" />
            <span>Tạo quỹ mới</span>
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">Quỹ của bạn</h2>
        {funds.length === 0 ? (
          <div className="text-center p-12 bg-secondary rounded-lg">
            <h3 className="text-lg font-medium mb-2">Bạn chưa có quỹ nào</h3>
            <p className="text-muted-foreground mb-6">
              Tạo một quỹ mới để bắt đầu theo dõi chi tiêu nhóm
            </p>
            <Button asChild>
              <Link to="/funds/new">
                <PlusIcon className="h-4 w-4 mr-1" />
                Tạo quỹ đầu tiên
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {funds.map((fund) => (
              <FundCard key={fund.id} fund={fund} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
