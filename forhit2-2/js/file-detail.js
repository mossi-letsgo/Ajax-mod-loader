import { db } from './firebase-config.js';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const fileId = urlParams.get('id');

async function loadFileDetail() {
  const titleEl = document.getElementById('file-title');
  const descEl = document.getElementById('file-description');
  const dateEl = document.getElementById('file-date');

  if (!fileId) {
    if (titleEl) titleEl.innerText = "ไม่พบรหัสไฟล์ (Invalid ID)";
    return;
  }

  try {
    const docRef = doc(db, "files", fileId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (titleEl) titleEl.innerText = data.title || data.name || "ไม่มีชื่อไฟล์";
      if (descEl) descEl.innerText = data.description || "ไม่มีรายละเอียด";
      if (dateEl && data.createdAt) {
        dateEl.innerText = "วันที่อัปโหลด: " + new Date(data.createdAt.toDate()).toLocaleDateString('th-TH');
      }
    } else {
      if (titleEl) titleEl.innerText = "ไม่พบข้อมูลไฟล์นี้ในระบบ";
    }
  } catch (error) {
    console.error("Error loading file details:", error);
    if (titleEl) titleEl.innerText = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
  }
}

async function loadVersions() {
  const versionList = document.getElementById('version-list');
  if (!versionList || !fileId) return;

  try {
    const versionsRef = collection(db, "files", fileId, "versions");
    const snapshot = await getDocs(versionsRef);

    if (snapshot.empty) {
      versionList.innerHTML = "<p style='color: #666;'>ยังไม่มีเวอร์ชันดาวน์โหลด</p>";
      return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';
    snapshot.forEach(docSnap => {
      const v = docSnap.data();
      const downloadUrl = v.url || v.downloadUrl || '#';
      html += `
        <li style="margin-bottom: 10px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span><strong>${v.version || 'Version'}</strong></span>
          <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary" style="padding: 6px 14px; text-decoration: none; border-radius: 6px;">ดาวน์โหลด</a>
        </li>
      `;
    });
    html += '</ul>';
    versionList.innerHTML = html;
  } catch (error) {
    console.error("Error loading versions:", error);
    versionList.innerHTML = "<p>ไม่สามารถโหลดรายการเวอร์ชันได้</p>";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFileDetail();
  loadVersions();
});