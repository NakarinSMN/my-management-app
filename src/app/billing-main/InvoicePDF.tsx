import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';

const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: `${baseUrl}/fonts/Sarabun-Regular.ttf`, fontWeight: 'normal' },
    { src: `${baseUrl}/fonts/Sarabun-Bold.ttf`, fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 0, fontFamily: 'Sarabun', backgroundColor: '#FFFFFF' },
  billContainer: { height: '50%', padding: '20 30', position: 'relative' },
  
  // Header Section
  headerRow: { 
    flexDirection: 'row', 
    borderBottom: '2pt solid #10b981', 
    paddingBottom: 10,
    marginBottom: 15,
    minHeight: 65,
    alignItems: 'flex-start'
  },
  headerLeft: { flex: 2 },
  headerRight: { flex: 1, alignItems: 'flex-end', paddingTop: 5 },
  
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 50, height: 50, marginRight: 10 },
  companyName: { fontSize: 14, fontWeight: 'bold', color: '#10b981' },
  addressText: { fontSize: 8, color: '#4B5563', marginTop: 1, lineHeight: 1.2 },
  
  invoiceTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  copyLabel: { fontSize: 9, fontWeight: 'bold', color: '#6B7280' },
  billMeta: { fontSize: 8.5, color: '#4B5563', marginTop: 12 },

  // Info Section
  topGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoBox: { 
    flex: 1.6, 
    backgroundColor: '#F9FAFB', 
    padding: 8, 
    borderRadius: 4, 
    border: '0.5pt solid #E5E7EB',
    height: 90 // ขยายความสูงเพิ่มนิดหน่อยเพื่อให้ที่อยู่ตัดบรรทัดได้พอดี
  },
  vehicleBox: { 
    flex: 1, 
    backgroundColor: '#F0FDF4', 
    padding: 8, 
    borderRadius: 4, 
    border: '0.5pt solid #BBF7D0',
    height: 90
  },
  label: { fontSize: 7, color: '#6B7280', fontWeight: 'bold', marginBottom: 3 },
  valueText: { fontSize: 10, color: '#111827', fontWeight: 'bold' },
  subText: { fontSize: 8.5, color: '#4B5563', lineHeight: 1.3 },

  // Table Section
  tableContainer: { border: '0.5pt solid #E5E7EB', borderRadius: 4, overflow: 'hidden', minHeight: 130 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1F2937', padding: '5 8' },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottom: '0.5pt solid #F3F4F6', padding: '6 8', alignItems: 'center' },
  
  colDesc: { flex: 5, fontSize: 9.5 }, 
  colPrice: { flex: 1.5, textAlign: 'right', fontSize: 9.5, fontWeight: 'bold' },

  // Summary Section
  summaryContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  summaryTable: { width: 150 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  summaryLabel: { fontSize: 9, color: '#4B5563' },
  summaryValue: { fontSize: 9, color: '#111827', textAlign: 'right', fontWeight: 'bold' },
  totalRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 4, 
    paddingTop: 4, 
    borderTop: '1pt solid #E5E7EB' 
  },
  totalPrice: { fontSize: 16, fontWeight: 'bold', color: '#10b981' },

  // Signature Section
  bottomSection: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 15,
    alignItems: 'flex-end' 
  },
  signatureBox: { alignItems: 'center', width: 140 },
  signatureLine: { width: '100%', borderBottom: '0.5pt solid #374151', marginBottom: 4, marginTop: 15 },
  footerNote: { fontSize: 7, color: '#9CA3AF' },
  
  divider: { position: 'absolute', bottom: 0, left: 20, right: 20, borderBottom: '1pt dashed #D1D5DB' },
  cutMark: { position: 'absolute', bottom: -5, left: '46%', fontSize: 9, color: '#9CA3AF', backgroundColor: '#FFFFFF', padding: '0 10' }
});

