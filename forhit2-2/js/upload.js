import { auth, db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// --- 1. โหลดรายชื่อไฟล์ใส่ Select Dropdown ---
// ==========================================
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

// ==========================================
// --- 2. ฟอร์ม 1: เพิ่มรายการไฟล์ใหม่ ---
// ==========================================
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

      // สร้าง Document ใน "files"
      const fileRef = await addDoc(collection(db, "files"), {
        title: title,
        description: description,
        status: status,
        latestVersion: versionNum,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // สร้าง Sub-collection "versions"
      await addDoc(collection(db, "files", fileRef.id, "versions"), {
        version: versionNum,
        url: fileUrl,
        downloadUrl: fileUrl,
        createdAt: serverTimestamp()
      });

      alert("บันทึกข้อมูลไฟล์ใหม่เรียบร้อยแล้ว!");
      uploadNewFileForm.reset();
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

// ==========================================
// --- 3. ฟอร์ม 2: เพิ่ม Version ให้ไฟล์เดิม ---
// ==========================================
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

      await addDoc(collection(db, "files", selectedFileId, "versions"), {
        version: newVersionNum,
        url: newFileUrl,
        downloadUrl: newFileUrl,
        createdAt: serverTimestamp()
      });

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

// ==========================================
// --- 4. ฟอร์ม 3: ตารางจัดการและลบไฟล์/เวอร์ชัน ---
// ==========================================
function renderFileListTable() {
  const tbody = document.getElementById('file-list-tbody');
  if (!tbody) return;

  onSnapshot(collection(db, "files"), (snapshot) => {
    if (snapshot.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">ไม่พบรายการไฟล์ในระบบ</td></tr>';
      return;
    }

    tbody.innerHTML = '';

    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const fileId = docSnap.id;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #e2e8f0';

      const versionsQuery = query(collection(db, "files", fileId, "versions"), orderBy("createdAt", "desc"));
      const versionSnapshots = await getDocs(versionsQuery);

      let versionOptionsHTML = '';
      if (!versionSnapshots.empty) {
        versionSnapshots.forEach((vDoc) => {
          const vData = vDoc.data();
          versionOptionsHTML += `<option value="${vDoc.id}">${vData.version}</option>`;
        });
      } else {
        versionOptionsHTML = '<option value="">ไม่มีเวอร์ชัน</option>';
      }

      tr.innerHTML = `
        <td style="padding: 12px; border: 1px solid #cbd5e1;"><b>${data.title || data.name}</b></td>
        <td style="padding: 12px; border: 1px solid #cbd5e1;">${data.latestVersion || '-'}</td>
        <td style="padding: 12px; border: 1px solid #cbd5e1;">${getStatusBadge(data.status)}</td>
        <td style="padding: 12px; border: 1px solid #cbd5e1;">
          <select id="version-select-${fileId}" style="padding: 4px; margin-bottom: 6px; width: 100%;">
            ${versionOptionsHTML}
          </select>
          <button type="button" class="btn-delete-version" data-file-id="${fileId}" style="color: #ef4444; background: none; border: none; cursor: pointer; font-size: 13px; text-decoration: underline;">ลบเวอร์ชันที่เลือก</button>
        </td>
        <td style="padding: 12px; border: 1px solid #cbd5e1;">
          <button type="button" class="btn-edit-file" data-file-id="${fileId}" style="margin-right: 8px; padding: 4px 10px; cursor: pointer;">แก้ไข</button>
          <button type="button" class="btn-delete-file" data-file-id="${fileId}" style="color: #ef4444; padding: 4px 10px; cursor: pointer;">ลบไฟล์นี้</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  });
}

function getStatusBadge(status) {
  if (status === 'new') return '🔥 อัปเดตใหม่';
  if (status === 'maintenance') return '🛠️ ปรับปรุง';
  return '✅ ปกติ';
}

// ==========================================
// --- 5. ฟอร์ม 4: ระบบจัดการเพลงพื้นหลัง (Music Management) ---
// ==========================================

// 5.1 เพิ่มเพลงใหม่ลง Collection "music"
const addMusicForm = document.getElementById('add-music-form');
if (addMusicForm) {
  addMusicForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('music-title').value.trim();
    const url = document.getElementById('music-url').value.trim();
    const btnAddMusic = document.getElementById('btn-add-music');

    try {
      btnAddMusic.disabled = true;
      btnAddMusic.innerText = "กำลังบันทึก...";

      await addDoc(collection(db, "music"), {
        title: title,
        url: url,
        createdAt: serverTimestamp()
      });

      alert("บันทึกเพลงใหม่สำเร็จ!");
      addMusicForm.reset();

    } catch (error) {
      console.error("Error adding music:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกเพลง: " + error.message);
    } finally {
      btnAddMusic.disabled = false;
      btnAddMusic.innerText = "บันทึกเพลงใหม่";
    }
  });
}

// 5.2 โหลดตารางรายการเพลง Realtime ฝั่ง Admin
function renderMusicListTable() {
  const musicTbody = document.getElementById('music-list-tbody');
  if (!musicTbody) return;

  onSnapshot(query(collection(db, "music"), orderBy("createdAt", "desc")), (snapshot) => {
    if (snapshot.empty) {
      musicTbody.innerHTML = '<tr><td colspan="2" style="text-align: center; padding: 15px;">ยังไม่มีเพลงในระบบ</td></tr>';
      return;
    }

    musicTbody.innerHTML = '';

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const musicId = docSnap.id;

      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #e2e8f0';
      tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #cbd5e1;">🎵 <b>${data.title}</b></td>
        <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center;">
          <button type="button" class="btn-delete-music" data-music-id="${musicId}" style="color: #ef4444; padding: 4px 8px; cursor: pointer;">ลบเพลง</button>
        </td>
      `;
      musicTbody.appendChild(tr);
    });
  });
}

// ==========================================
// --- 6. Event Delegation & Helper Functions ---
// ==========================================

document.addEventListener('click', async (e) => {
  // แก้ไขไฟล์
  if (e.target.classList.contains('btn-edit-file')) {
    openEditModal(e.target.getAttribute('data-file-id'));
  }

  // ลบไฟล์ทั้งรายการ
  if (e.target.classList.contains('btn-delete-file')) {
    deleteEntireFile(e.target.getAttribute('data-file-id'));
  }

  // ลบเวอร์ชันย่อย
  if (e.target.classList.contains('btn-delete-version')) {
    const fileId = e.target.getAttribute('data-file-id');
    const selectEl = document.getElementById(`version-select-${fileId}`);
    if (selectEl && selectEl.value) {
      deleteSelectedVersion(fileId, selectEl.value);
    } else {
      alert("ไม่มีเวอร์ชันให้ลบ");
    }
  }

  // ลบเพลง
  if (e.target.classList.contains('btn-delete-music')) {
    deleteMusicTrack(e.target.getAttribute('data-music-id'));
  }
});

// เปิด Modal แก้ไขไฟล์
async function openEditModal(fileId) {
  try {
    const docSnap = await getDoc(doc(db, "files", fileId));
    if (docSnap.exists()) {
      const data = docSnap.data();
      document.getElementById('edit-file-id').value = fileId;
      document.getElementById('edit-file-title').value = data.title || '';
      document.getElementById('edit-file-desc').value = data.description || '';
      document.getElementById('edit-file-status').value = data.status || 'normal';

      document.getElementById('edit-file-modal').style.display = 'flex';
    }
  } catch (error) {
    console.error("Error opening edit modal:", error);
  }
}

// ปิด Modal แก้ไขไฟล์
const btnCloseModal = document.getElementById('btn-close-modal');
if (btnCloseModal) {
  btnCloseModal.addEventListener('click', () => {
    document.getElementById('edit-file-modal').style.display = 'none';
  });
}

// บันทึกการแก้ไขไฟล์หลัก
const editFileForm = document.getElementById('edit-file-form');
if (editFileForm) {
  editFileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileId = document.getElementById('edit-file-id').value;

    try {
      await updateDoc(doc(db, "files", fileId), {
        title: document.getElementById('edit-file-title').value.trim(),
        description: document.getElementById('edit-file-desc').value.trim(),
        status: document.getElementById('edit-file-status').value,
        updatedAt: serverTimestamp()
      });

      alert("อัปเดตข้อมูลไฟล์เรียบร้อยแล้ว");
      document.getElementById('edit-file-modal').style.display = 'none';
      loadFileListForSelect();
    } catch (error) {
      console.error("Error updating document:", error);
      alert("เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + error.message);
    }
  });
}

