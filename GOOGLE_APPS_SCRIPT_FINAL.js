// Google Apps Script สำหรับจัดการข้อมูลลูกค้า (แก้ไข CORS และ FormData)
// วางโค้ดนี้ใน Google Apps Script Editor

function doPost(e) {
  try {
    let data;
    
    console.log('=== DEBUG INFO ===');
    console.log('e.parameter:', e.parameter);
    console.log('e.postData:', e.postData);
    console.log('e.postData.type:', e.postData ? e.postData.type : 'undefined');
    console.log('e.postData.contents:', e.postData ? e.postData.contents : 'undefined');
    
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

function doGet(e) {
  try {
    const getAll = e.parameter.getAll;
    
    if (getAll === '1') {
      return getAllCustomers();
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error',
        message: 'Invalid parameter'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllCustomers() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'success',
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const customers = rows.map((row, index) => {
      const customer = {};
      headers.forEach((header, colIndex) => {
        customer[header] = row[colIndex];
      });
      customer.rowIndex = index + 2; // +2 เพราะมี header และ index เริ่มจาก 0
      return customer;
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      result: 'success',
      data: customers
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error in getAllCustomers:', error);
    return ContentService.createTextOutput(JSON.stringify({
      result: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addCustomer(data) {
  try {
    console.log('Adding customer:', data);
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // ตรวจสอบว่าทะเบียนรถซ้ำหรือไม่
    const existingData = sheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === data.licensePlate) {
        return ContentService.createTextOutput(JSON.stringify({
          result: 'error',
          message: 'ทะเบียนรถนี้มีอยู่แล้วในระบบ'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // เพิ่มข้อมูลใหม่
    const newRow = [
      data.licensePlate || '',
      data.customerName || '',
      data.phone || '',
      data.registerDate || '',
      data.status || 'รอดำเนินการ',
      data.brand || '',
      data.note || ''
    ];
    
    console.log('Adding row:', newRow);
    sheet.appendRow(newRow);
    
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
    const sheet = SpreadsheetApp.getActiveSheet();
    const allData = sheet.getDataRange().getValues();
    
    // หาแถวที่มีทะเบียนรถเดิม
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.originalLicensePlate) {
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
        if (allData[i][0] === data.licensePlate && (i + 1) !== targetRow) {
          return ContentService.createTextOutput(JSON.stringify({
            result: 'error',
            message: 'ทะเบียนรถใหม่นี้มีอยู่แล้วในระบบ'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // อัปเดตข้อมูล
    const updateRow = [
      data.licensePlate || '',
      data.customerName || '',
      data.phone || '',
      data.registerDate || '',
      data.status || 'รอดำเนินการ',
      data.brand || '',
      data.note || ''
    ];
    
    console.log('Updating row', targetRow, 'with:', updateRow);
    sheet.getRange(targetRow, 1, 1, updateRow.length).setValues([updateRow]);
    
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
    const sheet = SpreadsheetApp.getActiveSheet();
    const allData = sheet.getDataRange().getValues();
    
    // หาแถวที่มีทะเบียนรถที่ต้องการลบ
    let targetRow = -1;
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === data.licensePlate) {
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
