// ===== แก้ค่าในไฟล์นี้ไฟล์เดียว ให้ตรงกับระบบของโรงเรียน =====
const CONFIG = {
  // URL ของ Edge Function (Supabase > Edge Functions > api > คัดลอก URL)
  API_URL: "https://YOUR-PROJECT-REF.supabase.co/functions/v1/api",

  // LIFF ID ของแต่ละหน้า (LINE Developers > LINE Login channel > LIFF)
  LIFF_STUDENT: "2000000000-xxxxxxxx",
  LIFF_TEACHER: "2000000000-yyyyyyyy",
  LIFF_ADMIN:   "2000000000-zzzzzzzz",
  LIFF_FORMS:   "2000000000-ffffffff",   // แบบฟอร์มนักเรียน (ปพ.8 / SDQ / EQ) → forms.html
  LIFF_CARE:    "2000000000-cccccccc",   // ระบบดูแลช่วยเหลือนักเรียน (ครู) → care.html
  LIFF_PARENT:  "2000000000-pppppppp",   // หน้าผู้ปกครอง (แพ็กเกจเสริม แจ้งเตือนผู้ปกครอง) → parent.html

  // LINE OA ของโรงเรียน (Basic ID ขึ้นต้นด้วย @) ใช้สร้างปุ่ม "เพิ่มเพื่อน" ให้ผู้ปกครอง
  LINE_OA_ID: "@yourschool",

  // แสดงผลคะแนน SDQ/EQ ให้นักเรียนเห็นหลังส่งหรือไม่ (false = ครูเห็นในชีตเท่านั้น)
  SHOW_RESULTS_TO_STUDENT: false,

  SCHOOL_NAME: "โรงเรียนตัวอย่างวิทยา",
};
