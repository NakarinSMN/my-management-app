// ========================================
// Google Apps Script - Billing System
// ระบบจัดการข้อมูลบิล + Cache
// ========================================

// ========== CONFIG ==========
const SHEET_ID = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
const SHEET_NAME_BILLING = "billing"; // Sheet ข้อมูลบิล

// ========== CACHE CONFIG ==========
const CACHE_DURATION = 60 * 5; // 5 นาที
const CACHE_KEY_BILLING = 'all_billing_data';

// ========== HELPER FUNCTIONS ==========

/**
 * ดึงชีต billing
 */
function getBillingSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_BILLING);
  if (!sheet) throw new Error('ไม่พบชีต "billing"');
  return sheet;
}

/**
 * ล้าง Billing Cache
 */
function clearBillingCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_KEY_BILLING);
    console.log('🗑️ ล้าง Billing Cache แล้ว');
  } catch (error) {
    console.warn('⚠️ ไม่สามารถล้าง billing cache ได้:', error);
  }
}

// ========== API ENDPOINTS ==========

/**
 * GET: getBills=1 => คืนข้อมูลบิลทั้งหมด (พร้อม Cache)
 */
function doGet_Billing(e) {
  try {
    if (e.parameter.getBills === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      const billingSheet = getBillingSheet();
      return getAllBillsWithCache(billingSheet, forceRefresh);
    }

    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: 'Invalid request. Use ?getBills=1'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ⚡ ดึงข้อมูลบิลทั้งหมดพร้อม Cache
 */
function getAllBillsWithCache(sheet, forceRefresh = false) {
  try {
    const cache = CacheService.getScriptCache();
    
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY_BILLING);
      if (cached) {
        console.log('✅ ส่งข้อมูลบิลจาก Cache');
        return ContentService.createTextOutput(cached)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('🔄 ดึงข้อมูลบิลจาก Sheet');
    
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        if (row[i] instanceof Date) {
          obj[h] = Utilities.formatDate(row[i], 'Asia/Bangkok', 'dd/MM/yyyy');
        } else {
          obj[h] = row[i];
        }
      });
      return obj;
    });

    const result = JSON.stringify({
      result: 'success',
      data: data,
      cached: false,
      timestamp: new Date().toISOString(),
      count: data.length
    });
    
    try {
      cache.put(CACHE_KEY_BILLING, result, CACHE_DURATION);
      console.log('💾 บันทึกข้อมูลบิลลง Cache (', data.length, 'รายการ)');
    } catch (cacheError) {
      console.warn('⚠️ ไม่สามารถบันทึก billing cache:', cacheError);
    }

    return ContentService
      .createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in getAllBillsWithCache:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: addBill, updateBill, deleteBill
 */
function doPost_Billing(e) {
  try {
    let data;
    
    if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const action = data.action;
    
    if (!action) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No action specified'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'addBill') {
      return addBill(data);
    } else if (action === 'updateBill') {
      return updateBill(data);
    } else if (action === 'deleteBill') {
      return deleteBill(data);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'Invalid action: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doPost_Billing:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * เพิ่มบิล
 */
function addBill(data) {
  try {
    console.log('Adding bill:', data);
    const sheet = getBillingSheet();
    
    // ตรวจสอบเลขที่บิลซ้ำ
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === data.billNumber) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'เลขที่บิลนี้มีอยู่แล้วในระบบ'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // แปลงวันที่
    let dateObj = null;
    if (data.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        dateObj = new Date(data.date);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(data.date)) {
        const [day, month, year] = data.date.split('/');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    const newRow = [
      data.billNumber || '',
      data.customerName || '',
      data.service || '',
      data.category || '',
      parseFloat(data.price) || 0,
      dateObj || new Date(),
      data.phone || '',
      data.status || 'รอดำเนินการ',
      data.items || ''
    ];
    
    sheet.appendRow(newRow);
    clearBillingCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'เพิ่มบิลสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in addBill:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * แก้ไขบิล
 */
function updateBill(data) {
  try {
    console.log('Updating bill:', data);
    const sheet = getBillingSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.billNumber) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบบิลที่ต้องการแก้ไข'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // แปลงวันที่
    let dateObj = allData[targetRow-1][5];
    if (data.date) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
        dateObj = new Date(data.date);
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(data.date)) {
        const [day, month, year] = data.date.split('/');
        dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    const updateRow = [
      data.billNumber || '',
      data.customerName || '',
      data.service || '',
      data.category || '',
      parseFloat(data.price) || 0,
      dateObj,
      data.phone || '',
      data.status || 'รอดำเนินการ',
      data.items || ''
    ];
    
    sheet.getRange(targetRow, 1, 1, 9).setValues([updateRow]);
    clearBillingCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'แก้ไขบิลสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in updateBill:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ลบบิล
 */
function deleteBill(data) {
  try {
    console.log('Deleting bill:', data);
    const sheet = getBillingSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.billNumber) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบบิลที่ต้องการลบ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.deleteRow(targetRow);
    clearBillingCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'ลบบิลสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in deleteBill:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== TESTING ==========

function testBillingCache() {
  console.log('=== ทดสอบ Billing Cache ===');
  clearBillingCache();
  const sheet = getBillingSheet();
  
  const start1 = new Date().getTime();
  getAllBillsWithCache(sheet, true);
  const end1 = new Date().getTime();
  console.log('ครั้งที่ 1 (ไม่มี cache):', end1 - start1, 'ms');
  
  const start2 = new Date().getTime();
  getAllBillsWithCache(sheet, false);
  const end2 = new Date().getTime();
  console.log('ครั้งที่ 2 (มี cache):', end2 - start2, 'ms');
  
  if ((end2 - start2) > 0) {
    console.log('ความเร็วเพิ่มขึ้น:', Math.round((end1 - start1) / (end2 - start2)), 'เท่า');
  }
}


