// Google Apps Script สำหรับจัดการข้อมูลลูกค้า (แก้ไข timezone และวันที่ + CACHE SYSTEM)
// วางโค้ดนี้ใน Google Apps Script Editor

// ========== CONFIG ==========
const sheetid = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
var accessToken = '7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU';
const ssFilter = "sentnotify";
const ssData = "data";
const ssBilling = "billing"; // Sheet สำหรับบิล

// ========== CACHE CONFIG ==========
const CACHE_DURATION = 60 * 5; // 5 นาที (หน่วยเป็นวินาที)
const CACHE_KEY_CUSTOMERS = 'all_customers_data';
const CACHE_KEY_BILLING = 'all_billing_data';

// ========== CACHE FUNCTIONS ==========
/**
 * ล้าง Cache ทั้งหมด
 */
function clearCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_KEY_CUSTOMERS);
    cache.remove(CACHE_KEY_BILLING);
    console.log('🗑️ ล้าง Cache ทั้งหมดแล้ว');
  } catch (error) {
    console.warn('⚠️ ไม่สามารถล้าง cache ได้:', error);
  }
}

/**
 * ล้าง Cache ของลูกค้า
 */
function clearCustomerCache() {
  try {
    const cache = CacheService.getScriptCache();
    cache.remove(CACHE_KEY_CUSTOMERS);
    console.log('🗑️ ล้าง Customer Cache แล้ว');
  } catch (error) {
    console.warn('⚠️ ไม่สามารถล้าง customer cache ได้:', error);
  }
}

/**
 * ล้าง Cache ของบิล
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

// ========== LINE NOTIFY FUNCTIONS ==========

function sendAlert() {
  const filterSheet = SpreadsheetApp.openById(sheetid).getSheetByName(ssFilter);
  const dataSheet = SpreadsheetApp.openById(sheetid).getSheetByName(ssData);
  const filterLastRow = filterSheet.getLastRow();

  if (filterLastRow < 2) {
    Logger.log("ไม่มีรายการต้องแจ้งเตือน");
    return;
  }

  const filterValues = filterSheet.getRange("B2:L" + filterLastRow).getValues();

  filterValues.forEach((row) => {
    const licensePlate = row[1]; // B - ทะเบียนรถ
    const lastPaidDate = row[5]; // F
    const nextDueDate = row[9];  // J
    const userId = row[7];       // H
    const status = row[10];      // K

    // ✅ ตรวจสอบสถานะการเตือนในชีต data (คอลัมน์ L)
    const notifyStatus = getNotifyStatus(dataSheet, licensePlate);
    if (notifyStatus === "แจ้งแล้ว") {
      Logger.log(`ข้าม ${licensePlate} (สถานะการเตือน: แจ้งแล้ว)`);
      return;
    }

    if (userId && status === "กำลังจะครบกำหนด") {
      const message = `แจ้งเตือน: ใกล้ถึงกำหนดต่อภาษีรถยนต์/รถจักรยานยนต์แล้ว!\n\n` +
        `ทะเบียน: ${licensePlate}\n` +
        `ครบกำหนด: ${formatDate(nextDueDate)}\n\n` +
        `ท่านสามารถต่อภาษีล่วงหน้าได้ 3 เดือน`;

      sendLineMessage(accessToken, userId, message);
      updateNotifyStatus(dataSheet, licensePlate, "แจ้งแล้ว");
      Logger.log(`ส่งแล้ว: ${licensePlate} → ${userId}`);
    }
  });
}

function getNotifyStatus(sheet, licensePlate) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues(); // รวมถึงคอลัมน์ L
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) { // B - ทะเบียนรถ
      return data[i][11]; // L = สถานะการเตือน
    }
  }
  return "";
}

function updateNotifyStatus(sheet, licensePlate, newStatus) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) {
      sheet.getRange(i + 2, 12).setValue(newStatus); // L = คอลัมน์ 12
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

  UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
}

function testInsert() {
  const sheet = SpreadsheetApp.openById(sheetid).getSheetByName(ssData);
  sheet.appendRow(['', 'TEST987', 'Brand', 'Name', '0800000000', '2025-12-31', 'Note here', 'TEST_USERID_123456', '', '', '']);
}

// ========== DATA FUNCTIONS ==========

/**
 * ดึงชีต data ใน Google Sheets
 */
function getDataSheet() {
  const ss = SpreadsheetApp.openById(sheetid);
  const sheet = ss.getSheetByName(ssData);
  if (!sheet) throw new Error('ไม่พบชีต "data"');
  return sheet;
}

/**
 * normalize หมายเลขทะเบียน:
 * - NFC normalization
 * - ลบ whitespace ทุกตัว
 * - uppercase
 */
