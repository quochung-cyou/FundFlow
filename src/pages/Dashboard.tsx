
import { Button } from "@/components/ui/button";
import { FundCard } from "@/components/funds/FundCard";
import { useApp } from "@/context/AppContext";
import { PlusIcon, WalletCardsIcon, SearchIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { funds, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter funds based on search term
  const filteredFunds = funds.filter(fund => 
    fund.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    fund.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 70 } }
  };

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 sm:px-6">
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Xin chào, {currentUser?.displayName}
          </h1>
          <p className="text-muted-foreground">Quản lý chi tiêu nhóm của bạn một cách dễ dàng</p>
        </div>
        <Button asChild className="group shadow-md hover:shadow-lg transition-all duration-300">
          <Link to="/funds/new" className="flex items-center gap-1">
            <PlusIcon className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Tạo quỹ mới</span>
          </Link>
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6"
      >
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm quỹ..." 
            className="pl-10 transition-all focus-within:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        <motion.h2 
          className="text-xl font-semibold mb-4 flex items-center gap-2"
          variants={item}
        >
          <WalletCardsIcon className="h-5 w-5 text-blue-500" />
          <span>Quỹ của bạn</span>
          {searchTerm && (
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredFunds.length} kết quả)
            </span>
          )}
        </motion.h2>

        {filteredFunds.length === 0 ? (
          <motion.div 
            className="text-center p-12 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100 shadow-inner"
            variants={item}
          >
            {searchTerm ? (
              <>
                <h3 className="text-lg font-medium mb-2">Không tìm thấy quỹ nào</h3>
                <p className="text-muted-foreground mb-6">
                  Không có quỹ nào phù hợp với tìm kiếm "{searchTerm}"
                </p>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Xóa tìm kiếm
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">Bạn chưa có quỹ nào</h3>
                <p className="text-muted-foreground mb-6">
                  Tạo một quỹ mới để bắt đầu theo dõi chi tiêu nhóm
                </p>
                <Button asChild className="hover-lift">
                  <Link to="/funds/new">
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Tạo quỹ đầu tiên
                  </Link>
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredFunds.map((fund, index) => (
              <FundCard key={fund.id} fund={fund} delay={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
