import React from "react";
import { useApp } from "@/context/AppContext";
import { Fund } from "@/types";
import { FundChartDashboard } from "./FundCharts";

interface FundSummaryChartProps {
  fund: Fund;
}

export function FundSummaryChart({ fund }: FundSummaryChartProps) {
  return <FundChartDashboard fund={fund} />;
}
