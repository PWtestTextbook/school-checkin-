// =====================================================================
// แพ็กเกจเสริม: แจ้งเตือนผู้ปกครองผ่าน LINE — ครูที่ปรึกษาออกรหัสผูกบัญชี / ยกเลิกการผูก
// ใช้ $, room() จาก teacher.html
// =====================================================================
window.TeacherParents = (() => {
  const e = App.esc;
  const fmt = (c) => `${c.slice(0, 4)}-${c.slice(4)}`;

  async function load() {
    const r = await App.api("parent.classLinks", { classroom: room() });
    const linked = r.rows.filter((x) => x.parents.length).length;
    $("parSummary").textContent = `ห้อง ม.${room()} · ผู้ปกครองผูกบัญชีแล้ว ${linked} จาก ${r.rows.length} คน`;
    $("parList").innerHTML = r.rows.map((x) => `
      <div class="log-item" style="border-top:1px solid var(--line);padding:10px 0">
        <div class="log-head"><b>${x.number}. ${e(x.name)}</b>
          <span class="badge ${x.parents.length ? "ok" : "absent"}">${x.parents.length ? `ผูกแล้ว ${x.parents.length}` : "ยังไม่ผูก"}</span></div>
        ${x.parents.map((p) => `<div class="muted" style="display:flex;justify-content:space-between;gap:8px;align-items:center">
          <span>${e(p.relation || "ผู้ปกครอง")}${p.name ? ` · LINE: ${e(p.name)}` : ""} · ${new Date(p.linkedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}</span>
          <button class="secondary small-btn" style="width:auto;margin:0;padding:4px 10px" data-rm="${p.id}">ยกเลิก</button></div>`).join("")}
        ${x.code ? `<div class="muted">มีรหัสที่ยังไม่ถูกใช้: <b>${fmt(x.code)}</b></div>` : ""}
        <button class="secondary small-btn" data-code="${e(x.studentId)}">${x.code ? "ออกรหัสใหม่ (ยกเลิกรหัสเดิม)" : "ออกรหัสผูกบัญชี"}</button>
        <div data-box="${e(x.studentId)}"></div>
      </div>`).join("");
    $("parList").querySelectorAll("[data-code]").forEach((b) => (b.onclick = () => issue(b.dataset.code)));
    $("parList").querySelectorAll("[data-rm]").forEach((b) => (b.onclick = () => remove(Number(b.dataset.rm))));
  }

  async function issue(studentId) {
    try {
      App.loading("กำลังออกรหัส...");
      const r = await App.api("parent.issueCode", { studentId });
      App.close();
      const link = `https://liff.line.me/${CONFIG.LIFF_PARENT}?code=${r.code}`;
      const until = new Date(r.expiresAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
      const msg = `เรียนผู้ปกครองของ ${r.student.name} ชั้น ม.${r.student.classroom}\n` +
        `รหัสผูกบัญชีรับแจ้งเตือนการมาเรียนทาง LINE: ${fmt(r.code)} (ใช้ได้ถึง ${until})\n` +
        `1) เพิ่มเพื่อน LINE ของโรงเรียน ${CONFIG.LINE_OA_ID}\n2) เปิดลิงก์ ${link} แล้วกด "ผูกบัญชี"`;
      const box = document.querySelector(`[data-box="${CSS.escape(studentId)}"]`);
      box.innerHTML = `<div class="code-box">${fmt(r.code)}</div>
        <textarea readonly style="min-height:120px;font-size:14px">${e(msg)}</textarea>
        <button class="small-btn" data-copy>คัดลอกข้อความส่งผู้ปกครอง</button>`;
      box.querySelector("[data-copy]").onclick = async () => {
        const ta = box.querySelector("textarea");
        try { await navigator.clipboard.writeText(msg); App.alert("คัดลอกแล้ว นำไปวางในแชตส่วนตัวกับผู้ปกครอง"); }
        catch { ta.select(); App.alert("เลือกข้อความไว้แล้ว กดค้างแล้วเลือก คัดลอก"); }
      };
    } catch (err) { App.alert(err.message); }
  }

  async function remove(id) {
    if (!(await App.confirm("ยกเลิกการผูกบัญชีของผู้ปกครองคนนี้? ผู้ปกครองจะไม่ได้รับแจ้งเตือนอีก"))) return;
    try { App.loading(); const r = await App.api("parent.removeLink", { id }); await load(); App.alert(r.message); }
    catch (err) { App.alert(err.message); }
  }

  return { load };
})();
