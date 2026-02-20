import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";//
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
    apiKey: "AIzaSyBjnfrqymhhE88LkFBIrC7tvV7YyXRCTh4",
    authDomain: "sgelar-web-store.firebaseapp.com",
    projectId: "sgelar-web-store",
    storageBucket: "sgelar-web-store.firebasestorage.app",
    messagingSenderId: "984584108456",
    appId: "1:984584108456:web:51ca48c53cbf16d459059d",
    measurementId: "G-Q0FD7RSMQQ"
};

const app = initializeApp(firebaseConfig);

// Add this line to enable local testing

// 4. PASTE THE APP CHECK CODE RIGHT HERE:
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LfWg0csAAAAAJF90OmpPN6hisFTcV0K4G0z7gHM'),
  isTokenAutoRefreshEnabled: true 
});
const auth = getAuth(app);

// =========================
// LOGIN Function 
// =========================
window.login = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        
        // Check for redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        
        if (redirect === 'cart') {
            window.location.href = "cart.html";
        } else {
            window.location.href = "index.html";
        }
    } catch (error) {
        alert("Login failed: " + error.message);
    }
};

// =========================
// SIGNUP FUNCTION
// =========================
window.signup = async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
        window.location.href = "shop.html";
    } catch (error) {
        alert("Signup failed: " + error.message);
    }
};

// =========================
// UI TOGGLE FUNCTION
// =========================
window.toggleAuth = (isSignUp) => {
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const toggleText = document.getElementById("toggleText");

    if (isSignUp) {
        title.innerText = "Create Account";
        subtitle.innerText = "Join the SGELAR community today.";
        loginBtn.style.display = "none";
        signupBtn.style.display = "block";
        toggleText.innerHTML = `Already have an account? <a onclick="toggleAuth(false)">Login here</a>`;
    } else {
        title.innerText = "Login";
        subtitle.innerText = "Enter your credentials to access your account.";
        loginBtn.style.display = "block";
        signupBtn.style.display = "none";
        toggleText.innerHTML = `No account? <a onclick="toggleAuth(true)">Sign up here</a>`;
    }
};

// =========================
// FORGOT PASSWORD FUNCTION
// =========================
window.forgotPassword = async () => {
    const email = document.getElementById("email").value;

    if (!email) {
        alert("Please enter your email address first so we can send you a reset link.");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        alert("Password reset email sent! Please check your inbox (and spam folder).");
    } catch (error) {
        logger.error("Reset Error:", error);
        alert("Error: " + error.message);
    }
};