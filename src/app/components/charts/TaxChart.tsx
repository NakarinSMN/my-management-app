"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TaxChartProps {
  data: { label: string; count: number; active: boolean }[]; // active เพื่อบอกว่าเป็นเดือนปัจจุบันหรือไม่
}

export default function TaxChart({ data }: TaxChartProps) {
  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'จำนวนรถต่อภาษี',
        data: data.map((d) => d.count),
        // ใช้ Scriptable Options เพื่อเปลี่ยนสีตามเงื่อนไข (เดือนปัจจุบันสีเข้ม)
        backgroundColor: (context) => {
          const index = context.dataIndex;
          return data[index]?.active ? '#10b981' : '#e2e8f0'; // Emerald-500 vs Slate-200
        },
        hoverBackgroundColor: (context) => {
          const index = context.dataIndex;
          return data[index]?.active ? '#059669' : '#cbd5e1';
        },
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // ซ่อน Legend เพราะมีสีเดียว
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        displayColors: false, // ซ่อนสีหน้า Tooltip
        callbacks: {
          title: (items) => `เดือน ${items[0].label}`,
          label: (item) => `${item.formattedValue} คัน`,
        },
        titleFont: { family: "'Kanit', sans-serif", size: 14 },
        bodyFont: { family: "'Kanit', sans-serif", size: 14, weight: 'bold' },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: "'Kanit', sans-serif" } },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid: {
          color: '#f1f5f9',
          tickBorderDash: [5, 5]
        },
        ticks: {
          color: '#94a3b8',
          font: { family: "'Kanit', sans-serif" },
          padding: 10
        },
        border: { display: false }, // บรรทัดนี้ทำหน้าที่แทน drawBorder: false เดิม
      },
    },
  };

  return (
    <div className="h-80 w-full relative">
      <Bar options={options} data={chartData} />
    </div>
  );
}