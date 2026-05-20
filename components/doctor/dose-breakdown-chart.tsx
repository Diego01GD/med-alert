"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export interface DoseBreakdownData {
  onTime: number;
  justified: number;
  unjustified: number;
}

export interface DoseBreakdownChartProps {
  data: DoseBreakdownData;
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = {
  onTime: "#10b981",
  justified: "#f59e0b",
  unjustified: "#ef4444",
};

export function DoseBreakdownChart({ data }: DoseBreakdownChartProps) {
  const total = data.onTime + data.justified + data.unjustified;
  const chartData: ChartData[] = [
    {
      name: "A tiempo",
      value: data.onTime,
      percentage: Math.round((data.onTime / total) * 100),
    },
    {
      name: "Omisiones justificadas",
      value: data.justified,
      percentage: Math.round((data.justified / total) * 100),
    },
    {
      name: "Omisiones injustificadas",
      value: data.unjustified,
      percentage: Math.round((data.unjustified / total) * 100),
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Desglose de tomas en el período
      </h3>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        <div className="w-full lg:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      index === 0
                        ? COLORS.onTime
                        : index === 1
                          ? COLORS.justified
                          : COLORS.unjustified
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => String(value)}
                contentStyle={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2 space-y-4">
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-slate-900">{total}</p>
            <p className="text-sm text-slate-600">Tomas Totales</p>
          </div>

          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        index === 0
                          ? COLORS.onTime
                          : index === 1
                            ? COLORS.justified
                            : COLORS.unjustified,
                    }}
                  />
                  <span className="text-sm text-slate-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {item.percentage}%
                  </p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
