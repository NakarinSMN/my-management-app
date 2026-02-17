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
  billContainer: { height: '50%', padding: 25, position: 'relative' },
  header: { flexDirection: 'row', marginBottom: 10, borderBottomWidth: 2, borderBottomColor: '#10b981', paddingBottom: 8 },
  logo: { width: 50, height: 50, marginRight: 12 },
  headerInfo: { flex: 1 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#10b981' },
  addressText: { fontSize: 8, color: '#374151', marginTop: 1, lineHeight: 1.2 },
  titleSection: { textAlign: 'right', justifyContent: 'center' },
  invoiceTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  copyLabel: { fontSize: 9, fontWeight: 'bold', color: '#6B7280' },
  topGrid: { flexDirection: 'row', gap: 15, marginBottom: 10 },
  infoBox: { flex: 1.5 },
  vehicleBox: { flex: 1 },
  label: { fontSize: 7, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 2 },
  card: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#F3F4F6', flexDirection: 'row', justifyContent: 'space-between' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#111827', padding: 6, borderRadius: 4 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  
  // ✅ ปรับสัดส่วนใหม่ให้กว้างพอสำหรับ "จำนวนเงิน (บาท)"
  colDesc: { flex: 3.2, fontSize: 9 }, 
  colPrice: { flex: 1.8, textAlign: 'right', fontSize: 9 },

  summaryWrapper: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 },
  totalPrice: { fontSize: 20, fontWeight: 'bold', color: '#10b981' },
  divider: { position: 'absolute', bottom: 0, left: 20, right: 20, borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderStyle: 'dashed' },
  cutMark: { position: 'absolute', bottom: -6, left: '46%', fontSize: 10, color: '#9CA3AF', backgroundColor: '#FFFFFF', paddingHorizontal: 8 }
});

const BillContent = ({ data, type }: { data: any, type: string }) => (
  <View style={styles.billContainer}>
    <View style={styles.header}>
      <Image src={`${baseUrl}/ToRoOo.png`} style={styles.logo} />
      <View style={styles.headerInfo}>
        <Text style={styles.companyName}>สถานตรวจสภาพรถเอกชน บังรี ท่าอิฐ</Text>
        <Text style={styles.addressText}>เลขที่ 91/130 หมู่ 5 ต.บางรักน้อย อ.เมืองนนทบุรี จ.นนทบุรี 11000</Text>
        <Text style={styles.addressText}>โทร 065-893-3571, 089-013-3571 | TAX ID: 3-1204-00299-64-3</Text>
      </View>
      <View style={styles.titleSection}>
        <Text style={styles.invoiceTitle}>ใบเสร็จรับเงิน</Text>
        <Text style={styles.copyLabel}>{type === 'original' ? 'ต้นฉบับ / ORIGINAL' : 'สำเนา / COPY'}</Text>
        <Text style={{ fontSize: 7, color: '#9CA3AF', marginTop: 2 }}>เลขที่: {data.id} | วันที่: {data.date}</Text>
      </View>
    </View>

    <View style={styles.topGrid}>
      <View style={styles.infoBox}>
        <Text style={styles.label}>ข้อมูลลูกค้า / ผู้เสียภาษี</Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>
          {data.customer.name || '-'} {data.customer.type === 'company' && ` (${data.customer.branch || 'สำนักงานใหญ่'})`}
        </Text>
        <Text style={{ fontSize: 8, color: '#374151', marginTop: 2 }}>
          เลขประจำตัวผู้เสียภาษี: {data.customer.taxId || '-'} | โทร: {data.customer.phone || '-'}
        </Text>
        <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 1, lineHeight: 1.3 }}>
          ที่อยู่: {data.customer.addressDetail} {data.customer.subdistrict} {data.customer.district} {data.customer.province} {data.customer.zipcode}
        </Text>
      </View>
      <View style={styles.vehicleBox}>
        <Text style={styles.label}>ข้อมูลรถยนต์</Text>
        <View style={styles.card}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.vehicle.licensePlate || '-'}</Text>
            <Text style={{ fontSize: 7, color: '#6B7280' }}>{data.vehicle.province}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{data.vehicle.brand}</Text>
            <Text style={{ fontSize: 7, color: '#6B7280' }}>{data.vehicle.model}</Text>
          </View>
        </View>
      </View>
    </View>

    <View style={styles.tableHeader}>
      <Text style={[styles.colDesc, styles.tableHeaderText, { paddingLeft: 5 }]}>รายการ (DESCRIPTION)</Text>
      <Text style={[styles.colPrice, styles.tableHeaderText, { paddingRight: 5 }]}>จำนวนเงิน (บาท)</Text>
    </View>
    {data.items.map((item: any) => (
      <View key={item.id} style={styles.tableRow}>
        <Text style={[styles.colDesc, { paddingLeft: 5 }]}>{item.description || '-'}</Text>
        <Text style={[styles.colPrice, { paddingRight: 5 }]}>
          {Number(item.price).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </Text>
      </View>
    ))}

    <View style={styles.summaryWrapper}>
      <Text style={{ fontSize: 7, color: '#9CA3AF' }}>* ใบเสร็จรับเงินนี้จะสมบูรณ์เมื่อชำระเงินเรียบร้อยแล้ว</Text>
      <View style={{ width: 140 }}>
        {data.discount > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={{ fontSize: 8, color: '#EF4444' }}>ส่วนลด/ปัดเศษ</Text>
            <Text style={{ fontSize: 8, color: '#EF4444' }}>-{data.discount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
          </View>
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: 4 }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold' }}>ยอดสุทธิ</Text>
          <Text style={styles.totalPrice}>{data.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
        </View>
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
  <Document title={`Invoice-${data.id}`}>
    <Page size="A4" style={styles.page}>
      <BillContent data={data} type="original" />
      <BillContent data={data} type="copy" />
    </Page>
  </Document>
);