import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore.js";

async function addComment(fileId, versionId, userId, userName, commentText) {
  try {
    // ระบบจะสร้าง sub-collection "comments" ให้เองอัตโนมัติ
    await addDoc(collection(db, "files", fileId, "versions", versionId, "comments"), {
      userId: userId,
      userName: userName,
      text: commentText,
      createdAt: serverTimestamp()
    });
    console.log("เพิ่ม Comment สำเร็จ");
  } catch (e) {
    console.error("Error adding comment: ", e);
  }
}