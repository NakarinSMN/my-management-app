// ========================================
// Google Apps Script - LINE Notify System
// ระบบแจ้งเตือนผ่าน LINE
// ========================================

// ========== CONFIG ==========
const SHEET_ID = "110t2LJA96E0eZRTj40kgW0_X50v7dUkt-oTR1SA13wU";
const ACCESS_TOKEN = '7yh7P8dfolfTAe4YxovRpmFtC7gOtU3zRA/lAQZce2QAIxj3r4rDElMrFc85vv0CMNWiksyJeY/cG6WLpLmD4cKxWYTK1TDzn2IjBqofgdm4G8oTtOn/VOjWJQ+KNg3H7glWWoL6rLGDv70xlveeewdB04t89/1O/w1cDnyilFU';
const SHEET_NAME_FILTER = "sentnotify";
const SHEET_NAME_DATA = "data";

// ========== HELPER FUNCTIONS ==========

/**
 * แปลงวันที่เป็นรูปแบบ DD/MM/YYYY
 */
function formatDate(cell) {
  if (Object.prototype.toString.call(cell) === '[object Date]' && !isNaN(cell)) {
    return Utilities.formatDate(cell, "Asia/Bangkok", "dd/MM/yyyy");
  }
  return cell;
}

// ========== LINE NOTIFY FUNCTIONS ==========

/**
 * ส่งการแจ้งเตือนผ่าน LINE Bot
 */
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
    console.log('✅ ส่งข้อความ LINE สำเร็จ');
    return true;
  } catch (error) {
    console.error('❌ Error sending LINE message:', error);
    return false;
  }
}

/**
 * ดึงสถานะการเตือน
 */
function getNotifyStatus(sheet, licensePlate) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) { // B - ทะเบียนรถ
      return data[i][11]; // L = สถานะการเตือน
    }
  }
  return "";
}

/**
 * อัปเดตสถานะการเตือน
 */
function updateNotifyStatus(sheet, licensePlate, newStatus) {
  const data = sheet.getRange("A2:L" + sheet.getLastRow()).getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][1] === licensePlate) {
      sheet.getRange(i + 2, 12).setValue(newStatus); // L = คอลัมน์ 12
      break;
    }
  }
}

/**
 * ตรวจสอบและส่งการแจ้งเตือนภาษีที่ใกล้ครบกำหนด
 */
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
    const licensePlate = row[1]; // B - ทะเบียนรถ
    const lastPaidDate = row[5]; // F
    const nextDueDate = row[9];  // J
    const userId = row[7];       // H
    const status = row[10];      // K

    // ตรวจสอบสถานะการเตือนในชีต data (คอลัมน์ L)
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

      const sent = sendLineMessage(ACCESS_TOKEN, userId, message);
      
      if (sent) {
        updateNotifyStatus(dataSheet, licensePlate, "แจ้งแล้ว");
        Logger.log(`ส่งแล้ว: ${licensePlate} → ${userId}`);
        sentCount++;
      }
    }
  });
  
  Logger.log(`✅ ส่งการแจ้งเตือนทั้งหมด ${sentCount} รายการ`);
  return sentCount;
}

/**
 * ตรวจสอบภาษีที่ใกล้ครบกำหนดและส่งแจ้งเตือน
 */
function checkAndNotifyTaxExpiry() {
  try {
    const dataSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_DATA);
    const data = dataSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log('ไม่มีข้อมูลลูกค้า');
      return 0;
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    let notificationCount = 0;
    
    rows.forEach((row, index) => {
      const licensePlate = row[1]; // B: ทะเบียนรถ
      const customerName = row[3]; // D: ชื่อลูกค้า
      const userId = row[7]; // H: userId
      const status = row[10]; // K: สถานะ
      const notifyStatus = row[11]; // L: สถานะการเตือน
      
      // ตรวจสอบเฉพาะสถานะที่ใกล้ครบกำหนดและยังไม่แจ้งเตือน
      if ((status === 'ใกล้ครบกำหนด' || status === 'กำลังจะครบกำหนด') && 
          userId && 
          notifyStatus !== 'แจ้งแล้ว') {
        
        const message = `🚗 แจ้งเตือนต่อภาษี\n` +
                       `ทะเบียนรถ: ${licensePlate}\n` +
                       `ชื่อลูกค้า: ${customerName}\n` +
                       `สถานะ: ${status}\n` +
                       `กรุณาติดต่อลูกค้าเพื่อต่อภาษี`;
        
        const sent = sendLineMessage(ACCESS_TOKEN, userId, message);
        
        if (sent) {
          // อัปเดตสถานะการเตือนในคอลัมน์ L
          dataSheet.getRange(index + 2, 12).setValue('แจ้งแล้ว');
          notificationCount++;
        }
      }
    });
    
    console.log(`✅ ส่งการแจ้งเตือนทั้งหมด ${notificationCount} รายการ`);
    return notificationCount;
  } catch (error) {
    console.error('Error checking and notifying:', error);
    return 0;
  }
}

/**
 * รีเซ็ตสถานะการเตือนทั้งหมด (ใช้สำหรับเดือนใหม่)
 */
function resetAllNotifyStatus() {
  try {
    const dataSheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME_DATA);
    const lastRow = dataSheet.getLastRow();
    
    if (lastRow > 1) {
      // เคลียร์คอลัมน์ L (สถานะการเตือน) ทั้งหมด
      dataSheet.getRange(2, 12, lastRow - 1, 1).clearContent();
      console.log(`✅ รีเซ็ตสถานะการเตือนทั้งหมด ${lastRow - 1} รายการ`);
    }
  } catch (error) {
    console.error('Error resetting notify status:', error);
  }
}

/**
 * ทดสอบส่งข้อความ LINE
 */
function testSendLineMessage() {
  const testUserId = 'YOUR_TEST_USER_ID'; // เปลี่ยนเป็น User ID ของคุณ
  const testMessage = '🧪 ทดสอบการส่งข้อความจาก Google Apps Script\nระบบจัดการข้อมูลลูกค้า';
  
  const result = sendLineMessage(ACCESS_TOKEN, testUserId, testMessage);
  
  if (result) {
    console.log('✅ ทดสอบส่งข้อความสำเร็จ');
  } else {
    console.log('❌ ทดสอบส่งข้อความล้มเหลว');
  }
}

// ========== TESTING ==========

/**
 * ทดสอบระบบแจ้งเตือน
 */
function testNotificationSystem() {
  console.log('=== ทดสอบระบบแจ้งเตือน ===');
  
  // วิธีที่ 1: ใช้ sendAlert() (อ่านจาก sentnotify sheet)
  console.log('1. ทดสอบ sendAlert():');
  sendAlert();
  
  // วิธีที่ 2: ใช้ checkAndNotifyTaxExpiry() (อ่านจาก data sheet)
  console.log('2. ทดสอบ checkAndNotifyTaxExpiry():');
  const count = checkAndNotifyTaxExpiry();
  console.log(`ส่งแจ้งเตือนทั้งหมด ${count} รายการ`);
}

/**
 * ตั้งค่า Time-based Trigger (รันอัตโนมัติทุกวัน)
 * รันฟังก์ชันนี้ครั้งเดียวเพื่อสร้าง trigger
 */
function setupDailyTrigger() {
  // ลบ trigger เก่าก่อน (ถ้ามี)
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendAlert') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // สร้าง trigger ใหม่ (รันทุกวันเวลา 9:00)
  ScriptApp.newTrigger('sendAlert')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
  
  console.log('✅ สร้าง Daily Trigger สำเร็จ (รันทุกวันเวลา 9:00)');
}


