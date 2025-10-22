// ========================================
// Google Apps Script - Main Combined System
// รวมทุกระบบไว้ในไฟล์เดียว (สำหรับ Deploy)
// ========================================

// ========== CONFIG ==========
const SHEET_ID = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
const ACCESS_TOKEN = '7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU';

const SHEET_NAME_DATA = "data";        // ข้อมูลลูกค้า
const SHEET_NAME_BILLING = "billing";  // ข้อมูลบิล
const SHEET_NAME_FILTER = "sentnotify"; // การแจ้งเตือน

// ========== CACHE CONFIG ==========
const CACHE_DURATION = 60 * 5; // 5 นาที
const CACHE_KEY_CUSTOMERS = 'all_customers_data';
const CACHE_KEY_BILLING = 'all_billing_data';

// ========================================
// MAIN ROUTING FUNCTIONS
// ========================================

/**
 * GET: รับคำขอ HTTP GET
 * - ?getAll=1 => ข้อมูลลูกค้า
 * - ?getBills=1 => ข้อมูลบิล
 * - ?check=1&plate=xxx => ค้นหาทะเบียน
 */
function doGet(e) {
  try {
    // ระบบบิล
    if (e.parameter.getBills === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      const billingSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_BILLING);
      if (!billingSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ไม่พบ Sheet "billing"'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return getAllBillsWithCache(billingSheet, forceRefresh);
    }

    // ระบบลูกค้า
    const sheet = getDataSheet();

    if (e.parameter.getAll === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      return getAllCustomersWithCache(sheet, forceRefresh);
    }

    // ค้นหาทะเบียน
    const rawPlate = e.parameter.plate || '';
    const plateParam = normalizePlate(rawPlate);
    const isCheck = e.parameter.check === '1';

    if (!isCheck || !plateParam) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: true, message: 'Invalid request' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const rows = sheet.getDataRange().getValues();
    let foundIdx = -1;

    for (let i = 1; i < rows.length; i++) {
      const cell = normalizePlate(rows[i][1]);
      if (cell === plateParam) {
        foundIdx = i;
        break;
      }
    }

    if (foundIdx >= 1) {
      const r = rows[foundIdx];
      const data = {
        licensePlate: String(r[1] || ''),
        brand: String(r[2] || ''),
        customerName: String(r[3] || ''),
        phone: String(r[4] || ''),
        registerDate: r[5]
          ? Utilities.formatDate(new Date(r[5]), 'Asia/Bangkok', 'dd/MM/yyyy')
          : '',
        note: String(r[6] || ''),
        userId: String(r[7] || ''),
        day: Number(r[8]) || 365,
      };

      return ContentService
        .createTextOutput(JSON.stringify({ exists: true, data }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ exists: false }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: true, message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST: รับคำขอ HTTP POST
 * - action: addCustomer, updateCustomer, deleteCustomer
 * - action: addBill, updateBill, deleteBill
 */
function doPost(e) {
  try {
    let data;
    
    if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
      console.log('Processing as JSON');
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      console.log('Processing as FormData');
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
    
    // Customer actions
    if (action === 'addCustomer') {
      return addCustomer(data);
    } else if (action === 'updateCustomer') {
      return updateCustomer(data);
    } else if (action === 'deleteCustomer') {
      return deleteCustomer(data);
    }
    // Billing actions
    else if (action === 'addBill') {
      return addBill(data);
    } else if (action === 'updateBill') {
      return updateBill(data);
    } else if (action === 'deleteBill') {
      return deleteBill(data);
    }
    else {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'Invalid action: ' + action
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: 'Server error: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// HELPER FUNCTIONS (ใช้ร่วมกัน)
// ========================================

function getDataSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_DATA);
  if (!sheet) throw new Error('ไม่พบชีต "data"');
  return sheet;
}

function normalizePlate(str) {
  return String(str || '')
    .normalize('NFC')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    else if (dateStr instanceof Date) {
      return dateStr;
    }
    else {
      return new Date(dateStr);
    }
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

function clearCustomerCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_KEY_CUSTOMERS);
    console.log('🗑️ ล้าง Customer Cache แล้ว');
  } catch (error) {
    console.warn('⚠️ ไม่สามารถล้าง customer cache:', error);
  }
}

function clearBillingCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_KEY_BILLING);
    console.log('🗑️ ล้าง Billing Cache แล้ว');
  } catch (error) {
    console.warn('⚠️ ไม่สามารถล้าง billing cache:', error);
  }
}

function clearAllCache() {
  clearCustomerCache();
  clearBillingCache();
}

// ========================================
// CUSTOMER SYSTEM (ระบบลูกค้า)
// ========================================

