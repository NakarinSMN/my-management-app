// src/app/billing-main/InvoicePDF.tsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// ✅ การ Register ฟอนต์แบบ Local
// เราจะใช้ Absolute URL เพื่อให้ Turbopack/Next.js หาไฟล์เจอแน่นอน
const getFontPath = (fontName: string) => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/fonts/${fontName}`;
  }
  return ''; // ช่วง SSR ให้ส่งค่าว่างไปก่อน เพราะเราปิด SSR ไว้ที่ page.tsx อยู่แล้ว
};

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: getFontPath('Sarabun-Regular.ttf'), fontWeight: 'normal' },
    { src: getFontPath('Sarabun-Bold.ttf'), fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Sarabun', // ✅ ใช้ชื่อที่ตั้งไว้ใน family
    backgroundColor: '#FFFFFF',
  },
  // ... (Styles อื่นๆ เหมือนเดิมที่เคยทำ)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E5E7EB',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    paddingBottom: 8,
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  }
});

export const InvoicePDF = ({ data }: { data: any }) => (
  <Document title={`Invoice-${data.id}`}>
    <Page size="A4" style={styles.page}>
      {/* --- ส่วนหัว --- */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>ตรอ. บังรีท่าอิฐ</Text>
          <Text style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>โทร. 095-841-0423 | ท่าอิฐ นนทบุรี</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={{ fontSize: 10, color: '#6B7280' }}>#{data.id}</Text>
        </View>
      </View>

      {/* --- ข้อมูลลูกค้าและรถ --- */}
      <View style={{ flexDirection: 'row', gap: 20, marginBottom: 30 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 'bold' }}>ลูกค้า</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', marginTop: 5 }}>{data.customer.name}</Text>
          <Text style={{ fontSize: 10, color: '#6B7280' }}>{data.customer.phone}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 }}>
          <Text style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 'bold' }}>ข้อมูลรถยนต์</Text>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 4 }}>{data.vehicle.licensePlate}</Text>
          <Text style={{ fontSize: 10, color: '#6B7280' }}>{data.vehicle.province}</Text>
        </View>
      </View>

      {/* --- ตารางรายการ --- */}
      <View style={styles.tableHeader}>
        <Text style={{ flex: 4, fontSize: 10, fontWeight: 'bold' }}>รายการ</Text>
        <Text style={{ flex: 1, textAlign: 'right', fontSize: 10, fontWeight: 'bold' }}>จำนวนเงิน</Text>
      </View>

      {data.items.map((item: any) => (
        <View key={item.id} style={styles.tableRow}>
          <Text style={{ flex: 4, fontSize: 10 }}>{item.description}</Text>
          <Text style={{ flex: 1, textAlign: 'right', fontSize: 10 }}>
            {item.price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      ))}

      {/* --- ยอดรวม --- */}
      <View style={{ marginTop: 40, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <View style={{ width: 160 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>ยอดรวม</Text>
            <Text style={{ fontSize: 10 }}>{data.subtotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>ยอดสุทธิ</Text>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#10b981' }}>
              {data.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* เส้นขอบบาร์ด้านล่างมินิมอล */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#10b981' }} />
    </Page>
  </Document>
);