import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const fileListContainer = document.getElementById('file-list');
const searchInput = document.getElementById('search-input');
let allFiles = [];

// ฟังก์ชั่นดึงและแสดงรายการไฟล์
async function loadFiles() {
  if (!fileListContainer) return;

  try {
    // ดึงข้อมูลไฟล์ เรียงตามเวลาอัปเดตล่าสุดขึ้นก่อนเสมอ (desc)
    const q = query(collection(db, "files"), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    allFiles = [];
    querySnapshot.forEach((doc) => {
      allFiles.push({ id: doc.id, ...doc.data() });
    });

    renderFiles(allFiles);
  } catch (error) {
    console.error("Error loading files:", error);
    fileListContainer.innerHTML = `<p class="error-message">ไม่สามารถโหลดรายการไฟล์ได้: ${error.message}</p>`;
  }
}

// แสดงผล HTML รายการไฟล์
function renderFiles(files) {
  if (files.length === 0) {
    fileListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">ไม่พบรายการไฟล์</p>';
    return;
  }

  fileListContainer.innerHTML = files.map(file => {
    // สร้าง Badge แสดงสถานะไฟล์
    let statusBadge = '';
    if (file.status === 'new') {
      statusBadge = '<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 8px;">🔥 อัปเดตใหม่</span>';
    } else if (file.status === 'maintenance') {
      statusBadge = '<span style="background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; margin-left: 8px;">🛠️ ปิดปรับปรุง</span>';
    }

    return `
      <div class="file-card">
        <div>
          <h3>${file.title} ${statusBadge}</h3>
          <p>${file.description || 'ไม่มีรายละเอียด'}</p>
        </div>
        <a href="html/file-detail.html?id=${file.id}" class="btn-primary" style="text-align: center; text-decoration: none;">ดูรายละเอียด / ดาวน์โหลด</a>
      </div>
    `;
  }).join('');
}

// ค้นหาไฟล์ realtime
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredFiles = allFiles.filter(file => 
      file.title.toLowerCase().includes(searchTerm) || 
      (file.description && file.description.toLowerCase().includes(searchTerm))
    );
    renderFiles(filteredFiles);
  });
}

// เรียกโหลดไฟล์ตอนเปิดหน้าเว็บ
loadFiles();