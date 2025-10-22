// ========================================
// Google Apps Script - Customer System
// ระบบจัดการข้อมูลลูกค้า + Cache
// ========================================

// ========== CONFIG ==========
const SHEET_ID = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
const SHEET_NAME_DATA = "data"; // Sheet ข้อมูลลูกค้า

// ========== CACHE CONFIG ==========
const CACHE_DURATION = 60 * 5; // 5 นาที
const CACHE_KEY_CUSTOMERS = 'all_customers_data';

// ========== HELPER FUNCTIONS ==========

/**
 * ดึงชีต data
 */
function getDataSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME_DATA);
  if (!sheet) throw new Error('ไม่พบชีต "data"');
  return sheet;
}

/**
 * Normalize หมายเลขทะเบียน
 */
function normalizePlate(str) {
  return String(str || '')
    .normalize('NFC')
    .replace(/\s+/g, '')
    .toUpperCase();
}

/**
 * แปลงวันที่ DD/MM/YYYY เป็น Date object
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    console.log('Parsing date:', dateStr);
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('Parsed DD/MM/YYYY:', dateObj);
      return dateObj;
    }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      console.log('Parsed YYYY-MM-DD:', dateObj);
      return dateObj;
    }
    else if (dateStr instanceof Date) {
      console.log('Already Date object:', dateStr);
      return dateStr;
    }
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

/**
 * ล้าง Customer Cache
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

// ========== API ENDPOINTS ==========

/**
 * GET: getAll=1 => คืนข้อมูลลูกค้าทั้งหมด (พร้อม Cache)
 * GET: check=1&plate=... => ค้นหาทะเบียนรถ
 */
function doGet_Customer(e) {
  try {
    const sheet = getDataSheet();

    // กรณี getAll=1
    if (e.parameter.getAll === '1') {
      const forceRefresh = e.parameter.refresh === '1';
      return getAllCustomersWithCache(sheet, forceRefresh);
    }

    // กรณีค้นหา plate
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

/**
 * POST: addCustomer, updateCustomer, deleteCustomer
 */
function doPost_Customer(e) {
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
 */
function addCustomer(data) {
  try {
    console.log('Adding customer:', data);
    const sheet = getDataSheet();
    
    // ตรวจสอบทะเบียนซ้ำ
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
    
    // เพิ่มสูตร
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
    console.log('Updating customer:', data);
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const sheetPlate = normalizePlate(allData[i][1]);
      const searchPlate = normalizePlate(data.originalLicensePlate);
      
      if (sheetPlate === searchPlate) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ตรวจสอบทะเบียนซ้ำ
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
    
    // อัปเดตสูตร
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
    console.log('Deleting customer:', data);
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      const sheetPlate = normalizePlate(allData[i][1]);
      const searchPlate = normalizePlate(data.licensePlate);
      
      if (sheetPlate === searchPlate) {
        targetRow = i + 1;
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.deleteRow(targetRow);
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

// ========== TESTING ==========

function testCustomerCache() {
  console.log('=== ทดสอบ Customer Cache ===');
  clearCustomerCache();
  const sheet = getDataSheet();
  
  const start1 = new Date().getTime();
  getAllCustomersWithCache(sheet, true);
  const end1 = new Date().getTime();
  console.log('ครั้งที่ 1 (ไม่มี cache):', end1 - start1, 'ms');
  
  const start2 = new Date().getTime();
  getAllCustomersWithCache(sheet, false);
  const end2 = new Date().getTime();
  console.log('ครั้งที่ 2 (มี cache):', end2 - start2, 'ms');
  
  if ((end2 - start2) > 0) {
    console.log('ความเร็วเพิ่มขึ้น:', Math.round((end1 - start1) / (end2 - start2)), 'เท่า');
  }
}


