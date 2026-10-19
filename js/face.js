// ===== จัดการกล้องหน้าและการจดจำใบหน้า (ใช้ face-api.js) =====
const Face = {
  MODEL_URL: "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/",
  loaded: false,
  stream: null,

  /** โหลดโมเดล AI (ครั้งแรกใช้เวลา 5-15 วินาที ครั้งต่อไปเร็วขึ้นเพราะถูกแคช) */
  async load() {
    if (Face.loaded) return;
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(Face.MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(Face.MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(Face.MODEL_URL),
    ]);
    Face.loaded = true;
  },

  /** เปิดกล้องหน้าแล้วแสดงใน <video> */
  async start(video) {
    try {
      Face.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
    } catch {
      throw new Error("เปิดกล้องไม่ได้ กรุณาอนุญาตให้ LINE ใช้กล้อง (ตั้งค่า > LINE > กล้อง)");
    }
    video.srcObject = Face.stream;
    video.setAttribute("playsinline", ""); // จำเป็นสำหรับ iPhone
    video.muted = true;
    await video.play();
  },

  stop() {
    Face.stream?.getTracks().forEach((t) => t.stop());
    Face.stream = null;
  },

  /**
   * ถ่ายภาพจากวิดีโอแล้วหาใบหน้า
   * คืนค่า { descriptor: number[128], yaw } หรือ throw Error เมื่อหาใบหน้าไม่เจอ
   */
  async capture(video) {
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
    const faces = await faceapi.detectAllFaces(c, opts).withFaceLandmarks().withFaceDescriptors();
    if (faces.length === 0) throw new Error("ไม่พบใบหน้า กรุณาให้ใบหน้าอยู่ในกรอบและมีแสงสว่างเพียงพอ");
    if (faces.length > 1) throw new Error("พบใบหน้ามากกว่า 1 คน กรุณาถ่ายคนเดียว");
    const f = faces[0];
    if (f.detection.box.width < c.width * 0.25) throw new Error("ใบหน้าเล็กเกินไป กรุณาขยับเข้าใกล้กล้อง");
    // ประมาณการหันซ้าย-ขวา: ตำแหน่งจมูกเทียบกับกึ่งกลางดวงตา
    const lm = f.landmarks, nose = lm.getNose()[3];
    const le = lm.getLeftEye()[0], re = lm.getRightEye()[3];
    const yaw = (nose.x - (le.x + re.x) / 2) / Math.abs(re.x - le.x);
    return { descriptor: Array.from(f.descriptor).map((v) => Math.round(v * 1e5) / 1e5), yaw };
  },

  distance(a, b) { return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0)); },
};
