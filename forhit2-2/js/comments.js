import { auth, db } from './firebase-config.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const urlParams = new URLSearchParams(window.location.search);
const fileId = urlParams.get('id');

const commentFormContainer = document.getElementById('comment-form-container');
const loginPrompt = document.getElementById('login-prompt');
const commentsList = document.getElementById('comments-list');
const commentForm = document.getElementById('comment-form');

// ตรวจสอบสถานะการล็อกอินเพื่อแสดง/ซ่อนฟอร์มคอมเมนต์
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (commentFormContainer) commentFormContainer.style.display = 'block';
    if (loginPrompt) loginPrompt.style.display = 'none';
  } else {
    if (commentFormContainer) commentFormContainer.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'block';
  }
});

// โหลดคอมเมนต์ทั้งหมด
async function loadComments() {
  if (!commentsList || !fileId) return;

  try {
    const commentsRef = collection(db, "files", fileId, "comments");
    const snapshot = await getDocs(commentsRef);

    if (snapshot.empty) {
      commentsList.innerHTML = "<p style='color: #666;'>ยังไม่มีความคิดเห็น</p>";
      return;
    }

    let html = '';
    snapshot.forEach(docSnap => {
      const c = docSnap.data();
      html += `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
          <strong style="color: #2563eb;">${c.username || 'ผู้ใช้งาน'}</strong>
          <p style="margin: 4px 0 0 0; color: #334155;">${c.text}</p>
        </div>
      `;
    });
    commentsList.innerHTML = html;
  } catch (error) {
    console.error("Error loading comments:", error);
    commentsList.innerHTML = "<p>ไม่สามารถโหลดคอมเมนต์ได้</p>";
  }
}

// บันทึกคอมเมนต์ใหม่
if (commentForm) {
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-input');
    if (!input || !input.value.trim() || !fileId) return;

    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนส่งความคิดเห็น");
      return;
    }

    try {
      const commentsRef = collection(db, "files", fileId, "comments");
      await addDoc(commentsRef, {
        userId: user.uid,
        username: user.displayName || user.email.split('@')[0],
        text: input.value.trim(),
        createdAt: serverTimestamp()
      });

      input.value = '';
      loadComments(); // รีโหลดรายการคอมเมนต์ทันที
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("เกิดข้อผิดพลาดในการส่งความคิดเห็น: " + error.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', loadComments);