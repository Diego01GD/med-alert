"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface PatientAdherenceData {
  patientName: string;
  adherence: number;
}

export interface PatientAdherenceChartProps {
  data: PatientAdherenceData[];
}

const getAdherenceColor = (value: number): string => {
  if (value >= 80) return "#10b981"; // green
  if (value >= 60) return "#f59e0b"; // amber
  return "#ef4444"; // red
};

export function PatientAdherenceChart({
  data,
}: PatientAdherenceChartProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Adherencia total por paciente (%)
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
            <YAxis
              dataKey="patientName"
              type="category"
              width={195}
              tick={{ fontSize: 12 }}
              stroke="#64748b"
            />
            <Tooltip
              formatter={(value: any) => `${value}%`}
              contentStyle={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
              }}
            />
            <Bar
              dataKey="adherence"
              radius={[0, 8, 8, 0]}
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAdherenceColor(entry.adherence)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
