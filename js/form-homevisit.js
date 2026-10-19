// =====================================================================
// แบบเก็บข้อมูลเยี่ยมบ้านนักเรียนรายบุคคล (ครูที่ปรึกษาบันทึก)
//  - hvPrefill   : ดึงข้อมูลที่ระบบเคยเก็บ (ปพ.8 / ทะเบียนนักเรียน / ครู) มาเติมให้
//  - hvSteps     : รายการคำถามตามแบบฟอร์ม ตอนที่ 1-5
//  - hvSuggest   : วิเคราะห์สภาพที่น่าเป็นห่วงและร่างข้อสรุป (ครูแก้ไขได้)
// ชื่อ key ต้องตรงกับ supabase/functions/api/homevisit.ts
// =====================================================================

const HV_OPT = {
  religion: ["พุทธ", "อิสลาม", "คริสต์", "ไม่นับถือศาสนา"],
  blood: ["A", "B", "AB", "O", "ไม่ทราบ"],
  disadvantage: ["ไม่ด้อยโอกาส", "ถูกบังคับให้ขายแรงงาน", "เด็กอยู่ในธุรกิจทางเพศ", "เด็กถูกทอดทิ้ง",
    "เด็กในสถานพินิจและคุ้มครองเด็กเยาวชน", "เด็กเร่ร่อน", "ผลกระทบจากเอดส์", "ชนกลุ่มน้อย", "เด็กที่ถูกทำร้ายทารุณ",
    "เด็กยากจน", "เด็กที่มีปัญหาเกี่ยวกับยาเสพติด", "กำพร้า", "ทำงานรับผิดชอบตนเองและครอบครัว"],
  disability: ["ไม่พิการ", "บกพร่องทางการมองเห็น", "บกพร่องทางการได้ยิน", "ความพิการซ้อน", "บกพร่องทางสติปัญญา",
    "บกพร่องทางร่างกายหรือสุขภาพ", "บกพร่องทางการเรียนรู้", "บกพร่องทางการพูดและภาษา", "บกพร่องทางพฤติกรรมหรืออารมณ์", "ออทิสติก"],
  health: ["ปกติ", "พิการ", "เจ็บป่วยเรื้อรัง", "ทุพพลภาพ"],
  parents: ["อยู่ด้วยกัน", "แยกกันอยู่", "หย่าร้าง", "บิดา-มารดาเสียชีวิต/สาบสูญ", "มารดาเสียชีวิต/สาบสูญ",
    "มารดาสมรสใหม่", "บิดาเสียชีวิต/สาบสูญ", "บิดาสมรสใหม่", "บิดามารดาทอดทิ้ง"],
  closest: ["บิดา", "มารดา", "พี่สาว", "น้องสาว", "พี่ชาย", "น้องชาย", "ผู้ปกครอง"],
  consult: ["บิดา", "มารดา", "ผู้ปกครอง", "พี่น้อง", "ญาติ", "เพื่อน", "ครู", "เพื่อนในโลกออนไลน์",
    "เก็บไว้ในใจ ไม่เล่าให้ใครฟัง", "Hotline"],
  housing: ["บ้านของตนเอง/เจ้าของบ้าน", "บ้านเช่า (เสียค่าเช่า)", "อาศัยอยู่กับผู้อื่น/อยู่โดยไม่มีค่าใช้จ่าย", "บ้านพัก/หอพัก"],
  houseType: ["บ้านชั้นเดียว", "บ้านสองชั้น", "ทาวน์เฮ้าส์"],
  dependents: ["ครัวเรือนไม่มีภาระพึ่งพิง", "มีคนพิการ/เจ็บป่วยเรื้อรัง", "มีผู้สูงอายุ (มากกว่า 60 ปี)",
    "เป็นบิดา/มารดาเลี้ยงเดี่ยว", "มีคนอายุ 15-60 ปีที่ว่างงาน (ไม่ใช่นักเรียน/นักศึกษา)"],
  safetyRisks: ["มีสภาพทรุดโทรม/ไม่ปลอดภัย/ทำจากวัสดุท้องถิ่น", "ไม่มีห้องส้วมในที่อยู่อาศัยและบริเวณบ้าน", "สภาพแวดล้อมบริเวณบ้าน"],
  livesWith: ["บิดาและมารดา", "บิดา", "มารดา", "พี่/น้อง (ไม่ได้อยู่กับบิดา มารดา)", "เพื่อน/คนรู้จัก",
    "ผู้ปกครองที่ไม่ใช่บิดา มารดา", "พักอยู่ที่โรงเรียน (นักเรียนประจำ)", "พักอยู่คนเดียว (เช่าหอพัก/บ้านเช่า)", "พักอยู่กับมูลนิธิ/วัด/นายจ้าง"],
  travel: ["เดิน", "จักรยาน", "รถโรงเรียน", "จักรยานยนต์ส่วนตัว", "รถส่วนตัว", "เรือส่วนตัว", "จักรยานยนต์รับจ้าง",
    "รถโดยสารประจำทาง/รับจ้าง", "เรือโดยสารประจำทาง/รับจ้าง", "เดินทางโดยรถไฟ", "เดินทางโดยรถไฟฟ้า"],
  distance: ["0-5 กิโลเมตร", "6-10 กิโลเมตร", "11-15 กิโลเมตร", "16-20 กิโลเมตร", "21-40 กิโลเมตร", "40 กิโลเมตรขึ้นไป"],
  time: ["น้อยกว่า 30 นาที", "30-50 นาที", "1-3 ชั่วโมง", "มากกว่า 3 ชั่วโมง"],
  elecType: ["เครื่องปั่นไฟ/โซลาเซลล์", "ไฟต่อพ่วง/แบตเตอรี่", "ไฟบ้านหรือมิเตอร์"],
  water: ["น้ำดื่มบรรจุขวด/ตู้หยอดน้ำ", "น้ำประปา", "น้ำบ่อ/น้ำบาดาล", "น้ำฝน/น้ำประปาภูเขา/ลำธาร"],
  disaster: ["อาศัยอยู่ในพื้นที่วาตภัย", "อาศัยอยู่ในพื้นที่มลพิษทางอากาศ", "อาศัยอยู่ในพื้นที่มลพิษทางเสียง",
    "อาศัยอยู่ในพื้นที่แผ่นดินไหว/ดินถล่ม", "อาศัยอยู่ในพื้นที่อุทกภัย", "อาศัยอยู่ในพื้นที่โรคระบาด"],
  screening: ["ปกติ", "เสี่ยง", "มีปัญหา"],
};
const HV_SEVERE = ["ถูกบังคับให้ขายแรงงาน", "เด็กอยู่ในธุรกิจทางเพศ", "เด็กถูกทอดทิ้ง", "เด็กที่ถูกทำร้ายทารุณ",
  "เด็กที่มีปัญหาเกี่ยวกับยาเสพติด", "เด็กเร่ร่อน", "เด็กในสถานพินิจและคุ้มครองเด็กเยาวชน"];

