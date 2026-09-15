import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const profileForm = document.getElementById('profile-form');
const emailInput = document.getElementById('profile-email');
const usernameInput = document.getElementById('profile-username');
const photoInput = document.getElementById('profile-photo');
const avatarPreview = document.getElementById('avatar-preview');
const messageText = document.getElementById('profile-message');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    emailInput.value = user.email;
    
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    const currentPhoto = userData.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid;
    
    usernameInput.value = userData.username || user.displayName || "";
    photoInput.value = userData.photoURL || user.photoURL || "";
    avatarPreview.src = currentPhoto;

    // แสดงตัวอย่างรูปภาพทันทีเมื่อพิมพ์ลิงก์ URL
    photoInput.addEventListener('input', () => {
      avatarPreview.src = photoInput.value.trim() || currentPhoto;
    });

  } else {
    window.location.href = "login.html";
  }
});

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = usernameInput.value.trim();
    const newPhotoURL = photoInput.value.trim();
    const user = auth.currentUser;

    if (!user || !newUsername) return;

    try {
      const btn = document.getElementById('btn-save-profile');
      btn.disabled = true;
      btn.innerText = "กำลังบันทึก...";

      // 1. อัปเดตข้อมูลใน Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        username: newUsername,
        photoURL: newPhotoURL
      });

      // 2. อัปเดตใน Firebase Auth
      await updateProfile(user, {
        displayName: newUsername,
        photoURL: newPhotoURL
      });

      messageText.style.color = "#10b981";
      messageText.innerText = "บันทึกข้อมูลเรียบร้อยแล้ว!";
      
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);

    } catch (error) {
      console.error("Update Profile Error:", error);
      messageText.style.color = "#ef4444";
      messageText.innerText = "เกิดข้อผิดพลาด: " + error.message;
    } finally {
      const btn = document.getElementById('btn-save-profile');
      btn.disabled = false;
      btn.innerText = "บันทึกการเปลี่ยนแปลง";
    }
  });
}