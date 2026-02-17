'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { InvoicePDF } from './InvoicePDF';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileInvoice, faHistory, faCheck, faPlus, faTrash, 
  faUser, faCar, faReceipt, faSpinner, faEdit, faArrowLeft, faCoins,
  faBuilding, faIdCard
} from '@fortawesome/free-solid-svg-icons'; // เพิ่ม icon building/idcard
import { motion, AnimatePresence } from 'framer-motion';

const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), { ssr: false });

// UI Helper: Input Field Component
const MinimalInput = ({ label, value, ...props }: any) => (
  <div className="flex flex-col gap-1.5 w-full">
    {label && <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">{label}</label>}
    <input 
      {...props} 
      value={value ?? ""} 
      className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all duration-200 text-sm"
    />
  </div>
);

export default function BillPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'preview'>('form');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const initialForm = {
    id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleDateString('th-TH'),
    customer: { 
      type: "individual", // default value
      name: "", 
      taxId: "", 
      branch: "", // เพิ่ม field สาขา
      phone: "", 
      email: "",
      addressDetail: "", subdistrict: "", district: "", province: "", zipcode: "" 
    },
    vehicle: { licensePlate: "", province: "", brand: "", model: "" },
    items: [{ id: Date.now(), description: "ค่าบริการตรวจสภาพรถ (ตรอ.)", price: 0 }],
    subtotal: 0, 
    discount: 0, 
    rounding: 0, 
    total: 0
  };

  const [formData, setFormData] = useState(initialForm);
  const [pdfData, setPdfData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('tor_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const calculateTotal = (items: any[], discountVal: number, roundingVal: number) => {
    const sum = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    const netTotal = sum - (Number(discountVal) || 0) + (Number(roundingVal) || 0);
    setFormData(prev => ({ 
      ...prev, 
      items, 
      subtotal: sum, 
      discount: discountVal, 
      rounding: roundingVal, 
      total: netTotal 
    }));
  };

  const handleSaveAndPreview = async () => {
    setIsGenerating(true);
    const newHistory = [formData, ...history.filter(h => h.id !== formData.id)].slice(0, 50);
    setHistory(newHistory);
    localStorage.setItem('tor_history', JSON.stringify(newHistory));
    setPdfData(formData);
    await new Promise(r => setTimeout(r, 800)); 
    setActiveTab('preview');
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-Sarabun text-slate-700">
      
      {/* --- Header / Nav --- */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">EasyBill</h1>
            <div className="flex bg-gray-100/80 p-1 rounded-2xl">
              <button onClick={() => setActiveTab('form')} className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'form' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <FontAwesomeIcon icon={faFileInvoice} className="mr-2 opacity-70" /> ออกบิล
              </button>
              <button onClick={() => setActiveTab('history')} className={`px-5 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'history' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <FontAwesomeIcon icon={faHistory} className="mr-2 opacity-70" /> ประวัติ
              </button>
            </div>
          </div>
          
          <div className="flex gap-3">
            {activeTab === 'form' && (
              <button onClick={handleSaveAndPreview} disabled={!formData.customer.name} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200">
                {isGenerating ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'สร้างใบเสร็จ'}
              </button>
            )}
            {activeTab === 'preview' && (
              <button onClick={() => setActiveTab('form')} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-emerald-600 transition-colors">
                <FontAwesomeIcon icon={faArrowLeft} /> กลับไปแก้ไข
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <AnimatePresence mode="wait">
          
          {activeTab === 'form' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-12 gap-8">
              
              <div className="col-span-12 lg:col-span-7 space-y-6">
                
                {/* --- ส่วนข้อมูลลูกค้า --- */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                      <h3 className="font-bold text-lg">ข้อมูลลูกค้า</h3>
                    </div>

                    {/* ✅ Toggle Switch: บุคคลธรรมดา / นิติบุคคล */}
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button 
                        onClick={() => setFormData({...formData, customer: {...formData.customer, type: 'individual'}})}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${formData.customer.type === 'individual' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <FontAwesomeIcon icon={faUser} /> บุคคล
                      </button>
                      <button 
                         onClick={() => setFormData({...formData, customer: {...formData.customer, type: 'corporate'}})}
                         className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${formData.customer.type === 'corporate' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <FontAwesomeIcon icon={faBuilding} /> นิติบุคคล
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      {/* เปลี่ยน Label ตามประเภท */}
                      <MinimalInput 
                        label={formData.customer.type === 'individual' ? "ชื่อ-นามสกุล" : "ชื่อบริษัท"} 
                        placeholder={formData.customer.type === 'individual' ? "นาย สมชาย ใจดี" : "บริษัท ตัวอย่าง จำกัด"}
                        value={formData.customer.name} 
                        onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, name: e.target.value}})} 
                      />
                    </div>
                    
                    {/* ถ้าเป็นนิติบุคคล ให้แสดงช่องสาขาด้วย */}
                    <div className={formData.customer.type === 'corporate' ? "col-span-1" : "col-span-2"}>
                       <MinimalInput 
                        label={formData.customer.type === 'individual' ? "เลขบัตรประชาชน (ถ้ามี)" : "เลขผู้เสียภาษี"} 
                        maxLength={13} 
                        value={formData.customer.taxId} 
                        onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, taxId: e.target.value}})} 
                      />
                    </div>
                    
                    {formData.customer.type === 'corporate' && (
                      <div className="col-span-1">
                        <MinimalInput 
                          label="สาขา" 
                          placeholder="สนง.ใหญ่ / 0000"
                          value={formData.customer.branch} 
                          onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, branch: e.target.value}})} 
                        />
                      </div>
                    )}

                    <div className="col-span-2">
                      <MinimalInput label="เบอร์โทรศัพท์" value={formData.customer.phone} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, phone: e.target.value}})} />
                    </div>
                    
                    <div className="col-span-2 mt-4 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <MinimalInput label="ที่อยู่" placeholder="เลขที่, หมู่บ้าน, ถนน..." value={formData.customer.addressDetail} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, addressDetail: e.target.value}})} />
                      </div>
                      <MinimalInput label="ตำบล" value={formData.customer.subdistrict} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, subdistrict: e.target.value}})} />
                      <MinimalInput label="อำเภอ" value={formData.customer.district} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, district: e.target.value}})} />
                      <MinimalInput label="จังหวัด" value={formData.customer.province} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, province: e.target.value}})} />
                      <MinimalInput label="รหัสไปรษณีย์" value={formData.customer.zipcode} onChange={(e:any) => setFormData({...formData, customer: {...formData.customer, zipcode: e.target.value}})} />
                    </div>
                  </div>
                </section>

                {/* ข้อมูลยานพาหนะ */}
                <section className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><FontAwesomeIcon icon={faCar} /></div>
                    <h3 className="font-bold text-lg">ข้อมูลยานพาหนะ</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <MinimalInput label="เลขทะเบียน" placeholder="กข 1234" value={formData.vehicle.licensePlate} onChange={(e:any) => setFormData({...formData, vehicle: {...formData.vehicle, licensePlate: e.target.value.toUpperCase()}})} />
                    <MinimalInput label="จังหวัด" value={formData.vehicle.province} onChange={(e:any) => setFormData({...formData, vehicle: {...formData.vehicle, province: e.target.value}})} />
                    <MinimalInput label="ยี่ห้อรถ" placeholder="Toyota, Honda, etc." value={formData.vehicle.brand} onChange={(e:any) => setFormData({...formData, vehicle: {...formData.vehicle, brand: e.target.value}})} />
                    <MinimalInput label="รุ่น / สี" placeholder="Yaris (ขาว)" value={formData.vehicle.model} onChange={(e:any) => setFormData({...formData, vehicle: {...formData.vehicle, model: e.target.value}})} />
                  </div>
                </section>
              </div>

              {/* Right Column: รายการบริการ */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <section className="bg-white p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 sticky top-28">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600"><FontAwesomeIcon icon={faReceipt} /></div>
                      <h3 className="font-bold text-lg">รายการบริการ</h3>
                    </div>
                    <button onClick={() => setFormData({...formData, items: [...formData.items, {id: Date.now(), description: "", price: 0}]})} className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center">
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-8 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.items.map((item, idx) => (
                      <div key={item.id} className="group flex gap-3 items-end">
                        <div className="flex-1">
                          <MinimalInput placeholder="ชื่อรายการ..." value={item.description} onChange={(e:any) => {
                              const next = [...formData.items]; next[idx].description = e.target.value;
                              calculateTotal(next, formData.discount, formData.rounding);
                          }} />
                        </div>
                        <div className="w-24">
                          <MinimalInput type="number" placeholder="0.00" value={item.price || ''} onChange={(e:any) => {
                              const next = [...formData.items]; next[idx].price = Number(e.target.value);
                              calculateTotal(next, formData.discount, formData.rounding);
                          }} />
                        </div>
                        {idx > 0 && (
                          <button onClick={() => calculateTotal(formData.items.filter(i => i.id !== item.id), formData.discount, formData.rounding)} className="mb-2 text-gray-300 hover:text-red-400 transition-colors">
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-dashed border-gray-100 space-y-3">
                    <div className="flex justify-between text-sm text-gray-400 font-medium">
                      <span>ยอดรวม (Subtotal)</span>
                      <span>฿{formData.subtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-gray-400 font-medium flex items-center gap-2">
                        <FontAwesomeIcon icon={faCoins} className="text-[10px]" /> ปัดเศษ / ส่วนต่าง
                      </span>
                      <div className="w-24">
                        <input 
                          type="number" 
                          step="any"
                          className="w-full px-2 py-1 bg-slate-50 border border-gray-100 rounded-lg text-right text-sm focus:border-emerald-500 outline-none"
                          value={formData.rounding ?? 0} 
                          onChange={(e:any) => calculateTotal(formData.items, formData.discount, Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold text-slate-800">ยอดสุทธิ</span>
                      <span className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">
                        ฿{formData.total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}

          {/* ประวัติ และ Preview ยังคงเหมือนเดิมครับ */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
               <h2 className="text-2xl font-bold mb-6">ประวัติการออกบิล</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.map(h => (
                  <div key={h.id} onClick={() => { 
                    setFormData({
                      ...initialForm,
                      ...h,
                      customer: { ...initialForm.customer, ...h.customer },
                      vehicle: { ...initialForm.vehicle, ...h.vehicle }
                    }); 
                    setActiveTab('form'); 
                  }} className="bg-white p-6 rounded-3xl border border-transparent hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 cursor-pointer transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{h.id}</div>
                      <FontAwesomeIcon icon={faEdit} className="text-gray-200 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-lg font-bold text-slate-800 mb-1">{h.vehicle.licensePlate || 'ไม่ระบุทะเบียน'}</p>
                    <p className="text-sm text-gray-500 truncate mb-4">{h.customer.name}</p>
                    <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                      <span className="text-[10px] font-medium text-gray-400">{h.date}</span>
                      <span className="font-bold text-emerald-600 font-mono">฿{(h.total ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-[80vh] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100">
              <PDFViewer width="100%" height="100%" className="border-none">
                <InvoicePDF data={pdfData} />
              </PDFViewer>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-emerald-100 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 font-bold text-slate-800 animate-pulse text-lg">กำลังเตรียมเอกสาร...</p>
        </div>
      )}
    </div>
  );
}