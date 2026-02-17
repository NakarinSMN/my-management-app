'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { InvoicePDF } from './InvoicePDF';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faDownload, faFilePdf, faPlus, faTrash, 
  faUser, faCar, faList, faSpinner, faEye, faEdit, faCoins, 
  faCheckCircle, faHistory, faClock
} from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink), { ssr: false });
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), { ssr: false });

export default function BillPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const initialForm = {
    id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleDateString('th-TH'),
    customer: { 
      type: "individual", name: "", taxId: "", branch: "สำนักงานใหญ่", phone: "", email: "",
      addressDetail: "", subdistrict: "", district: "", province: "", zipcode: "" 
    },
    vehicle: { licensePlate: "", province: "", brand: "", model: "" },
    items: [{ id: Date.now(), description: "ค่าบริการตรวจสภาพรถ (ตรอ.)", price: 0 }],
    subtotal: 0, discount: 0, total: 0
  };

  const [formData, setFormData] = useState(initialForm);
  const [pdfData, setPdfData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tor_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const calculateTotal = (items: any[], discountVal: number) => {
    const sum = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    const netTotal = sum - (Number(discountVal) || 0);
    setFormData(prev => ({ ...prev, items, subtotal: sum, discount: discountVal, total: netTotal }));
  };

  const handleSaveAndPreview = async () => {
    setIsGenerating(true);
    // บันทึกลง LocalStorage
    const newHistory = [formData, ...history.filter(h => h.id !== formData.id)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('tor_history', JSON.stringify(newHistory));
    
    setPdfData(formData);
    
    // ✅ ดีเลย์เพื่อให้หน้าจอ "รอสักครู่" แสดงผล
    await new Promise(r => setTimeout(r, 1200)); 
    
    setActiveTab('preview');
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-Sarabun text-gray-800">
      
      {/* --- Navigation Bar --- */}
      <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setActiveTab('form')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'form' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>ออกบิล</button>
             <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>ประวัติ</button>
          </div>
          
          <div className="flex gap-2">
            {activeTab === 'form' && (
                <button onClick={handleSaveAndPreview} disabled={!formData.customer.name} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 disabled:opacity-50">
                   {isGenerating ? <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" /> : <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />}
                   บันทึก & ดูตัวอย่าง
                </button>
            )}
            {activeTab === 'preview' && (
                <button onClick={() => setActiveTab('form')} className="bg-gray-200 px-5 py-2 rounded-xl text-sm font-bold">กลับไปแก้ไข</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* ✅ แสดงหน้าจอ "รอสักครู่" ระหว่างโหลด */}
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
             <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <FontAwesomeIcon icon={faClock} className="text-4xl text-emerald-500 animate-pulse mb-4" />
                <h2 className="text-xl font-bold text-gray-700">รอสักครู่...</h2>
                <p className="text-sm text-gray-400 mt-2 text-center">กำลังบันทึกข้อมูลและเตรียมไฟล์ PDF</p>
             </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          
          {/* --- Tab: Form (ที่อยู่ละเอียด) --- */}
          {activeTab === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="font-bold flex items-center gap-3 mb-6"><FontAwesomeIcon icon={faUser} className="text-emerald-500" /> ข้อมูลผู้เสียภาษี / ลูกค้า</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 ml-1">ชื่อลูกค้า (หรือบริษัท)</label>
                        <input type="text" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 ring-emerald-100" value={formData.customer.name} onChange={e => setFormData({...formData, customer: {...formData.customer, name: e.target.value}})} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 ml-1">เลขประจำตัวผู้เสียภาษี</label>
                        <input type="text" maxLength={13} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none font-mono" value={formData.customer.taxId} onChange={e => setFormData({...formData, customer: {...formData.customer, taxId: e.target.value}})} />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t">
                        <input className="md:col-span-2 px-4 py-2 bg-gray-50 rounded-lg text-xs" placeholder="ที่อยู่ (เลขที่/ซอย/ถนน)" value={formData.customer.addressDetail} onChange={e => setFormData({...formData, customer: {...formData.customer, addressDetail: e.target.value}})} />
                        <input className="px-4 py-2 bg-gray-50 rounded-lg text-xs" placeholder="ตำบล" value={formData.customer.subdistrict} onChange={e => setFormData({...formData, customer: {...formData.customer, subdistrict: e.target.value}})} />
                        <input className="px-4 py-2 bg-gray-50 rounded-lg text-xs" placeholder="อำเภอ" value={formData.customer.district} onChange={e => setFormData({...formData, customer: {...formData.customer, district: e.target.value}})} />
                        <input className="px-4 py-2 bg-gray-50 rounded-lg text-xs" placeholder="จังหวัด" value={formData.customer.province} onChange={e => setFormData({...formData, customer: {...formData.customer, province: e.target.value}})} />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <input className="px-4 py-3 bg-gray-50 rounded-xl text-xs" placeholder="รหัสไปรษณีย์" value={formData.customer.zipcode} onChange={e => setFormData({...formData, customer: {...formData.customer, zipcode: e.target.value}})} />
                        <input className="px-4 py-3 bg-gray-50 rounded-xl text-xs" placeholder="เบอร์โทร" value={formData.customer.phone} onChange={e => setFormData({...formData, customer: {...formData.customer, phone: e.target.value}})} />
                    </div>
                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <section className="bg-white p-6 rounded-[2rem] shadow-sm border">
                    <h3 className="font-bold mb-4 text-blue-500"><FontAwesomeIcon icon={faCar} className="mr-2" /> ข้อมูลรถ</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="ทะเบียน" className="px-4 py-3 bg-gray-50 rounded-xl font-bold uppercase" value={formData.vehicle.licensePlate} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, licensePlate: e.target.value}})} />
                        <input placeholder="จังหวัด" className="px-4 py-3 bg-gray-50 rounded-xl" value={formData.vehicle.province} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, province: e.target.value}})} />
                    </div>
                </section>

                <section className="bg-white p-6 rounded-[2rem] shadow-sm border">
                    <div className="flex justify-between items-center mb-4 font-bold text-purple-600">
                        <h3><FontAwesomeIcon icon={faList} className="mr-2" /> รายการบริการ</h3>
                        <button onClick={() => setFormData({...formData, items: [...formData.items, {id: Date.now(), description: "", price: 0}]})} className="text-xs bg-purple-50 px-3 py-1 rounded-lg">+ เพิ่ม</button>
                    </div>
                    <div className="space-y-2">
                        {formData.items.map((item, idx) => (
                            <div key={item.id} className="flex gap-2">
                                <input placeholder="รายการ..." className="flex-1 px-3 py-2 bg-gray-50 rounded-lg text-xs" value={item.description} onChange={e => {
                                    const next = [...formData.items]; next[idx].description = e.target.value;
                                    calculateTotal(next, formData.discount);
                                }} />
                                <input type="number" className="w-20 px-3 py-2 bg-gray-50 rounded-lg text-right text-xs font-mono" value={item.price || ''} onChange={e => {
                                    const next = [...formData.items]; next[idx].price = Number(e.target.value);
                                    calculateTotal(next, formData.discount);
                                }} />
                                {idx > 0 && <button onClick={() => calculateTotal(formData.items.filter(i => i.id !== item.id), formData.discount)} className="text-red-300"><FontAwesomeIcon icon={faTrash} className="text-xs" /></button>}
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t text-right">
                        <p className="text-[10px] text-gray-400 font-bold">ยอดรวมสุทธิ</p>
                        <p className="text-4xl font-black text-emerald-600 font-mono">฿{formData.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* --- Tab: History --- */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="bg-white rounded-[2rem] p-8 border">
                <h3 className="font-bold text-xl mb-6">ประวัติบิล (แก้ไขได้)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {history.map(h => (
                        <div key={h.id} className="border p-4 rounded-2xl flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => { setFormData(h); setActiveTab('form'); }}>
                            <div>
                                <p className="font-bold text-emerald-600">{h.vehicle.licensePlate}</p>
                                <p className="text-xs font-bold truncate w-32">{h.customer.name}</p>
                                <p className="text-[10px] text-gray-400">{h.date}</p>
                            </div>
                            <FontAwesomeIcon icon={faEdit} className="text-gray-300" />
                        </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* --- Tab: Preview --- */}
          {activeTab === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border h-[82vh]">
                <PDFViewer width="100%" height="100%" className="border-none">
                  <InvoicePDF data={pdfData} />
                </PDFViewer>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}