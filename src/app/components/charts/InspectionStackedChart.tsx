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

interface InspectionChartProps {
  data: {
    label: string;
    r1: number;
    r2: number;
    r3: number;
    r12: number;
  }[];
}

export default function InspectionStackedChart({ data }: InspectionChartProps) {
  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'รย.1',
        data: data.map((d) => d.r1),
        backgroundColor: '#10b981', // Emerald
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'รย.2',
        data: data.map((d) => d.r2),
        backgroundColor: '#38bdf8', // Sky
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'รย.3',
        data: data.map((d) => d.r3),
        backgroundColor: '#fbbf24', // Amber
        borderRadius: 4,
        stack: 'Stack 0',
      },
      {
        label: 'รย.12',
        data: data.map((d) => d.r12),
        backgroundColor: '#fb7185', // Rose
        borderRadius: 4,
        stack: 'Stack 0',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          font: { family: "'Kanit', sans-serif", size: 12 },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { family: "'Kanit', sans-serif" },
        bodyFont: { family: "'Kanit', sans-serif" },
        callbacks: {
          footer: (tooltipItems) => {
            const sum = tooltipItems.reduce((a, b) => a + (b.raw as number), 0);
            return `รวม: ${sum} คัน`;
          },
        },
        footerColor: '#10b981',
        footerFont: { weight: 'bold', family: "'Kanit', sans-serif" },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: "'Kanit', sans-serif" } },
        border: { display: false },
      },
      y: {
        stacked: true,
        grid: { color: '#f1f5f9', borderDash: [5, 5], drawBorder: false },
        ticks: { color: '#94a3b8', font: { family: "'Kanit', sans-serif" }, padding: 10 },
        border: { display: false },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div className="h-80 w-full relative">
      <Bar options={options} data={chartData} />
    </div>
  );
}