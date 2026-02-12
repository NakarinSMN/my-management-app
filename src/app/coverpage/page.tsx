"use client";
import React, { useState, useEffect } from 'react'

function Page() {
  // เปลี่ยนเป็น State ว่างๆ เพื่อรอรับข้อมูลจาก API
  const [sheets, setSheets] = useState<{ _id: string, name: string, url: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // 1. โหลดข้อมูลเมื่อเปิดหน้าเว็บ (Fetch from MongoDB)
  // 1. โหลดข้อมูลเมื่อเปิดหน้าเว็บ (Fetch from MongoDB)
  useEffect(() => {
    setIsIframeLoading(true);
    const fetchSheets = async () => {
      try {
        const res = await fetch('/api/sheets');
        const data = await res.json();

        // 🔍 จุดแก้ปัญหา: เช็คก่อนว่า data ที่ได้มา เป็น Array จริงไหม?
        if (Array.isArray(data)) {
          setSheets(data);

          // ถ้ามีข้อมูล และยังไม่ได้เลือก activeSheet ให้เลือกอันแรก
          if (data.length > 0) {
            setActiveSheet((prev) => prev || data[0]);
          }
        } else {
          // ถ้าไม่ใช่ Array (เช่น ได้ Error กลับมา) ให้ใส่ Array ว่างๆ ไว้ก่อน กันเว็บพัง
          console.error("API ส่งข้อมูลมาผิดรูปแบบ (ไม่ใช่ Array):", data);
          setSheets([]);
        }

      } catch (error) {
        console.error("Error fetching sheets:", error);
        setSheets([]); // กันเหนียว ถ้าพังให้เป็น Array ว่าง
      }
    };

    fetchSheets();
  }, [activeSheet]);

  // 2. ฟังก์ชันส่งข้อมูลไปบันทึก (POST to MongoDB)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newSheet = await res.json();

        // อัปเดต UI ทันที
        setSheets([...sheets, newSheet]);
        setActiveSheet(newSheet);

        // ล้างค่าและปิด Modal
        setIsModalOpen(false);
        setFormData({ title: '', desc: '', url: '' });
      }
    } catch (error) {
      console.error("Error saving:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // กันไม่ให้ไปคลิกเลือก Tab ตอนกดลบ
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบใบปะหน้านี้?")) return;

    try {
      const res = await fetch(`/api/sheets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updatedSheets = sheets.filter(s => s._id !== id);
        setSheets(updatedSheets);
        // ถ้าลบตัวที่เปิดอยู่ ให้ไปเปิดตัวแรกแทน หรือล้างค่าถ้าไม่เหลือแล้ว
        if (activeSheet?._id === id) {
          setActiveSheet(updatedSheets.length > 0 ? updatedSheets[0] : null);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("ลบไม่สำเร็จ");
    }
  };

  return (
    <div>
      {/* --- Header & Tabs Section --- */}
      <header>
        <div>
          {/* Title Area */}
          <div className="pt-6 pb-4 flex-1 justify-between items-center flex">
            <h3 className="text-2xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent inline-block">
              ใบปะหน้า
            </h3>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              + เพิ่มใบปะหน้า
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 overflow-x-auto no-scrollbar">
            {sheets.length === 0 ? (
              <div className="text-gray-400 py-2 text-sm">กำลังโหลดข้อมูล...</div>
            ) : (
              sheets.map((sheet) => {
                // MongoDB ใช้ _id แทน id
                const isActive = activeSheet?._id === sheet._id;
                return (
                  <div key={sheet._id} className="group relative">
                    <button
                      onClick={() => setActiveSheet(sheet)}
                      className={`
                        flex items-center gap-2 px-4 pb-3 pt-2 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap
                        ${isActive
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                      `}
                    >
                      {sheet.name}

                      {/* ปุ่มลบ (x) จะแสดงตอน Hover หรือตอนที่ Tab นั้น active */}
                      <span
                        onClick={(e) => handleDelete(e, sheet._id)}
                        className={`
                          ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600 transition-colors
                          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                        `}
                      >
                        ✕
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content Area (Pre-loading Version) --- */}
      <main className="flex-1 py-4">
        <div className="max-w-screen-2xl h-[calc(100vh-180px)] bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 overflow-hidden relative">

          {/* 1. ข้อความกรณีไม่มีข้อมูลเลย */}
          {sheets.length === 0 && (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="text-6xl opacity-20">📄</div>
              <p className="text-lg">ยังไม่มีข้อมูลที่จะแสดงผล</p>
            </div>
          )}

          {/* 2. เทคนิค Pre-loading: โหลดทุก iframe พร้อมกันแต่ซ่อนไว้ */}
          {sheets.map((sheet) => {
            const isActive = activeSheet?._id === sheet._id;
            return (
              <div
                key={sheet._id}
                className={`absolute inset-0 transition-opacity w-full h-full duration-500 ${isActive ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
                  }`}
              >
                {/* แถบ Loading เล็กๆ ด้านบน iframe */}
                {!isActive && <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 animate-pulse"></div>}

                <iframe
                  src={sheet.url}
                  className="w-full h-full border-0"
                  title={sheet.name}
                  // loading="eager" คือการสั่งให้โหลดทันทีไม่ต้องรอ scroll มาถึง
                  loading="eager"
                ></iframe>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- Modal (Popup Form) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">สร้างใบปะหน้าใหม่</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หัวข้อเอกสาร</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="เช่น รายงานประจำเดือน..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด / ลิ้งค์</label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="เช่น https://docs.google.com/..."
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:bg-gray-400"
                >
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Page