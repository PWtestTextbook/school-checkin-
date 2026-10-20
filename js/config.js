// ===== แก้ค่าในไฟล์นี้ไฟล์เดียว ให้ตรงกับระบบของโรงเรียน =====
const CONFIG = {
  // URL ของ Edge Function (Supabase > Edge Functions > api > คัดลอก URL)
  API_URL: "https://wznazkjkmpvfbuznrhhr.supabase.co/functions/v1/quick-action",

  // LIFF ID ของแต่ละหน้า (LINE Developers > LINE Login channel > LIFF)
  LIFF_STUDENT: "2012092632-OHiXnQg3",
  LIFF_TEACHER: "2012092632-cGqOSwyO",
  LIFF_ADMIN:   "2012092632-gdEV5FDZ",
  LIFF_FORMS:   "2012092632-feuDU1Lu",   // แบบฟอร์มนักเรียน (ปพ.8 / SDQ / EQ) → forms.html
  LIFF_CARE:    "2012092632-gdEV5FDZ",   // ระบบดูแลช่วยเหลือนักเรียน (ครู) → care.html
  LIFF_PARENT:  "2012092632-teGprCYV",   // หน้าผู้ปกครอง (แพ็กเกจเสริม แจ้งเตือนผู้ปกครอง) → parent.html

  // LINE OA ของโรงเรียน (Basic ID ขึ้นต้นด้วย @) ใช้สร้างปุ่ม "เพิ่มเพื่อน" ให้ผู้ปกครอง
  LINE_OA_ID: "@698wklbh ",

  // แสดงผลคะแนน SDQ/EQ ให้นักเรียนเห็นหลังส่งหรือไม่ (false = ครูเห็นในชีตเท่านั้น)
  SHOW_RESULTS_TO_STUDENT: false,

  SCHOOL_NAME: "โรงเรียนสิรินธรราชวิทยาลัย",
};
