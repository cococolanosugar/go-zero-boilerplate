import React from "react";
import { Area } from "@ant-design/charts";

interface TrafficChartProps {
  isDark?: boolean;
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ isDark }) => {
  const trafficData = [
    { time: "09-01", service: "Gateway (HTTP)", qps: 1240 },
    { time: "09-01", service: "User RPC", qps: 820 },
    { time: "09-01", service: "Worker RPC", qps: 420 },
    { time: "09-01", service: "ITSM RPC", qps: 310 },
    { time: "09-02", service: "Gateway (HTTP)", qps: 1480 },
    { time: "09-02", service: "User RPC", qps: 960 },
    { time: "09-02", service: "Worker RPC", qps: 520 },
    { time: "09-02", service: "ITSM RPC", qps: 390 },
    { time: "09-03", service: "Gateway (HTTP)", qps: 1890 },
    { time: "09-03", service: "User RPC", qps: 1250 },
    { time: "09-03", service: "Worker RPC", qps: 640 },
    { time: "09-03", service: "ITSM RPC", qps: 460 },
    { time: "09-04", service: "Gateway (HTTP)", qps: 2100 },
    { time: "09-04", service: "User RPC", qps: 1420 },
    { time: "09-04", service: "Worker RPC", qps: 680 },
    { time: "09-04", service: "ITSM RPC", qps: 580 },
    { time: "09-05", service: "Gateway (HTTP)", qps: 2650 },
    { time: "09-05", service: "User RPC", qps: 1800 },
    { time: "09-05", service: "Worker RPC", qps: 850 },
    { time: "09-05", service: "ITSM RPC", qps: 720 },
    { time: "09-06", service: "Gateway (HTTP)", qps: 3120 },
    { time: "09-06", service: "User RPC", qps: 2150 },
    { time: "09-06", service: "Worker RPC", qps: 970 },
    { time: "09-06", service: "ITSM RPC", qps: 860 },
  ];

  return (
    <Area
      data={trafficData}
      xField="time"
      yField="qps"
      colorField="service"
      shapeField="smooth"
      height={260}
      theme={isDark ? "classicDark" : "classic"}
      scale={{
        color: {
          range: ["#722ed1", "#1677ff", "#52c41a", "#fa8c16"],
        },
      }}
      legend={{
        color: {
          position: "bottom" as const,
        },
      }}
    />
  );
};

export default TrafficChart;
