// =====================================================================
// ระเบียนสะสมนักเรียนรายบุคคล (ปพ.8) ข้อ 1-9
// ชื่อ key ต้องตรงกับ PP8_COLS ใน supabase/functions/api/forms.ts
// =====================================================================
function pp8Steps(stu) {
  const level = parseInt(String(stu.classroom), 10) || 1;       // "4/2" → 4
  const esc = App.esc;

  // ตารางผลการเรียนเฉลี่ย แสดงเฉพาะชั้นที่ผ่านมาและชั้นปัจจุบัน
  const gpaFields = [];
  for (let m = 1; m <= Math.min(level, 6); m++) {
    gpaFields.push({ key: `gpa_m${m}_year`, label: `ม.${m} ปีการศึกษา`, type: "number", half: true, placeholder: "เช่น 2567", min: 2550, max: 2600 });
    if (m <= 3) {
      gpaFields.push({ key: `gpa_m${m}`, label: `ม.${m} เกรดเฉลี่ย`, type: "number", half: true, placeholder: "0.00-4.00", min: 0, max: 4 });
    } else {
      gpaFields.push({ key: `gpa_m${m}_s1`, label: `ม.${m} ภาคเรียนที่ 1`, type: "number", half: true, placeholder: "0.00-4.00", min: 0, max: 4 });
      gpaFields.push({ key: `gpa_m${m}_s2`, label: `ม.${m} ภาคเรียนที่ 2`, type: "number", half: true, placeholder: "0.00-4.00", min: 0, max: 4 });
    }
  }

  const steps = [
    {
      title: "1. ประวัติส่วนตัวนักเรียน",
      desc: "ข้อมูลพื้นฐานดึงจากทะเบียนนักเรียน หากไม่ถูกต้องให้แจ้งครูที่ปรึกษา",
      fields: [
        { type: "info", html: `<div class="id-card">
            <div><span>ชื่อ-สกุล</span><b>${esc(stu.name)}</b></div>
            <div><span>เลขประจำตัว</span><b>${esc(stu.studentId)}</b></div>
            <div><span>ชั้น</span><b>ม.${esc(stu.classroom)}</b></div>
            <div><span>เลขที่</span><b>${esc(stu.number)}</b></div>
            <div class="wide"><span>ครูที่ปรึกษา</span><b>${esc(stu.advisors.join(", ") || "-")}</b></div>
          </div>` },
        { key: "nickname", label: "ชื่อเล่น", required: true, half: true },
        { key: "phone", label: "โทรศัพท์นักเรียน", type: "tel", half: true, placeholder: "0812345678" },
        { key: "birth_date", label: "วันเดือนปีเกิด", type: "date", required: true, half: true },
        { type: "info", html: "<h3 class='sub'>สถานที่เกิด</h3>" },
        { key: "bp_house", label: "บ้านเลขที่", half: true },
        { key: "bp_moo", label: "หมู่ที่", half: true },
        { key: "bp_village", label: "บ้าน (หมู่บ้าน)", half: true },
        { key: "bp_subdistrict", label: "ตำบล", half: true },
        { key: "bp_district", label: "อำเภอ", half: true },
        { key: "bp_province", label: "จังหวัด", half: true },
        { type: "info", html: "<h3 class='sub'>การอยู่อาศัยและการเดินทาง</h3>" },
        { key: "lives_with", label: "อาศัยอยู่กับ", type: "radio", required: true, other: true,
          options: ["บิดาและมารดา", "บิดา", "มารดา", "ปู่/ย่า", "ตา/ยาย", "ญาติ", "หอพัก"] },
        { key: "distance_km", label: "ระยะทางจากบ้านถึงโรงเรียน", type: "number", unit: "กม.", half: true, min: 0, max: 500 },
        { key: "travel", label: "เดินทางมาโรงเรียนโดย", type: "radio", required: true, other: true,
          options: ["เดิน", "รถจักรยาน", "รถจักรยานยนต์", "รถรับส่ง"] },
        { key: "talent", label: "ความสามารถพิเศษ", type: "textarea", maxlength: 200 },
      ],
    },
    {
      title: "1. ประวัติส่วนตัว (ครอบครัว)",
      fields: [
        { type: "info", html: "<h3 class='sub'>บิดา</h3>" },
        { key: "father_name", label: "ชื่อ-สกุลบิดา", required: true, hint: "ถ้าไม่ทราบหรือเสียชีวิตแล้ว ให้ระบุตามจริง" },
        { key: "father_age", label: "อายุ", type: "number", unit: "ปี", half: true, min: 15, max: 120 },
        { key: "father_job", label: "อาชีพ", half: true },
        { type: "info", html: "<h3 class='sub'>มารดา</h3>" },
        { key: "mother_name", label: "ชื่อ-สกุลมารดา", required: true },
        { key: "mother_age", label: "อายุ", type: "number", unit: "ปี", half: true, min: 15, max: 120 },
        { key: "mother_job", label: "อาชีพ", half: true },
        { key: "parent_address", label: "ที่อยู่บิดา/มารดา", type: "textarea", maxlength: 300 },
        { key: "parent_phone", label: "โทรศัพท์บิดา/มารดา", type: "tel", half: true },
        { type: "info", html: "<h3 class='sub'>พี่น้อง</h3>" },
        { key: "birth_order", label: "เป็นบุตรคนที่", type: "number", half: true, min: 1, max: 20 },
        { key: "siblings_total", label: "พี่น้องร่วมสายโลหิต", type: "number", unit: "คน", half: true, min: 1, max: 20 },
        { key: "siblings_male", label: "เป็นชาย", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "siblings_female", label: "เป็นหญิง", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "siblings_working", label: "ประกอบอาชีพแล้ว", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "siblings_dependent", label: "อยู่ในความอุปการะของครอบครัว", type: "number", unit: "คน", half: true, min: 0, max: 20 },
        { key: "parent_status", label: "สถานภาพบิดา มารดา", type: "radio", required: true, other: true,
          options: ["อยู่ด้วยกัน", "แยกกันอยู่", "หย่าร้างกัน"] },
        { key: "family_income", label: "รายได้ของครอบครัว", type: "radio", required: true,
          options: ["ตั้งแต่ 27,000 บาทต่อปีขึ้นไป", "20,000 - 26,999 บาทต่อปี", "น้อยกว่า 20,000 บาทต่อปี"] },
        { key: "payer_name", label: "ผู้ออกค่าใช้จ่ายในการเรียน", half: true },
        { key: "payer_relation", label: "เกี่ยวข้องเป็น", half: true, placeholder: "เช่น บิดา" },
        { key: "hobby", label: "งานอดิเรกของข้าพเจ้า" },
        { key: "duty1", label: "หน้าที่รับผิดชอบภายในบ้าน 1", half: true },
        { key: "duty2", label: "หน้าที่รับผิดชอบภายในบ้าน 2", half: true },
      ],
      validate: (d) => {
        const t = Number(d.siblings_total || 0), m = Number(d.siblings_male || 0), f = Number(d.siblings_female || 0);
        if (d.siblings_total && (d.siblings_male || d.siblings_female) && m + f !== t) return "จำนวนพี่น้องชาย + หญิง ต้องเท่ากับจำนวนพี่น้องทั้งหมด";
        if (d.birth_order && d.siblings_total && Number(d.birth_order) > t) return "ลำดับบุตรต้องไม่เกินจำนวนพี่น้องทั้งหมด";
        return null;
      },
    },
    {
      title: "2. ด้านเกี่ยวกับสุขภาพ",
      fields: [
        { key: "weight", label: "น้ำหนัก", type: "number", unit: "กก.", required: true, half: true, min: 15, max: 250 },
        { key: "height", label: "ส่วนสูง", type: "number", unit: "ซม.", required: true, half: true, min: 80, max: 230 },
        { type: "html", id: "bmi", render: (d) => {
          const w = Number(d.weight), h = Number(d.height) / 100;
          return w && h ? `<div class="bmi">ดัชนีมวลกาย (BMI) ≈ <b>${(w / (h * h)).toFixed(1)}</b></div>` : "";
        } },
        { key: "chronic_disease", label: "โรคประจำตัว", placeholder: "ถ้าไม่มี พิมพ์ \"ไม่มี\"" },
        { key: "past_disease", label: "โรคที่เคยเป็น", half: true },
        { key: "past_disease_year", label: "เมื่อปี พ.ศ.", type: "number", half: true, min: 2540, max: 2600 },
        { key: "past_disease_treatment", label: "การรักษา" },
        { key: "accident", label: "ประวัติอุบัติเหตุ", half: true },
        { key: "accident_year", label: "เมื่อปี พ.ศ.", type: "number", half: true, min: 2540, max: 2600 },
        { key: "accident_hospital", label: "สถานที่เข้ารับการรักษา" },
      ],
    },
    {
      title: "3. ด้านเกี่ยวกับเศรษฐกิจ",
      fields: [
        { key: "money_per_day", label: "เงินใช้จ่ายในการมาโรงเรียนประมาณวันละ", type: "number", unit: "บาท", half: true, min: 0, max: 5000 },
        { key: "parttime_job", label: "งานพิเศษที่ทำ", placeholder: "ถ้าไม่มี เว้นว่างได้" },
        { key: "parttime_income", label: "รายได้เฉลี่ยวันละ", type: "number", unit: "บาท", half: true, min: 0, max: 10000,
          show: (d) => !!d.parttime_job },
        { key: "expense_opinion", label: "ข้าพเจ้าคิดว่าค่าใช้จ่ายของข้าพเจ้า", type: "radio", required: true, cols: 2,
          options: ["มากเกินไป", "พอดี", "ไม่พอใช้บางครั้ง", "น้อยเกินไป"] },
      ],
    },
    {
      title: "4. สิ่งแวดล้อมในโรงเรียนและทางบ้าน",
      fields: [
        { key: "school_feel", label: "โรงเรียนของข้าพเจ้า", type: "radio", required: true,
          options: ["น่าเรียนมาก", "น่าเรียนพอควร", "ไม่น่าเรียนเลย"] },
        { key: "school_warmth", label: "บรรยากาศในโรงเรียน: ความอบอุ่น", type: "radio", required: true,
          options: ["อบอุ่นมาก", "อบอุ่นพอควร", "ห่างเหินกัน"] },
        { key: "school_unity", label: "บรรยากาศในโรงเรียน: ความสามัคคี", type: "radio", required: true,
          options: ["สามัคคีกัน", "ต่างคนต่างอยู่", "แยกกันหลายหมู่"] },
        { key: "home_warmth", label: "บรรยากาศของบ้านข้าพเจ้า: ความอบอุ่น", type: "radio", required: true,
          options: ["อบอุ่นมาก", "อบอุ่นพอควร", "ห่างเหินกัน"] },
        { key: "home_unity", label: "บรรยากาศของบ้านข้าพเจ้า: ความสัมพันธ์", type: "radio", required: true, cols: 2,
          options: ["สามัคคีกัน", "ต่างคนต่างอยู่", "ไม่ลงรอยกันทั้งบ้าน", "เงียบเหงาน่าเบื่อ"] },
        { key: "family_improve1", label: "สิ่งที่อยากให้ครอบครัวปรับปรุง 1", half: true },
        { key: "family_improve2", label: "สิ่งที่อยากให้ครอบครัวปรับปรุง 2", half: true },
      ],
    },
    {
      title: "5. ด้านเกี่ยวกับการเรียน",
      fields: [
        { key: "study_problems", label: "ปัจจุบันข้าพเจ้า (เลือกได้หลายข้อ)", type: "checks", required: true, exclusive: "ไม่มีปัญหาการเรียน",
          options: ["ไม่มีปัญหาการเรียน", "เรียนไม่เข้าใจ", "เบื่อเรียนบางวิชา", "เรียนไม่ทันเพื่อน", "อยากเลิกเรียน",
            "ต้องการให้เพื่อนช่วย", "ต้องการครูที่เข้าใจและเป็นที่ปรึกษาได้"] },
        { key: "study_problem_cause", label: "สาเหตุของปัญหาทางการเรียน เพราะ", type: "textarea", maxlength: 300,
          show: (d) => (d.study_problems || []).some((x) => x !== "ไม่มีปัญหาการเรียน") },
        { type: "info", html: "<h3 class='sub'>ผลการเรียนเฉลี่ย</h3><p class='f-hint'>กรอกเฉพาะชั้นที่ทราบผลแล้ว</p>" },
        ...gpaFields,
      ],
    },
    {
      title: "6. มนุษยสัมพันธ์และบุคลิกภาพ",
      fields: [
        { key: "best_friend", label: "เพื่อนสนิทของข้าพเจ้า", half: true },
        { key: "best_friend_class", label: "ชั้น", half: true, placeholder: "เช่น ม.4/2" },
        { key: "peer_role", label: "เมื่ออยู่ในกลุ่มเพื่อน ข้าพเจ้ามักเป็น", type: "radio", required: true,
          options: ["ผู้นำ", "ผู้ตาม", "ผู้นำบางโอกาส ผู้ตามบางโอกาส"] },
        { key: "get_along", label: "ข้าพเจ้าเข้ากับเพื่อนได้", type: "radio", required: true, options: ["ง่าย", "ค่อนข้างง่าย", "ยาก"] },
        { key: "adult_task", label: "เมื่อผู้ใหญ่ใช้งาน ข้าพเจ้ามักจะ", type: "radio", required: true,
          options: ["ทำด้วยความกระตือรือร้น", "ทำเพราะเลี่ยงไม่ได้", "พยายามหลีกเลี่ยง"] },
        { key: "group_work", label: "เมื่อมีกิจกรรมกลุ่ม ข้าพเจ้ามักจะ", type: "radio", required: true,
          options: ["ทำงานมากกว่าเพื่อน", "ทำงานเท่ากับเพื่อน", "ทำงานน้อยกว่าเพื่อน"] },
      ],
    },
    {
      title: "7. สุขภาพจิตและค่านิยม",
      fields: [
        { key: "world_view", label: "ข้าพเจ้ารู้สึกว่าโลกนี้", type: "radio", required: true, options: ["น่าอยู่", "ไม่น่าอยู่"] },
        { key: "self_worth", label: "ข้าพเจ้ารู้สึกว่าตัวเอง", type: "radio", required: true, options: ["มีค่า", "ไม่มีค่า"] },
        { key: "good_person", label: "ข้าพเจ้าคิดว่าคนที่ดีควรมีลักษณะ", type: "textarea", maxlength: 300 },
        { key: "good_society", label: "ข้าพเจ้าคิดว่าสังคมที่ดีควรมีลักษณะ", type: "textarea", maxlength: 300 },
      ],
    },
    {
      title: "8. เป้าหมายของชีวิตในอนาคต",
      fields: [
        { key: "career", label: "ข้าพเจ้าอยากประกอบอาชีพ", required: true },
        { key: "career_reason", label: "เพราะ", type: "textarea", maxlength: 300 },
      ],
    },
    {
      title: "9. ปัญหาที่ข้าพเจ้ากำลังประสบอยู่ในขณะนี้",
      fields: [
        { key: "problems", label: "เลือกได้หลายข้อ", type: "checks", required: true, exclusive: "ไม่มีปัญหา", cols: 2,
          options: ["ไม่มีปัญหา", "เรื่องครอบครัว", "เรื่องการเรียน", "เรื่องสุขภาพ", "เรื่องเศรษฐกิจ", "เรื่องการคบเพื่อน",
            "เรื่องการวางตัวในสังคม", "เรื่องการใช้เวลาว่าง", "เรื่องการเลือกอาชีพ", "เรื่องการเลือกศึกษาต่อ",
            "เรื่องการปรับตัวเข้ากับครู-อาจารย์ในโรงเรียน"] },
        { key: "help_from", label: "ถ้าต้องการความช่วยเหลือ/ปรึกษา ข้าพเจ้าต้องการจาก", type: "checks", other: true, cols: 2,
          options: ["บิดา", "มารดา", "ครูแนะแนว", "ครูที่ปรึกษา", "เพื่อน"] },
      ],
    },
  ];

  // ขั้นสุดท้าย: ตรวจทาน + รับรองข้อมูล
  steps.push({
    title: "ตรวจทานและรับรองข้อมูล",
    desc: "แตะชื่อส่วนเพื่อกลับไปแก้ไข",
    render: (d) => {
      const filled = (s) => (s.fields || []).filter((f) => f.key && f.type !== "info" && f.type !== "html");
      const rows = steps.slice(0, -1).map((s, i) => {
        const fs = filled(s), n = fs.filter((f) => d[f.key] !== undefined && d[f.key] !== "" && !(Array.isArray(d[f.key]) && !d[f.key].length)).length;
        return `<button class="review-row" data-jump="${i}"><span>${esc(s.title)}</span><span class="cnt">${n}/${fs.length} ข้อ ›</span></button>`;
      }).join("");
      const today = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" });
      return `<div class="review">${rows}</div>
        <label class="certify"><input type="checkbox" data-k="certify" data-bool="1" ${d.certify ? "checked" : ""}>
          <span>ข้าพเจ้าขอรับรองว่าข้อมูลข้างต้นเป็นความจริงทุกประการ</span></label>
        <div class="sign">ลงชื่อ <b>${esc(stu.name)}</b> ผู้กรอกข้อมูล<br>วันที่ ${today}</div>
        <p class="privacy">ข้อมูลนี้เก็บเป็นความลับ ใช้เพื่อการดูแลช่วยเหลือนักเรียนของครูที่ปรึกษาเท่านั้น</p>`;
    },
    validate: (d) => (d.certify === true ? null : "กรุณาติ๊กรับรองว่าข้อมูลเป็นความจริง"),
  });
  return steps;
}
