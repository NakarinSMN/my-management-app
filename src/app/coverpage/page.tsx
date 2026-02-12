"use client";
import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSheetPlastic,
} from "@fortawesome/free-solid-svg-icons";


function Page() {
  // เปลี่ยนเป็น State ว่างๆ เพื่อรอรับข้อมูลจาก API
  const [sheets, setSheets] = useState<{ _id: string, name: string, url: string }[]>([]);
  const [activeSheet, setActiveSheet] = useState<any>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', desc: '', url: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

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

  const handleDeleteClick = (e, sheet) => {
    e.stopPropagation();
    setItemToDelete(sheet); // เก็บข้อมูลทั้งก้อนของ sheet ที่จะลบ
    setIsDeleteModalOpen(true);
  };

  // ฟังก์ชันที่จะลบจริงๆ เมื่อกดยืนยันใน Modal
  const confirmDelete = async () => {
    // เช็คว่ามีข้อมูลที่จะลบจริงไหม (ป้องกัน Error Property '_id' does not exist)
    if (!itemToDelete || !itemToDelete._id) return;

    try {
      // ส่ง ID ไปที่ API
      const res = await fetch(`/api/sheets?id=${itemToDelete._id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // ลบออกจาก State เพื่อให้ UI อัปเดตทันที
        const updatedSheets = sheets.filter((s: any) => s._id !== itemToDelete._id);
        setSheets(updatedSheets);

        // ถ้าตัวที่ลบคือตัวที่กำลังเปิดอยู่ ให้สลับไปเปิดอันแรกแทน
        if (activeSheet?._id === itemToDelete._id) {
          setActiveSheet(updatedSheets.length > 0 ? updatedSheets[0] : null);
        }

        // ปิด Modal และล้างค่าตัวแปร
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } else {
        const errorData = await res.json();
        alert(`ลบไม่สำเร็จ: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error deleting sheet:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  return (
    <div>
      {/* --- Header & Tabs Section --- */}
      <header>
        <div>
          {/* Title Area */}
          <div className="pt-6 pb-4 flex-1 justify-between items-center flex">
            <div className='px-4 flex items-center gap-5 '>

              <FontAwesomeIcon 
              icon={faSheetPlastic}
              className='  text-emerald-500  text-3xl' 
              />
              <div>
                <h3 className="text-2xl font-semibold bg-gradient-to-r text-gray-800 inline-block">
                  ใบปะหน้า
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mt-1">
                  รายงานสรุปยอดชำระภาษีรถยนต์และค่าธรรมเนียมประจำปี 2569
                </p>
              </div>
            </div>

            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
              + เพิ่มใบปะหน้า
            </button>
          </div>


          {/* --- Navigation Tabs --- */}
          <div className="flex space-x-6 overflow-x-auto no-scrollbar">
            {sheets.length === 0 ? (
              <div className="text-gray-400 py-2 text-sm">กำลังโหลดข้อมูล...</div>
            ) : (
              sheets.map((sheet) => {
                const isActive = activeSheet?._id === sheet._id;
                return (
                  <div key={sheet._id} className="group relative">
                    <button
                      onClick={() => setActiveSheet(sheet)}
                      className={`
              flex items-center text-gray-700 text-sm font-medium pl-10 py-1 rounded-full border border-gray-300 
              ${isActive
                          ? ' bg-blue-500 text-white'
                          : ''}
            `}
                    >
                      {sheet.name}

                      <span
                        onClick={(e) => handleDeleteClick(e, sheet)} // เรียก Modal ยืนยัน
                        className={`
                 ml-2 flex p-3 h-3 items-center justify-between font-semibold rounded-full hover:text-red-500 hover:scale-105 transition-all
                ${isActive ? 'opacity-100' : 'display-none group-hover:flex opacity-0 group-hover:opacity-100'}
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

          {/* --- Delete Confirmation Modal --- */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsDeleteModalOpen(false)}
              ></div>

              {/* Modal Content */}
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-2xl mx-auto mb-4">
                  ⚠️
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">ยืนยันการลบ?</h3>
                <p className="text-slate-500 mb-8">
                  คุณต้องการลบใบปะหน้า <span className="font-semibold text-slate-700">"{itemToDelete?.name}"</span> ใช่หรือไม่? ข้อมูลนี้จะไม่สามารถกู้คืนได้
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
                  >
                    ลบทันที
                  </button>
                </div>
              </div>
            </div>
          )}







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
                  className="w-full h-full  border-0"
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