// ---------- ฟังก์ชันช่วย ----------
const hvNum = (v) => (v === undefined || v === null || v === "" ? 0 : Number(String(v).replace(/,/g, "")) || 0);
const hvMoney = (v) => hvNum(v).toLocaleString("th-TH");
function hvAge(birth, at) {
  if (!birth) return "";
  const b = new Date(birth), t = at ? new Date(at) : new Date();
  let m = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) m--;
  return m < 0 ? "" : `${Math.floor(m / 12)} ปี ${m % 12} เดือน`;
}
function hvShape(w, h) {
  const bmi = hvNum(w) / (hvNum(h) / 100) ** 2;
  if (!isFinite(bmi) || !bmi) return "";
  // เกณฑ์ BMI โดยประมาณ (สำหรับวัยรุ่นควรใช้กราฟน้ำหนักตามเกณฑ์ส่วนสูงของกรมอนามัยประกอบ)
  return bmi < 18.5 ? "ผอม" : bmi < 23 ? "สมส่วน" : bmi < 25 ? "ท้วม" : bmi < 30 ? "อ้วน" : "อ้วนมาก";
}
/** ผู้ปกครองเป็นบิดา/มารดา → ใช้ข้อมูลเดียวกัน */
function hvGuardian(d) {
  const src = d.guardian_relation === "บิดา" ? "father" : d.guardian_relation === "มารดา" ? "mother" : null;
  if (!src) return d;
  const out = { ...d };
  for (const k of ["id", "phone", "name", "age", "job", "income"]) out["guardian_" + k] = d[`${src}_${k}`] ?? "";
  return out;
}

// ---------- ดึงข้อมูลเดิมมาเติม ----------
function hvPrefill(ctx) {
  const p = ctx.pp8 || {}, d = {};
  const set = (k, v) => { if (v !== undefined && v !== null && v !== "") { d[k] = v; prefilled.add(k); } };
  const prefilled = new Set();
  set("visit_date", App.today());
  set("nickname", p.nickname);
  set("birth_date", p.birth_date);
  set("weight", p.weight); set("height", p.height);
  if (p.chronic_disease) {
    if (/^(ไม่มี|-|ไม่)$/.test(p.chronic_disease.trim())) set("chronic", "ไม่มีโรคประจำตัว");
    else { set("chronic", "มีโรคประจำตัว"); set("chronic_detail", p.chronic_disease); }
  }
  set("father_name", p.father_name); set("father_age", p.father_age); set("father_job", p.father_job);
  set("mother_name", p.mother_name); set("mother_age", p.mother_age); set("mother_job", p.mother_job);
  set("father_phone", p.parent_phone); set("mother_phone", p.parent_phone);
  if (p.father_name) set("father_flag", "มีข้อมูลบิดา");
  if (p.mother_name) set("mother_flag", "มีข้อมูลมารดา");
  const ps = { "อยู่ด้วยกัน": "อยู่ด้วยกัน", "แยกกันอยู่": "แยกกันอยู่", "หย่าร้างกัน": "หย่าร้าง" }[p.parent_status];
  set("parents_status", ps);
  if (p.siblings_total) {
    set("sibling_only", Number(p.siblings_total) <= 1 ? "เป็นบุตรคนเดียว" : "มีพี่น้อง");
    set("birth_order", p.birth_order); set("siblings_total", p.siblings_total);
    set("siblings_male", p.siblings_male); set("siblings_female", p.siblings_female);
  }
  const lw = { "บิดาและมารดา": "บิดาและมารดา", "บิดา": "บิดา", "มารดา": "มารดา", "หอพัก": "พักอยู่คนเดียว (เช่าหอพัก/บ้านเช่า)" }[p.lives_with];
  set("lives_with", lw);
  const tv = { "เดิน": "เดิน", "รถจักรยาน": "จักรยาน", "รถจักรยานยนต์": "จักรยานยนต์ส่วนตัว", "รถรับส่ง": "รถโรงเรียน" }[p.travel];
  set("travel", tv);
  if (p.distance_km) {
    const km = hvNum(p.distance_km);
    set("distance_range", km <= 5 ? "0-5 กิโลเมตร" : km <= 10 ? "6-10 กิโลเมตร" : km <= 15 ? "11-15 กิโลเมตร"
      : km <= 20 ? "16-20 กิโลเมตร" : km <= 40 ? "21-40 กิโลเมตร" : "40 กิโลเมตรขึ้นไป");
  }
  set("friend_in_name", p.best_friend); set("friend_in_class", p.best_friend_class);
  if (Array.isArray(p.help_from) && p.help_from.length) {
    const map = { "บิดา": "บิดา", "มารดา": "มารดา", "ครูแนะแนว": "ครู", "ครูที่ปรึกษา": "ครู", "เพื่อน": "เพื่อน" };
    set("consult", [...new Set(p.help_from.map((x) => map[x]).filter(Boolean))]);
  }
  set("teacher_name", ctx.teacherName);
  set("body_shape", hvShape(d.weight, d.height));
  return { data: d, prefilled };
}

