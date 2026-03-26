// firebase-config-compat.js
// Uses the Firebase COMPAT SDK (not modular) for use with inline <script> tags.
// Firebase Storage is NOT used — product images are stored on Cloudinary.

(function () {
    if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp({
            apiKey:            "AIzaSyBjnfrqymhhE88LkFBIrC7tvV7YyXRCTh4",
            authDomain:        "sgelar-web-store.firebaseapp.com",
            projectId:         "sgelar-web-store",
            storageBucket:     "sgelar-web-store.firebasestorage.app",
            messagingSenderId: "984584108456",
            appId:             "1:984584108456:web:51ca48c53cbf16d459059d",
            measurementId:     "G-Q0FD7RSMQQ"
        });
    }
})();

var adminAuth = firebase.auth();
var adminDb   = firebase.firestore();
