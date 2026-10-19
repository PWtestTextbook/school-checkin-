// ===== ฟังก์ชันที่ใช้ร่วมกันทุกหน้า =====
const App = {
  idToken: null,

  /** เริ่มต้น LIFF และขอ ID Token ของผู้ใช้ */
  async init(liffId) {
    document.querySelectorAll("[data-school]").forEach((el) => (el.textContent = CONFIG.SCHOOL_NAME));
    App.loading("กำลังเปิดระบบ...");
    await liff.init({ liffId });
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: location.href });
      return new Promise(() => {}); // รอหน้าเปลี่ยน
    }
    App.idToken = liff.getIDToken();
    App.close();
    App.syncTheme();                       // ไม่ต้องรอ ให้ทำงานเบื้องหลัง
  },

  /** เปลี่ยนธีมทันที และจำไว้ในเครื่อง */
  setTheme(id) {
    if (!window.THEMES || !THEMES.some((t) => t.id === id)) id = window.DEFAULT_THEME || "formal";
    const link = document.getElementById("themeCss");
    if (link && !link.href.endsWith(`/themes/${id}.css`)) link.href = `css/themes/${id}.css`;
    document.documentElement.setAttribute("data-theme", id);
    try { localStorage.setItem("sc_theme", id); } catch { /* ข้าม */ }
  },

  /** ถามเซิร์ฟเวอร์ว่าโรงเรียนใช้ธีมไหน */
  async syncTheme() {
    try {
      const r = await App.api("public.theme");
      if (r.theme) App.setTheme(r.theme);
    } catch { /* ใช้ธีมเดิมต่อไป */ }
  },

  /** เรียก API หลังบ้าน  ถ้าไม่สำเร็จจะ throw Error พร้อมข้อความภาษาไทย */
  async api(action, data = {}) {
    let res;
    try {
      res = await fetch(CONFIG.API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, idToken: App.idToken, ...data }),
      });
    } catch (err) {
      // fetch ล้ม = ไม่ได้รับคำตอบเลย: เน็ตหลุด, API_URL ผิด, หรือเซิร์ฟเวอร์ตอบกลับโดยไม่มี CORS (เช่นยังเปิด Verify JWT)
      console.error("API fetch failed:", CONFIG.API_URL, err);
      if (!navigator.onLine) throw new Error("เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาลองใหม่");
      if (/YOUR-PROJECT-REF/.test(CONFIG.API_URL)) throw new Error("ยังไม่ได้ตั้งค่า API_URL ในไฟล์ js/config.js กรุณาแจ้งผู้ดูแลระบบ");
      throw new Error("ติดต่อเซิร์ฟเวอร์ของโรงเรียนไม่ได้ กรุณาลองใหม่ ถ้าเป็นกับทุกคนให้แจ้งผู้ดูแลระบบ");
    }
    const j = await res.json().catch(() => ({ ok: false, message: "เซิร์ฟเวอร์ตอบกลับผิดรูปแบบ" }));
    if (!j.ok) throw new Error(j.message);
    return j;
  },

  /** ขอพิกัด GPS ปัจจุบัน */
  getLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("อุปกรณ์นี้ไม่รองรับ GPS"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) }),
        () => reject(new Error("ไม่สามารถอ่านพิกัดได้ กรุณาเปิด Location และอนุญาตให้ LINE เข้าถึงตำแหน่ง")),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
      );
    });
  },

  /** ย่อรูปจากไฟล์ให้ขนาดเล็ก (ด้านยาวไม่เกิน maxSide px, ไม่เกิน maxKB) แล้วคืนเป็น dataURL
   *  type: "image/jpeg" (ค่าเริ่มต้น) หรือ "image/png" สำหรับตราโรงเรียนที่มีพื้นโปร่งใส */
  compressImage(file, maxSide = 1000, quality = 0.6, maxKB = 250, type = "image/jpeg") {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let side = maxSide, q = quality, out;
        do {
          const scale = Math.min(1, side / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          out = c.toDataURL(type, q);
          side *= 0.85; q = Math.max(0.4, q - 0.05);
        } while (out.length > maxKB * 1024 * 1.37 && side > Math.min(400, maxSide * 0.5)); // เป้าหมาย ≈ ไม่เกิน maxKB
        URL.revokeObjectURL(img.src);
        resolve(out);
      };
      img.onerror = () => reject(new Error("เปิดรูปภาพไม่ได้"));
      img.src = URL.createObjectURL(file);
    });
  },

  // ---------- กล่องข้อความ ----------
  _overlay(html) {
    let o = document.getElementById("overlay");
    if (!o) { o = document.createElement("div"); o.id = "overlay"; document.body.appendChild(o); }
    o.innerHTML = `<div class="box">${html}</div>`;
    o.classList.remove("hidden");
    return o;
  },
  loading(msg = "กำลังดำเนินการ...") { App._overlay(`<div class="spinner"></div><p>${App.esc(msg)}</p>`); },
  close() { document.getElementById("overlay")?.classList.add("hidden"); },
  alert(msg, title = "") {
    return new Promise((ok) => {
      const o = App._overlay(`${title ? `<h2>${App.esc(title)}</h2>` : ""}<p>${App.esc(msg)}</p><button id="ovOk">ตกลง</button>`);
      o.querySelector("#ovOk").onclick = () => { App.close(); ok(); };
    });
  },
  confirm(msg, yes = "ยืนยัน", no = "ยกเลิก") {
    return new Promise((ok) => {
      const o = App._overlay(`<p>${App.esc(msg)}</p><button id="ovYes">${yes}</button><button id="ovNo" class="secondary">${no}</button>`);
      o.querySelector("#ovYes").onclick = () => { App.close(); ok(true); };
      o.querySelector("#ovNo").onclick = () => { App.close(); ok(false); };
    });
  },
  esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); },

  /** วันที่วันนี้ตามเวลาไทย รูปแบบ YYYY-MM-DD */
  today() { return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }); },
  thaiDate(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  },
};