function normalizePlate(str) {
  return String(str || '')
    .normalize('NFC')
    .replace(/\s+/g, '')
    .toUpperCase();
}

/**
 * แปลงวันที่จาก DD/MM/YYYY เป็น Date object (แก้ไข timezone)
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    console.log('Parsing date:', dateStr);
    
    // ถ้าเป็น DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      // สร้างวันที่ใน timezone ไทย
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('Parsed DD/MM/YYYY:', dateObj);
      return dateObj;
    }
    // ถ้าเป็น YYYY-MM-DD
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('Parsed YYYY-MM-DD:', dateObj);
      return dateObj;
    }
    // ถ้าเป็น Date object อยู่แล้ว
    else if (dateStr instanceof Date) {
      console.log('Already Date object:', dateStr);
      return dateStr;
    }
    // ลองแปลงเป็น Date
    else {
      const dateObj = new Date(dateStr);
      console.log('Parsed as Date:', dateObj);
      return dateObj;
    }
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

// ========== API ENDPOINTS ==========

/**
 * GET: check=1&plate=…  => คืน { exists, data? }
 * GET: getAll=1  => คืนข้อมูลลูกค้าทั้งหมด (พร้อม Cache)
 * GET: getBills=1  => คืนข้อมูลบิลทั้งหมด (พร้อม Cache)
 */
function doGet(e) {
  try {
    // ⚡ กรณี getBills=1 ให้ส่งข้อมูลบิลทั้งหมด (พร้อม Cache)
    if (e.parameter.getBills === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      const billingSheet = SpreadsheetApp.openById(sheetid).getSheetByName(ssBilling);
      if (!billingSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ไม่พบ Sheet "billing"'
        })).setMimeType(ContentService.MimeType.JSON);
      }
      return getAllBillsWithCache(billingSheet, forceRefresh);
    }

    const sheet = getDataSheet();

    // ⚡ กรณี getAll=1 ให้ส่งข้อมูลลูกค้าทั้งหมด (พร้อม Cache)
    if (e.parameter.getAll === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      return getAllCustomersWithCache(sheet, forceRefresh);
    }

    // ✅ กรณีค้นหา plate
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
 * ⚡ ดึงข้อมูลลูกค้าทั้งหมดพร้อม Cache
 */
