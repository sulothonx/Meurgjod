/**
 * จดให้ไว (JodHaiWai) — Google Apps Script Backend API
 * เชื่อมต่อกับ Spreadsheet ID: 10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE
 * ปลอดภัย มีระบบ Lock, Formula Injection Prevention และ Audit Log
 */

const SPREADSHEET_ID = "10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE";

function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || "testConnection";

  try {
    const ss = getSpreadsheet();

    if (action === "testConnection") {
      const sheets = ss.getSheets().map(s => s.getName());
      return createJsonResponse({
        success: true,
        message: "เชื่อมต่อ Google Sheets สำเร็จเรียบร้อย",
        spreadsheetTitle: ss.getName(),
        spreadsheetId: ss.getId(),
        sheets: sheets,
        timestamp: new Date().toISOString()
      });
    }

    if (action === "getInitialData") {
      return createJsonResponse(fetchInitialData(ss));
    }

    return createJsonResponse({ success: false, error: "Action not recognized: " + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds for concurrent requests
  const hasLock = lock.tryLock(30000);
  if (!hasLock) {
    return createJsonResponse({ success: false, error: "ระบบไม่สามารถบันทึกได้เนื่องจากมีคำขอเขียนข้อมูลพร้อมกัน กรุณาลองใหม่อีกครั้ง" });
  }

  try {
    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (err) {
      return createJsonResponse({ success: false, error: "รูปแบบ JSON ไม่ถูกต้อง" });
    }

    const action = payload.action;
    const ss = getSpreadsheet();

    if (action === "addTransaction") {
      const res = appendTransaction(ss, payload.data);
      return createJsonResponse(res);
    }

    if (action === "addHealthRecord") {
      const res = appendHealthRecord(ss, payload.data);
      return createJsonResponse(res);
    }

    if (action === "initSheets") {
      const res = setupRequiredSheets(ss);
      return createJsonResponse(res);
    }

    return createJsonResponse({ success: false, error: "Unknown action: " + action });
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Fetch all initial data
 */
function fetchInitialData(ss) {
  const defaultSheet = ss.getSheets()[0];
  const rows = defaultSheet.getDataRange().getValues();
  return {
    success: true,
    sheetName: defaultSheet.getName(),
    rowCount: rows.length,
    rows: rows
  };
}

/**
 * Append transaction (Supports both new schema and legacy sheet)
 */
function appendTransaction(ss, item) {
  let sheet = ss.getSheetByName("Transactions");
  if (!sheet) {
    sheet = ss.getSheets()[0]; // Fallback to primary sheet
  }

  // Prevent formula injection
  const safeDesc = escapeFormula(item.description || "");
  const safeNote = escapeFormula(item.note || "");
  const safeCat = escapeFormula(item.category || "");
  const safeAcc = escapeFormula(item.account_name || item.account_id || "เงินคู่");
  const amount = Number(item.amount) || 0;

  // Primary sheet columns: ID, วันที่, บัญชี, ประเภท, หมวดหมู่, รายละเอียดเพิ่มเติม, จำนวนเงิน
  const rowData = [
    item.transaction_id || Utilities.getUuid(),
    item.transaction_date || Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm"),
    safeAcc,
    item.transaction_type === 'income' ? 'รายรับ' : 'รายจ่าย',
    safeCat,
    safeDesc + (safeNote ? (" (" + safeNote + ")") : ""),
    amount
  ];

  sheet.appendRow(rowData);

  // Write audit log if sheet exists
  logAudit(ss, item.user_id || "unknown", "ADD_TRANSACTION", "Transaction", item.transaction_id);

  return {
    success: true,
    message: "บันทึกรายการรายรับ-รายจ่ายสำเร็จ",
    transaction_id: item.transaction_id
  };
}

/**
 * Append health record
 */
function appendHealthRecord(ss, item) {
  let sheet = ss.getSheetByName("HealthRecords");
  if (!sheet) {
    sheet = ss.getSheets()[0];
    // Write in existing format: ID, วันที่, บัญชี (น้ำหนัก), ประเภท (ชื่อคน), หมวดหมู่ (น้ำหนักรายวัน), รายละเอียด, จำนวนเงิน
    sheet.appendRow([
      item.health_id || ("WT" + new Date().getTime()),
      item.record_date || Utilities.formatDate(new Date(), "Asia/Bangkok", "yyyy-MM-dd"),
      "น้ำหนัก",
      escapeFormula(item.user_name || "โจ"),
      "น้ำหนักรายวัน",
      escapeFormula(item.note || ""),
      Number(item.weight_kg) || 0
    ]);
  } else {
    // Standard HealthRecords sheet
    sheet.appendRow([
      item.health_id || Utilities.getUuid(),
      item.user_id || "user-1",
      item.record_date,
      Number(item.weight_kg),
      Number(item.height_cm),
      Number(item.bmi),
      escapeFormula(item.note || ""),
      new Date().toISOString()
    ]);
  }

  logAudit(ss, item.user_id || "unknown", "ADD_HEALTH_RECORD", "HealthRecord", item.health_id);

  return {
    success: true,
    message: "บันทึกข้อมูลสุขภาพสำเร็จ",
    health_id: item.health_id
  };
}

/**
 * Initialize all required sheets without overwriting or deleting existing data
 */
function setupRequiredSheets(ss) {
  const required = [
    { name: "Users", headers: ["user_id", "display_name", "email", "couple_id", "role", "created_at", "updated_at"] },
    { name: "Couples", headers: ["couple_id", "couple_name", "created_by", "created_at", "status"] },
    { name: "CoupleMembers", headers: ["membership_id", "couple_id", "user_id", "role", "joined_at", "status"] },
    { name: "Transactions", headers: ["transaction_id", "couple_id", "user_id", "transaction_date", "transaction_type", "category", "description", "amount", "account_id", "receipt_id", "note", "created_at", "updated_at"] },
    { name: "Categories", headers: ["category_id", "category_name", "transaction_type", "icon", "color"] },
    { name: "Budgets", headers: ["budget_id", "couple_id", "category_id", "budget_amount", "start_date", "end_date", "alert_percentage"] },
    { name: "HealthRecords", headers: ["health_id", "user_id", "record_date", "weight_kg", "height_cm", "bmi", "note", "created_at"] },
    { name: "Accounts", headers: ["account_id", "user_id", "account_name", "account_type", "display_balance", "balance_source", "last_synced_at", "connection_status"] },
    { name: "ReceiptScans", headers: ["receipt_id", "user_id", "file_reference", "detected_amount", "detected_date", "detected_description", "scan_status", "transaction_id"] },
    { name: "Settings", headers: ["user_id", "selected_theme", "language", "notifications_enabled", "updated_at"] },
    { name: "AuditLogs", headers: ["log_id", "actor_id", "action", "entity_type", "entity_id", "timestamp", "metadata"] }
  ];

  const created = [];
  const existing = [];

  required.forEach(item => {
    let sheet = ss.getSheetByName(item.name);
    if (!sheet) {
      sheet = ss.insertSheet(item.name);
      sheet.appendRow(item.headers);
      sheet.getRange(1, 1, 1, item.headers.length).setFontWeight("bold").setBackground("#E0F7FF");
      created.push(item.name);
    } else {
      existing.push(item.name);
    }
  });

  return {
    success: true,
    message: "ตรวจสอบโครงสร้างชีตเรียบร้อย",
    createdSheets: created,
    existingSheets: existing
  };
}

function escapeFormula(str) {
  if (typeof str !== 'string') return str;
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return "'" + str;
  }
  return str;
}

function logAudit(ss, actorId, action, entityType, entityId) {
  try {
    let auditSheet = ss.getSheetByName("AuditLogs");
    if (auditSheet) {
      auditSheet.appendRow([
        Utilities.getUuid(),
        actorId,
        action,
        entityType,
        entityId,
        new Date().toISOString(),
        ""
      ]);
    }
  } catch (e) {
    // Silently continue
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
