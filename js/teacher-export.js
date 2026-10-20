// =====================================================================
// ส่งออกรายงานหน้าครูเป็นไฟล์ Word (.docx) ขนาด A4
//  - ปุ่มไอคอน [data-export="today|history|homeroom|service|conduct"] ที่หัวการ์ดของแต่ละแท็บ
//  - สร้างไฟล์ในเครื่อง ไม่ส่งข้อมูลออกไปที่ใด (ใช้ JSZip จาก cdnjs โหลดเมื่อกดครั้งแรก)
//  - ในแอป LINE: ใช้เมนูแชร์ของมือถือ (บันทึกลงไฟล์ / Drive / ส่งต่อ) ถ้าเครื่องไม่รองรับ
//    เสนอให้เปิดหน้านี้ในเบราว์เซอร์ แล้วกดปุ่มอีกครั้ง
// ใช้ตัวแปร me, room(), todayData, histData, homeroomLogs จาก teacher.html
// =====================================================================
const TeacherExport = (() => {
  const FONT = "TH Sarabun New";
  const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const x = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- โหลด JSZip ครั้งแรกที่ใช้ ----------
  let zipReady = null;
  function loadZip() {
    if (window.JSZip) return Promise.resolve();
    zipReady ??= new Promise((ok, bad) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = ok; s.onerror = () => { zipReady = null; bad(new Error("โหลดตัวสร้างไฟล์ไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่")); };
      document.head.appendChild(s);
    });
    return zipReady;
  }

  // ---------- ส่วนประกอบเอกสาร Word ----------
  const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/><w:bCs/>" : ""}${o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : ""}</w:rPr><w:t xml:space="preserve">${x(t)}</w:t></w:r>`;
  const para = (t, o = {}) => `<w:p><w:pPr>${o.center ? '<w:jc w:val="center"/>' : o.right ? '<w:jc w:val="right"/>' : ""}<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 60}"/></w:pPr>${
    String(t).split("\n").map((line, i) => (i ? "<w:r><w:br/></w:r>" : "") + run(line, o)).join("")}</w:p>`;

  /** ตาราง: head = ["หัว", ...], rows = [["ค่า", ...]], widths = สัดส่วนความกว้างแต่ละคอลัมน์ */
  function table(head, rows, o = {}) {
    const total = o.pageW, n = head.length;
    const w = o.widths ?? head.map(() => 1), sum = w.reduce((a, b) => a + b, 0);
    const tw = w.map((k) => Math.floor((k / sum) * total));
    const sz = o.sz ?? 28;
    const cell = (t, i, hdr) => `<w:tc><w:tcPr><w:tcW w:w="${tw[i]}" w:type="dxa"/>${hdr ? '<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/>' : ""}<w:vAlign w:val="center"/></w:tcPr>${
      para(t, { sz, b: hdr, center: hdr || (o.centerCols ?? []).includes(i), after: 0 })}</w:tc>`;
    const tr = (cells, hdr) => `<w:tr>${hdr ? "<w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>" : "<w:trPr><w:cantSplit/></w:trPr>"}${cells.map((c, i) => cell(c, i, hdr)).join("")}</w:tr>`;
    const B = '<w:top w:val="single" w:sz="4" w:color="808080"/><w:left w:val="single" w:sz="4" w:color="808080"/><w:bottom w:val="single" w:sz="4" w:color="808080"/><w:right w:val="single" w:sz="4" w:color="808080"/><w:insideH w:val="single" w:sz="4" w:color="808080"/><w:insideV w:val="single" w:sz="4" w:color="808080"/>';
    return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${B}</w:tblBorders><w:tblCellMar><w:left w:w="57" w:type="dxa"/><w:right w:w="57" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${
      tw.map((v) => `<w:gridCol w:w="${v}"/>`).join("")}</w:tblGrid>${tr(head, true)}${rows.map((r) => tr(r.slice(0, n), false)).join("")}</w:tbl>` + para("", { after: 0 });
  }

  /** สร้างไฟล์ .docx จากรายการชิ้นส่วน */
  async function buildDocx(parts, landscape) {
    await loadZip();
    // A4 = 11906 x 16838 twip (1 ซม. = 567)  ขอบซ้าย 3 ซม. บน 2.5 ขวา/ล่าง 2 ซม.
    const W = landscape ? 16838 : 11906, H = landscape ? 11906 : 16838, mL = 1701, mR = 1134;
    const pageW = W - mL - mR;
    const body = parts.map((p) => (typeof p === "function" ? p(pageW) : p)).join("");
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="${W}" w:h="${H}"${landscape ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="1418" w:right="${mR}" w:bottom="1134" w:left="${mL}" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${FONT}" w:hAnsi="${FONT}" w:eastAsia="${FONT}" w:cs="${FONT}"/><w:sz w:val="32"/><w:szCs w:val="32"/><w:lang w:val="th-TH" w:eastAsia="th-TH" w:bidi="th-TH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
    const zip = new JSZip();
    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
    zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.file("word/document.xml", doc);
    zip.file("word/styles.xml", styles);
    return zip.generateAsync({ type: "blob", mimeType: DOCX_MIME, compression: "DEFLATE" });
  }

  // ---------- หัวและท้ายเอกสาร ----------
  const printedAt = () => new Date().toLocaleString("th-TH", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const header = (title, sub) => [
    para(CONFIG.SCHOOL_NAME || "", { center: true, b: true, sz: 36, after: 0 }),
    para(title, { center: true, b: true, sz: 36, after: 0 }),
    para(sub, { center: true, after: 160 }),
  ].join("");
  const footer = (role = "ครูที่ปรึกษา") => [
    para("", { after: 200 }),
    para(`ลงชื่อ ...........................................................\n(${me?.name || "..........................................."})\n${role}`, { center: true }),
    para(`พิมพ์จากระบบ School Check-in เมื่อ ${printedAt()}`, { right: true, sz: 24, before: 200 }),
  ].join("");
  const cellsOf = (tbody) => [...tbody.querySelectorAll("tr")].map((tr) => [...tr.children].map((td) => td.innerText.replace(/\s*\n\s*/g, "\n").trim()));

  // ---------- รายงานแต่ละแท็บ ----------
  const REPORTS = {
    today() {
      const d = todayData; if (!d) throw new Error("ยังไม่มีข้อมูลวันนี้");
      const s = d.summary, sumRow = (n, v) => [n, v.total, v.present, v.late, v.absent].map(String);
      const all = { total: s.male.total + s.female.total, present: s.male.present + s.female.present, late: s.male.late + s.female.late, absent: s.male.absent + s.female.absent };
      return { name: `การมาเรียน_ม${room()}_${d.date}`, parts: [
        header("รายงานการมาเรียนประจำวัน", `ห้อง ม.${room()}  วันที่ ${App.thaiDate(d.date)}`),
        para("สรุป", { b: true }),
        (W) => table(["", "ทั้งหมด", "มา", "สาย", "ขาด/ยังไม่มา"], [sumRow("ชาย", s.male), sumRow("หญิง", s.female), sumRow("รวม", all)], { pageW: W, centerCols: [1, 2, 3, 4] }),
        para("รายชื่อ", { b: true }),
        (W) => table(["เลขที่", "ชื่อ-สกุล", "สถานะ", "เวลามา", "เวลากลับ", "หมายเหตุ"], d.rows.map((r) => [
          r.number, r.name, r.status, r.time ?? "-", r.out ? r.out + (r.early ? " (ก่อนเวลา)" : "") : "-", r.method === "teacher" ? (r.note || "ครูเช็คแทน") : "",
        ].map(String)), { pageW: W, widths: [0.95, 3, 1.2, 1, 1.4, 2.1], centerCols: [0, 2, 3, 4] }),
        footer(),
      ] };
    },

    history() {
      const h = histData; if (!h || !h.days.length) throw new Error("ยังไม่มีวันเรียนในภาคเรียนนี้");
      const n = h.days.length;
      const stu = h.students.map((s) => {
        const present = s.marks.filter((m) => m === "/").length;
        return [s.number, s.name, n, present, s.late, s.absent, n ? ((present + s.late) * 100 / n).toFixed(1) : "-"].map(String);
      });
      // ตารางรายวันแบ่งตามเดือน (กระดาษแนวนอน) เพื่อให้คอลัมน์อ่านได้
      const months = [];
      h.days.forEach((d, i) => { const k = d.slice(0, 7); (months.at(-1)?.k === k ? months.at(-1) : (months.push({ k, idx: [] }), months.at(-1))).idx.push(i); });
      const TH_M = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
      const monthParts = months.map((m) => {
        const [y, mo] = m.k.split("-").map(Number);
        return [
          para(`รายวัน เดือน${TH_M[mo - 1]} ${y + 543}`, { b: true, before: 160 }),
          (W) => table(["ที่", "ชื่อ-สกุล", ...m.idx.map((i) => String(Number(h.days[i].slice(8))))],
            h.students.map((s) => [String(s.number), s.name, ...m.idx.map((i) => s.marks[i])]),
            { pageW: W, sz: 22, widths: [0.6, 3.4, ...m.idx.map(() => 0.42)], centerCols: [0, ...m.idx.map((_, j) => j + 2)] }),
        ];
      }).flat();
      return { name: `ตารางการมาเรียนสะสม_ม${room()}`, landscape: true, parts: [
        header("ตารางการมาเรียนสะสม", `ห้อง ม.${room()}  ตั้งแต่ ${App.thaiDate(h.days[0])} ถึง ${App.thaiDate(h.days[n - 1])}  (${n} วันเรียน)`),
        para("สรุปรายบุคคล ( / = มา, ส = สาย, ข = ขาด )", { b: true }),
        (W) => table(["เลขที่", "ชื่อ-สกุล", "วันเรียน", "มา", "สาย", "ขาด", "ร้อยละการมาเรียน"], stu,
          { pageW: W, widths: [0.7, 3.4, 1, 0.8, 0.8, 0.8, 1.5], centerCols: [0, 2, 3, 4, 5, 6] }),
        ...monthParts,
        footer(),
      ] };
    },

    homeroom() {
      const logs = homeroomLogs || []; if (!logs.length) throw new Error("ยังไม่มีบันทึกโฮมรูม");
      return { name: `บันทึกโฮมรูม_ม${room()}`, parts: [
        header("บันทึกกิจกรรมโฮมรูม", `ห้อง ม.${room()}  จำนวน ${logs.length} ครั้ง`),
        (W) => table(["วันที่", "บันทึกการปฏิบัติ"], logs.map((l) => [App.thaiDate(l.log_date), l.content || ""]), { pageW: W, widths: [1.3, 4.7] }),
        footer(),
      ] };
    },

    service() {
      const rows = cellsOf(document.getElementById("svBody")).filter((r) => r.length >= 5);
      if (!rows.length) throw new Error("ยังไม่มีข้อมูลกิจกรรมเพื่อสังคม");
      return { name: `กิจกรรมเพื่อสังคม_ม${room()}`, parts: [
        header("สรุปกิจกรรมเพื่อสังคมและสาธารณประโยชน์", document.getElementById("svPeriod").innerText.replace(" (แสดงเฉพาะภาคเรียนปัจจุบัน)", "")),
        (W) => table(["เลขที่", "ชื่อ-สกุล", "บันทึก (ครั้ง)", "ชั่วโมงที่อนุมัติ", "รออนุมัติ (ครั้ง)"], rows,
          { pageW: W, widths: [0.7, 3.2, 1.2, 1.3, 1.3], centerCols: [0, 2, 3, 4] }),
        para("ชั่วโมงนับรวมเฉพาะรายการที่ครูที่ปรึกษาอนุมัติแล้ว", { sz: 26 }),
        footer(),
      ] };
    },

    conduct() {
      const rows = cellsOf(document.getElementById("cdRoomBody")).filter((r) => r.length >= 4);
      if (!rows.length) throw new Error("ยังไม่มีข้อมูลคะแนนความประพฤติของห้อง");
      return { name: `คะแนนความประพฤติ_ม${room()}`, parts: [
        header("สรุปคะแนนความประพฤติ", document.getElementById("cdRoomPeriod").innerText),
        (W) => table(["เลขที่", "ชื่อ-สกุล", "ถูกตัด (ครั้ง)", "คะแนนคงเหลือ"], rows, { pageW: W, widths: [0.7, 3.4, 1.3, 1.3], centerCols: [0, 2, 3] }),
        footer(),
      ] };
    },
  };

  // ---------- ส่งไฟล์ถึงเครื่องของครู ----------
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function deliver(blob, filename) {
    const file = new File([blob], filename, { type: DOCX_MIME });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: filename }); return; }
      catch (e) { if (e.name === "AbortError") return; }       // ผู้ใช้กดยกเลิก
    }
    const inLine = window.liff && liff.isInClient && liff.isInClient();
    if (inLine) {
      const ext = await App.confirm("แอป LINE บางรุ่นบันทึกไฟล์ลงเครื่องไม่ได้\nแนะนำให้เปิดหน้านี้ในเบราว์เซอร์ แล้วกดปุ่มส่งออกอีกครั้ง", "เปิดในเบราว์เซอร์", "ลองบันทึกที่นี่");
      if (ext) { liff.openWindow({ url: location.href, external: true }); return; }
    }
    download(blob, filename);
  }

  async function exportReport(kind) {
    try {
      const rep = REPORTS[kind]();
      App.loading("กำลังสร้างไฟล์ Word...");
      const blob = await buildDocx(rep.parts, rep.landscape);
      App.close();
      await deliver(blob, `${rep.name.replace(/[\\/:*?"<>|]/g, "-")}.docx`);
    } catch (e) { App.close(); App.alert(e.message); }
  }

  document.querySelectorAll("[data-export]").forEach((b) => (b.onclick = () => exportReport(b.dataset.export)));
  return { exportReport, buildDocx };
})();
