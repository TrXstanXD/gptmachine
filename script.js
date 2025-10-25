// ---- Firebase Imports ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ---- Firebase Config (from your Firebase project) ----
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ---- Init Firebase ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ---- Elements ----
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userName = document.getElementById("userName");
const chatSection = document.getElementById("chat-section");
const authSection = document.getElementById("auth-section");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("sendBtn");

// ---- Google Auth ----
const provider = new GoogleAuthProvider();

loginBtn.onclick = async () => {
  await signInWithPopup(auth, provider);
};

logoutBtn.onclick = async () => {
  await signOut(auth);
};

// ---- Auth State Change ----
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.style.display = "none";
    chatSection.style.display = "block";
    userName.textContent = `Hello, ${user.displayName}!`;

    // Load previous chats
    const q = query(collection(db, "chats"), where("uid", "==", user.uid));
    const snap = await getDocs(q);
    snap.forEach(doc => {
      const chat = doc.data();
      addMessage("user", chat.userMessage);
      addMessage("bot", chat.botReply);
    });
  } else {
    authSection.style.display = "block";
    chatSection.style.display = "none";
  }
});

// ---- Chat ----
function addMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `message ${role}`;
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = async () => {
  const userInput = document.getElementById("userInput");
  const imageInput = document.getElementById("imageInput");
  const text = userInput.value.trim();
  const image = imageInput.files[0];
  if (!text && !image) return;

  addMessage("user", text || "[Image]");
  userInput.value = "";
  imageInput.value = "";

  const formData = new FormData();
  formData.append("message", text);
  if (image) formData.append("image", image);

  const res = await fetch("/chat", { method: "POST", body: formData });
  const data = await res.json();

  addMessage("bot", data.reply);

  // Save to Firestore
  const user = auth.currentUser;
  if (user) {
    await addDoc(collection(db, "chats"), {
      uid: user.uid,
      userMessage: text,
      botReply: data.reply,
      timestamp: new Date(),
    });
  }
};
