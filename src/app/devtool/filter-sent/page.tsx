// src/app/devtool/filter-sent/page.tsx
'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faCopy, faCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function FilterSentPage() {
  const [inputText, setInputText] = useState<string>('');
  const [filteredText, setFilteredText] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [stats, setStats] = useState<{ total: number; sent: number; notSent: number }>({
    total: 0,
    sent: 0,
    notSent: 0
  });

  const filterNotSent = () => {
    if (!inputText.trim()) {
      return;
    }

    const lines = inputText.split('\n');
    const notSentLines: string[] = [];
    let totalCount = 0;
    let sentCount = 0;
    let notSentCount = 0;

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      if (!line) {
        i++;
        continue;
      }

      // แยกข้อมูลด้วย tab
      const parts = line.split('\t');
      
      if (parts.length >= 8) {
        totalCount++;
        const sentStatus = parts[7].trim();
        
        // เช็คว่าเป็น "ยังไม่ส่ง" หรือไม่
        if (sentStatus === 'ยังไม่ส่ง') {
          notSentCount++;
          notSentLines.push(line);
          
          // ตรวจสอบว่าบรรทัดถัดไปมีวันเวลาหรือไม่ (ถ้ามีก็ข้าม)
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.match(/^\(\d{2}\/\d{2}\s+\d{2}:\d{2}\)$/)) {
              i++; // ข้ามบรรทัดวันเวลา
            }
          }
        } else if (sentStatus.startsWith('ส่งแล้ว')) {
          sentCount++;
          // ข้ามบรรทัดวันเวลา
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine.match(/^\(\d{2}\/\d{2}\s+\d{2}:\d{2}\)$/)) {
              i++;
            }
          }
        }
      }
      
      i++;
    }

    setFilteredText(notSentLines.join('\n'));
    setStats({ total: totalCount, sent: sentCount, notSent: notSentCount });
  };

  const copyToClipboard = async () => {
    if (!filteredText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(filteredText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('ไม่สามารถคัดลอกข้อความได้');
    }
  };

  const clearAll = () => {
    setInputText('');
    setFilteredText('');
    setStats({ total: 0, sent: 0, notSent: 0 });
    setIsCopied(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FontAwesomeIcon icon={faFilter} className="mr-3 text-blue-600" />
            กรองรายการที่ยังไม่ส่ง
          </motion.h1>
          <motion.p 
            className="text-gray-600 dark:text-gray-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            เครื่องมือกรองข้อมูลเพื่อแยกรายการที่ยังไม่ส่งออกมา
          </motion.p>
          <Link
            href="/devtool"
            className="inline-block mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← กลับไป DevTool
          </Link>
        </div>

        {/* Statistics */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faFilter} className="text-blue-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">รายการทั้งหมด</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-2 border-green-200 dark:border-green-800">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ส่งแล้ว</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-2 border-orange-200 dark:border-orange-800">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faTimesCircle} className="text-orange-500 text-2xl mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ยังไม่ส่ง</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.notSent}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📥 ข้อมูลต้นทาง
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              วางข้อความทั้งหมดที่นี่ (รวมทั้งส่งแล้วและยังไม่ส่ง):
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="วางข้อความที่คัดลอกมาที่นี่..."
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={filterNotSent}
                disabled={!inputText.trim()}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <FontAwesomeIcon icon={faFilter} className="mr-2" />
                กรองรายการที่ยังไม่ส่ง
              </button>
              <button
                onClick={clearAll}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                ล้างข้อมูล
              </button>
            </div>
          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              📤 ผลลัพธ์ (ยังไม่ส่ง)
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              รายการที่กรองออกมาแล้ว (เฉพาะยังไม่ส่ง):
            </p>
            <textarea
              value={filteredText}
              readOnly
              placeholder="ผลลัพธ์จะแสดงที่นี่..."
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={copyToClipboard}
              disabled={!filteredText}
              className={`w-full px-6 py-3 rounded-lg transition-all font-semibold mt-4 ${
                isCopied
                  ? 'bg-green-600 text-white'
                  : 'bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <FontAwesomeIcon icon={isCopied ? faCheck : faCopy} className="mr-2" />
              {isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกผลลัพธ์'}
            </button>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            💡 วิธีใช้งาน
          </h3>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
            <li>คัดลอกข้อความรายการทั้งหมดจากไฟล์ของคุณ (ทั้งส่งแล้วและยังไม่ส่ง)</li>
            <li>วางข้อความลงในช่องด้านซ้าย</li>
            <li>กดปุ่ม <span className="font-semibold">&quot;กรองรายการที่ยังไม่ส่ง&quot;</span></li>
            <li>ระบบจะแยกเฉพาะรายการที่มีสถานะ <span className="font-semibold">&quot;ยังไม่ส่ง&quot;</span> ออกมา</li>
            <li>ผลลัพธ์จะแสดงในช่องด้านขวา พร้อมสถิติด้านบน</li>
            <li>กดปุ่ม <span className="font-semibold">&quot;คัดลอกผลลัพธ์&quot;</span> เพื่อคัดลอกรายการที่ยังไม่ส่ง</li>
          </ol>
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border border-blue-300 dark:border-blue-700">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold mb-2">
              📋 รูปแบบข้อมูลที่รองรับ:
            </p>
            <pre className="text-xs text-blue-800 dark:text-blue-200 font-mono bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
{`9กก3222กท	ปรีชา ผาดาสิทธิ์	0890069676	07/12/2567	07/12/2568	33 วัน	กำลังจะครบกำหนด	ส่งแล้ว
(03/11 10:34)
ศฉ631กท	ศรัญญา ดวงกําเหนิด		10/11/2567	10/11/2568	6 วัน	กำลังจะครบกำหนด	ยังไม่ส่ง`}
            </pre>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              ⚠️ คอลัมน์ที่ 8 ต้องเป็น &quot;ส่งแล้ว&quot; หรือ &quot;ยังไม่ส่ง&quot; (คั่นด้วย Tab)
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

