import React from "react";
import { Fund } from "@/types";
import { FundChartDashboard } from "./charts";

// Export all charts components for reuse
export * from "./charts";

// For backwards compatibility
export function FundCharts({ fund }: { fund: Fund }) {
  return <FundChartDashboard fund={fund} />;
}
