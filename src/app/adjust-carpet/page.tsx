'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faClock, 
  faArrowLeft,
  faCalculator,
  faCalendar
} from '@fortawesome/free-solid-svg-icons';
import Calendar from '../components/Calendar';
import AnimatedNumber from '../components/AnimatedNumber';

export default function AdjustCarpetPage() {
  // ตั้งค่าเริ่มต้นเป็นวันที่ปัจจุบัน
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'byDate' | 'byDays'>('byDate');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(nextYearStr);
  const [customDays, setCustomDays] = useState<string>('');
  const [daysDiff, setDaysDiff] = useState<number>(0);
  const [resultDate, setResultDate] = useState<string>('');
  const [resultRates, setResultRates] = useState<Record<string, string>>({});

  const [dateTime, setDateTime] = useState({ date: '', time: '' });
  useEffect(() => {
    const upd = () => {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = now.getFullYear();
      const h = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setDateTime({
        date: `วันที่ ${d}/${m}/${y}`,
        time: `เวลา ${h}:${mi}:${s}`,
      });
    };
    upd();
    const tid = setInterval(upd, 1000);
    return () => clearInterval(tid);
  }, []);

  // Rate factors - constant values
  const rateFactors: Record<string, number> = {
    A: 645.21,
    B: 1182.35,
    C: 2493.10,
    D: 967.28,
    E: 1310.75,
    F: 1408.12,
    G: 1826.49,
    H: 161.57,
    I: 323.14,
    J: 430.14,
    K: 645.21,
  };

  useEffect(() => {
    if (activeTab === 'byDate' && startDate) {
      const sd = new Date(startDate);
      sd.setFullYear(sd.getFullYear() + 1);
      const y = sd.getFullYear();
      const mm = String(sd.getMonth() + 1).padStart(2, '0');
      const dd = String(sd.getDate()).padStart(2, '0');
      setEndDate(`${y}-${mm}-${dd}`);
    }
  }, [startDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'byDate' && startDate && endDate) {
      const sd = new Date(startDate);
      const ed = new Date(endDate);
      if (ed > sd) {
        const diff = Math.ceil((ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24));
        setDaysDiff(diff);
        const rates: Record<string, string> = {};
        for (const [k, base] of Object.entries(rateFactors)) {
          rates[k] = ((base / 365) * diff + 0.2).toFixed(2);
        }
        setResultRates(rates);
      } else {
        setDaysDiff(0);
        setResultRates({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'byDays') {
      const n = parseInt(customDays, 10);
      if (!isNaN(n) && n > 0) {
        const rates: Record<string, string> = {};
        for (const [k, base] of Object.entries(rateFactors)) {
          rates[k] = ((base / 365) * n + 0.2).toFixed(2);
        }
        setResultRates(rates);
        const due = new Date();
        due.setDate(due.getDate() + n);
        const dd = String(due.getDate()).padStart(2, '0');
        const mm = String(due.getMonth() + 1).padStart(2, '0');
        const yy = due.getFullYear();
        setResultDate(`${dd}/${mm}/${yy}`);
        setDaysDiff(n);
      } else {
        setResultRates({});
        setResultDate('');
        setDaysDiff(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customDays, activeTab]);

  const labelMap: Record<string, string> = {
    A: 'รย.1',
    B: 'รย.2',
    C: 'รย.2 (เชิงพานิชย์)',
    D: 'รย.3',
    E: 'รย.3 (น้ำหนักเกิน 3-6 ตัน)',
    F: 'รย.3 (น้ำหนักเกิน 6-12 ตัน)',
    G: 'รย.3 (น้ำหนักเกิน 12 ตัน)',
    H: 'รย.12 (ขนาดไม่เกิน 75 ซีซี)',
    I: 'รย.12 (ขนาดเกิน 75-125 ซีซี)',
    J: 'รย.12 (ขนาดเกิน 125-150 ซีซี)',
    K: 'รย.12 (ขนาดเกิน 150 ซีซี)',
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <div className="w-full h-full p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg"
              >
                <FontAwesomeIcon 
                  icon={faCalendarAlt} 
                  className="text-lg text-white" 
                />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                >
                  ปรับรอบพรบ.
                </motion.h1>
                <motion.p 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-xs text-gray-600 dark:text-gray-400 mt-0.5"
                >
                  คำนวณค่าเบี้ยประกันภัยตามระยะเวลาที่กำหนด
                </motion.p>
              </div>
            </div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-right bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 px-4 py-2 rounded-xl shadow-md border border-emerald-200 dark:border-emerald-700"
            >
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{dateTime.date}</div>
              <div className="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400">{dateTime.time}</div>
            </motion.div>
          </div>

          {/* Back Button */}
         
        </motion.div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {/* Tab Buttons */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex gap-3 mb-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('byDate')}
              className={`flex-1 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                activeTab === 'byDate'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg'
                  : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600'
              }`}
            >
              <FontAwesomeIcon icon={faCalendar} className="text-sm" />
              คำนวนตามวันที่
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('byDays')}
              className={`flex-1 px-5 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                activeTab === 'byDays'
                  ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-lg'
                  : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 hover:from-emerald-50 hover:to-green-50 dark:hover:from-emerald-900/20 dark:hover:to-green-900/20 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600'
              }`}
            >
              <FontAwesomeIcon icon={faCalculator} className="text-sm" />
              คำนวนตามจำนวนวัน
            </motion.button>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="grid grid-cols-12 gap-4"
          >
            {/* Left + Middle: Calendars and Summary */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {activeTab === 'byDate' ? (
                  <motion.div
                    key="byDate"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Two Calendars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 p-4 rounded-3xl shadow-lg border border-emerald-100 dark:border-emerald-900/30 transition-all h-[480px] flex flex-col"
                    >
                      <p className="mb-3 text-sm font-semibold text-center text-gray-900 dark:text-white flex-shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-emerald-600 text-xs" />
                        วันเริ่มต้น
                      </p>
                      <div className="flex-1">
                        <Calendar
                          selectedDate={startDate}
                          onSelectDate={setStartDate}
                          className="w-full h-full"
                        />
                      </div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/10 p-4 rounded-3xl shadow-lg border border-green-100 dark:border-green-900/30 transition-all h-[480px] flex flex-col"
                    >
                      <p className="mb-3 text-sm font-semibold text-center text-gray-900 dark:text-white flex-shrink-0">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-green-600 text-xs" />
                        วันสิ้นสุด (+1 ปี)
                      </p>
                      <div className="flex-1">
                        <Calendar
                          selectedDate={endDate}
                          onSelectDate={setEndDate}
                          className="w-full h-full"
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Summary Below */}
                  {daysDiff > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                      className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 rounded-3xl shadow-lg border border-emerald-400 h-[100px] flex items-center justify-center mt-6"
                    >
                      <div className="text-center">
                        <p className="text-white/90 text-sm font-semibold mb-2 tracking-wider uppercase">
                          จำนวนวันทั้งหมด
                        </p>
                        <p className="text-4xl font-bold text-white drop-shadow-lg">
                          {daysDiff.toLocaleString('th-TH')} <span className="text-2xl">วัน</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="byDays"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 p-8 rounded-xl shadow-lg border border-emerald-100 dark:border-emerald-900/30 flex flex-col justify-center h-[480px]"
                    >
                    <div className="max-w-md mx-auto w-full">
                      <label className="block mb-4 text-lg font-semibold text-gray-900 dark:text-white text-center">
                        <FontAwesomeIcon icon={faClock} className="mr-2 text-emerald-600" />
                        กรอกจำนวนวัน
                      </label>
                      <input
                        type="number"
                        placeholder="จำนวนวัน (เช่น 365)"
                        className="w-full px-6 py-4 text-xl font-medium text-center border border-emerald-300 dark:border-emerald-700 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-md transition-all"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                      />
                    </div>
                  </motion.div>

                  {resultDate && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                      className="bg-gradient-to-br from-emerald-500 to-green-500 p-6 rounded-3xl shadow-lg border border-emerald-400 h-[100px] flex items-center justify-center mt-6"
                    >
                      <div className="text-center">
                        <p className="text-white/90 text-sm font-semibold mb-2 tracking-wider uppercase">
                          ครบกำหนดวันที่
                        </p>
                        <p className="text-4xl font-bold text-white drop-shadow-lg">
                          {resultDate}
                        </p>
                      </div>
                    </motion.div>
                  )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Rates List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="col-span-12 lg:col-span-3"
            >
              <AnimatePresence mode="wait">
                {((activeTab === 'byDate' && daysDiff > 0) || (activeTab === 'byDays' && resultDate)) ? (
                  <motion.div 
                    key="rates-list"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-5 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[600px]"
                  >
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-700 pb-3 flex-shrink-0">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center shadow-md">
                      <FontAwesomeIcon icon={faCalculator} className="text-white text-sm" />
                    </div>
                    <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      อัตราค่าเบี้ยประกันภัย
                    </span>
                  </h3>
                  <div 
                    className="space-y-2.5 flex-1 overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#10B981 #D1FAE5'
                    }}
                  >
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        width: 10px;
                      }
                      div::-webkit-scrollbar-track {
                        background: #D1FAE5;
                        border-radius: 8px;
                        margin: 4px 0;
                      }
                      div::-webkit-scrollbar-thumb {
                        background: linear-gradient(to bottom, #10B981, #059669);
                        border-radius: 8px;
                        border: 2px solid #D1FAE5;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background: linear-gradient(to bottom, #059669, #047857);
                      }
                    `}</style>
                    {Object.entries(resultRates).map(([k, v]) => (
                      <motion.div
                        key={k}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Object.keys(resultRates).indexOf(k) * 0.05 }}
                        whileHover={{ scale: 1.03, x: 5 }}
                        className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-3.5 rounded-3xl border border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                              {labelMap[k]}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                              <AnimatedNumber value={parseFloat(v)} />
                            </div>
                            <div className="text-[10px] font-normal text-gray-500 dark:text-gray-400">บาท</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                ) : (
                  <motion.div 
                    key="empty-rates"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-900/10 p-8 rounded-xl shadow-lg border border-emerald-100 dark:border-emerald-900/30 text-center flex flex-col items-center justify-center h-[570px]"
                  >
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl flex items-center justify-center mb-4 shadow-md">
                    <div className="text-4xl opacity-60">📋</div>
                  </div>
                  <p className="text-base font-medium text-gray-600 dark:text-gray-400">
                    เลือกวันที่เพื่อดูผลลัพธ์
                  </p>
                </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

 