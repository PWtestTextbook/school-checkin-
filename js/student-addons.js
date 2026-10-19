// =====================================================================
// ระบบเสริมฝั่งนักเรียน: กิจกรรมเพื่อสังคมและสาธารณประโยชน์ + คะแนนความประพฤติ
// ใช้ $ และ show() จาก student.html
// =====================================================================
(() => {
  const e = App.esc;
  const STATUS = {
    pending: ["รออนุมัติ", "late"], approved: ["อนุมัติแล้ว", "ok"], rejected: ["ไม่อนุมัติ", "absent"],
  };
  const thDate = (iso) => new Date(iso + (iso.length === 10 ? "T00:00:00" : ""))
    .toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  const thDateTime = (iso) => new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const hrs = (n) => `${Number(n).toLocaleString("th-TH", { maximumFractionDigits: 1 })} ชม.`;

  // ---------------- กิจกรรมเพื่อสังคมฯ ----------------
  let svImage = null;

  async function loadService() {
    App.loading("กำลังโหลด...");
    const r = await App.api("service.mine");
    App.close();
    const c = r.current;
    $("svPeriod").textContent = r.currentLabel;
    $("svStats").innerHTML = `
      <div><b>${c.count}</b><span>ครั้งที่บันทึก<br>ภาคเรียนนี้</span></div>
      <div><b>${hrs(c.approvedHours)}</b><span>อนุมัติแล้ว<br>ภาคเรียนนี้</span></div>
      <div><b>${hrs(r.totalApprovedHours)}</b><span>สะสมทั้งหมด<br>ทุกภาคเรียน</span></div>`;
    $("svPeriods").innerHTML =
      (c.pendingCount ? `<p class="muted center">รอครูที่ปรึกษาอนุมัติ ${c.pendingCount} รายการ (${hrs(c.pendingHours)}) ยังไม่นับรวม</p>` : "") +
      (r.periods.length > 1 ? `<div class="table-wrap"><table>
        <thead><tr><th>ภาคเรียน</th><th>ครั้ง</th><th>ชั่วโมงที่อนุมัติ</th></tr></thead>
        <tbody>${r.periods.map((p) => `<tr><td>${e(p.label)}</td><td>${p.count}</td><td>${hrs(p.approvedHours)}</td></tr>`).join("")}</tbody>
      </table></div>` : "");
    $("svList").innerHTML = r.items.length ? r.items.map((it) => {
      const [label, cls] = STATUS[it.status];
      return `<div class="card log-item">
        <div class="log-head"><b>${thDate(it.date)} · ${hrs(it.hours)}</b><span class="badge ${cls}">${label}</span></div>
        <div>${e(it.description)}</div>
        <div class="muted">สถานที่: ${e(it.place)}</div>
        <div class="muted">ผู้อนุมัติ: ${e(it.approverName)} (${e(it.approverTitle)})</div>
        <div class="muted">${e(it.periodLabel)} · บันทึกเมื่อ ${thDateTime(it.createdAt)}</div>
        ${it.status === "approved" ? `<div class="muted">อนุมัติโดย ${e(it.reviewedBy)}</div>` : ""}
        ${it.status === "rejected" ? `<div class="warn-box">ไม่อนุมัติ: ${e(it.rejectReason)}</div>` : ""}
        ${it.photoUrl ? `<img class="preview-img" src="${e(it.photoUrl)}" alt="หลักฐานกิจกรรม" loading="lazy">` : ""}
        ${it.status !== "approved" ? `<button class="secondary small-btn" data-del="${it.id}">ลบรายการนี้</button>` : ""}
      </div>`;
    }).join("") : `<div class="card muted center">ยังไม่มีการบันทึก กด "บันทึกกิจกรรมใหม่" เพื่อเริ่ม</div>`;
    $("svList").querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => {
      if (!(await App.confirm("ลบรายการนี้?"))) return;
      try { App.loading(); await App.api("service.remove", { id: Number(b.dataset.del) }); await loadService(); }
      catch (err) { App.alert(err.message); }
    }));
  }

  function resetForm() {
    ["svHours", "svDesc", "svPlace", "svAppName", "svAppTitle"].forEach((id) => ($(id).value = ""));
    $("svDate").value = App.today(); $("svDate").max = App.today();
    svImage = null; $("svPrev").classList.add("hidden"); $("svPhoto").value = "";
  }

  $("btnService").onclick = async () => {
    try { $("svForm").classList.add("hidden"); $("btnSvNew").classList.remove("hidden"); show("secService"); await loadService(); }
    catch (err) { App.alert(err.message); show("secHome"); }
  };
  $("btnSvNew").onclick = () => {
    resetForm(); $("svForm").classList.remove("hidden"); $("btnSvNew").classList.add("hidden");
    $("svForm").scrollIntoView({ behavior: "smooth" });
  };
  $("btnSvCancel").onclick = () => { $("svForm").classList.add("hidden"); $("btnSvNew").classList.remove("hidden"); };
  $("btnSvPhoto").onclick = () => $("svPhoto").click();
  $("svPhoto").onchange = async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try {
      App.loading("กำลังย่อรูป...");
      svImage = await App.compressImage(f, 1200, 0.7, 250);
      $("svPrev").src = svImage; $("svPrev").classList.remove("hidden");
      App.close();
    } catch (err) { App.alert(err.message); }
  };
  $("btnSvSave").onclick = async () => {
    const entry = {
      date: $("svDate").value, hours: Number($("svHours").value), description: $("svDesc").value.trim(),
      place: $("svPlace").value.trim(), approverName: $("svAppName").value.trim(), approverTitle: $("svAppTitle").value.trim(),
      image: svImage,
    };
    if (!entry.date || !entry.hours || !entry.description || !entry.place || !entry.approverName || !entry.approverTitle) {
      return App.alert("กรุณากรอกข้อมูลให้ครบทุกช่อง");
    }
    if (!svImage && !(await App.confirm("ยังไม่ได้แนบภาพหลักฐาน ครูอาจไม่อนุมัติ ต้องการบันทึกต่อหรือไม่?", "บันทึกต่อ", "กลับไปแนบรูป"))) return;
    try {
      App.loading("กำลังบันทึก...");
      const r = await App.api("service.add", { entry });
      $("svForm").classList.add("hidden"); $("btnSvNew").classList.remove("hidden");
      await loadService();
      App.alert(r.message, "สำเร็จ");
    } catch (err) { App.alert(err.message); }
  };
  $("btnSvBack").onclick = () => show("secHome");

  // ---------------- คะแนนความประพฤติ ----------------
  $("btnConduct").onclick = async () => {
    try {
      App.loading("กำลังโหลด...");
      const r = await App.api("conduct.mine");
      $("cdPeriod").textContent = r.periodLabel;
      const pct = Math.max(0, r.score) / r.base;
      $("cdScore").innerHTML = `<b class="${pct >= 0.8 ? "good" : pct >= 0.6 ? "mid" : "low"}">${r.score}</b><span>/ ${r.base} คะแนน</span>`;
      $("cdCount").textContent = r.count ? `ถูกตัดคะแนน ${r.count} ครั้ง รวม ${r.deducted} คะแนน` : "ยังไม่เคยถูกตัดคะแนนในรอบนี้";
      $("cdList").innerHTML = r.logs.length ? r.logs.map((l) => `
        <div class="card log-item ${l.voided ? "voided" : ""}">
          <div class="log-head"><b>ข้อ ${e(l.code)} ${e(l.title)}</b><span class="pts">−${l.points}</span></div>
          <div class="muted">${thDateTime(l.at)} · ครั้งที่ ${l.occurrence} · ${e(l.periodLabel)}</div>
          <div>${e(l.detail)}</div>
          ${l.action ? `<div class="muted">การดำเนินการ: ${e(l.action)}</div>` : ""}
          <div class="muted">ผู้บันทึก: ${e(l.recorder)}</div>
          ${l.voided ? `<div class="warn-box">ยกเลิกแล้ว (คืนคะแนน): ${e(l.voidReason)}</div>` : ""}
        </div>`).join("") : "";
      show("secConduct");
      App.close();
    } catch (err) { App.alert(err.message); }
  };
  $("btnCdBack").onclick = () => show("secHome");
})();