function getAllCustomersWithCache(sheet, forceRefresh = false) {
  try {
    const cache = CacheService.getScriptCache();
    
    // ⚡ ตรวจสอบ cache ก่อน (ถ้าไม่ force refresh)
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY_CUSTOMERS);
      if (cached) {
        console.log('✅ ส่งข้อมูลลูกค้าจาก Cache');
        return ContentService.createTextOutput(cached)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('🔄 ดึงข้อมูลลูกค้าจาก Sheet (Cache miss หรือ force refresh)');
    
    // ดึงข้อมูลจาก Sheet
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        // แปลง Date object เป็น string ในรูปแบบ DD/MM/YYYY
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
    
    // ⚡ บันทึกลง cache
    try {
      cache.put(CACHE_KEY_CUSTOMERS, result, CACHE_DURATION);
      console.log('💾 บันทึกข้อมูลลูกค้าลง Cache แล้ว (', data.length, 'รายการ)');
    } catch (cacheError) {
      console.warn('⚠️ ไม่สามารถบันทึก customer cache ได้:', cacheError);
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

/**
 * ⚡ ดึงข้อมูลบิลทั้งหมดพร้อม Cache
 */
function getAllBillsWithCache(sheet, forceRefresh = false) {
  try {
    const cache = CacheService.getScriptCache();
    
    // ⚡ ตรวจสอบ cache ก่อน (ถ้าไม่ force refresh)
    if (!forceRefresh) {
      const cached = cache.get(CACHE_KEY_BILLING);
      if (cached) {
        console.log('✅ ส่งข้อมูลบิลจาก Cache');
        return ContentService.createTextOutput(cached)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('🔄 ดึงข้อมูลบิลจาก Sheet (Cache miss หรือ force refresh)');
    
    // ดึงข้อมูลจาก Sheet
    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        // แปลง Date object เป็น string ในรูปแบบ DD/MM/YYYY
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
    
    // ⚡ บันทึกลง cache
    try {
      cache.put(CACHE_KEY_BILLING, result, CACHE_DURATION);
      console.log('💾 บันทึกข้อมูลบิลลง Cache แล้ว (', data.length, 'รายการ)');
    } catch (cacheError) {
      console.warn('⚠️ ไม่สามารถบันทึก billing cache ได้:', cacheError);
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
 * POST: รองรับทั้ง JSON และ FormData
 */
function doPost(e) {
  try {
    console.log('=== DEBUG INFO ===');
    console.log('e.parameter:', e.parameter);
    console.log('e.postData:', e.postData);
    console.log('e.postData.type:', e.postData ? e.postData.type : 'undefined');
    console.log('e.postData.contents:', e.postData ? e.postData.contents : 'undefined');
    
    let data;
    
    // ตรวจสอบว่าเป็น JSON หรือ FormData
    if (e.postData && e.postData.type === 'application/json' && e.postData.contents) {
      console.log('Processing as JSON');
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      console.log('Processing as FormData');
      data = e.parameter;
    } else {
      console.log('No data received');
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Final data:', data);
    const action = data.action;
    
    if (!action) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'No action specified'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'addCustomer') {
      return addCustomer(data);
    } else if (action === 'updateCustomer') {
      return updateCustomer(data);
    } else if (action === 'deleteCustomer') {
      return deleteCustomer(data);
    } else {
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

/**
 * เพิ่มข้อมูลลูกค้า
 * โครงสร้างคอลัมน์:
 * A: timestamp, B: ทะเบียนรถ, C: ยี่ห้อ/รุ่น, D: ชื่อลูกค้า, E: เบอร์ติดต่อ,
 * F: วันที่ชำระภาษีล่าสุด, G: หมายเหตุ, H: userId, I: day (365)
 * J: สูตรครบกำหนด, K: สูตรสถานะ
 */
function addCustomer(data) {
  try {
    console.log('Adding customer:', data);
    const sheet = getDataSheet();
    
    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่ (คอลัมน์ B)
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (normalizePlate(existingData[i][1]) === normalizePlate(data.licensePlate)) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ทะเบียนรถนี้มีอยู่แล้วในระบบ'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // แปลงวันที่
    const dateObj = parseDate(data.registerDate);
    console.log('Parsed date for add:', dateObj);
    
    // เพิ่มข้อมูลใหม่ตามโครงสร้างคอลัมน์:
    // A=timestamp, B=licensePlate, C=brand, D=customerName, E=phone, 
    // F=registerDate, G=note, H=userId, I=day
    const newRow = [
      new Date(), // A: timestamp
      data.licensePlate || '', // B: ทะเบียนรถ
      data.brand || '', // C: ยี่ห้อ/รุ่น
      data.customerName || '', // D: ชื่อลูกค้า
      data.phone || '', // E: เบอร์ติดต่อ
      dateObj || '', // F: วันที่ชำระภาษีล่าสุด (Date object)
      data.note || '', // G: หมายเหตุ
      '', // H: userId (ว่างไว้)
      365 // I: day (default 365)
    ];
    
    console.log('Adding row:', newRow);
    const lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1, 1, 9).setValues([newRow]);
    
    // เพิ่มสูตรสำหรับคอลัมน์ J (ครบกำหนด) และ K (สถานะ)
    sheet.getRange(lastRow, 10).setFormula(
      `=IF(F${lastRow}<>"", DATEVALUE(F${lastRow})+I${lastRow},"")`
    );
    sheet.getRange(lastRow, 11).setFormula(
      `=IF(J${lastRow}<>"",LET(gap,J${lastRow}-TODAY(),
         IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",
         IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")`
    );
    
    // ⚡ ล้าง customer cache
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'เพิ่มข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in addCustomer:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * แก้ไขข้อมูลลูกค้า
 */
function updateCustomer(data) {
  try {
    console.log('=== UPDATE CUSTOMER ===');
    console.log('Updating customer:', data);
    console.log('originalLicensePlate:', data.originalLicensePlate);
    console.log('licensePlate:', data.licensePlate);
    
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    console.log('Total rows:', allData.length);
    console.log('Looking for originalLicensePlate:', data.originalLicensePlate);
    
    // หาแถวที่มีทะเบียนรถเดิม (normalize ทั้งสองฝั่ง) - คอลัมน์ B
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const sheetPlate = normalizePlate(allData[i][1]);
      const searchPlate = normalizePlate(data.originalLicensePlate);
      
      console.log(`Row ${i}: comparing "${sheetPlate}" with "${searchPlate}"`);
      
      if (sheetPlate === searchPlate) {
        targetRow = i + 1; // +1 เพราะ Google Sheets เริ่มจาก 1
        console.log('Found matching row:', targetRow);
        break;
      }
    }
    
    console.log('Final targetRow:', targetRow);
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ตรวจสอบว่าทะเบียนรถใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยนทะเบียน)
    if (normalizePlate(data.licensePlate) !== normalizePlate(data.originalLicensePlate)) {
      for (let i = 1; i < allData.length; i++) {
        if (normalizePlate(allData[i][1]) === normalizePlate(data.licensePlate) && (i + 1) !== targetRow) {
          return ContentService.createTextOutput(JSON.stringify({
            result: 'error',
            message: 'ทะเบียนรถใหม่นี้มีอยู่แล้วในระบบ'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // แปลงวันที่
    const dateObj = parseDate(data.registerDate);
    console.log('Parsed date for update:', dateObj);
    
    // อัปเดตข้อมูลตามโครงสร้างคอลัมน์:
    // A=timestamp (เก็บเดิม), B=licensePlate, C=brand, D=customerName, E=phone, 
    // F=registerDate, G=note, H=userId (เก็บเดิม), I=day (เก็บเดิม)
    const updateRow = [
      allData[targetRow-1][0], // A: เก็บ timestamp เดิม
      data.licensePlate || '', // B: ทะเบียนรถ
      data.brand || '', // C: ยี่ห้อ/รุ่น
      data.customerName || '', // D: ชื่อลูกค้า
      data.phone || '', // E: เบอร์ติดต่อ
      dateObj || allData[targetRow-1][5], // F: วันที่ชำระภาษีล่าสุด
      data.note || '', // G: หมายเหตุ
      allData[targetRow-1][7] || '', // H: เก็บ userId เดิม
      allData[targetRow-1][8] || 365 // I: เก็บ day เดิม
    ];
    
    console.log('Updating row', targetRow, 'with:', updateRow);
    sheet.getRange(targetRow, 1, 1, 9).setValues([updateRow]);
    
    // อัปเดตสูตรสำหรับคอลัมน์ J และ K
    sheet.getRange(targetRow, 10).setFormula(
      `=IF(F${targetRow}<>"", DATEVALUE(F${targetRow})+I${targetRow},"")`
    );
    sheet.getRange(targetRow, 11).setFormula(
      `=IF(J${targetRow}<>"",LET(gap,J${targetRow}-TODAY(),
         IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",
         IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")`
    );
    
    // ⚡ ล้าง customer cache
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'แก้ไขข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in updateCustomer:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ลบข้อมูลลูกค้า
 */
function deleteCustomer(data) {
  try {
    console.log('=== DELETE CUSTOMER ===');
    console.log('Deleting customer:', data);
    console.log('licensePlate:', data.licensePlate);
    
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    console.log('Total rows:', allData.length);
    console.log('Looking for licensePlate:', data.licensePlate);
    
    // หาแถวที่มีทะเบียนรถที่ต้องการลบ (normalize ทั้งสองฝั่ง) - คอลัมน์ B
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const sheetPlate = normalizePlate(allData[i][1]);
      const searchPlate = normalizePlate(data.licensePlate);
      
      console.log(`Row ${i}: comparing "${sheetPlate}" with "${searchPlate}"`);
      
      if (sheetPlate === searchPlate) {
        targetRow = i + 1; // +1 เพราะ Google Sheets เริ่มจาก 1
        console.log('Found matching row:', targetRow);
        break;
      }
    }
    
    console.log('Final targetRow:', targetRow);
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ลบแถว
    console.log('Deleting row:', targetRow);
    sheet.deleteRow(targetRow);
    
    // ⚡ ล้าง customer cache
    clearCustomerCache();
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      message: 'ลบข้อมูลลูกค้าสำเร็จ'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in deleteCustomer:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== TESTING FUNCTIONS ==========

/**
 * ⚡ ทดสอบ Cache
 */
function testCache() {
  console.log('=== ทดสอบ Cache ===');
  
  // ล้าง cache
  clearCache();
  console.log('1. ล้าง cache แล้ว');
  
  // เรียกครั้งที่ 1 (ไม่มี cache)
  console.log('2. เรียกครั้งที่ 1 (ไม่มี cache)');
  const sheet = getDataSheet();
  const start1 = new Date().getTime();
  getAllCustomersWithCache(sheet, true);
  const end1 = new Date().getTime();
  console.log('   เวลา:', end1 - start1, 'ms');
  
  // เรียกครั้งที่ 2 (มี cache)
  console.log('3. เรียกครั้งที่ 2 (มี cache)');
  const start2 = new Date().getTime();
  getAllCustomersWithCache(sheet, false);
  const end2 = new Date().getTime();
  console.log('   เวลา:', end2 - start2, 'ms');
  
  if ((end2 - start2) > 0) {
    console.log('4. ความเร็วเพิ่มขึ้น:', Math.round((end1 - start1) / (end2 - start2)), 'เท่า');
  } else {
    console.log('4. Cache ทำงานได้ดีมาก! (เร็วจนวัดไม่ได้)');
  }
}

/**
 * ทดสอบ LINE Notify
 */
function testLineNotify() {
  console.log('=== ทดสอบ LINE Notify ===');
  sendAlert();
  console.log('✅ ทดสอบการแจ้งเตือนเสร็จสิ้น');
}
