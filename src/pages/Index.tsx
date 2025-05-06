
import { useEffect } from "react";
import Dashboard from "./Dashboard";
import { Toaster } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  // Set up scroll restoration
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-white"
    >
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          className: "animate-slide-up"
        }}
      />
      <Dashboard />
    </motion.div>
  );
};

export default Index;
