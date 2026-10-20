# วิธีติดตั้ง Google Apps Script สำหรับแอป "มรึงจด"

ระบบ "มรึงจด" ออกแบบมาให้เชื่อมต่อกับ Google Sheet ID:
**`10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE`**

สามารถเปิดใช้งาน Web App Endpoint ได้ง่ายๆ ใน 3 ขั้นตอน:

### ขั้นตอนที่ 1: เปิด Apps Script ใน Google Sheets
1. เปิดไฟล์ Google Sheets: [https://docs.google.com/spreadsheets/d/10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE/edit](https://docs.google.com/spreadsheets/d/10nzaDw3TWBgFp12jHwMfjY4ajFaLaU0k6PDWO8RpMcE/edit)
2. ไปที่เมนูด้านบนเลือก **ส่วนขยาย (Extensions)** > **Apps Script**

### ขั้นตอนที่ 2: วางโค้ด
1. ลบโค้ดเดิมในไฟล์ `Code.gs` ทั้งหมด
2. คัดลอกโค้ดจากไฟล์ `google-apps-script/Code.gs` ในโปรเจกต์นี้ไปวาง
3. กดปุ่มไอคอน **บันทึก (Save)** 💾

### ขั้นตอนที่ 3: ทำให้ใช้งานได้ (Deploy as Web App)
1. กดปุ่มสีน้ำเงิน **ทำให้ใช้งานได้ (Deploy)** ที่มุมขวาบน > เลือก **การทำให้ใช้งานได้รายการใหม่ (New deployment)**
2. คลิกรูปฟันเฟืองเลือกประเภท: **เว็บแอป (Web app)**
3. ตั้งค่า:
   - **คำอธิบาย:** มรึงจด API v1
   - **ดำเนินการในฐานะ (Execute as):** ฉัน (Me)
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** ทุกคน (Anyone) *(เพื่อให้เว็บแอปสามารถส่งข้อมูลบันทึกได้)*
4. กด **ทำให้ใช้งานได้ (Deploy)** แล้วกดอนุญาตสิทธิ์ (Authorize Access)
5. คัดลอก **URL เว็บแอป (Web App URL)** ที่ได้ (ขึ้นต้นด้วย `https://script.google.com/macros/s/.../exec`)
6. นำ URL ไปวางในหน้า **ตั้งค่า (Settings)** ของแอป "มรึงจด" และกดปุ่ม **"ทดสอบการเชื่อมต่อ"**

---
*หมายเหตุ:* หากยังไม่ได้ใส่ Web App URL ระบบจะอ่านข้อมูลล่าสุดจาก Google Sheets ผ่าน Export API และเก็บข้อมูลใหม่ในหน่วยความจำเครื่อง (LocalStorage) อย่างปลอดภัย พร้อมซิงก์ทันทีเมื่อใส่ URL!
