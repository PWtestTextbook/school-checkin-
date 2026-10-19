// =====================================================================
// ระบบดูแลช่วยเหลือนักเรียน (หน้าจอครูที่ปรึกษา)
//  1) เยี่ยมบ้าน + PDF   2) SDQ ฉบับครู/ผู้ปกครอง   3) แสดงข้อมูลนักเรียนทั้งห้อง
// =====================================================================
const $ = (id) => document.getElementById(id);
const esc = App.esc;
const S = { me: null, cls: null, main: "view", dataView: "pp8", layout: "list", sdqVer: "student", sortKey: "number", sortDir: "desc" };
const room = () => $("room").value;
const thaiDT = (iso) => (iso ? new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" }) : "");

// ---------- เริ่มต้น ----------
(async () => {
  try {
    await App.init(CONFIG.LIFF_CARE);
    App.loading("กำลังโหลด...");
    S.me = await App.api("me");
    App.close();
    if (!S.me.registered) return App.alert("กรุณาลงทะเบียนรหัสครูในระบบครูที่ปรึกษาก่อน");
    $("room").innerHTML = S.me.classrooms.map((c) => `<option value="${esc(c)}">ห้อง ม.${esc(c)}</option>`).join("");
    if (S.me.myClassroom) $("room").value = S.me.myClassroom;
    $("careTop").classList.remove("hidden");
    await loadClass();
  } catch (e) { App.alert(e.message); }
})();

$("room").onchange = () => loadClass();
document.querySelectorAll("[data-main]").forEach((b) => (b.onclick = () => { S.main = b.dataset.main; showMain(); }));
document.querySelectorAll("#segData [data-v]").forEach((b) => (b.onclick = () => { S.dataView = b.dataset.v; renderData(); }));

async function loadClass() {
  App.loading("กำลังโหลดข้อมูลห้อง...");
  try { S.cls = await App.api("care.classData", { classroom: room() }); App.close(); showMain(); }
  catch (e) { App.alert(e.message); }
}

function setHead(title, code) {
  $("docTitle").textContent = title;
  $("docCode").textContent = code || "";
  $("docCode").classList.toggle("hidden", !code);
}
function showOnly(id) {
  ["viewData", "viewVisit", "viewSdq", "viewForm", "viewPreview"].forEach((x) => $(x).classList.toggle("hidden", x !== id));
  $("careTop").classList.toggle("hidden", !["viewData", "viewVisit", "viewSdq"].includes(id));
  window.scrollTo(0, 0);
}
function showMain() {
  setHead("ระบบดูแลช่วยเหลือนักเรียน", `ม.${room()} · ${S.cls.semester}/${S.cls.academicYear}`);
  document.querySelectorAll("[data-main]").forEach((b) => b.classList.toggle("on", b.dataset.main === S.main));
  if (S.main === "view") { showOnly("viewData"); renderData(); }
  if (S.main === "visit") { showOnly("viewVisit"); renderVisitList(); }
  if (S.main === "sdq") { showOnly("viewSdq"); renderSdqList(); }
}

// =====================================================================
// 3. แสดงข้อมูล
// =====================================================================
function renderData() {
  document.querySelectorAll("#segData [data-v]").forEach((b) => b.classList.toggle("on", b.dataset.v === S.dataView));
  const v = S.dataView, list = S.cls.students;
  const layoutBar = `<div class="seg"><button data-lay="list" class="${S.layout === "list" ? "on" : ""}">☰ รายการ</button>
    <button data-lay="carousel" class="${S.layout === "carousel" ? "on" : ""}">▭ การ์ดเลื่อน</button></div>`;
  let html = "";
  if (v === "pp8") {
    const done = list.filter((s) => s.pp8).length;
    html = `<div class="toolbar">${layoutBar}<span class="muted">กรอกแล้ว ${done}/${list.length} คน</span></div>`
      + layout(list, pp8Card, (s) => (s.pp8 ? `${esc(s.pp8.nickname || "")}${s.pp8Flags ? " · ⚠ ควรติดตาม" : ""}` : "ยังไม่กรอก"));
  } else if (v === "sdq") {
    const vers = [["student", "ฉบับนักเรียน"], ["teacher", "ฉบับครู"], ["parent", "ฉบับผู้ปกครอง"]];
    const cnt = (lv) => list.filter((s) => s.sdq[S.sdqVer]?.result?.totalLevel === lv).length;
    html = `<div class="seg">${vers.map(([k, t]) => `<button data-sdqv="${k}" class="${S.sdqVer === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="chips-sum"><span>ปกติ ${cnt("ปกติ")}</span><span>เสี่ยง ${cnt("เสี่ยง")}</span><span>มีปัญหา ${cnt("มีปัญหา")}</span>
      <span>ยังไม่ประเมิน ${list.filter((s) => !s.sdq[S.sdqVer]).length}</span></div>
      <div class="toolbar">${layoutBar}</div>`
      + layout(list, (s) => sdqCard(s, S.sdqVer), (s) => {
        const r = s.sdq[S.sdqVer]?.result;
        return r ? `รวม 4 ด้าน ${r.total} · ${r.totalLevel}` : "ยังไม่ประเมิน";
      });
  } else if (v === "eq") {
    html = `<div class="toolbar">${layoutBar}</div>` + layout(list, eqCard, (s) => (s.eq ? `EQ ${s.eq.result.total} · ${s.eq.result.totalLevel}` : "ยังไม่ประเมิน"));
  } else if (v === "contact") {
    html = contactTable(list);
  } else {
    html = incomeTable(list);
  }
  $("dataBody").innerHTML = html;
  $("dataBody").querySelectorAll("[data-lay]").forEach((b) => (b.onclick = () => { S.layout = b.dataset.lay; renderData(); }));
  $("dataBody").querySelectorAll("[data-sdqv]").forEach((b) => (b.onclick = () => { S.sdqVer = b.dataset.sdqv; renderData(); }));
  const car = $("dataBody").querySelector(".carousel");
  if (car) car.onscroll = () => {
    const i = Math.round(car.scrollLeft / (car.firstElementChild.offsetWidth + 12));
    $("carCount").textContent = `${Math.min(i + 1, list.length)} / ${list.length}`;
  };
  const sel = $("sortKey");
  if (sel) {
    sel.onchange = () => { S.sortKey = sel.value; renderData(); };
    $("sortDir").onclick = () => { S.sortDir = S.sortDir === "desc" ? "asc" : "desc"; renderData(); };
  }
}

/** แสดงเป็นรายการ (แตะเพื่อดูการ์ด) หรือการ์ดเลื่อน */
function layout(list, cardFn, subFn) {
  if (S.layout === "carousel") {
    return `<div class="carousel">${list.map(cardFn).join("")}</div><div class="car-count" id="carCount">1 / ${list.length}</div>`;
  }
  return list.map((s) => `<details class="list-row"><summary><span class="no">${s.number}</span>
    <span class="nm">${esc(s.name)}<small>${subFn(s)}</small></span><span>›</span></summary>${cardFn(s)}</details>`).join("");
}

function bubble(s, sub, body, foot, empty) {
  return `<div class="bubble ${empty ? "empty" : ""}"><div class="bh"><div class="no">${s.number}</div>
    <div><b>${esc(s.name)}</b><small>${esc(sub)}</small></div></div>
    <div class="bb">${body}</div>${foot ? `<div class="bf">${foot}</div>` : ""}</div>`;
}
const kv = (k, v) => (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length) ? ""
  : `<div class="kv"><span>${esc(k)}</span><b>${esc(Array.isArray(v) ? v.join(", ") : v)}</b></div>`);

function pp8Card(s) {
  const p = s.pp8;
  if (!p) return bubble(s, `ม.${room()} · ${s.gender}`, "นักเรียนยังไม่ได้กรอกระเบียนสะสม (ปพ.8)", "", true);
  const gpa = ["m6_s2", "m6_s1", "m5_s2", "m5_s1", "m4_s2", "m4_s1", "m3", "m2", "m1"].map((k) => [k, p["gpa_" + k]]).find(([, v]) => v);
  const body = `
    <div class="sec">ข้อมูลส่วนตัว</div>${kv("ชื่อเล่น", p.nickname)}${kv("วันเกิด", p.birth_date ? new Date(p.birth_date).toLocaleDateString("th-TH", { dateStyle: "long" }) : "")}
    ${kv("โทรศัพท์", p.phone)}${kv("อาศัยอยู่กับ", p.lives_with)}${kv("เดินทางโดย", p.travel)}${kv("ระยะทาง", p.distance_km ? p.distance_km + " กม." : "")}${kv("ความสามารถพิเศษ", p.talent)}
    <div class="sec">ครอบครัว</div>${kv("บิดา", [p.father_name, p.father_age && p.father_age + " ปี", p.father_job].filter(Boolean).join(" · "))}
    ${kv("มารดา", [p.mother_name, p.mother_age && p.mother_age + " ปี", p.mother_job].filter(Boolean).join(" · "))}
    ${kv("โทรบิดา/มารดา", p.parent_phone)}${kv("สถานภาพบิดามารดา", p.parent_status)}${kv("รายได้ครอบครัว", p.family_income)}
    ${kv("ผู้ออกค่าใช้จ่าย", [p.payer_name, p.payer_relation].filter(Boolean).join(" · "))}
    ${kv("พี่น้อง", p.siblings_total ? `บุตรคนที่ ${p.birth_order || "-"} จาก ${p.siblings_total} คน` : "")}
    <div class="sec">สุขภาพและเศรษฐกิจ</div>${kv("น้ำหนัก/ส่วนสูง", p.weight ? `${p.weight} กก. / ${p.height} ซม. (BMI ${p.bmi})` : "")}
    ${kv("โรคประจำตัว", p.chronic_disease)}${kv("เงินมาโรงเรียน/วัน", p.money_per_day ? p.money_per_day + " บาท" : "")}${kv("งานพิเศษ", p.parttime_job)}
    ${kv("ค่าใช้จ่าย", p.expense_opinion)}
    <div class="sec">สิ่งแวดล้อม การเรียน และสังคม</div>${kv("โรงเรียน", p.school_feel)}${kv("บรรยากาศบ้าน", [p.home_warmth, p.home_unity].filter(Boolean).join(", "))}
    ${kv("ปัญหาการเรียน", p.study_problems)}${kv("เกรดเฉลี่ยล่าสุด", gpa ? `${gpa[1]} (${gpa[0].replace("_s", " ภาค ").replace("m", "ม.")})` : "")}
    ${kv("เพื่อนสนิท", [p.best_friend, p.best_friend_class].filter(Boolean).join(" · "))}${kv("ในกลุ่มเพื่อน", p.peer_role)}
    ${kv("มุมมองต่อตนเอง/โลก", [p.self_worth, p.world_view].filter(Boolean).join(" / "))}
    <div class="sec">เป้าหมายและปัญหา</div>${kv("อาชีพที่อยากเป็น", p.career)}${kv("ปัญหาที่ประสบ", p.problems)}${kv("ต้องการความช่วยเหลือจาก", p.help_from)}
    ${s.pp8Flags ? `<div class="flag">⚠ ควรติดตาม: ${esc(s.pp8Flags)}</div>` : ""}`;
  return bubble(s, `ระเบียนสะสม (ปพ.8) · ${p.nickname || ""}`, body, `ปรับปรุงล่าสุด ${thaiDT(s.pp8UpdatedAt)}`);
}

const VER_TXT = { student: "ฉบับนักเรียน", teacher: "ฉบับครู", parent: "ฉบับผู้ปกครอง" };
function sdqCard(s, ver) {
  const r = s.sdq[ver];
  if (!r) return bubble(s, `SDQ ${VER_TXT[ver]}`, "ยังไม่มีผลการประเมิน", "", true);
  return bubble(s, `SDQ ${VER_TXT[ver]} · รอบ ${r.period}`, sdqResultHtml(r.result), `ประเมินเมื่อ ${thaiDT(r.updatedAt)}`);
}
function eqCard(s) {
  if (!s.eq) return bubble(s, "EQ", "ยังไม่มีผลการประเมิน", "", true);
  return bubble(s, `EQ · รอบ ${s.eq.period}`, eqResultHtml(s.eq.result), `ประเมินเมื่อ ${thaiDT(s.eq.updatedAt)}`);
}

// ---------- เบอร์โทร / ที่พัก ----------
function contactOf(s) {
  const h = s.homevisit?.data ? hvGuardian(s.homevisit.data) : null, p = s.pp8 || {};
  const addr = (x, pre) => [x[pre + "_no"] && "เลขที่ " + x[pre + "_no"], x[pre + "_moo"] && x[pre + "_moo"] !== "-" && "ม." + x[pre + "_moo"],
    x[pre + "_village"] && x[pre + "_village"] !== "-" && x[pre + "_village"], x[pre + "_subdistrict"] && "ต." + x[pre + "_subdistrict"],
    x[pre + "_district"] && "อ." + x[pre + "_district"], x[pre + "_province"] && "จ." + x[pre + "_province"]].filter(Boolean).join(" ");
  return {
    student: p.phone, father: h?.father_phone || p.parent_phone, mother: h?.mother_phone || p.parent_phone,
    guardian: h?.guardian_phone, guardianRel: h?.guardian_relation,
    home: h ? (h.cur_same === "ต่างจากทะเบียนบ้าน" ? addr(h, "cur") : addr(h, "reg")) : p.parent_address,
    livesWith: h?.lives_with || p.lives_with, source: h ? "เยี่ยมบ้าน" : p.phone || p.parent_phone ? "ปพ.8" : "",
  };
}
function contactTable(list) {
  const tel = (n) => (n ? `<a href="tel:${esc(String(n).replace(/[^\d+]/g, ""))}">${esc(n)}</a>` : "-");
  return `<p class="muted">ข้อมูลจากบันทึกเยี่ยมบ้าน (ถ้ามี) หรือจาก ปพ.8 · แตะเบอร์เพื่อโทร</p>
    <div class="data-table"><table><thead><tr><th>เลขที่</th><th>ชื่อ-สกุล</th><th>นักเรียน</th><th>บิดา</th><th>มารดา</th><th>ผู้ปกครอง</th><th>สถานที่พัก</th></tr></thead><tbody>
    ${list.map((s) => { const c = contactOf(s); return `<tr><td>${s.number}</td><td>${esc(s.name)}</td><td>${tel(c.student)}</td><td>${tel(c.father)}</td>
      <td>${tel(c.mother)}</td><td>${tel(c.guardian)}${c.guardianRel ? `<br><small class="muted">${esc(c.guardianRel)}</small>` : ""}</td>
      <td style="white-space:normal;min-width:180px">${esc(c.home || "-")}${c.livesWith ? `<br><small class="muted">พักกับ ${esc(c.livesWith)}</small>` : ""}</td></tr>`; }).join("")}
    </tbody></table></div>`;
}

// ---------- รายได้ (เรียงลำดับได้) ----------
function incomeOf(s) {
  const h = s.homevisit?.data;
  if (!h) return { father: null, mother: null, guardian: null, total: null, bracket: s.pp8?.family_income || "" };
  const g = hvGuardian(h);
  const n = (v) => (v === undefined || v === "" || v === null ? null : hvNum(v));
  const father = n(h.father_income), mother = n(h.mother_income), guardian = n(g.guardian_income);
  const extra = ["บิดา", "มารดา"].includes(h.guardian_relation) ? 0 : guardian || 0;
  const total = father === null && mother === null && guardian === null ? null : (father || 0) + (mother || 0) + extra;
  return { father, mother, guardian, total, rel: h.guardian_relation, bracket: s.pp8?.family_income || "" };
}
function incomeTable(list) {
  const rows = list.map((s) => ({ s, i: incomeOf(s) }));
  const k = S.sortKey, dir = S.sortDir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (k === "number") return (a.s.number - b.s.number) * (S.sortDir === "asc" ? 1 : 1);
    const x = a.i[k], y = b.i[k];
    if (x === null && y === null) return a.s.number - b.s.number;
    if (x === null) return 1;                     // ไม่มีข้อมูลไว้ท้ายเสมอ
    if (y === null) return -1;
    return (x - y) * dir || a.s.number - b.s.number;
  });
  const m = (v) => (v === null ? "-" : v.toLocaleString("th-TH"));
  const opts = [["number", "เลขที่"], ["father", "รายได้บิดา"], ["mother", "รายได้มารดา"], ["guardian", "รายได้ผู้ปกครอง"], ["total", "รายได้รวม"]];
  return `<div class="toolbar"><select id="sortKey">${opts.map(([v, t]) => `<option value="${v}" ${k === v ? "selected" : ""}>เรียงตาม: ${t}</option>`).join("")}</select>
    <button class="secondary small" id="sortDir" ${k === "number" ? "disabled" : ""}>${S.sortDir === "desc" ? "มาก → น้อย ↓" : "น้อย → มาก ↑"}</button></div>
    <p class="muted">หน่วย: บาท/เดือน จากบันทึกเยี่ยมบ้าน · คอลัมน์สุดท้ายคือรายได้ครอบครัวต่อปีจาก ปพ.8</p>
    <div class="data-table"><table><thead><tr><th>เลขที่</th><th>ชื่อ-สกุล</th><th>บิดา</th><th>มารดา</th><th>ผู้ปกครอง</th><th>รวม</th><th>ปพ.8</th></tr></thead><tbody>
    ${rows.map(({ s, i }) => `<tr><td>${s.number}</td><td>${esc(s.name)}</td><td class="money">${m(i.father)}</td><td class="money">${m(i.mother)}</td>
      <td class="money">${m(i.guardian)}${i.rel ? `<br><small class="muted">${esc(i.rel)}</small>` : ""}</td><td class="money"><b>${m(i.total)}</b></td>
      <td style="white-space:normal;font-size:12px">${esc(i.bracket || "-")}</td></tr>`).join("")}
    </tbody></table></div>`;
}

// =====================================================================
// รายชื่อสำหรับงานครู
// =====================================================================
const LV_CLS = { "ปกติ": "ok", "เสี่ยง": "late", "มีปัญหา": "absent" };
function renderVisitList() {
  const list = S.cls.students, done = list.filter((s) => s.homevisit?.period === S.cls.period).length;
  $("viewVisit").innerHTML = `<div class="chips-sum"><span>เยี่ยมแล้ว ${done}/${list.length}</span>
    ${["ปกติ", "เสี่ยง", "มีปัญหา"].map((l) => `<span>${l} ${list.filter((s) => s.homevisit?.period === S.cls.period && s.homevisit.screening === l).length}</span>`).join("")}</div>`
    + list.map((s) => {
      const h = s.homevisit, cur = h?.period === S.cls.period;
      const st = cur ? `เยี่ยมแล้ว ${thaiDT(h.data?.visit_date)} <span class="badge ${LV_CLS[h.screening] || ""}">${esc(h.screening || "")}</span>`
        : h ? `รอบก่อน ${esc(h.period)}` : "ยังไม่ได้เยี่ยมบ้าน";
      return `<div class="task-row"><span class="no">${s.number}</span><div class="nm">${esc(s.name)}<small>${st}</small></div>
        <div class="acts">${cur && h.pdfUrl ? `<button class="secondary" data-pdf="${esc(h.pdfUrl)}">PDF</button>` : ""}
        <button data-visit="${s.studentId}" class="${cur ? "secondary" : ""}">${cur ? "แก้ไข" : "บันทึก"}</button></div></div>`;
    }).join("");
  $("viewVisit").querySelectorAll("[data-visit]").forEach((b) => (b.onclick = () => openHomeVisit(b.dataset.visit)));
  $("viewVisit").querySelectorAll("[data-pdf]").forEach((b) => (b.onclick = () => openUrl(b.dataset.pdf)));
}
function renderSdqList() {
  const list = S.cls.students, cur = (r) => r && r.period === S.cls.period;
  const lab = (r) => (cur(r) ? `<span class="badge ${LV_CLS[r.result.totalLevel]}">${r.result.totalLevel}</span>` : "ยังไม่ประเมิน");
  $("viewSdq").innerHTML = `<div class="chips-sum"><span>ครูประเมินแล้ว ${list.filter((s) => cur(s.sdq.teacher)).length}/${list.length}</span>
    <span>ผู้ปกครองแล้ว ${list.filter((s) => cur(s.sdq.parent)).length}/${list.length}</span></div>
    <p class="muted">ฉบับผู้ปกครอง: ครูอ่านคำถามให้ผู้ปกครองตอบ (เช่น ระหว่างเยี่ยมบ้าน) แล้วบันทึกแทน</p>`
    + list.map((s) => `<div class="task-row"><span class="no">${s.number}</span>
      <div class="nm">${esc(s.name)}<small>ครู: ${lab(s.sdq.teacher)} · ผู้ปกครอง: ${lab(s.sdq.parent)}</small></div>
      <div class="acts"><button data-sdq="teacher" data-id="${s.studentId}" class="${cur(s.sdq.teacher) ? "secondary" : ""}">ครูประเมิน</button>
      <button data-sdq="parent" data-id="${s.studentId}" class="secondary">ผู้ปกครอง</button></div></div>`).join("");
  $("viewSdq").querySelectorAll("[data-sdq]").forEach((b) => (b.onclick = () => openSdq(b.dataset.id, b.dataset.sdq)));
}

// =====================================================================
// 2. SDQ ฉบับครู / ฉบับผู้ปกครอง
// =====================================================================
async function openSdq(studentId, version) {
  const kind = version === "parent" ? "sdq_parent" : "sdq_teacher";
  let ctx;
  try { App.loading(); ctx = await App.api("care.studentContext", { studentId, kind }); App.close(); }
  catch (e) { return App.alert(e.message); }
  let data = {};
  const title = version === "parent" ? "SDQ ฉบับผู้ปกครองประเมิน" : "SDQ ฉบับครูประเมินนักเรียน";
  if (ctx.record) {
    if (!(await App.confirm(`${title}\nของ ${ctx.student.name} บันทึกแล้วเมื่อ ${thaiDT(ctx.record.updatedAt)}\n\nต้องการแก้ไขข้อมูลหรือไม่?`, "แก้ไข", "ยกเลิก"))) return;
    data = { ...ctx.record.data };
  }
  setHead(title, `ม.${ctx.student.classroom} เลขที่ ${ctx.student.number}`);
  showOnly("viewForm");
  FormEngine.create({
    root: $("viewForm"), steps: sdqSteps(version, ctx.student.name), data,
    draftKey: `draft_${kind}_${studentId}_${ctx.period}`, submitText: ctx.record ? "บันทึกการปรับปรุง" : "บันทึกผลประเมิน",
    onExit: () => showMain(),
    onSubmit: async (d) => {
      if (!(await App.confirm(ctx.record ? "ยืนยันบันทึกทับข้อมูลเดิม?" : "ยืนยันบันทึกผลการประเมิน?"))) return;
      try {
        App.loading("กำลังบันทึก...");
        let r = await App.api("care.sdqSave", { studentId, version, data: d, confirmUpdate: !!ctx.record });
        if (r.needConfirm) {
          App.close();
          if (!(await App.confirm(`มีการบันทึกไว้แล้วเมื่อ ${thaiDT(r.submittedAt)} ต้องการบันทึกทับหรือไม่?`))) return;
          App.loading(); r = await App.api("care.sdqSave", { studentId, version, data: d, confirmUpdate: true });
        }
        App.close();
        try { localStorage.removeItem(`draft_${kind}_${studentId}_${ctx.period}`); } catch { /* ข้าม */ }
        $("viewPreview").innerHTML = `<div class="paper"><div class="done-box"><div class="tick">✓</div>
          <h2>${r.updated ? "ปรับปรุงผลประเมินแล้ว" : "บันทึกผลประเมินแล้ว"}</h2><p class="muted">${esc(title)} · ${esc(ctx.student.name)}</p></div>
          ${sdqResultHtml(r.result)}<button class="primary" id="btnBack">กลับรายชื่อ</button></div>`;
        $("btnBack").onclick = async () => { await loadClass(); };
        showOnly("viewPreview");
      } catch (e) { App.alert(e.message); }
    },
  });
}

// =====================================================================
// 1. เยี่ยมบ้าน
// =====================================================================
let HV = null;   // { ctx, engine, photoState }

async function openHomeVisit(studentId) {
  let ctx;
  try { App.loading("กำลังดึงข้อมูลนักเรียน..."); ctx = await App.api("care.studentContext", { studentId, kind: "homevisit" }); App.close(); }
  catch (e) { return App.alert(e.message); }
  const draftKey = `draft_hv_${studentId}_${ctx.period}`;
  let data, prefilled = new Set();
  const photoState = { photo1: "none", photo2: "none" };
  if (ctx.record) {
    if (!(await App.confirm(`บันทึกเยี่ยมบ้านของ ${ctx.student.name}\nบันทึกแล้วเมื่อ ${thaiDT(ctx.record.updatedAt)}\n\nต้องการแก้ไขข้อมูลหรือไม่?`, "แก้ไข", "ยกเลิก"))) return;
    data = { ...ctx.record.data };
    for (const k of ["photo1", "photo2"]) if (ctx.photos?.[k]) { data[k] = ctx.photos[k]; photoState[k] = "keep"; }
  } else {
    const pf = hvPrefill(ctx);
    data = pf.data; prefilled = pf.prefilled;
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null");
      if (draft && (await App.confirm("พบข้อมูลที่กรอกค้างไว้ ต้องการกรอกต่อหรือไม่?", "กรอกต่อ", "เริ่มใหม่"))) data = { ...data, ...draft };
    } catch { /* ข้าม */ }
  }
  data.consent = false;
  setHead("แบบเก็บข้อมูลเยี่ยมบ้านนักเรียนรายบุคคล", `${ctx.student.name} · ม.${ctx.student.classroom}`);
  showOnly("viewForm");
  const engine = FormEngine.create({
    root: $("viewForm"), steps: hvSteps(ctx, prefilled), data, draftKey, draftExclude: ["photo1", "photo2"],
    submitText: "ดูตัวอย่าง PDF", onExit: () => showMain(),
    onSubmit: (d) => previewHomeVisit(d),
  });
  HV = { ctx, engine, photoState, draftKey, isEdit: !!ctx.record };
}

// ปุ่มในแบบฟอร์มเยี่ยมบ้าน: ถ่าย/ลบรูป, สร้างข้อความสรุปใหม่
let pickTarget = null;
$("viewForm").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || !HV) return;
  const d = HV.engine.data;
  if (b.dataset.action === "pick") { pickTarget = b.dataset.photo; $("hvPhotoInput").click(); }
  if (b.dataset.action === "del") { d[b.dataset.photo] = null; HV.photoState[b.dataset.photo] = "deleted"; HV.engine.render(); }
  if (b.dataset.action === "hv-regen") {
    if (!(await App.confirm("สร้างข้อความสรุปใหม่จากข้อมูลล่าสุด? ข้อความที่แก้ไขไว้จะถูกแทนที่"))) return;
    const s = hvSuggest(d, HV.ctx);
    Object.assign(d, { concerns: s.concerns, conclusion: s.conclusion, screening: s.screening });
    const y = window.scrollY; HV.engine.render(); window.scrollTo(0, y);
  }
});
$("viewForm").addEventListener("change", async (e) => {
  if (e.target.id !== "hvPhotoInput" || !HV || !pickTarget) return;
  const file = e.target.files[0];
  if (!file) return;
  try {
    App.loading("กำลังย่อขนาดรูป...");
    HV.engine.data[pickTarget] = await App.compressImage(file, 1280, 0.7);   // ≈ ไม่เกิน 250 KB
    HV.photoState[pickTarget] = "new";
    App.close();
    HV.engine.render();
  } catch (err) { App.alert(err.message); }
});

/** สร้าง PDF แล้วแสดงตัวอย่างก่อนยืนยันบันทึก */
async function previewHomeVisit(d) {
  try {
    App.loading("กำลังจัดหน้ารายงาน...");
    const pages = await hvLayoutPages(hvReportBlocks(d, HV.ctx), $("rpHost"));
    const pdf = await hvRenderPdf(pages, (i, n) => App.loading(`กำลังสร้าง PDF หน้า ${i}/${n}...`));
    $("rpHost").innerHTML = "";
    HV.pdf = pdf;
    App.close();
    const sizeKb = Math.round((pdf.pdfDataUrl.length * 0.75) / 1024);
    $("viewPreview").innerHTML = `<div class="step-head"><div class="step-no">ตัวอย่างไฟล์ PDF · ${pdf.images.length} หน้า · ${sizeKb} KB</div>
      <h2>ตรวจทานก่อนยืนยัน</h2><p class="step-desc">ไฟล์นี้จะถูกเก็บใน Google Drive ของโรงเรียน และบันทึกข้อมูลลง Google Sheet</p></div>
      <div class="preview-pages">${pdf.images.map((src) => `<img src="${src}" alt="หน้า PDF">`).join("")}</div>
      <div class="preview-bar"><button class="secondary" id="pvBack">กลับไปแก้ไข</button><button class="primary" id="pvSave">ยืนยันบันทึกและส่ง PDF</button></div>`;
    showOnly("viewPreview");
    $("pvBack").onclick = () => { showOnly("viewForm"); HV.engine.render(); };
    $("pvSave").onclick = () => saveHomeVisit(d);
  } catch (e) { App.alert("สร้าง PDF ไม่สำเร็จ: " + e.message); }
}

async function saveHomeVisit(d) {
  const { ctx, photoState, pdf } = HV;
  const data = hvGuardian({ ...d });
  delete data.photo1; delete data.photo2;
  const photos = {};
  for (const k of ["photo1", "photo2"]) photos[k] = photoState[k] === "new" ? d[k] : photoState[k] === "keep" ? "keep" : null;
  const send = (confirmUpdate) => App.api("care.homevisitSave", { studentId: ctx.student.studentId, data, photos, pdf: pdf.pdfDataUrl, confirmUpdate });
  try {
    App.loading("กำลังบันทึกและอัปโหลด PDF...");
    let r = await send(HV.isEdit);
    if (r.needConfirm) {
      App.close();
      if (!(await App.confirm(`มีบันทึกเยี่ยมบ้านแล้วเมื่อ ${thaiDT(r.submittedAt)} ต้องการบันทึกทับหรือไม่?`))) return;
      App.loading("กำลังบันทึก..."); r = await send(true);
    }
    App.close();
    try { localStorage.removeItem(HV.draftKey); } catch { /* ข้าม */ }
    const url = r.files?.pdf?.url;
    const fname = `เยี่ยมบ้าน_${ctx.student.studentId}_${ctx.student.firstName}.pdf`;
    $("viewPreview").innerHTML = `<div class="paper"><div class="done-box"><div class="tick">✓</div>
      <h2>${r.updated ? "ปรับปรุงบันทึกเยี่ยมบ้านแล้ว" : "บันทึกเยี่ยมบ้านเรียบร้อย"}</h2>
      <p class="muted">${esc(ctx.student.name)} · ผลคัดกรอง: กลุ่ม${esc(d.screening)}</p></div>
      ${url ? `<button class="primary" id="btnDrive">เปิดไฟล์ PDF ใน Google Drive</button>` : ""}
      <button class="secondary" id="btnSave">บันทึก PDF ลงเครื่อง</button>
      <button class="secondary" id="btnList">กลับรายชื่อเยี่ยมบ้าน</button></div>`;
    if (url) $("btnDrive").onclick = () => openUrl(url);
    $("btnSave").onclick = () => savePdf(pdf.blob, fname, url);
    $("btnList").onclick = async () => { HV = null; S.main = "visit"; await loadClass(); };
  } catch (e) { App.alert(e.message); }
}

/** เก็บ PDF ลงเครื่อง: ใช้เมนูแชร์ของมือถือถ้าทำได้ ไม่เช่นนั้นดาวน์โหลดตรง */
async function savePdf(blob, name, driveUrl) {
  const file = new File([blob], name, { type: "application/pdf" });
  try {
    if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: name });
  } catch (e) { if (e.name === "AbortError") return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  if (liff.isInClient() && driveUrl) {
    App.alert("หากแอป LINE ไม่ดาวน์โหลดไฟล์ ให้กด \"เปิดไฟล์ PDF ใน Google Drive\" แล้วดาวน์โหลดจาก Drive แทน");
  }
}
function openUrl(url) {
  if (window.liff && liff.isInClient()) liff.openWindow({ url, external: true });
  else window.open(url, "_blank");
}
