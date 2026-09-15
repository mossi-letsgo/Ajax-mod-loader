import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- ปุ่ม Google Sign-In (ทำงานเหมือนกันทั้งหน้า Login และ Register) ---
const googleBtn = document.getElementById('btn-google');
if (googleBtn) {
  googleBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    
    // บังคับให้ Google แสดงหน้าเลือกบัญชีเสมอ
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ตรวจสอบข้อมูลใน Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      // ถ้าเป็นผู้ใช้ใหม่ -> สร้างบัญชีให้อัตโนมัติทันที
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          username: user.displayName || "Google User",
          email: user.email,
          role: "user",
          createdAt: new Date()
        });
      }

      // นำทางกลับหน้าหลักทันที
      window.location.href = "../index.html";

    } catch (error) {
      console.error("Google Auth Error Details:", error);
      const errorText = document.getElementById('auth-error');
      
      if (errorText) {
        if (error.code === 'auth/popup-closed-by-user') {
          errorText.innerText = "หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการเสร็จ";
        } else if (error.code === 'auth/unauthorized-domain') {
          errorText.innerText = "โดเมนนี้ยังไม่ได้รับอนุญาตใน Firebase Console";
        } else {
          errorText.innerText = "เกิดข้อผิดพลาด: " + error.message;
        }
      }
    }
  });
}

// --- ฟอร์ม Login ปกติ (Email / Password) ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorText = document.getElementById('auth-error');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "../index.html";
    } catch (error) {
      errorText.innerText = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    }
  });
}

// --- ฟอร์ม Register ปกติ (Email / Password) ---
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorText = document.getElementById('auth-error');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        role: "user",
        createdAt: new Date()
      });

      window.location.href = "../index.html";
    } catch (error) {
      errorText.innerText = "เกิดข้อผิดพลาด: " + error.message;
    }
  });
}

// --- ตรวจสอบสถานะการล็อกอินและจัดการ Navbar ---
onAuthStateChanged(auth, async (user) => {
  const navLinks = document.getElementById('nav-links');
  const path = window.location.pathname;

  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const isAdmin = userData && userData.role === 'admin';

    // เช็กว่าอยู่หน้าไหนเพื่อใส่ Path ของลิงก์ Admin และ Profile ให้ถูก
    const profilePath = path.includes('/html/') ? 'profile.html' : 'html/profile.html';
    const adminPath = path.includes('/html/') ? 'admin-upload.html' : 'html/admin-upload.html';

    // ดึง URL รูปโปรไฟล์
    const photoURL = userData?.photoURL || user.photoURL || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.uid;

    if (navLinks) {
      navLinks.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <!-- คลิกที่รูปโปรไฟล์เพื่อเปิดหน้าแก้ไข Profile -->
          <a href="${profilePath}" title="แก้ไขโปรไฟล์" style="display: flex; align-items: center;">
            <img src="${photoURL}" alt="Profile" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid #2563eb; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          </a>
          <span style="font-weight: 500;">${userData?.username || user.displayName || 'ผู้ใช้งาน'}</span>
          ${isAdmin ? `<a href="${adminPath}" style="color: #ff4757; font-weight: bold;">[ Admin Panel ]</a>` : ''}
          <button id="btn-logout-nav" class="btn-secondary">ออกจากระบบ</button>
        </div>
      `;
    }

    // ป้องกันคนที่ไม่ใช่ Admin เข้าหน้า Admin
    if (path.includes('admin-upload.html') && !isAdmin) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      window.location.href = path.includes('/html/') ? '../index.html' : 'index.html';
    }

  } else {
    // ถ้ายังไม่ได้ล็อกอิน แล้วพยายามเข้าหน้า Admin ให้เด้งไปหน้า Login
    if (path.includes('admin-upload.html')) {
      window.location.href = "login.html";
    }
  }
});

// --- ดักจับการกดปุ่ม Logout (รองรับทั้ง #btn-logout และ #btn-logout-nav) ---
document.addEventListener('click', async (e) => {
  const target = e.target;
  
  // เช็กว่าปุ่มที่กดมี id เป็น 'btn-logout' (หน้า Admin) หรือ 'btn-logout-nav' (หน้าทั่วไป)
  if (target && (target.id === 'btn-logout' || target.id === 'btn-logout-nav' || target.closest('#btn-logout') || target.closest('#btn-logout-nav'))) {
    e.preventDefault();
    try {
      await signOut(auth);
      alert("ออกจากระบบเรียบร้อยแล้ว");
      
      // เช็กหน้าปัจจุบันเพื่อรีไดเรกต์กลับหน้า Login หรือ หน้าหลักให้ถูกต้อง
      if (window.location.pathname.includes('/html/')) {
        window.location.href = "login.html";
      } else {
        window.location.href = "html/login.html";
      }
    } catch (error) {
      console.error("Logout Error:", error);
      alert("เกิดข้อผิดพลาดในการออกจากระบบ: " + error.message);
    }
  }
});