function getAllCustomersWithCache(sheet, forceRefresh = false) {
  try {
    const cache = CacheService.getScriptCache();
    
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY_CUSTOMERS);
      if (cached) {
        console.log('✅ ส่งข้อมูลลูกค้าจาก Cache');
        return ContentService.createTextOutput(cached)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('🔄 ดึงข้อมูลลูกค้าจาก Sheet');
    
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
      cache.put(CACHE_KEY_CUSTOMERS, result, CACHE_DURATION);
      console.log('💾 บันทึกข้อมูลลูกค้าลง Cache (', data.length, 'รายการ)');
    } catch (cacheError) {
      console.warn('⚠️ ไม่สามารถบันทึก customer cache:', cacheError);
    }

    return ContentService
      .createTextOutput(result)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in getAllCustomersWithCache:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addCustomer(data) {
  try {
    const sheet = getDataSheet();
    
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (normalizePlate(existingData[i][1]) === normalizePlate(data.licensePlate)) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ทะเบียนรถนี้มีอยู่แล้วในระบบ'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    const dateObj = parseDate(data.registerDate);
    
    const newRow = [
      new Date(),
      data.licensePlate || '',
      data.brand || '',
      data.customerName || '',
      data.phone || '',
      dateObj || '',
      data.note || '',
      '',
      365
    ];
    
    const lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1, 1, 9).setValues([newRow]);
    
    sheet.getRange(lastRow, 10).setFormula(
      `=IF(F${lastRow}<>"", DATEVALUE(F${lastRow})+I${lastRow},"")`
    );
    sheet.getRange(lastRow, 11).setFormula(
      `=IF(J${lastRow}<>"",LET(gap,J${lastRow}-TODAY(),
         IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",
         IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")`
    );
    
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateCustomer(data) {
  try {
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (normalizePlate(allData[i][1]) === normalizePlate(data.originalLicensePlate)) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้า'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const dateObj = parseDate(data.registerDate);
    
    const updateRow = [
      allData[targetRow-1][0],
      data.licensePlate || '',
      data.brand || '',
      data.customerName || '',
      data.phone || '',
      dateObj || allData[targetRow-1][5],
      data.note || '',
      allData[targetRow-1][7] || '',
      allData[targetRow-1][8] || 365
    ];
    
    sheet.getRange(targetRow, 1, 1, 9).setValues([updateRow]);
    
    sheet.getRange(targetRow, 10).setFormula(
      `=IF(F${targetRow}<>"", DATEVALUE(F${targetRow})+I${targetRow},"")`
    );
    sheet.getRange(targetRow, 11).setFormula(
      `=IF(J${targetRow}<>"",LET(gap,J${targetRow}-TODAY(),
         IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",
         IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")`
    );
    
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteCustomer(data) {
  try {
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (normalizePlate(allData[i][1]) === normalizePlate(data.licensePlate)) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้า'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.deleteRow(targetRow);
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'ลบข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// BILLING SYSTEM (ระบบบิล)
// ========================================

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

function addBill(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_BILLING);
    if (!sheet) throw new Error('ไม่พบ Sheet "billing"');
    
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
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function updateBill(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_BILLING);
    if (!sheet) throw new Error('ไม่พบ Sheet "billing"');
    
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
        message: 'ไม่พบบิล'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    let dateObj = allData[targetRow-1][5];
    if (data.date) {
      dateObj = parseDate(data.date);
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
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function deleteBill(data) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_BILLING);
    if (!sheet) throw new Error('ไม่พบ Sheet "billing"');
    
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
        message: 'ไม่พบบิล'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.deleteRow(targetRow);
    clearBillingCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'ลบบิลสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========================================
// LINE NOTIFY SYSTEM (ระบบแจ้งเตือน)
// ========================================

function sendLineMessage(token, recipientId, text) {
  const payload = JSON.stringify({
    to: recipientId,
    messages: [{ type: 'text', text }]
  });

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + token
    },
    payload
  };

  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
    return true;
  } catch (error) {
    console.error('Error sending LINE:', error);
    return false;
  }
}

function sendAlert() {
  const filterSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_FILTER);
  const dataSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_DATA);
  const filterLastRow = filterSheet.getLastRow();

  if (filterLastRow < 2) {
    Logger.log("ไม่มีรายการต้องแจ้งเตือน");
    return;
  }

  const filterValues = filterSheet.getRange("B2:L" + filterLastRow).getValues();
  let sentCount = 0;

  filterValues.forEach((row) => {
    const licensePlate = row[1];
    const nextDueDate = row[9];
    const userId = row[7];
    const status = row[10];

    const notifyStatus = getNotifyStatus(dataSheet, licensePlate);
    if (notifyStatus === "แจ้งแล้ว") {
      return;
    }

    if (userId && status === "กำลังจะครบกำหนด") {
      const message = `แจ้งเตือน: ใกล้ถึงกำหนดต่อภาษีรถยนต์/รถจักรยานยนต์แล้ว!\n\n` +
        `ทะเบียน: ${licensePlate}\n` +
        `ครบกำหนด: ${formatDate(nextDueDate)}\n\n` +
        `ท่านสามารถต่อภาษีล่วงหน้าได้ 3 เดือน`;

      const sent = sendLineMessage(ACCESS_TOKEN, userId, message);
      
      if (sent) {
        updateNotifyStatus(dataSheet, licensePlate, "แจ้งแล้ว");
        sentCount++;
      }
    }
  });
  
  Logger.log(`✅ ส่งการแจ้งเตือนทั้งหมด ${sentCount} รายการ`);
  return sentCount;
}

function getNotifyStatus(sheet, licensePlate) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) {
      return data[i][11];
    }
  }
  return "";
}

function updateNotifyStatus(sheet, licensePlate, newStatus) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) {
      sheet.getRange(i + 2, 12).setValue(newStatus);
      break;
    }
  }
}

function formatDate(cell) {
  if (Object.prototype.toString.call(cell) === '[object Date]' && !isNaN(cell)) {
    return Utilities.formatDate(cell, "Asia/Bangkok", "dd/MM/yyyy");
  }
  return cell;
}

// ========================================
// TESTING FUNCTIONS
// ========================================

function testCache() {
  console.log('=== ทดสอบ Cache ===');
  clearAllCache();
  
  const sheet = getDataSheet();
  const start1 = new Date().getTime();
  getAllCustomersWithCache(sheet, true);
  const end1 = new Date().getTime();
  
  const start2 = new Date().getTime();
  getAllCustomersWithCache(sheet, false);
  const end2 = new Date().getTime();
  
  console.log('ไม่มี cache:', end1 - start1, 'ms');
  console.log('มี cache:', end2 - start2, 'ms');
  if ((end2 - start2) > 0) {
    console.log('เร็วขึ้น:', Math.round((end1 - start1) / (end2 - start2)), 'เท่า');
  }
}


