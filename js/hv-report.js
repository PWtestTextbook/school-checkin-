// =====================================================================
// สร้างรายงานเยี่ยมบ้านเป็น PDF ขนาด A4
// วิธีทำ: สร้าง HTML ตามแบบฟอร์ม → จัดลงหน้า A4 → html2canvas แปลงเป็นภาพ → jsPDF รวมเป็นไฟล์
// (วิธีนี้ทำให้ภาษาไทยแสดงถูกต้องเพราะใช้ฟอนต์ของเบราว์เซอร์)
// =====================================================================
const RP = { W: 794, H: 1123, PAD: 48 };          // A4 ที่ 96 dpi (พิกเซล)

function rpVal(v) {
  if (Array.isArray(v)) return v.length ? v.join(", ") : "-";
  return v === undefined || v === null || String(v).trim() === "" ? "-" : String(v);
}
const rpEsc = (s) => App.esc(rpVal(s));

/** สร้างกล่องเนื้อหาของรายงาน (แต่ละกล่องจะไม่ถูกตัดกลางหน้า) */
function hvReportBlocks(d0, ctx) {
  const d = hvGuardian(d0), st = ctx.student, B = [];
  const row = (pairs) => `<tr>${pairs.map(([l, v]) => `<th>${App.esc(l)}</th><td>${rpEsc(v)}</td>`).join("")}</tr>`;
  const table = (title, rows) => B.push(`${title ? `<h3>${App.esc(title)}</h3>` : ""}<table class="rp-t">${rows.map(row).join("")}</table>`);
  const addr = (p) => [d[p + "_no"] && `เลขที่ ${d[p + "_no"]}`, d[p + "_village"] && d[p + "_village"] !== "-" && `${d[p + "_village"]}`,
    d[p + "_moo"] && d[p + "_moo"] !== "-" && `หมู่ ${d[p + "_moo"]}`, d[p + "_subdistrict"] && `ต.${d[p + "_subdistrict"]}`,
    d[p + "_district"] && `อ.${d[p + "_district"]}`, d[p + "_province"] && `จ.${d[p + "_province"]}`, d[p + "_postcode"]].filter(Boolean).join(" ");
  const money = (v) => (hvNum(v) ? `${hvMoney(v)} บาท` : "-");
  const dateTh = (v) => (v ? new Date(v).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" }) : "-");

  B.push(`<div class="rp-head">
    <div class="rp-crest">เยี่ยมบ้าน</div>
    <h1>แบบเก็บข้อมูลเยี่ยมบ้านนักเรียนรายบุคคล</h1>
    <div>ภาคเรียนที่ ${ctx.semester} ปีการศึกษา ${ctx.academicYear}</div>
    <div>${App.esc(CONFIG.SCHOOL_NAME)}</div>
    <div class="rp-date">วันที่เยี่ยมบ้าน ${dateTh(d.visit_date)}</div></div>`);

  B.push(`<h2>ตอนที่ 1 ข้อมูลพื้นฐาน</h2>`);
  table("1. ข้อมูลพื้นฐานนักเรียน", [
    [["ชื่อ-สกุล", st.name], ["ชื่อเล่น", d.nickname]],
    [["ชื่อ-สกุล (อังกฤษ)", d.name_en], ["เพศ", st.gender]],
    [["เลขประจำตัวนักเรียน", st.studentId], ["ชั้น/เลขที่", `ม.${st.classroom} เลขที่ ${st.number}`]],
    [["เลขประจำตัวประชาชน", d.citizen_id], ["เลขที่ทางราชการออกให้", d.foreign_id]],
    [["วันเกิด", dateTh(d.birth_date)], ["อายุ", hvAge(d.birth_date, d.visit_date)]],
    [["สัญชาติ/เชื้อชาติ", `${rpVal(d.nationality)} / ${rpVal(d.ethnicity)}`], ["ศาสนา", d.religion]],
  ]);
  table("2. ประวัติการเรียน", [
    [["จบการศึกษาระดับ", d.prev_level], ["ผลการเรียนเฉลี่ย", d.prev_gpa]],
    [["จากโรงเรียน", d.prev_school], ["สังกัด", d.prev_affiliation]],
    [["ที่ตั้ง", [d.prev_subdistrict && `ต.${d.prev_subdistrict}`, d.prev_district && `อ.${d.prev_district}`, d.prev_province && `จ.${d.prev_province}`].filter(Boolean).join(" ")], ["โทรศัพท์", d.prev_phone]],
  ]);
  table("3. ข้อมูลสุขภาพ", [
    [["น้ำหนัก/ส่วนสูง", `${rpVal(d.weight)} กก. / ${rpVal(d.height)} ซม.`], ["รูปร่าง", hvShape(d.weight, d.height)]],
    [["หมู่โลหิต", d.blood_type], ["โรคประจำตัว", d.chronic === "มีโรคประจำตัว" ? d.chronic_detail : d.chronic]],
  ]);
  table("4. ที่อยู่ของนักเรียน", [
    [["ตามทะเบียนบ้าน", addr("reg")]],
    [["ที่อยู่ปัจจุบัน", d.cur_same === "ต่างจากทะเบียนบ้าน" ? addr("cur") : "ตรงกับที่อยู่ตามทะเบียนบ้าน"]],
  ]);
  table("", [[["5. ความด้อยโอกาส", d.disadvantage]], [["6. ความพิการ", d.disability]]]);

  B.push(`<h2>ตอนที่ 2 ข้อมูลครอบครัว</h2>`);
  const person = (title, p, flag) => table(title, [
    ...(flag ? [[["สถานะ", flag]]] : []),
    [["ชื่อ-สกุล", d[p + "_name"]], ["เลขประจำตัวประชาชน", d[p + "_id"]]],
    [["อายุ", d[p + "_age"] ? `${d[p + "_age"]} ปี` : "-"], ["อาชีพ", d[p + "_job"]]],
    [["รายได้ต่อเดือน", money(d[p + "_income"])], ["โทรศัพท์", d[p + "_phone"]]],
    ...(p === "guardian" ? [] : [[["สุขภาพ", d[p + "_health"]]]]),
  ]);
  person("7. ข้อมูลบิดา", "father", d.father_flag);
  person("ข้อมูลมารดา", "mother", d.mother_flag);
  table("", [[["สถานภาพของพ่อแม่", d.parents_status]]]);
  person(`8. ข้อมูลผู้ปกครอง (เกี่ยวข้องเป็น ${rpVal(d.guardian_relation)})`, "guardian");
  table("", [
    [["การศึกษาสูงสุด", d.guardian_education], ["โรคประจำตัว", d.guardian_chronic]],
    [["ที่อยู่ผู้ปกครอง", d.guardian_addr_same === "ที่อยู่อื่น" ? d.guardian_address : "เหมือนที่อยู่ปัจจุบันของนักเรียน"]],
  ]);
  table("9. พี่น้องที่อาศัยอยู่ร่วมกัน", [
    [["", d.sibling_only === "มีพี่น้อง" ? `เป็นบุตรคนที่ ${rpVal(d.birth_order)} จาก ${rpVal(d.siblings_total)} คน (ชาย ${rpVal(d.siblings_male)} หญิง ${rpVal(d.siblings_female)})` : d.sibling_only]],
    [["พี่/น้องต่างบิดามารดา", `พี่ ${rpVal(d.half_older)} คน น้อง ${rpVal(d.half_younger)} คน`], ["กำลังศึกษา", `${rpVal(d.siblings_studying)} คน`]],
  ]);
  table("", [[["10. สนิทสนมกับใครมากที่สุด", d.closest]], [["11. เมื่อทุกข์ใจปรึกษา", d.consult]]]);
  B.push(`<h3>12. ภาพประกอบการเยี่ยมบ้าน</h3><div class="rp-photos">
    <figure>${d0.photo1 ? `<img src="${d0.photo1}">` : "<div class='rp-noimg'>ไม่มีภาพ</div>"}<figcaption>รูปที่ 1 ภาพถ่ายภายนอกที่พักอาศัย</figcaption></figure>
    <figure>${d0.photo2 ? `<img src="${d0.photo2}">` : "<div class='rp-noimg'>ไม่มีภาพ</div>"}<figcaption>รูปที่ 2 ภาพถ่ายภายในที่พักอาศัย</figcaption></figure></div>`);

  B.push(`<h2>ตอนที่ 3 ข้อมูลสถานะครัวเรือน</h2>`);
  table("", [
    [["13. สถานะที่อยู่อาศัย", d.housing === "บ้านเช่า (เสียค่าเช่า)" ? `บ้านเช่า เดือนละ ${money(d.rent)}` : d.housing], ["14. ลักษณะบ้าน", d.house_type]],
    [["15. ภาระพึ่งพิง", d.dependents]],
    [["16. ความปลอดภัยที่อยู่อาศัย", d.safety === "เสี่ยง" ? `เสี่ยง: ${rpVal(d.safety_risks)}` : d.safety]],
    [["17. พักอาศัยอยู่กับ", d.lives_with], ["18. การเดินทาง", d.travel]],
    [["19. ระยะทาง", d.distance_range], ["20. เวลาเดินทาง", d.travel_time]],
    [["21. ระหว่างการเดินทาง", d.route_safety === "เสี่ยงอันตราย" ? `เสี่ยงอันตราย: ${rpVal(d.route_risk_detail)}` : d.route_safety]],
    [["22. แหล่งไฟฟ้า", d.electricity === "มีไฟฟ้า" ? `มีไฟฟ้า (${rpVal(d.electricity_type)})` : d.electricity], ["23. น้ำดื่ม", d.water]],
    [["24. ความเสี่ยงภัยพิบัติ", d.disaster === "มีความเสี่ยง" ? `มีความเสี่ยง: ${rpVal(d.disaster_types)}` : d.disaster]],
  ]);
  B.push(`<h2>ตอนที่ 4 ข้อมูลเชิงลึก</h2>`);
  table("เพื่อนสนิทของนักเรียน", [
    [["ภายในโรงเรียน", `${rpVal(d.friend_in_name)} (${rpVal(d.friend_in_nickname)}) ชั้น ${rpVal(d.friend_in_class)}`], ["โทรศัพท์", d.friend_in_phone]],
    [["ภายนอกโรงเรียน", `${rpVal(d.friend_out_name)} (${rpVal(d.friend_out_nickname)})`], ["โทรศัพท์", d.friend_out_phone]],
  ]);
  B.push(`<h2>ตอนที่ 5 ความคิดเห็นครู</h2>`);
  table("25. ข้อมูลครูประจำชั้น/ครูที่ปรึกษา", [[["ชื่อ-สกุล", d.teacher_name], ["ตำแหน่ง", d.teacher_position]], [["โทรศัพท์", d.teacher_phone], ["ผลการคัดกรอง", `กลุ่ม${rpVal(d.screening)}`]]]);
  B.push(`<h3>26. ข้อสรุปจากการเยี่ยมบ้าน</h3><div class="rp-label">สภาพที่น่าเป็นห่วงและความต้องการจำเป็น (การให้ความช่วยเหลือเบื้องต้น)</div>`);
  // แยกทีละบรรทัดเพื่อให้ตัดหน้าได้พอดี ไม่ตัดกลางบรรทัด
  for (const para of String(d.concerns || "-").split(/\n(?=\d+\.)/)) B.push(`<div class="rp-text">${App.esc(para)}</div>`);
  B.push(`<div class="rp-label">ข้อสรุปจากการเยี่ยมบ้าน</div>`);
  for (const para of String(d.conclusion || "-").split(/\n\s*\n/)) B.push(`<div class="rp-text">${App.esc(para)}</div>`);
  B.push(`<div class="rp-sign"><div class="box">
    <div>☑ ได้มีการแจ้งวัตถุประสงค์การขอข้อมูลตามแบบเก็บข้อมูลเยี่ยมบ้านนักเรียนรายบุคคลแก่ผู้ให้ข้อมูลเรียบร้อยแล้ว</div>
    <div class="line">ลงชื่อ ......................................................</div>
    <div>( ${App.esc(rpVal(d.teacher_name))} )</div><div>ครูประจำชั้น/ครูที่ปรึกษา</div>
    <div>วันที่ ${dateTh(d.visit_date)}</div></div></div>`);
  return B;
}

/** จัดกล่องเนื้อหาลงหน้า A4 แล้วคืนรายการ element ของแต่ละหน้า */
async function hvLayoutPages(blocks, host) {
  host.innerHTML = "";
  const measure = document.createElement("div");
  measure.className = "rp-page rp-measure";
  host.appendChild(measure);
  const maxH = RP.H - RP.PAD * 2 - 24;            // เผื่อพื้นที่เลขหน้า
  const els = blocks.map((html) => { const el = document.createElement("div"); el.className = "rp-block"; el.innerHTML = html; measure.appendChild(el); return el; });
  await Promise.all([...measure.querySelectorAll("img")].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
  if (document.fonts?.ready) await document.fonts.ready;
  const pages = [];
  let cur = [], h = 0;
  for (const el of els) {
    const bh = el.offsetHeight + 6;
    // หัวข้อ (h2/h3 อย่างเดียว) ไม่ให้ค้างท้ายหน้า: ย้ายไปพร้อมกล่องถัดไป
    if (h + bh > maxH && cur.length) { pages.push(cur); cur = []; h = 0; }
    cur.push(el); h += bh;
  }
  if (cur.length) pages.push(cur);
  // ย้ายหัวข้อที่อยู่ท้ายหน้าไปหน้าถัดไป
  for (let i = 0; i < pages.length - 1; i++) {
    const last = pages[i][pages[i].length - 1];
    if (/^<h[23]>[^<]*<\/h[23]>$/.test(last.innerHTML.trim()) && pages[i].length > 1) pages[i + 1].unshift(pages[i].pop());
  }
  host.innerHTML = "";
  return pages.map((list, i) => {
    const pg = document.createElement("div");
    pg.className = "rp-page";
    list.forEach((el) => pg.appendChild(el));
    const foot = document.createElement("div");
    foot.className = "rp-foot";
    foot.textContent = `หน้า ${i + 1} / ${pages.length}`;
    pg.appendChild(foot);
    host.appendChild(pg);
    return pg;
  });
}

/** แปลงหน้าเป็นภาพแล้วรวมเป็น PDF  คืน { images, pdfDataUrl, blob } */
async function hvRenderPdf(pageEls, onProgress) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const images = [];
  for (let i = 0; i < pageEls.length; i++) {
    onProgress?.(i + 1, pageEls.length);
    const canvas = await html2canvas(pageEls[i], { scale: 1.6, backgroundColor: "#ffffff", useCORS: true, logging: false });
    const img = canvas.toDataURL("image/jpeg", 0.78);
    images.push(img);
    if (i) pdf.addPage();
    pdf.addImage(img, "JPEG", 0, 0, 210, 297);
  }
  const blob = pdf.output("blob");
  const pdfDataUrl = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  return { images, blob, pdfDataUrl: pdfDataUrl.replace(/^data:application\/pdf;[^,]*,/, "data:application/pdf;base64,") };
}