const BillContent = ({ data, type }: { data: any, type: string }) => (
  <View style={styles.billContainer}>
    {/* Header */}
    <View style={styles.headerRow}>
      <View style={styles.headerLeft}>
        <View style={styles.logoRow}>
          <Image src={`${baseUrl}/ToRoOo.png`} style={styles.logo} />
          <View>
            <Text style={styles.companyName}>สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ</Text>
            <Text style={styles.addressText}>91/130 หมู่ 5 ต.บางรักน้อย อ.เมืองนนทบุรี จ.นนทบุรี 11000</Text>
            <Text style={styles.addressText}>โทร: 065-893-3571, 089-013-3571 | Tax ID: 3-1204-00299-64-3</Text>
          </View>
        </View>
      </View>
      <View style={styles.headerRight}>
        <Text style={styles.invoiceTitle}>ใบเสร็จรับเงิน</Text>
        <Text style={styles.copyLabel}>{type === 'original' ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY'}</Text>
        <Text style={styles.billMeta}>เลขที่: {data.id} | วันที่: {data.date}</Text>
      </View>
    </View>

    {/* Info Grid */}
    <View style={styles.topGrid}>
      <View style={styles.infoBox}>
        <Text style={styles.label}>ลูกค้า / Customer</Text>
        <Text style={styles.valueText}>{data.customer.name || '-'}</Text>
        <Text style={styles.subText}>เลขประจำตัว: {data.customer.taxId || '-'}</Text>
        <Text style={[styles.subText, { fontSize: 8 }]}>โทร: {data.customer.phone || '-'}</Text>
        {/* ✅ แก้ไข: นำ numberOfLines ออก เพื่อให้ Build ผ่าน และใช้ความสูงของ Box คุมแทน */}
        <Text style={[styles.subText, { fontSize: 7.5, marginTop: 2, maxHeight: 25, overflow: 'hidden' }]}>
          ที่อยู่: {data.customer.addressDetail} {data.customer.subdistrict} {data.customer.district} {data.customer.province} {data.customer.zipcode}
        </Text>
      </View>
      <View style={styles.vehicleBox}>
        <Text style={styles.label}>ข้อมูลรถ / Vehicle</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
          <View>
            <Text style={[styles.valueText, { fontSize: 12 }]}>{data.vehicle.licensePlate || '-'}</Text>
            <Text style={styles.subText}>{data.vehicle.province}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={styles.valueText}>{data.vehicle.brand}</Text>
             <Text style={styles.subText}>{data.vehicle.model}</Text>
          </View>
        </View>
      </View>
    </View>

    {/* Table */}
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={[styles.colDesc, styles.tableHeaderText]}>รายการ (Description)</Text>
        <Text style={[styles.colPrice, styles.tableHeaderText]}>จำนวนเงิน (Amount)</Text>
      </View>
      {data.items.map((item: any, index: number) => (
        <View key={index} style={styles.tableRow}>
          {/* ✅ แก้ไข: นำ numberOfLines ออก และใช้ flex/overflow แทน */}
          <Text style={[styles.colDesc, { maxHeight: 15, overflow: 'hidden' }]}>{item.description || '-'}</Text>
          <Text style={styles.colPrice}>
            {Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      ))}
    </View>

    {/* Summary */}
    <View style={styles.summaryContainer}>
      <View style={styles.summaryTable}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>รวมเป็นเงิน</Text>
          <Text style={styles.summaryValue}>{Number(data.subtotal).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
        </View>
        {Number(data.rounding) !== 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>ปัดเศษ / ส่วนต่าง</Text>
            <Text style={[styles.summaryValue, { color: Number(data.rounding) < 0 ? '#EF4444' : '#10B981' }]}>
              {Number(data.rounding) > 0 ? '+' : ''}{Number(data.rounding).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#111827' }]}>ยอดสุทธิ</Text>
          <Text style={styles.totalPrice}>{Number(data.total).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>
    </View>

    {/* Bottom Section */}
    <View style={styles.bottomSection}>
      <View>
        <Text style={{ fontSize: 9 }}>วันนัดรับรถ: ...................................................</Text>
        <Text style={{ fontSize: 9, marginTop: 5 }}>เวลา: ..........................................................</Text>
        <Text style={styles.footerNote}>* เอกสารนี้พิมพ์จากระบบคอมพิวเตอร์</Text>
      </View>
      <View style={styles.signatureBox}>
        <View style={styles.signatureLine} />
        <Text style={{ fontSize: 9 }}>ผู้รับเงิน</Text>
        <Text style={{ fontSize: 7, color: '#9CA3AF', marginTop: 2 }}>(..................................................)</Text>
      </View>
    </View>

    {type === 'original' && (
      <View style={styles.divider}>
        <Text style={styles.cutMark}>✂--------------------------------------</Text>
      </View>
    )}
  </View>
);

export const InvoicePDF = ({ data }: { data: any }) => (
  <Document title={`INV-${data.id}`}>
    <Page size="A4" style={styles.page}>
      <BillContent data={data} type="original" />
      <BillContent data={data} type="copy" />
    </Page>
  </Document>
);