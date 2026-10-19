// =====================================================================
// โหลดธีมของโรงเรียน (ต้องวางใน <head> ถัดจากไฟล์ CSS อื่นทั้งหมด)
//  - ครั้งแรกใช้ธีมที่จำไว้ในเครื่อง ถ้าไม่มีใช้ Formal Blue (ค่าเริ่มต้น)
//  - หลังเข้าสู่ระบบ common.js จะถามเซิร์ฟเวอร์ว่าแอดมินเลือกธีมไหน แล้วเปลี่ยนให้ถ้าไม่ตรง
// =====================================================================
window.THEMES = [
  { id: "formal",    name: "Formal Blue",    desc: "ทางการ โทนน้ำเงิน (ค่าเริ่มต้น)", colors: ["#0F2C5C", "#C9A227", "#F2F5FA"] },
  { id: "backboard", name: "Backboard",      desc: "กระดานดำ ชอล์ค หมุด คลิป",        colors: ["#2E4A3B", "#7A4B24", "#F4F1E8"] },
  { id: "sweet",     name: "Sweet Ribbon",   desc: "หวานแหวว ชมพูพาสเทล",              colors: ["#E6578F", "#FCE4EE", "#C7A6E8"] },
  { id: "stem",      name: "STEM Blueprint", desc: "วิทย์ คณิต วิศวะ พิมพ์เขียว",        colors: ["#0E3A66", "#FF9E3D", "#EAF2FB"] },
  { id: "digital",   name: "Digital Circuit",desc: "ดิจิทัล อิเล็กทรอนิกส์ แผงวงจร",      colors: ["#07140F", "#3EF0FF", "#39FF88"] },
  { id: "magic",     name: "Magic Academy",  desc: "โรงเรียนเวทมนตร์ กระดาษหนัง",       colors: ["#141433", "#E8C873", "#6B1E2A"] },
  { id: "chibi",     name: "Chibi Pop",      desc: "การ์ตูนญี่ปุ่น สีสดใส",               colors: ["#BFE7FF", "#FF6B8B", "#FFF27A"] },
  { id: "wizard",    name: "Wizard Hall",    desc: "เวทมนตร์เข้มข้น เทียน หมวกพ่อมด",   colors: ["#120F24", "#4B2F8C", "#F2C96B"] },
];
window.DEFAULT_THEME = "formal";
(function () {
  var t = window.DEFAULT_THEME;
  try {
    var saved = localStorage.getItem("sc_theme");
    if (saved && window.THEMES.some(function (x) { return x.id === saved; })) t = saved;
  } catch (e) { /* ไม่มีที่เก็บก็ใช้ค่าเริ่มต้น */ }
  document.documentElement.setAttribute("data-theme", t);
  document.write('<link rel="stylesheet" id="themeCss" href="css/themes/' + t + '.css">');
})();
