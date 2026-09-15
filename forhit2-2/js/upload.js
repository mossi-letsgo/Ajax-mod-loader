import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. เพิ่มไฟล์ใหม่พร้อม Version แรก และสถานะ ---
const uploadForm = document.getElementById('upload-new-file-form');
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('file-title').value;
    const desc = document.getElementById('file-desc').value;
    const status = document.getElementById('file-status').value;
    const versionNum = document.getElementById('version-num').value;
    const downloadUrl = document.getElementById('file-url').value;
    const btn = document.getElementById('btn-upload');

    try {
      btn.disabled = true;
      btn.innerText = "กำลังบันทึก...";

      // บันทึกไฟล์หลักลง Firestore พร้อม status และ timestamps
      const fileDoc = await addDoc(collection(db, "files"), {
        title: title,
        description: desc,
        status: status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // บันทึก Sub-collection เวอร์ชันแรก
      await addDoc(collection(db, "files", fileDoc.id, "versions"), {
        versionNumber: versionNum,
        downloadUrl: downloadUrl,
        createdAt: serverTimestamp()
      });

      alert("บันทึกไฟล์เรียบร้อยแล้ว!");
      window.location.href = "../index.html";
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
      btn.disabled = false;
      btn.innerText = "บันทึกข้อมูลไฟล์";
    }
  });
}

// --- 2. โหลดรายชื่อไฟล์ใส่ Select และเพิ่ม Version ใหม่ ---
const selectFile = document.getElementById('select-file');
const addVersionForm = document.getElementById('add-version-form');

if (selectFile) {
  async function loadFileOptions() {
    const querySnapshot = await getDocs(collection(db, "files"));
    selectFile.innerHTML = '<option value="">-- เลือกไฟล์ที่ต้องการเพิ่มเวอร์ชัน --</option>';
    querySnapshot.forEach((docSnap) => {
      selectFile.innerHTML += `<option value="${docSnap.id}">${docSnap.data().title}</option>`;
    });
  }
  loadFileOptions();
}

if (addVersionForm) {
  addVersionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedFileId = selectFile.value;
    const newVersionNum = document.getElementById('new-version-num').value;
    const newDownloadUrl = document.getElementById('new-file-url').value;
    const btn = document.getElementById('btn-add-version');

    try {
      btn.disabled = true;
      btn.innerText = "กำลังบันทึก...";

      // เพิ่มเวอร์ชันใหม่ใน Sub-collection
      await addDoc(collection(db, "files", selectedFileId, "versions"), {
        versionNumber: newVersionNum,
        downloadUrl: newDownloadUrl,
        createdAt: serverTimestamp()
      });

      // อัปเดตเวลา updatedAt ในตัวไฟล์หลัก (เพื่อให้เด้งขึ้นมาอยู่บนสุดของรายการ)
      const fileRef = doc(db, "files", selectedFileId);
      await updateDoc(fileRef, {
        updatedAt: serverTimestamp()
      });

      alert("เพิ่มเวอร์ชันใหม่เรียบร้อยแล้ว!");
      window.location.reload();
    } catch (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
      btn.disabled = false;
      btn.innerText = "เพิ่มเวอร์ชันใหม่";
    }
  });
}