// ลบเวอร์ชันย่อย
async function deleteSelectedVersion(fileId, versionDocId) {
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบเวอร์ชันนี้?")) return;

  try {
    await deleteDoc(doc(db, "files", fileId, "versions", versionDocId));

    const remainingVersionsQuery = query(
      collection(db, "files", fileId, "versions"), 
      orderBy("createdAt", "desc")
    );
    const remainingSnapshots = await getDocs(remainingVersionsQuery);

    let updatedLatestVersion = "ไม่มีเวอร์ชัน";
    if (!remainingSnapshots.empty) {
      updatedLatestVersion = remainingSnapshots.docs[0].data().version;
    }

    await updateDoc(doc(db, "files", fileId), {
      latestVersion: updatedLatestVersion,
      updatedAt: serverTimestamp()
    });

    alert("ลบเวอร์ชันเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Error deleting version:", error);
    alert("เกิดข้อผิดพลาดในการลบเวอร์ชัน: " + error.message);
  }
}

// ลบไฟล์ทั้งรายการ
async function deleteEntireFile(fileId) {
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบไฟล์นี้รวมถึงทุกเวอร์ชัน? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

  try {
    const versionsSnap = await getDocs(collection(db, "files", fileId, "versions"));
    const deletePromises = versionsSnap.docs.map(vDoc => deleteDoc(doc(db, "files", fileId, "versions", vDoc.id)));
    await Promise.all(deletePromises);

    await deleteDoc(doc(db, "files", fileId));

    alert("ลบไฟล์สำเร็จ");
    loadFileListForSelect();
  } catch (error) {
    console.error("Error deleting file:", error);
    alert("เกิดข้อผิดพลาดในการลบไฟล์: " + error.message);
  }
}

// ลบเพลงพื้นหลัง
async function deleteMusicTrack(musicId) {
  if (!confirm("คุณแน่ใจหรือไม่ที่จะลบเพลงนี้ออกระบบ?")) return;

  try {
    await deleteDoc(doc(db, "music", musicId));
    alert("ลบเพลงเรียบร้อยแล้ว");
  } catch (error) {
    console.error("Error deleting music:", error);
    alert("เกิดข้อผิดพลาดในการลบเพลง: " + error.message);
  }
}

// ==========================================
// --- 7. เรียกใช้งานเมื่อ DOM โหลดเสร็จ ---
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadFileListForSelect();
  renderFileListTable();
  renderMusicListTable();
});