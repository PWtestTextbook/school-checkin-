// =====================================================================
// FormEngine: สร้างแบบฟอร์มหลายขั้นตอน (wizard) จากรายการคำถาม
// ใช้ร่วมกันทั้ง ปพ.8, SDQ และ EQ
//
// ชนิดคำถาม (type):
//   text, tel, number, date, textarea  = ช่องกรอก
//   radio   = เลือก 1 ข้อ   (other: true = มีตัวเลือก "อื่นๆ" ให้พิมพ์)
//   checks  = เลือกได้หลายข้อ
//   likert  = ข้อคำถามแบบมาตรประมาณค่า เก็บค่าเป็นตัวเลข 0,1,2,...
//   info    = ข้อความแสดงผลอย่างเดียว
//   html    = ส่วน HTML ที่สร้างเอง (render: (data) => "<...>")
// ตัวเลือกอื่น: required, half (ครึ่งแถว), unit, hint, placeholder, min, max, maxlength,
//              show: (data) => true/false  (แสดงเมื่อเงื่อนไขเป็นจริง)
// =====================================================================
const OTHER = "อื่นๆ";

const FormEngine = {
  create(opt) {
    const st = { step: 0, data: opt.data || {}, steps: opt.steps, root: opt.root };
    const esc = App.esc;

    const saveDraft = () => {
      if (!opt.draftKey) return;
      try {
        const keep = { ...st.data };
        (opt.draftExclude || []).forEach((k) => delete keep[k]);       // ไม่เก็บรูปภาพในร่าง (ใหญ่เกินไป)
        localStorage.setItem(opt.draftKey, JSON.stringify(keep));
      } catch { /* ไม่มีที่เก็บก็ข้ามไป */ }
    };
    const visible = (f) => !f.show || f.show(st.data);

    // ---------- วาดคำถามแต่ละแบบ ----------
    function field(f) {
      if (!visible(f)) return "";
      const v = st.data[f.key];
      const req = f.required ? '<span class="req">*</span>' : "";
      const lab = f.label ? `<label class="f-label" for="f_${f.key}">${f.num ? `<span class="q-num">${f.num}</span>` : ""}${esc(f.label)}${req}</label>` : "";
      const hint = f.hint ? `<div class="f-hint">${esc(f.hint)}</div>` : "";
      const wrap = (inner) => `<div class="f-item ${f.half ? "half" : ""}" data-key="${f.key || ""}">${lab}${inner}${hint}</div>`;

      switch (f.type) {
        case "info":
          return `<div class="f-info">${f.html ?? esc(f.label)}</div>`;
        case "html":
          return `<div class="f-item f-html" data-hid="${f.id}">${f.render(st.data)}</div>`;
        case "textarea":
          return wrap(`<textarea id="f_${f.key}" data-k="${f.key}" maxlength="${f.maxlength || 300}" placeholder="${esc(f.placeholder || "")}">${esc(v || "")}</textarea>`);
        case "radio":
        case "checks": {
          const multi = f.type === "checks";
          const list = Array.isArray(v) ? v : v ? [v] : [];
          const otherVal = list.find((x) => String(x).startsWith(OTHER + ":"));
          const opts = f.options.map((o, i) => {
            const on = list.includes(o);
            return `<label class="chip ${on ? "on" : ""}"><input type="${multi ? "checkbox" : "radio"}" name="f_${f.key}" data-k="${f.key}" data-multi="${multi ? 1 : 0}" value="${esc(o)}" ${on ? "checked" : ""}><span>${esc(o)}</span></label>`;
          }).join("");
          const other = f.other
            ? `<label class="chip ${otherVal ? "on" : ""}"><input type="${multi ? "checkbox" : "radio"}" name="f_${f.key}" data-k="${f.key}" data-multi="${multi ? 1 : 0}" value="${OTHER}" ${otherVal ? "checked" : ""}><span>${OTHER} (ระบุ)</span></label>
               <input class="other-input ${otherVal ? "" : "hidden"}" data-other="${f.key}" placeholder="โปรดระบุ" maxlength="100" value="${esc(otherVal ? otherVal.slice(OTHER.length + 1).trim() : "")}">`
            : "";
          return wrap(`<div class="chips ${f.cols ? "cols-" + f.cols : ""}">${opts}${other}</div>`);
        }
        case "likert": {
          const opts = f.options.map((o, i) =>
            `<label class="lk ${v === i ? "on" : ""}"><input type="radio" name="f_${f.key}" data-k="${f.key}" data-num="1" value="${i}" ${v === i ? "checked" : ""}><span>${esc(o)}</span></label>`).join("");
          return `<div class="f-item likert ${v === undefined ? "" : "answered"}" data-key="${f.key}">
            <div class="lk-q"><span class="q-num">${f.num}</span><span>${esc(f.label)}</span></div>
            <div class="lk-opts n${f.options.length}">${opts}</div></div>`;
        }
        default: {
          const t = f.type || "text";
          const im = t === "number" ? 'inputmode="decimal"' : t === "tel" ? 'inputmode="tel"' : "";
          const input = `<input id="f_${f.key}" data-k="${f.key}" type="${t === "number" ? "text" : t}" ${im} value="${esc(v ?? "")}"
            placeholder="${esc(f.placeholder || "")}" maxlength="${f.maxlength || 150}">`;
          return wrap(f.unit ? `<div class="with-unit">${input}<span>${esc(f.unit)}</span></div>` : input);
        }
      }
    }

    // ---------- วาดขั้นตอนปัจจุบัน ----------
    function render() {
      const s = st.steps[st.step], n = st.steps.length;
      const pct = Math.round(((st.step + 1) / n) * 100);
      st.root.innerHTML = `
        <div class="progress"><div class="bar" style="width:${pct}%"></div></div>
        <div class="step-head">
          <div class="step-no">ส่วนที่ ${st.step + 1} / ${n}</div>
          <h2>${esc(s.title)}</h2>
          ${s.desc ? `<p class="step-desc">${esc(s.desc)}</p>` : ""}
        </div>
        <div class="paper">${s.render ? s.render(st.data) : `<div class="f-grid">${s.fields.map(field).join("")}</div>`}</div>
        <div class="nav-bar">
          <button class="secondary" id="feBack">${st.step === 0 ? "กลับเมนู" : "ย้อนกลับ"}</button>
          <button id="feNext">${st.step === n - 1 ? (opt.submitText || "บันทึกข้อมูล") : "ถัดไป"}</button>
        </div>`;
      window.scrollTo(0, 0);
    }

    // ---------- รับค่าที่ผู้ใช้กรอก ----------
    function onInput(e) {
      const el = e.target;
      el.closest(".f-item")?.classList.remove("error");
      if (el.dataset.other) {                                  // ช่องพิมพ์ "อื่นๆ"
        setOther(el.dataset.other, el.value);
        return saveDraft();
      }
      const k = el.dataset.k;
      if (!k) return;
      if (el.type === "radio" && el.dataset.num) {
        st.data[k] = Number(el.value);
      } else if (el.type === "radio") {
        st.data[k] = el.value === OTHER ? `${OTHER}: ` : el.value;
      } else if (el.type === "checkbox" && el.dataset.bool) {
        st.data[k] = el.checked;
      } else if (el.type === "checkbox") {
        const cur = Array.isArray(st.data[k]) ? st.data[k] : [];
        const val = el.value === OTHER ? `${OTHER}: ` : el.value;
        st.data[k] = el.checked ? [...cur.filter((x) => !(val.startsWith(OTHER) && x.startsWith(OTHER))), val]
          : cur.filter((x) => (el.value === OTHER ? !x.startsWith(OTHER) : x !== el.value));
        if (f(k)?.exclusive && el.checked) {                    // ตัวเลือก "ไม่มี" ล้างตัวอื่น
          st.data[k] = el.value === f(k).exclusive ? [el.value] : st.data[k].filter((x) => x !== f(k).exclusive);
        }
      } else {
        st.data[k] = el.value;
        // อัปเดตส่วนคำนวณ (เช่น BMI) ทันทีโดยไม่วาดทั้งหน้าใหม่
        for (const h of (st.steps[st.step].fields || []).filter((x) => x.type === "html")) {
          const box = st.root.querySelector(`[data-hid="${h.id}"]`);
          if (box) box.innerHTML = h.render(st.data);
        }
      }
      saveDraft();
      if (el.type === "radio" || el.type === "checkbox") {
        const s = st.steps[st.step];
        if (s.fields?.some((x) => x.show) || s.render || f(k)?.type !== "likert") {
          const y = window.scrollY; render(); window.scrollTo(0, y);
        } else {                                              // likert: ไม่วาดใหม่ทั้งหน้า เลื่อนไปข้อถัดไป
          const box = el.closest(".likert");
          box.classList.add("answered");
          box.querySelectorAll(".lk").forEach((l) => l.classList.toggle("on", l.contains(el)));
          const next = box.nextElementSibling;
          if (next && !next.classList.contains("answered")) next.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    const allFields = () => st.steps.flatMap((s) => s.fields || []);
    const f = (k) => allFields().find((x) => x.key === k);
    function setOther(k, text) {
      const v = `${OTHER}: ${text.trim()}`;
      if (Array.isArray(st.data[k])) st.data[k] = st.data[k].map((x) => (x.startsWith(OTHER) ? v : x));
      else st.data[k] = v;
    }

    // ---------- ตรวจความครบถ้วนของขั้นตอน ----------
    function validate() {
      const s = st.steps[st.step];
      if (s.validate) { const m = s.validate(st.data); if (m) return { msg: m }; }
      for (const fl of s.fields || []) {
        if (!visible(fl) || !fl.key) continue;
        const v = st.data[fl.key];
        const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
        if (fl.required && empty) return { key: fl.key, msg: fl.type === "likert" ? `กรุณาตอบข้อ ${fl.num}` : `กรุณากรอก "${fl.label}"` };
        if (!empty && (String(v).endsWith(OTHER + ": ") || (Array.isArray(v) && v.some((x) => x === OTHER + ": ")))) {
          return { key: fl.key, msg: `กรุณาระบุ "อื่นๆ" ในข้อ "${fl.label}"` };
        }
        if (!empty && fl.type === "number") {
          const n = Number(v);
          if (Number.isNaN(n)) return { key: fl.key, msg: `"${fl.label}" ต้องเป็นตัวเลข` };
          if (fl.min !== undefined && n < fl.min) return { key: fl.key, msg: `"${fl.label}" ต้องไม่น้อยกว่า ${fl.min}` };
          if (fl.max !== undefined && n > fl.max) return { key: fl.key, msg: `"${fl.label}" ต้องไม่เกิน ${fl.max}` };
        }
        if (!empty && fl.type === "tel" && !/^0\d{8,9}$/.test(String(v).replace(/[-\s]/g, ""))) {
          return { key: fl.key, msg: `"${fl.label}" ไม่ถูกต้อง` };
        }
      }
      return null;
    }

    function onClick(e) {
      if (e.target.id === "feBack") {
        if (st.step === 0) return opt.onExit?.();
        st.step--; return render();
      }
      if (e.target.id === "feNext") {
        const err = validate();
        if (err) {
          App.alert(err.msg);
          const box = err.key && st.root.querySelector(`[data-key="${err.key}"]`);
          if (box) { box.classList.add("error"); box.scrollIntoView({ behavior: "smooth", block: "center" }); }
          return;
        }
        if (st.step < st.steps.length - 1) { st.step++; return render(); }
        return opt.onSubmit(st.data);
      }
      const jump = e.target.closest("[data-jump]");
      if (jump) { st.step = Number(jump.dataset.jump); render(); }
    }

    const isPick = (el) => el.type === "radio" || el.type === "checkbox";
    st.root.oninput = (e) => { if (!isPick(e.target)) onInput(e); };     // ช่องพิมพ์
    st.root.onchange = (e) => { if (isPick(e.target)) onInput(e); };     // ตัวเลือก
    st.root.onclick = onClick;
    render();
    return { get data() { return st.data; }, render, goto(i) { st.step = i; render(); } };
  },
};
