// components/ChartPlaceholder.js

'use client';
export function ChartPlaceholder({ type }) {
  const chartStyles = {
    line: "bg-gradient-to-br from-blue-200 to-blue-400 h-48 rounded-lg flex items-center justify-center text-blue-800 font-bold",
    pie: "bg-gradient-to-br from-green-200 to-green-400 h-48 rounded-lg flex items-center justify-center text-green-800 font-bold",
    bar: "bg-gradient-to-br from-purple-200 to-purple-400 h-48 rounded-lg flex items-center justify-center text-purple-800 font-bold",
  };

  return (
    <div className={`${chartStyles[type]} p-4`}>
      {/* ในโปรเจกต์จริงจะแทนที่ด้วย Component กราฟจากไลบรารี */}
      <p>กราฟ {type.charAt(0).toUpperCase() + type.slice(1)} จะแสดงที่นี่</p>
    </div>
  );
}