// Google Apps Script สำหรับจัดการข้อมูลลูกค้า (แก้ไข CORS และ FormData)
// วางโค้ดนี้ใน Google Apps Script Editor

const sheetid = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
var accessToken = '7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU';
const ssFilter = "sentnotify";
const ssData = "data";

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
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data')
  sheet.appendRow(['', 'TEST987', 'Brand', 'Name', '0800000000', '2025-12-31', 'Note here', 'TEST_USERID_123456', '', '', ''])
}

// ////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * ดึงชีต data ใน Google Sheets
 */
function getDataSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName('data')
  if (!sheet) throw new Error('ไม่พบชีต "data"')
  return sheet
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
    .toUpperCase()
}

/**
 * GET: check=1&plate=…  => คืน { exists, data? }
 */
function doGet(e) {
  try {
    const sheet = getDataSheet();

    // ✅ กรณี getAll=1 ให้ส่งข้อมูลทั้งหมด
    if (e.parameter.getAll === '1') {
      const rows = sheet.getDataRange().getValues();
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => {
          obj[h] = row[i];
        });
        return obj;
      });

      return ContentService
        .createTextOutput(JSON.stringify({ data }))
        .setMimeType(ContentService.MimeType.JSON);
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
          ? Utilities.formatDate(new Date(r[5]), Session.getScriptTimeZone(), 'yyyy-MM-dd')
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

function addCustomer(data) {
  try {
    console.log('Adding customer:', data);
    const sheet = getDataSheet();
    
    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][1] === data.licensePlate) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ทะเบียนรถนี้มีอยู่แล้วในระบบ'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // เพิ่มข้อมูลใหม่
    const newRow = [
      new Date(),
      data.licensePlate || '',
      data.brand || '',
      data.customerName || '',
      data.phone || '',
      data.registerDate ? new Date(data.registerDate) : '',
      data.note || '',
      '', // userId
      365 // day
    ];
    
    console.log('Adding row:', newRow);
    const lastRow = sheet.getLastRow() + 1;
    sheet.getRange(lastRow, 1, 1, 9).setValues([newRow]);
    
    // เพิ่มสูตรสำหรับคอลัมน์ J และ K
    sheet.getRange(lastRow, 10).setFormula(
      `=IF(F${lastRow}<>"", DATEVALUE(F${lastRow})+I${lastRow},"")`
    );
    sheet.getRange(lastRow, 11).setFormula(
      `=IF(J${lastRow}<>"",LET(gap,J${lastRow}-TODAY(),
         IF(gap<0,"เกินกำหนด",IF(gap=0,"ครบกำหนดวันนี้",
         IF(gap<=90,"กำลังจะครบกำหนด","ต่อภาษีแล้ว")))),"")`
    );
    
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

function updateCustomer(data) {
  try {
    console.log('Updating customer:', data);
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    // หาแถวที่มีทะเบียนรถเดิม
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] === data.originalLicensePlate) {
        targetRow = i + 1; // +1 เพราะ Google Sheets เริ่มจาก 1
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ตรวจสอบว่าทะเบียนรถใหม่ซ้ำหรือไม่ (ถ้าเปลี่ยนทะเบียน)
    if (data.licensePlate !== data.originalLicensePlate) {
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][1] === data.licensePlate && (i + 1) !== targetRow) {
          return ContentService.createTextOutput(JSON.stringify({
            result: 'error',
            message: 'ทะเบียนรถใหม่นี้มีอยู่แล้วในระบบ'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // อัปเดตข้อมูล
    const updateRow = [
      allData[targetRow-1][0], // เก็บ timestamp เดิม
      data.licensePlate || '',
      data.brand || '',
      data.customerName || '',
      data.phone || '',
      data.registerDate ? new Date(data.registerDate) : '',
      data.note || '',
      allData[targetRow-1][7] || '', // เก็บ userId เดิม
      allData[targetRow-1][8] || 365 // เก็บ day เดิม
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

function deleteCustomer(data) {
  try {
    console.log('Deleting customer:', data);
    const sheet = getDataSheet();
    const allData = sheet.getDataRange().getValues();
    
    // หาแถวที่มีทะเบียนรถที่ต้องการลบ
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][1] === data.licensePlate) {
        targetRow = i + 1; // +1 เพราะ Google Sheets เริ่มจาก 1
        break;
      }
    }
    
    if (targetRow === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ลบแถว
    console.log('Deleting row:', targetRow);
    sheet.deleteRow(targetRow);
    
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
