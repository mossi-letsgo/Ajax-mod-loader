import { auth, db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- 1. โหลดรายชื่อไฟล์ทั้งหมดใส่ Select Dropdown ---
async function loadFileListForSelect() {
  const selectFile = document.getElementById('select-file');
  if (!selectFile) return;

  try {
    const querySnapshot = await getDocs(collection(db, "files"));
    
    if (querySnapshot.empty) {
      selectFile.innerHTML = '<option value="">-- ยังไม่มีรายการไฟล์ในระบบ --</option>';
      return;
    }

    let optionsHTML = '<option value="">-- เลือกไฟล์ที่ต้องการเพิ่มเวอร์ชัน --</option>';
    querySnapshot.forEach((docSnap) => {
      const fileData = docSnap.data();
      optionsHTML += `<option value="${docSnap.id}">${fileData.title || fileData.name}</option>`;
    });

    selectFile.innerHTML = optionsHTML;
  } catch (error) {
    console.error("Error loading files for select:", error);
    selectFile.innerHTML = '<option value="">-- เกิดข้อผิดพลาดในการโหลดรายการ --</option>';
  }
}

// --- 2. ฟอร์ม 1: เพิ่มรายการไฟล์ใหม่ (New File + First Version) ---
const uploadNewFileForm = document.getElementById('upload-new-file-form');
if (uploadNewFileForm) {
  uploadNewFileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('file-title').value.trim();
    const description = document.getElementById('file-desc').value.trim();
    const status = document.getElementById('file-status').value;
    const versionNum = document.getElementById('version-num').value.trim();
    const fileUrl = document.getElementById('file-url').value.trim();
    const btnUpload = document.getElementById('btn-upload');

    try {
      btnUpload.disabled = true;
      btnUpload.innerText = "กำลังบันทึกข้อมูล...";

      // สร้าง Document ใหม่ใน collection "files"
      const fileRef = await addDoc(collection(db, "files"), {
        title: title,
        description: description,
        status: status,
        latestVersion: versionNum,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // สร้าง Sub-collection "versions" สำหรับเก็บเวอร์ชันแรก
      await addDoc(collection(db, "files", fileRef.id, "versions"), {
        version: versionNum,
        url: fileUrl,
        downloadUrl: fileUrl,
        createdAt: serverTimestamp()
      });

      alert("บันทึกข้อมูลไฟล์ใหม่เรียบร้อยแล้ว!");
      uploadNewFileForm.reset();
      
      // รีโหลด Dropdown ในฟอร์ม 2
      loadFileListForSelect();

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } finally {
      btnUpload.disabled = false;
      btnUpload.innerText = "บันทึกข้อมูลไฟล์";
    }
  });
}

// --- 3. ฟอร์ม 2: เพิ่ม Version ใหม่ให้กับไฟล์ที่มีอยู่เดิม ---
const addVersionForm = document.getElementById('add-version-form');
if (addVersionForm) {
  addVersionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedFileId = document.getElementById('select-file').value;
    const newVersionNum = document.getElementById('new-version-num').value.trim();
    const newFileUrl = document.getElementById('new-file-url').value.trim();
    const btnAddVersion = document.getElementById('btn-add-version');

    if (!selectedFileId) {
      alert("กรุณาเลือกไฟล์ที่ต้องการเพิ่มเวอร์ชัน");
      return;
    }

    try {
      btnAddVersion.disabled = true;
      btnAddVersion.innerText = "กำลังเพิ่มเวอร์ชัน...";

      // เพิ่ม Document ลงใน Sub-collection "versions"
      await addDoc(collection(db, "files", selectedFileId, "versions"), {
        version: newVersionNum,
        url: newFileUrl,
        downloadUrl: newFileUrl,
        createdAt: serverTimestamp()
      });

      // อัปเดตข้อมูลเวอร์ชันล่าสุดใน Document หลัก
      const fileDocRef = doc(db, "files", selectedFileId);
      await setDoc(fileDocRef, {
        latestVersion: newVersionNum,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert("เพิ่มเวอร์ชันใหม่สำเร็จ!");
      addVersionForm.reset();

    } catch (error) {
      console.error("Error adding new version: ", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มเวอร์ชัน: " + error.message);
    } finally {
      btnAddVersion.disabled = false;
      btnAddVersion.innerText = "เพิ่มเวอร์ชันใหม่";
    }
  });
}

// --- เรียกใช้งานเมื่อหน้าเว็บโหลดเสร็จ ---
document.addEventListener('DOMContentLoaded', () => {
  loadFileListForSelect();
});