// ---------- รายการคำถาม ----------
function hvSteps(ctx, prefilled) {
  const st = ctx.student, esc = App.esc;
  const auto = (f) => (prefilled.has(f.key) ? { ...f, hint: (f.hint ? f.hint + " · " : "") + "ดึงจากข้อมูลที่นักเรียนบันทึก (แก้ไขได้)" } : f);
  const A = (list) => list.map(auto);
  const fatherShow = (d) => !["ไม่ปรากฏบิดา", "บิดาเสียชีวิต"].includes(d.father_flag);
  const motherShow = (d) => !["ไม่ปรากฏมารดา", "มารดาเสียชีวิต"].includes(d.mother_flag);
  const notParent = (d) => d.guardian_relation && !["บิดา", "มารดา"].includes(d.guardian_relation);
  const addr = (p, show) => [
    { key: p + "_no", label: "เลขที่", half: true, show }, { key: p + "_moo", label: "หมู่ที่ (ถ้าไม่มีใส่ -)", half: true, show },
    { key: p + "_village", label: "หมู่บ้าน/อาคาร (ถ้าไม่มีใส่ -)", show },
    { key: p + "_subdistrict", label: "ตำบล/แขวง", half: true, show }, { key: p + "_district", label: "อำเภอ/เขต", half: true, show },
    { key: p + "_province", label: "จังหวัด", half: true, show },
    { key: p + "_postcode", label: "รหัสไปรษณีย์", type: "number", half: true, maxlength: 5, show },
  ];
  const parent = (p, who, show) => A([
    { key: p + "_name", label: `ชื่อ-สกุล${who} (พร้อมคำนำหน้า)`, required: true, show },
    { key: p + "_id", label: `เลขประจำตัวประชาชน${who}`, type: "number", maxlength: 13, half: true,
      show: (d) => show(d) && d[p + "_flag"] !== `${who}ไม่มีเลขประจำตัวประชาชน`, hint: "13 หลัก ไม่ต้องใส่ขีด" },
    { key: p + "_phone", label: "หมายเลขโทรศัพท์", type: "tel", half: true, show },
    { key: p + "_age", label: "อายุ", type: "number", unit: "ปี", required: true, half: true, min: 15, max: 120, show },
    { key: p + "_job", label: "อาชีพ", required: true, half: true, show },
    { key: p + "_income", label: "รายได้ต่อเดือน", type: "number", unit: "บาท", half: true, min: 0, max: 10000000, show },
    { key: p + "_health", label: "สุขภาพ", type: "radio", required: true, options: HV_OPT.health, show },
  ]);

  const steps = [
    {
      title: "ตอนที่ 1 ข้อมูลพื้นฐานนักเรียน",
      fields: [
        { type: "info", html: `<div class="id-card">
          <div class="wide"><span>ชื่อ-สกุล</span><b>${esc(st.name)}</b></div>
          <div><span>เลขประจำตัวนักเรียน</span><b>${esc(st.studentId)}</b></div><div><span>เพศ</span><b>${esc(st.gender)}</b></div>
          <div><span>ชั้น/ห้อง</span><b>ม.${esc(st.classroom)}</b></div><div><span>เลขที่</span><b>${esc(st.number)}</b></div></div>` },
        { key: "visit_date", label: "วันที่เยี่ยมบ้าน", type: "date", required: true, half: true },
        ...A([
          { key: "nickname", label: "ชื่อเล่น", half: true },
          { key: "name_en", label: "ชื่อ-สกุล (ภาษาอังกฤษ)" },
          { key: "citizen_id", label: "เลขประจำตัวประชาชน", type: "number", maxlength: 13, hint: "13 หลัก ไม่ต้องใส่ขีด" },
          { key: "foreign_id", label: "เลขที่ทางราชการออกให้ (กรณีเด็กต่างด้าว)" },
          { key: "birth_date", label: "วัน/เดือน/ปีเกิด", type: "date", required: true, half: true },
        ]),
        { type: "html", id: "age", render: (d) => d.birth_date ? `<div class="bmi">อายุ ณ วันเยี่ยมบ้าน <b>${hvAge(d.birth_date, d.visit_date)}</b></div>` : "" },
        { key: "nationality", label: "สัญชาติ", half: true, placeholder: "ไทย" },
        { key: "ethnicity", label: "เชื้อชาติ", half: true, placeholder: "ไทย" },
        { key: "religion", label: "ศาสนา", type: "radio", other: true, options: HV_OPT.religion },
      ],
    },
    {
      title: "ตอนที่ 1 ประวัติการเรียนและสุขภาพ",
      fields: [
        { type: "info", html: "<h3 class='sub'>2. ประวัติการเรียน</h3>" },
        { key: "prev_level", label: "จบการศึกษาระดับ", required: true, half: true, placeholder: "เช่น ประถมศึกษาปีที่ 6" },
        { key: "prev_gpa", label: "ผลการเรียนเฉลี่ย", type: "number", half: true, min: 0, max: 4 },
        { key: "prev_school", label: "จากโรงเรียน", required: true },
        { key: "prev_affiliation", label: "สังกัด", required: true, half: true, placeholder: "เช่น สพป." },
        { key: "prev_phone", label: "หมายเลขโทรศัพท์โรงเรียน", half: true },
        { key: "prev_subdistrict", label: "ตำบล/แขวง", half: true }, { key: "prev_district", label: "อำเภอ/เขต", half: true },
        { key: "prev_province", label: "จังหวัด", half: true },
        { type: "info", html: "<h3 class='sub'>3. ข้อมูลสุขภาพ</h3>" },
        ...A([
          { key: "weight", label: "น้ำหนัก", type: "number", unit: "กก.", half: true, min: 15, max: 250 },
          { key: "height", label: "ส่วนสูง", type: "number", unit: "ซม.", half: true, min: 80, max: 230 },
        ]),
        { type: "html", id: "shape", render: (d) => {
          const s = hvShape(d.weight, d.height); d.body_shape = s;
          return s ? `<div class="bmi">รูปร่าง (ประมวลจาก BMI โดยประมาณ): <b>${s}</b></div>` : "";
        } },
        { key: "blood_type", label: "หมู่โลหิต", type: "radio", options: HV_OPT.blood },
        ...A([
          { key: "chronic", label: "โรคประจำตัวของนักเรียน", type: "radio", required: true, options: ["ไม่มีโรคประจำตัว", "มีโรคประจำตัว"] },
          { key: "chronic_detail", label: "โรคประจำตัว คือ", required: true, show: (d) => d.chronic === "มีโรคประจำตัว" },
        ]),
      ],
    },
    {
      title: "ตอนที่ 1 ที่อยู่ของนักเรียน",
      fields: [
        { type: "info", html: "<h3 class='sub'>ที่อยู่ตามทะเบียนบ้าน</h3>" },
        ...addr("reg"),
        { key: "cur_same", label: "ที่อยู่ปัจจุบัน", type: "radio", required: true, options: ["ตรงกับที่อยู่ตามทะเบียนบ้าน", "ต่างจากทะเบียนบ้าน"] },
        ...addr("cur", (d) => d.cur_same === "ต่างจากทะเบียนบ้าน"),
      ],
    },
    {
      title: "ตอนที่ 1 ความด้อยโอกาสและความพิการ",
      fields: [
        { key: "disadvantage", label: "5. ประเภทความด้อยโอกาส (เลือกได้มากกว่า 1)", type: "checks", required: true, exclusive: "ไม่ด้อยโอกาส", options: HV_OPT.disadvantage },
        { key: "disability", label: "6. ประเภทความพิการ (เลือกได้มากกว่า 1)", type: "checks", required: true, exclusive: "ไม่พิการ", options: HV_OPT.disability },
      ],
    },
    {
      title: "ตอนที่ 2 ข้อมูลบิดา",
      fields: [
        { key: "father_flag", label: "สถานะข้อมูลบิดา", type: "radio", required: true,
          options: ["มีข้อมูลบิดา", "ไม่ปรากฏบิดา", "บิดาเสียชีวิต", "บิดาไม่มีเลขประจำตัวประชาชน"] },
        ...parent("father", "บิดา", fatherShow),
      ],
    },
    {
      title: "ตอนที่ 2 ข้อมูลมารดาและสถานภาพ",
      fields: [
        { key: "mother_flag", label: "สถานะข้อมูลมารดา", type: "radio", required: true,
          options: ["มีข้อมูลมารดา", "ไม่ปรากฏมารดา", "มารดาเสียชีวิต", "มารดาไม่มีเลขประจำตัวประชาชน"] },
        ...parent("mother", "มารดา", motherShow),
        ...A([{ key: "parents_status", label: "สถานภาพของพ่อแม่", type: "radio", required: true, other: true, options: HV_OPT.parents }]),
      ],
    },
    {
      title: "ตอนที่ 2 ข้อมูลผู้ปกครอง",
      fields: [
        { key: "guardian_relation", label: "ผู้ปกครองมีความเกี่ยวข้องกับนักเรียนเป็น", type: "radio", required: true, other: true, options: ["บิดา", "มารดา"] },
        { type: "info", show: (d) => ["บิดา", "มารดา"].includes(d.guardian_relation),
          html: "<div class='bmi'>ระบบจะใช้ชื่อ เลขประจำตัว โทรศัพท์ อายุ อาชีพ และรายได้ จากข้อมูลบิดา/มารดาที่กรอกไว้แล้ว</div>" },
        { key: "guardian_name", label: "ชื่อ-สกุลผู้ปกครอง (พร้อมคำนำหน้า)", required: true, show: notParent },
        { key: "guardian_id", label: "เลขประจำตัวประชาชนผู้ปกครอง", type: "number", maxlength: 13, half: true, show: notParent },
        { key: "guardian_phone", label: "หมายเลขโทรศัพท์", type: "tel", half: true, show: notParent },
        { key: "guardian_age", label: "อายุ", type: "number", unit: "ปี", required: true, half: true, min: 15, max: 120, show: notParent },
        { key: "guardian_job", label: "อาชีพ", required: true, half: true, show: notParent },
        { key: "guardian_income", label: "รายได้ต่อเดือน", type: "number", unit: "บาท", half: true, min: 0, max: 10000000, show: notParent },
        { key: "guardian_education", label: "การศึกษาสูงสุด", half: true },
        { key: "guardian_chronic", label: "โรคประจำตัวผู้ปกครอง", type: "radio", options: ["ไม่มีโรคประจำตัว"], other: true },
        { key: "guardian_addr_same", label: "ที่อยู่ปัจจุบันของผู้ปกครอง", type: "radio", required: true, options: ["เหมือนที่อยู่ปัจจุบันของนักเรียน", "ที่อยู่อื่น"] },
        { key: "guardian_address", label: "ที่อยู่ผู้ปกครอง", type: "textarea", required: true, show: (d) => d.guardian_addr_same === "ที่อยู่อื่น" },
      ],
    },
    {
      title: "ตอนที่ 2 พี่น้องและความใกล้ชิด",
      fields: [
        ...A([
          { key: "sibling_only", label: "9. ข้อมูลพี่น้องที่อาศัยอยู่ร่วมกัน", type: "radio", options: ["เป็นบุตรคนเดียว", "มีพี่น้อง"] },
          { key: "birth_order", label: "เป็นบุตรคนที่", type: "number", half: true, min: 1, max: 20, show: (d) => d.sibling_only === "มีพี่น้อง" },
          { key: "siblings_total", label: "จากจำนวน (บิดา-มารดาเดียวกัน)", type: "number", unit: "คน", half: true, min: 1, max: 20, show: (d) => d.sibling_only === "มีพี่น้อง" },
          { key: "siblings_male", label: "พี่ชาย/น้องชาย", type: "number", unit: "คน", half: true, min: 0, max: 20, show: (d) => d.sibling_only === "มีพี่น้อง" },
          { key: "siblings_female", label: "พี่สาว/น้องสาว", type: "number", unit: "คน", half: true, min: 0, max: 20, show: (d) => d.sibling_only === "มีพี่น้อง" },
        ]),
        { key: "half_older", label: "พี่ต่างบิดา-มารดา", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "half_younger", label: "น้องต่างบิดา-มารดา", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "siblings_studying", label: "พี่น้องที่กำลังศึกษาอยู่ (ไม่นับตัวเอง)", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "closest", label: "10. ในครอบครัวนักเรียนสนิทสนมกับใครมากที่สุด", type: "checks", required: true, other: true, cols: 2, options: HV_OPT.closest },
        ...A([{ key: "consult", label: "11. เมื่อทุกข์ใจ/มีปัญหา ส่วนใหญ่นักเรียนปรึกษา", type: "checks", required: true, other: true, cols: 2,
          exclusive: "เก็บไว้ในใจ ไม่เล่าให้ใครฟัง", options: HV_OPT.consult }]),
      ],
    },
    {
      title: "ตอนที่ 2 ภาพประกอบการเยี่ยมบ้าน",
      desc: "ถ่ายได้ไม่เกิน 2 ภาพ ระบบย่อขนาดให้อัตโนมัติ",
      fields: [{ type: "html", id: "photos", render: (d) => hvPhotoHtml(d) }],
      validate: (d) => (d.photo1 ? null : "กรุณาใส่รูปที่ 1 ภาพถ่ายภายนอกที่พักอาศัย"),
    },
    {
      title: "ตอนที่ 3 สถานะครัวเรือน",
      fields: [
        { key: "housing", label: "13. สถานะที่อยู่อาศัย", type: "radio", required: true, other: true, options: HV_OPT.housing },
        { key: "rent", label: "ค่าเช่าเดือนละ", type: "number", unit: "บาท", required: true, min: 0, max: 100000, show: (d) => d.housing === "บ้านเช่า (เสียค่าเช่า)" },
        { key: "house_type", label: "14. ลักษณะกายภาพของบ้าน", type: "radio", required: true, other: true, options: HV_OPT.houseType },
        { key: "dependents", label: "15. ครัวเรือนมีภาระพึ่งพิง", type: "checks", required: true, exclusive: "ครัวเรือนไม่มีภาระพึ่งพิง", options: HV_OPT.dependents },
        { key: "safety", label: "16. ความปลอดภัยของที่อยู่อาศัยและสภาพแวดล้อม", type: "radio", required: true, options: ["ดี/มั่นคง/ปลอดภัย/เป็นสัดส่วน", "เสี่ยง"] },
        { key: "safety_risks", label: "ความเสี่ยงที่พบ", type: "checks", required: true, other: true, options: HV_OPT.safetyRisks, show: (d) => d.safety === "เสี่ยง" },
        ...A([{ key: "lives_with", label: "17. นักเรียนพักอาศัยอยู่กับ (ตอบเพียง 1 ข้อ)", type: "radio", required: true, other: true, options: HV_OPT.livesWith }]),
      ],
    },
    {
      title: "ตอนที่ 3 การเดินทางและสาธารณูปโภค",
      fields: [
        ...A([
          { key: "travel", label: "18. การเดินทางมาโรงเรียน", type: "radio", required: true, other: true, cols: 2, options: HV_OPT.travel },
          { key: "distance_range", label: "19. ระยะทางจากบ้านถึงโรงเรียน", type: "radio", required: true, cols: 2, options: HV_OPT.distance },
        ]),
        { key: "travel_time", label: "20. ระยะเวลาเดินทาง", type: "radio", required: true, cols: 2, options: HV_OPT.time },
        { key: "route_safety", label: "21. สภาพแวดล้อมระหว่างการเดินทาง", type: "radio", required: true, options: ["ปลอดภัย", "เสี่ยงอันตราย"] },
        { key: "route_risk_detail", label: "อันตรายที่พบ", required: true, show: (d) => d.route_safety === "เสี่ยงอันตราย" },
        { key: "electricity", label: "22. แหล่งไฟฟ้าหลัก", type: "radio", required: true, options: ["ไม่มีไฟฟ้า/ไม่มีเครื่องกำเนิดไฟฟ้าชนิดอื่นๆ", "มีไฟฟ้า"] },
        { key: "electricity_type", label: "ชนิดของไฟฟ้า", type: "checks", required: true, options: HV_OPT.elecType, show: (d) => d.electricity === "มีไฟฟ้า" },
        { key: "water", label: "23. แหล่งน้ำดื่ม", type: "checks", required: true, options: HV_OPT.water },
        { key: "disaster", label: "24. สภาพที่พักอาศัยและความปลอดภัยด้านภัยพิบัติ", type: "radio", required: true, options: ["ไม่มีความเสี่ยง", "มีความเสี่ยง"] },
        { key: "disaster_types", label: "ความเสี่ยงที่พบ", type: "checks", required: true, options: HV_OPT.disaster, show: (d) => d.disaster === "มีความเสี่ยง" },
      ],
    },
    {
      title: "ตอนที่ 4 ข้อมูลเชิงลึก: เพื่อนสนิท",
      fields: [
        { type: "info", html: "<h3 class='sub'>เพื่อนสนิทภายในโรงเรียน</h3>" },
        ...A([
          { key: "friend_in_name", label: "ชื่อ-สกุล (พร้อมคำนำหน้า)" },
          { key: "friend_in_class", label: "ชั้น/ห้อง", half: true },
        ]),
        { key: "friend_in_nickname", label: "ชื่อเล่น", half: true },
        { key: "friend_in_phone", label: "หมายเลขโทรศัพท์", type: "tel", half: true },
        { type: "info", html: "<h3 class='sub'>เพื่อนสนิทภายนอกโรงเรียน</h3>" },
        { key: "friend_out_name", label: "ชื่อ-สกุล (พร้อมคำนำหน้า)" },
        { key: "friend_out_nickname", label: "ชื่อเล่น", half: true },
        { key: "friend_out_phone", label: "หมายเลขโทรศัพท์", type: "tel", half: true },
      ],
    },
    {
      title: "ตอนที่ 5 ความคิดเห็นครูและข้อสรุป",
      desc: "ระบบร่างข้อความจากข้อมูลทั้งหมดให้ ครูแก้ไข/เพิ่มเติมได้ก่อนบันทึก",
      fields: [
        ...A([{ key: "teacher_name", label: "ครูประจำชั้น/ครูที่ปรึกษา", required: true }]),
        { key: "teacher_position", label: "ตำแหน่ง", half: true, placeholder: "เช่น ครู คศ.1" },
        { key: "teacher_phone", label: "หมายเลขโทรศัพท์", type: "tel", half: true },
        { type: "html", id: "analysis", render: (d) => {
          const s = hvSuggest(d, ctx);
          if (d.concerns === undefined) { d.concerns = s.concerns; d.conclusion = s.conclusion; d.screening = s.screening; }
          const cls = { "ปกติ": "ok", "เสี่ยง": "late", "มีปัญหา": "absent" }[s.screening];
          return `<div class="analysis">
            <div class="an-head">ผลวิเคราะห์ของระบบ <span class="badge ${cls}">กลุ่ม${s.screening}</span></div>
            <div class="an-sub">พบประเด็นที่ควรดูแล ${s.items.length} ข้อ จากข้อมูลเยี่ยมบ้าน ปพ.8 SDQ EQ และการมาเรียน</div>
            <button type="button" class="secondary small" data-action="hv-regen">สร้างข้อความใหม่จากข้อมูลล่าสุด</button></div>`;
        } },
        { key: "screening", label: "ผลการคัดกรอง (ครูยืนยัน)", type: "radio", required: true, options: HV_OPT.screening },
        { key: "concerns", label: "สภาพที่น่าเป็นห่วงและความต้องการจำเป็น (การให้ความช่วยเหลือเบื้องต้น)", type: "textarea", required: true, maxlength: 3000 },
        { key: "conclusion", label: "ข้อสรุปจากการเยี่ยมบ้าน", type: "textarea", required: true, maxlength: 3000 },
        { type: "html", id: "consent", render: (d) => `<label class="certify"><input type="checkbox" data-k="consent" data-bool="1" ${d.consent ? "checked" : ""}>
          <span>ได้มีการแจ้งวัตถุประสงค์การขอข้อมูลตามแบบเก็บข้อมูลเยี่ยมบ้านนักเรียนรายบุคคลแก่ผู้ให้ข้อมูลเรียบร้อยแล้ว</span></label>` },
      ],
      validate: (d) => (d.consent === true ? null : "กรุณาติ๊กยืนยันการแจ้งวัตถุประสงค์การขอข้อมูลแก่ผู้ให้ข้อมูล"),
    },
  ];
  return steps;
}

