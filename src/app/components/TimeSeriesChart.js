// components/TimeSeriesChart.js

'use client';
// FIX 1: Import useCallback along with other hooks
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function TimeSeriesChart({ data, dataKey, name, chartType = 'line', chartColor, borderColor, className = '' }) {
  const [timeframe, setTimeframe] = useState('daily');
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [chartTextColor, setChartTextColor] = useState('#e2e8f0');
  const [chartSecondaryColor, setChartSecondaryColor] = useState('#94a3b8');
  const [chartGridColor, setChartGridColor] = useState('rgba(200, 200, 200, 0.1)');
  const chartContainerRef = useRef(null);

  // FIX 2: Wrap processDataByTimeframe in useCallback
  // This memoizes the function so it doesn't get recreated on every render,
  // making it safe to use in the useEffect dependency array.
  const processDataByTimeframe = useCallback((rawData, tf) => {
    const processed = {};
    rawData.forEach(item => {
      const date = new Date(item.date);
      let key;
      if (tf === 'daily') {
        key = date.toISOString().slice(0, 10);
      } else if (tf === 'weekly') {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

        // FIX 3: Correctly use the 'weekNo' variable in a template literal.
        // The old code had escaping issues, causing 'weekNo' to be unused.
        key = `${date.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;

      } else if (tf === 'monthly') {
        key = date.toISOString().slice(0, 7);
      } else if (tf === 'yearly') {
        key = date.getFullYear().toString();
      }

      if (key) {
        if (!processed[key]) {
          processed[key] = 0;
        }
        processed[key] += item[dataKey];
      }
    });

    let labels = Object.keys(processed).sort();
    let values = labels.map(label => processed[label]);
    // Limit chart points to 100 for performance
    if (labels.length > 100) {
      const step = Math.ceil(labels.length / 100);
      labels = labels.filter((_, idx) => idx % step === 0);
      values = values.filter((_, idx) => idx % step === 0);
    }

    return { labels, values };
  }, [dataKey]); // dataKey is a dependency for this function

  // useEffect to update chart data
  useEffect(() => {
    // FIX 4: Add 'processDataByTimeframe' to the dependency array.
    // This fixes the exhaustive-deps warning.
    if (data && data.length > 0) {
      const { labels, values } = processDataByTimeframe(data, timeframe);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: name,
            data: values,
            backgroundColor: chartColor || (chartType === 'bar' ? 'rgba(75, 192, 192, 0.6)' : 'rgba(75, 192, 192, 0.2)'),
            borderColor: borderColor || 'rgba(75, 192, 192, 1)',
            borderWidth: chartType === 'line' ? 2 : 1,
            fill: chartType === 'line' ? true : false,
            tension: 0.4,
          },
        ],
      });
    }
  }, [data, name, timeframe, chartType, chartColor, borderColor, processDataByTimeframe]);

  // useEffect for updating colors from CSS variables (no changes needed here)
  useEffect(() => {
    const getCssVariable = (variableName) => {
      if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
      }
      return '';
    };

    const updateColorsAndFont = () => {
      setChartTextColor(getCssVariable('--text-color-primary') || '#e2e8f0');
      setChartSecondaryColor(getCssVariable('--text-color-secondary') || '#94a3b8');
      setChartGridColor(getCssVariable('--chart-grid-color') || 'rgba(200, 200, 200, 0.1)');
    };
    updateColorsAndFont();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: chartTextColor, font: { family: 'Kanit' } } },
      title: {
        display: true,
        text: `${name} (${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})`,
        color: chartTextColor,
        font: { family: 'Kanit', size: 16, weight: 'bold' }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            if (context.parsed.y !== null) { label += context.parsed.y.toLocaleString(); }
            return label;
          }
        },
        bodyFont: { family: 'Kanit' },
        titleFont: { family: 'Kanit' }
      },
    },
    scales: {
      x: {
        ticks: { color: chartSecondaryColor, font: { family: 'Kanit' } },
        grid: { color: chartGridColor },
      },
      y: {
        ticks: {
          color: chartSecondaryColor,
          callback: function (value) { return typeof value === 'number' ? value.toLocaleString() : value; },
          font: { family: 'Kanit' },
        },
        grid: { color: chartGridColor },
      },
    },
    font: { family: 'Kanit', size: 12, weight: 'normal' },
  };

  return (
    <div ref={chartContainerRef} className={`space-y-1 ${className}`}>
      <div className="flex justify-end space-x-1">
        {['daily', 'weekly', 'monthly', 'yearly'].map(tf => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-3 py-1 rounded-md text-sm font-medium ${timeframe === tf ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {tf === 'daily' ? 'รายวัน' : tf === 'weekly' ? 'รายสัปดาห์' : tf === 'monthly' ? 'รายเดือน' : 'รายปี'}
          </button>
        ))}
      </div>
      <div style={{ height: '300px', width: '100%' }}>
        {chartType === 'line' ? <Line data={chartData} options={options} /> : <Bar data={chartData} options={options} />}
      </div>
    </div>
  );
}