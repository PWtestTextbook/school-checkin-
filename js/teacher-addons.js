// =====================================================================
// ระบบเสริมฝั่งครู: อนุมัติกิจกรรมเพื่อสังคมฯ + ตัดคะแนนความประพฤติ
// ใช้ $, room(), me จาก teacher.html
// =====================================================================
window.TeacherAddons = (() => {
  const e = App.esc;
  const thDate = (iso) => new Date(iso + (iso.length === 10 ? "T00:00:00" : ""))
    .toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  const thDateTime = (iso) => new Date(iso).toLocaleString("th-TH", {
    day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  const hrs = (n) => Number(n).toLocaleString("th-TH", { maximumFractionDigits: 1 });
  const STATUS = { pending: ["รออนุมัติ", "late"], approved: ["อนุมัติแล้ว", "ok"], rejected: ["ไม่อนุมัติ", "absent"] };

  // ================= กิจกรรมเพื่อสังคมฯ =================
  async function loadService() {
    const r = await App.api("service.class", { classroom: room() });
    $("svPeriod").textContent = `ห้อง ม.${room()} · ${r.periodLabel} (แสดงเฉพาะภาคเรียนปัจจุบัน)`;
    $("svBody").innerHTML = r.rows.map((x) => `
      <tr class="pick-row" data-sid="${e(x.studentId)}" tabindex="0">
        <td>${x.number}</td><td>${e(x.name)}</td><td>${x.count}</td><td>${hrs(x.approvedHours)}</td>
        <td>${x.pendingCount ? `<span class="badge late">${x.pendingCount}</span>` : "-"}</td>
      </tr>`).join("") || `<tr><td colspan="5" class="muted">ไม่มีนักเรียนในห้องนี้</td></tr>`;
    $("svBody").querySelectorAll("[data-sid]").forEach((tr) => {
      tr.onclick = () => openStudent(tr.dataset.sid);
      tr.onkeydown = (ev) => { if (ev.key === "Enter") openStudent(tr.dataset.sid); };
    });
    $("svDetail").classList.add("hidden");
  }

  async function openStudent(sid) {
    try {
      App.loading("กำลังโหลดรายการ...");
      const r = await App.api("service.studentLogs", { studentId: sid });
      App.close();
      const pend = r.items.filter((i) => i.status === "pending");
      $("svDetail").innerHTML = `
        <h2>${e(r.student.name)}</h2>
        <p class="muted">ม.${e(r.student.classroom)} เลขที่ ${r.student.number} · รหัส ${e(r.student.studentId)}</p>
        ${pend.length > 1 ? `<button data-all>อนุมัติทั้งหมดที่รอ (${pend.length} รายการ)</button>` : ""}
        ${r.items.map((it) => {
          const [label, cls] = STATUS[it.status];
          return `<div class="log-item" style="border-top:1px solid var(--line);padding-top:10px;margin-top:10px">
            <div class="log-head"><b>${thDate(it.date)} · ${hrs(it.hours)} ชม.</b><span class="badge ${cls}">${label}</span></div>
            <div>${e(it.description)}</div>
            <div class="muted">สถานที่: ${e(it.place)}</div>
            <div class="muted">ผู้อนุมัติที่นักเรียนระบุ: ${e(it.approverName)} (${e(it.approverTitle)})</div>
            <div class="muted">บันทึกเมื่อ ${thDateTime(it.createdAt)}</div>
            ${it.photoUrl ? `<img class="preview-img" src="${e(it.photoUrl)}" alt="หลักฐานกิจกรรม" loading="lazy">` : `<div class="warn-box">ไม่ได้แนบหลักฐาน</div>`}
            ${it.status === "approved" ? `<div class="muted">อนุมัติโดย ${e(it.reviewedBy)}</div>` : ""}
            ${it.status === "rejected" ? `<div class="warn-box">ไม่อนุมัติ: ${e(it.rejectReason)}</div>` : ""}
            ${it.status !== "approved" ? `
              <div class="row">
                <div><button data-ok="${it.id}">อนุมัติ</button></div>
                <div><button class="secondary" data-no="${it.id}">ไม่อนุมัติ</button></div>
              </div>
              <div class="hidden" data-reason-box="${it.id}">
                <input data-reason="${it.id}" maxlength="300" placeholder="เหตุผลที่ไม่อนุมัติ เช่น หลักฐานไม่ชัดเจน" style="margin-top:8px">
                <button class="danger small-btn" data-no-confirm="${it.id}">ยืนยันไม่อนุมัติ</button>
              </div>` : ""}
          </div>`;
        }).join("") || `<p class="muted">ภาคเรียนนี้ยังไม่มีการบันทึก</p>`}`;
      const box = $("svDetail");
      box.classList.remove("hidden");
      const review = async (ids, decision, reason) => {
        try {
          App.loading("กำลังบันทึก...");
          const res = await App.api("service.review", { ids, decision, reason });
          await loadService(); await openStudent(sid);
          App.alert(res.message, "สำเร็จ");
        } catch (err) { App.alert(err.message); }
      };
      box.querySelector("[data-all]")?.addEventListener("click", () => review(pend.map((p) => p.id), "approve"));
      box.querySelectorAll("[data-ok]").forEach((b) => (b.onclick = () => review([Number(b.dataset.ok)], "approve")));
      box.querySelectorAll("[data-no]").forEach((b) => (b.onclick = () =>
        box.querySelector(`[data-reason-box="${b.dataset.no}"]`).classList.toggle("hidden")));
      box.querySelectorAll("[data-no-confirm]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.noConfirm;
        review([Number(id)], "reject", box.querySelector(`[data-reason="${id}"]`).value);
      }));
      box.scrollIntoView({ behavior: "smooth" });
    } catch (err) { App.alert(err.message); }
  }

  // ================= คะแนนความประพฤติ =================
  let cur = null;     // ข้อมูลนักเรียนที่เลือกอยู่
  const ACTIONS = ["ว่ากล่าวตักเตือน", "แจ้งผู้ปกครอง", "ทำทัณฑ์บน", "เชิญผู้ปกครองมาพบ", "ส่งต่อฝ่ายปกครอง"];

  async function loadConduct() {
    const hasRoom = me.classrooms.length > 0;
    $("cdRoomCard").classList.toggle("hidden", !hasRoom);
    if (hasRoom) {
      const r = await App.api("conduct.class", { classroom: room() });
      $("cdRoomPeriod").textContent = `ห้อง ม.${room()} · ${r.periodLabel} · คะแนนเต็ม ${r.base}`;
      $("cdRoomBody").innerHTML = r.rows.map((x) => `
        <tr class="pick-row" data-sid="${e(x.studentId)}" tabindex="0"><td>${x.number}</td><td>${e(x.name)}</td><td>${x.count}</td>
        <td><b style="color:${x.score >= r.base * 0.8 ? "#1E7A43" : x.score >= r.base * 0.6 ? "#B45309" : "#B42318"}">${x.score}</b></td></tr>`).join("");
      $("cdRoomBody").querySelectorAll("[data-sid]").forEach((tr) => (tr.onclick = () => openConductStudent(tr.dataset.sid)));
    }
  }

  async function search() {
    const q = $("cdQ").value.trim();
    try {
      App.loading("กำลังค้นหา...");
      const r = await App.api("conduct.search", { q });
      App.close();
      $("cdResults").innerHTML = r.rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th>รหัส</th><th>ชื่อ-สกุล</th><th>ห้อง</th></tr></thead>
        <tbody>${r.rows.map((x) => `<tr class="pick-row" data-sid="${e(x.studentId)}" tabindex="0">
          <td>${e(x.studentId)}</td><td>${e(x.name)}</td><td>ม.${e(x.classroom)} (${x.number})</td></tr>`).join("")}</tbody>
      </table></div><p class="muted">แตะแถวเพื่อเลือกนักเรียน</p>` : `<p class="muted">ไม่พบนักเรียนที่ตรงกับ "${e(q)}"</p>`;
      $("cdResults").querySelectorAll("[data-sid]").forEach((tr) => {
        tr.onclick = () => openConductStudent(tr.dataset.sid);
        tr.onkeydown = (ev) => { if (ev.key === "Enter") openConductStudent(tr.dataset.sid); };
      });
    } catch (err) { App.alert(err.message); }
  }
  $("btnCdSearch").onclick = search;
  $("cdQ").onkeydown = (ev) => { if (ev.key === "Enter") search(); };

  async function openConductStudent(sid) {
    try {
      App.loading("กำลังโหลดข้อมูลนักเรียน...");
      cur = await App.api("conduct.student", { studentId: sid });
      App.close();
      renderStudent();
      $("cdStudent").scrollIntoView({ behavior: "smooth" });
    } catch (err) { App.alert(err.message); }
  }

  function renderStudent() {
    const st = cur.student, sm = cur.summary;
    const groups = [...new Set(cur.rules.map((r) => r.grp))];
    $("cdStudent").innerHTML = `
      <div class="card">
        <div style="display:flex;gap:14px;align-items:center">
          ${st.photoUrl ? `<img src="${e(st.photoUrl)}" alt="รูปนักเรียน" style="width:84px;height:112px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">`
            : `<div style="width:84px;height:112px;border-radius:8px;background:var(--soft-bg);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--muted);text-align:center">ไม่มีรูป</div>`}
          <div>
            <h2 style="margin:0">${e(st.name)}</h2>
            <div class="muted">ม.${e(st.classroom)} เลขที่ ${st.number} · รหัส ${e(st.studentId)}</div>
            <div class="score-big" style="margin:6px 0 0"><b style="font-size:36px">${sm.score}</b><span>/ ${sm.base}</span></div>
            <div class="muted">${e(sm.periodLabel)} · ถูกตัด ${sm.count} ครั้ง</div>
          </div>
        </div>
        <p class="muted" style="margin-bottom:0">ตรวจชื่อและรูปให้ตรงตัวนักเรียนก่อนบันทึกทุกครั้ง</p>
      </div>

      <div class="card">
        <h2>บันทึกการตัดคะแนน</h2>
        <label for="cdRule" style="margin-top:0">ประเภทความผิด</label>
        <select id="cdRule"><option value="">— เลือกประเภทความผิด —</option>
          ${groups.map((g) => `<optgroup label="กลุ่มที่ ${g}">${cur.rules.filter((r) => r.grp === g).map((r) =>
            `<option value="${e(r.code)}">${e(r.code)} ${e(r.title)} (${r.firstPoints}/${r.repeatPoints})${r.times ? ` · ทำแล้ว ${r.times} ครั้ง` : ""}</option>`).join("")}</optgroup>`).join("")}
        </select>
        <div id="cdCalc" class="muted" style="margin-top:6px"></div>
        <label for="cdDetail">รายละเอียดพฤติกรรม</label>
        <textarea id="cdDetail" maxlength="500" style="min-height:90px" placeholder="เช่น มาถึงโรงเรียนเวลา 08:25 น. หลังเคารพธงชาติ"></textarea>
        <label>การดำเนินการ</label>
        <div id="cdActions">${ACTIONS.map((a, i) => `<label class="check-item" style="color:var(--text)"><input type="checkbox" value="${e(a)}" id="cdA${i}"> ${e(a)}</label>`).join("")}</div>
        <input id="cdActOther" maxlength="150" placeholder="การดำเนินการอื่น (ถ้ามี)" style="margin-top:6px">
        <button id="btnCdSave" class="danger">บันทึกตัดคะแนน</button>
      </div>

      <div class="card">
        <h2>ประวัติการถูกตัดคะแนน</h2>
        ${sm.logs.length ? sm.logs.map((l) => `
          <div class="log-item ${l.voided ? "voided" : ""}" style="border-top:1px solid var(--line);padding-top:8px;margin-top:8px">
            <div class="log-head"><b>ข้อ ${e(l.code)} ${e(l.title)}</b><span class="pts">−${l.points}</span></div>
            <div class="muted">${thDateTime(l.at)} · ครั้งที่ ${l.occurrence} · ${e(l.periodLabel)} · โดย ${e(l.recorder)}</div>
            <div>${e(l.detail)}</div>
            ${l.action ? `<div class="muted">การดำเนินการ: ${e(l.action)}</div>` : ""}
            ${l.voided ? `<div class="warn-box">ยกเลิกแล้ว (คืนคะแนน): ${e(l.voidReason)}</div>`
              : `<button class="secondary small-btn" data-void="${l.id}">ยกเลิกรายการนี้ (บันทึกผิด)</button>`}
          </div>`).join("") : `<p class="muted">ไม่มีประวัติ</p>`}
      </div>`;
    $("cdStudent").classList.remove("hidden");

    $("cdRule").onchange = () => {
      const r = cur.rules.find((x) => x.code === $("cdRule").value);
      if (!r) { $("cdCalc").textContent = ""; return; }
      const pts = r.times ? r.repeatPoints : r.firstPoints;
      $("cdCalc").innerHTML = `ครั้งนี้เป็นครั้งที่ <b>${r.times + 1}</b> ของข้อนี้ → ตัด <b style="color:var(--red)">${pts}</b> คะแนน`
        + (r.defaultAction ? `<br>ระเบียบกำหนด: ${e(r.defaultAction)}` : "");
      // ติ๊กการดำเนินการตามที่ระเบียบกำหนดให้อัตโนมัติ
      ACTIONS.forEach((a, i) => { $("cdA" + i).checked = !!r.defaultAction && r.defaultAction.includes(a.replace("มาพบ", "")); });
    };
    $("btnCdSave").onclick = save;
    $("cdStudent").querySelectorAll("[data-void]").forEach((b) => (b.onclick = () => voidLog(Number(b.dataset.void))));
  }

  async function save() {
    const r = cur.rules.find((x) => x.code === $("cdRule").value);
    if (!r) return App.alert("กรุณาเลือกประเภทความผิด");
    const detail = $("cdDetail").value.trim();
    if (!detail) return App.alert("กรุณาบรรยายรายละเอียดพฤติกรรม");
    const actions = ACTIONS.filter((_, i) => $("cdA" + i).checked);
    if ($("cdActOther").value.trim()) actions.push($("cdActOther").value.trim());
    const pts = r.times ? r.repeatPoints : r.firstPoints;
    const ok = await App.confirm(`ยืนยันตัดคะแนน ${pts} คะแนน\n${cur.student.name} (ม.${cur.student.classroom} เลขที่ ${cur.student.number})\nข้อ ${r.code} ${r.title}`, "ยืนยันตัดคะแนน", "ยกเลิก");
    if (!ok) return;
    try {
      App.loading("กำลังบันทึก...");
      const res = await App.api("conduct.record", { studentId: cur.student.studentId, code: r.code, detail, action: actions.join(", ") });
      await openConductStudent(cur.student.studentId);
      if (me.classrooms.length) await loadConduct();
      App.alert(res.message, "บันทึกแล้ว");
    } catch (err) { App.alert(err.message); }
  }

  async function voidLog(id) {
    // ใช้กล่องข้อความในหน้าแทน prompt()
    const reason = await new Promise((resolve) => {
      const o = App._overlay(`<p>เหตุผลที่ยกเลิกรายการนี้</p><input id="vReason" maxlength="300" placeholder="เช่น บันทึกผิดคน">
        <button id="vOk" class="danger">ยืนยันยกเลิก</button><button id="vNo" class="secondary">ปิด</button>`);
      o.querySelector("#vOk").onclick = () => { const v = o.querySelector("#vReason").value.trim(); App.close(); resolve(v || null); };
      o.querySelector("#vNo").onclick = () => { App.close(); resolve(null); };
    });
    if (!reason) return;
    try {
      App.loading();
      const res = await App.api("conduct.void", { id, reason });
      await openConductStudent(cur.student.studentId);
      if (me.classrooms.length) await loadConduct();
      App.alert(res.message, "สำเร็จ");
    } catch (err) { App.alert(err.message); }
  }

  return { loadService, loadConduct };
})();