function hvPhotoHtml(d) {
  const slot = (k, title, hint) => `<div class="photo-slot">
    <div class="ph-title">${title}${k === "photo1" ? '<span class="req">*</span>' : ""}</div>
    ${d[k] ? `<img src="${d[k]}" alt="${title}">` : `<div class="ph-empty">${hint}</div>`}
    <div class="row">
      <button type="button" class="secondary small" data-action="pick" data-photo="${k}">${d[k] ? "เปลี่ยนรูป" : "ถ่าย/เลือกรูป"}</button>
      ${d[k] ? `<button type="button" class="secondary small" data-action="del" data-photo="${k}">ลบ</button>` : ""}
    </div></div>`;
  return `<div class="photos">
    ${slot("photo1", "รูปที่ 1 ภาพถ่ายภายนอกที่พักอาศัย", "กรุณาถ่ายให้เห็นหลังคา และฝาบ้าน")}
    ${slot("photo2", "รูปที่ 2 ภาพถ่ายภายในที่พักอาศัย", "กรุณาถ่ายให้เห็นพื้นบ้าน และภายในบริเวณบ้าน")}
    <p class="f-hint">กรณีที่พักอยู่ต่างจังหวัด/ต่างประเทศ หรือไม่ได้รับอนุญาตให้ถ่ายภาพ อนุโลมให้ถ่ายภาพนักเรียนคู่กับป้ายสถานศึกษาแทน</p>
    <input type="file" accept="image/*" id="hvPhotoInput" class="hidden"></div>`;
}

// =====================================================================
// วิเคราะห์สภาพที่น่าเป็นห่วง และร่างข้อสรุป
// ใช้เกณฑ์ตามระบบดูแลช่วยเหลือนักเรียน: ปกติ / เสี่ยง / มีปัญหา
// =====================================================================
function hvSuggest(d0, ctx) {
  const d = hvGuardian(d0);
  const items = [];            // { text, help, severe }
  const add = (text, help, severe = false) => items.push({ text, help, severe });
  const arr = (k) => (Array.isArray(d[k]) ? d[k] : []);
  const has = (k, v) => arr(k).includes(v);

  // ---- เศรษฐกิจ ----
  const parents = [d.father_income, d.mother_income].map(hvNum);
  const guardianExtra = !["บิดา", "มารดา"].includes(d0.guardian_relation) ? hvNum(d.guardian_income) : 0;
  const income = parents[0] + parents[1] + guardianExtra;
  if (income > 0 && income < 5000) add(`รายได้ครัวเรือนต่ำ (รวมประมาณ ${hvMoney(income)} บาท/เดือน)`, "พิจารณาเสนอชื่อรับทุนการศึกษา/ทุน กสศ. และอุปกรณ์การเรียน");
  else if (ctx.pp8?.family_income === "น้อยกว่า 20,000 บาทต่อปี") add("ครอบครัวมีรายได้น้อยกว่า 20,000 บาทต่อปี (จาก ปพ.8)", "พิจารณาทุนการศึกษาและสวัสดิการของโรงเรียน");
  if (d.housing === "บ้านเช่า (เสียค่าเช่า)" && hvNum(d.rent) > 0 && income > 0 && hvNum(d.rent) / income > 0.3) add(`ค่าเช่าบ้านสูงเมื่อเทียบกับรายได้ (${hvMoney(d.rent)} บาท/เดือน)`, "ติดตามภาระค่าใช้จ่ายของครอบครัว");

  // ---- ความด้อยโอกาส / พิการ ----
  const dis = arr("disadvantage").filter((x) => x !== "ไม่ด้อยโอกาส");
  if (dis.length) add(`มีภาวะด้อยโอกาส: ${dis.join(", ")}`, "ประสานครูแนะแนว/ฝ่ายกิจการนักเรียน และหน่วยงานที่เกี่ยวข้องตามประเภท", dis.some((x) => HV_SEVERE.includes(x)));
  const dsb = arr("disability").filter((x) => x !== "ไม่พิการ");
  if (dsb.length) add(`มีความบกพร่อง/ความพิการ: ${dsb.join(", ")}`, "ประสานงานการศึกษาพิเศษ จัดทำแผนการจัดการศึกษาเฉพาะบุคคล (IEP)");

  // ---- ครอบครัว ----
  if (d.parents_status && d.parents_status !== "อยู่ด้วยกัน") add(`สถานภาพบิดามารดา: ${d.parents_status}`, "ติดตามความอบอุ่นในครอบครัวและการดูแลของผู้ปกครอง",
    /ทอดทิ้ง/.test(d.parents_status));
  for (const [k, who] of [["father_health", "บิดา"], ["mother_health", "มารดา"]]) {
    if (d[k] && d[k] !== "ปกติ") add(`${who}มีภาวะ${d[k]}`, "ครอบครัวอาจมีภาระการดูแล ติดตามผลกระทบต่อการเรียน");
  }
  const dep = arr("dependents").filter((x) => x !== "ครัวเรือนไม่มีภาระพึ่งพิง");
  if (dep.length) add(`ครัวเรือนมีภาระพึ่งพิง: ${dep.join(", ")}`, "ติดตามภาระงานบ้านที่อาจกระทบเวลาเรียน");
  if (/คนเดียว|เพื่อน|มูลนิธิ|พี่\/น้อง/.test(d.lives_with || "")) add(`นักเรียนพักอาศัยกับ ${d.lives_with}`, "ติดตามการดูแลของผู้ใหญ่ ความปลอดภัย และการใช้เวลาว่าง");

  // ---- ที่อยู่อาศัย / การเดินทาง ----
  if (d.safety === "เสี่ยง") add(`ที่อยู่อาศัยมีความเสี่ยง: ${arr("safety_risks").join(", ")}`, "ประสานผู้นำชุมชน/อปท. เพื่อขอรับความช่วยเหลือด้านที่อยู่อาศัย");
  if ((d.electricity || "").startsWith("ไม่มีไฟฟ้า")) add("ที่พักอาศัยไม่มีไฟฟ้า", "ส่งผลต่อการทำการบ้าน พิจารณาให้ใช้ห้องสมุด/ห้องเรียนหลังเลิกเรียน");
  if (d.route_safety === "เสี่ยงอันตราย") add(`เส้นทางมาโรงเรียนเสี่ยงอันตราย: ${d.route_risk_detail || ""}`, "แนะนำเส้นทาง/การเดินทางเป็นกลุ่ม และแจ้งผู้ปกครอง");
  if (["1-3 ชั่วโมง", "มากกว่า 3 ชั่วโมง"].includes(d.travel_time) || ["21-40 กิโลเมตร", "40 กิโลเมตรขึ้นไป"].includes(d.distance_range)) {
    add(`บ้านอยู่ไกล (${d.distance_range || ""} ใช้เวลา ${d.travel_time || ""})`, "ติดตามการมาสาย/ความเหนื่อยล้า พิจารณาทุนค่าเดินทางหรือหอพัก");
  }
  if (d.disaster === "มีความเสี่ยง") add(`พื้นที่เสี่ยงภัยพิบัติ: ${arr("disaster_types").join(", ")}`, "แจ้งช่องทางติดต่อฉุกเฉินและแผนการช่วยเหลือเมื่อเกิดภัย");

  // ---- สุขภาพ ----
  if (d.chronic === "มีโรคประจำตัว") add(`มีโรคประจำตัว: ${d.chronic_detail || ""}`, "แจ้งครูพยาบาลและครูผู้สอน เตรียมแผนดูแลเมื่อมีอาการ");
  if (["ผอม", "อ้วน", "อ้วนมาก"].includes(hvShape(d.weight, d.height))) add(`ภาวะโภชนาการ: ${hvShape(d.weight, d.height)}`, "ให้คำแนะนำด้านโภชนาการและการออกกำลังกาย");

  // ---- จิตใจ / พฤติกรรม ----
  if (has("consult", "เก็บไว้ในใจ ไม่เล่าให้ใครฟัง")) add("เมื่อมีปัญหานักเรียนเก็บไว้ในใจ ไม่เล่าให้ใครฟัง", "สร้างความไว้วางใจ ให้คำปรึกษาเป็นรายบุคคล แนะนำช่องทางขอความช่วยเหลือ");
  if (ctx.pp8Flags) add(`ประเด็นจาก ปพ.8: ${ctx.pp8Flags}`, "พูดคุยติดตามเป็นรายบุคคล", /ไม่มีค่า|ไม่น่าอยู่|เลิกเรียน/.test(ctx.pp8Flags));
  for (const [r, who] of [[ctx.sdqStudent, "นักเรียนประเมินตนเอง"], [ctx.sdqTeacher, "ครูประเมิน"]]) {
    if (!r) continue;
    const bad = Object.values(r.scales || {}).filter((x) => x.level === "มีปัญหา").map((x) => x.name);
    if (r.totalLevel !== "ปกติ" || bad.length) {
      add(`SDQ (${who}) คะแนนรวม 4 ด้าน ${r.total} = ${r.totalLevel}${bad.length ? ` / ด้านที่มีปัญหา: ${bad.join(", ")}` : ""}`,
        "ดูแลตามผล SDQ และส่งต่อครูแนะแนวเมื่อจำเป็น", r.totalLevel === "มีปัญหา");
    }
  }
  if (ctx.eq && ctx.eq.totalLevel === "ต่ำกว่าเกณฑ์ปกติ") {
    const low = (ctx.eq.subs || []).filter((x) => x.level === "ต่ำกว่าเกณฑ์ปกติ").map((x) => x.name);
    add(`EQ ต่ำกว่าเกณฑ์ปกติ (${ctx.eq.total} คะแนน)${low.length ? ` ด้านที่ควรพัฒนา: ${low.join(", ")}` : ""}`, "จัดกิจกรรมพัฒนาความฉลาดทางอารมณ์");
  }

  // ---- การมาเรียน ----
  const a = ctx.att;
  if (a && a.days >= 5) {
    const rate = a.absent / a.days;
    if (rate >= 0.2) add(`ขาดเรียน ${a.absent} จาก ${a.days} วัน (${Math.round(rate * 100)}%)`, "ติดตามสาเหตุการขาดเรียนร่วมกับผู้ปกครอง", rate >= 0.3);
    if (a.late >= 5) add(`มาสาย ${a.late} ครั้งในภาคเรียนนี้`, "พูดคุยหาสาเหตุและวางแผนการเดินทางร่วมกับผู้ปกครอง");
  }

  // ---- จัดกลุ่ม ----
  // มีประเด็นรุนแรง = มีปัญหา, ตั้งแต่ 2 ประเด็น = เสี่ยง, 0-1 ประเด็นทั่วไป = ปกติ (ครูเป็นผู้ยืนยันอีกครั้ง)
  const screening = items.some((x) => x.severe) ? "มีปัญหา" : items.length >= 2 ? "เสี่ยง" : "ปกติ";
  const concerns = items.length
    ? items.map((x, i) => `${i + 1}. ${x.text}\n   → ${x.help}`).join("\n")
    : "ไม่พบสภาพที่น่าเป็นห่วงจากข้อมูลที่บันทึก";

  const name = ctx.student.name;
  const live = d.lives_with ? `พักอาศัยอยู่กับ${d.lives_with.replace(/^พักอยู่/, "")}` : "";
  const home = [d.housing, d.house_type].filter(Boolean).join(" ลักษณะ");
  const fam = d.parents_status ? `บิดามารดา${d.parents_status}` : "";
  const inc = income ? `รายได้ครัวเรือนรวมประมาณ ${hvMoney(income)} บาทต่อเดือน` : "";
  const env = d.safety ? `สภาพที่อยู่อาศัย${d.safety === "เสี่ยง" ? "มีความเสี่ยง" : "มั่นคงปลอดภัย"}` : "";
  const plan = {
    "ปกติ": "จัดอยู่ในกลุ่มปกติ ควรส่งเสริมและพัฒนาตามศักยภาพ สนับสนุนกิจกรรมที่นักเรียนสนใจ และติดตามตามปกติของระบบดูแลช่วยเหลือนักเรียน",
    "เสี่ยง": "จัดอยู่ในกลุ่มเสี่ยง ควรได้รับการป้องกันและแก้ไขปัญหา โดยครูที่ปรึกษาติดตามอย่างใกล้ชิด ประสานผู้ปกครองอย่างสม่ำเสมอ และทบทวนผลอีกครั้งในภาคเรียนถัดไป",
    "มีปัญหา": "จัดอยู่ในกลุ่มมีปัญหา ควรได้รับการช่วยเหลือโดยเร่งด่วน ครูที่ปรึกษาควรรายงานและส่งต่อครูแนะแนว/ฝ่ายกิจการนักเรียน หรือหน่วยงานภายนอกที่เกี่ยวข้อง พร้อมติดตามผลเป็นระยะ",
  }[screening];
  const conclusion = `จากการเยี่ยมบ้าน${d.visit_date ? `เมื่อวันที่ ${new Date(d.visit_date).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}` : ""} พบว่า ${name} `
    + [live, home && `ที่พักเป็น${home}`, fam, inc, env].filter(Boolean).join(" ") + "\n\n"
    + `ภาพรวม${plan}`;
  return { screening, concerns, conclusion, items };
}
