import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    deleteDoc,
    doc,
    getDocs,
    query,    
    orderBy,   
    where,       
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =========================
   FIREBASE CONFIG
========================= */
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


// 4. PASTE THE APP CHECK CODE RIGHT HERE:
const appCheck = initializeAppCheck(app, {
 provider: new ReCaptchaV3Provider('6LfWg0csAAAAAJF90OmpPN6hisFTcV0K4G0z7gHM'), 
 isTokenAutoRefreshEnabled: true 

    
});


const db = getFirestore(app);
const auth = getAuth(app);
let selectedShipping = "collection";
let currentUser = null;
/* =========================
   LOCAL IMAGE MAP
========================= */
const localImages = {
    "Sgelar The Classic Derby": "assets/img/shoe1.jpg",
    "Sgelar The Classic Derby Kids": "assets/img/shoe1.jpg",
    "Sgelar lace up": "assets/img/shoe2.jpg",
    "Sgelar lace up Kids": "assets/img/shoe2.jpg",
    "Premium T-Bar Buckle": "assets/img/shoe3.jpg",
    "Sgelar Classic Junior": "assets/img/shoe4.jpg",
    "Sgelar Buckle Cross": "assets/img/shoe5.jpg",
    "Premium T-Bar Buckle Kids": "assets/img/shoe11.jpg",
    "Sgelar Classic Girls Junior": "assets/img/shoe4.jpg",
    "Nu Buck Ladies Boots": "assets/img/shoe5.png",
    "Chelsea vellies": "assets/img/shoe6.png",
     "Dapper vellies": "assets/img/shoe8.png",
     "Moses sandals": "assets/img/shoe9.png",
    "Sgelar Water Bottle": "assets/img/bottle3.jpg",
    "Sgelar Combo": "assets/img/combodeal1.jpg",
    "Sgelar Bagpack": "assets/img/bag.jpg"
};

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");

    if (hamburger) {
        hamburger.onclick = () => navLinks.classList.toggle("active");
    }

    const shopGrid = document.getElementById("product-grid");
    if (shopGrid) renderShop(shopGrid);

    // ✅ PAYSTACK FIX: Attach click handler after DOM is ready
    const paystackBtn = document.getElementById("paystack-pay-btn");
    if (paystackBtn) {
        paystackBtn.addEventListener("click", payWithPaystack);
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const shippingRadios = document.querySelectorAll('input[name="shipping"]');

  shippingRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      selectedShipping = radio.value;
      updateTotalsWithShipping();
    });
  });
});


/* =========================
   AUTH STATE (SINGLE SOURCE)
========================= */
onAuthStateChanged(auth, (user) => {
    currentUser = user;

    const authBtn = document.getElementById("auth-btn");
    const cartItemsDiv = document.getElementById("cart-items");
    const cartCountEl = document.getElementById("cart-count");

    if (user) {
        if (authBtn) {
            authBtn.innerText = "Logout";
            authBtn.onclick = async () => {
                await signOut(auth);
                window.location.reload();
            };
        }

        // ✅ LIVE CART COUNT (ADDED)
        if (cartCountEl) {
            onSnapshot(
                collection(db, "cart", user.uid, "items"),
                (snap) => {
                    cartCountEl.innerText = `CART (${snap.size})`;
                }
            );
        }

        if (cartItemsDiv) {
            renderCart(cartItemsDiv);
        }

    } else {
        if (authBtn) {
            authBtn.innerText = "Login";
            authBtn.onclick = () => {
                window.location.href = "login.html";
            };
        }

        // ✅ RESET CART COUNT ON LOGOUT (ADDED)
        if (cartCountEl) {
            cartCountEl.innerText = "CART (0)";
        }
    }
});

/* =========================
   SHOP RENDERING
========================= */
function renderShop(container) {
    onSnapshot(collection(db, "inventory"), (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = "<p>Loading products...</p>";
            return;
        }

        const grouped = {};

        snapshot.docs.forEach(d => {
            const data = d.data();
            if (!data.name) {
        console.warn("Skipping document missing a name:", d.id);
        return; // Skip this document and move to the next
    }
            if (!grouped[data.name]) {
                grouped[data.name] = {
                    name: data.name,
                    img: localImages[data.name] || "assets/img/placeholder.jpg",
                    description: data.description || "High quality product",
                    variants: []
                };
            }
            grouped[data.name].variants.push({
                price: data.price,
                size: data.size
            });
        });

        container.innerHTML = Object.values(grouped).map(p => {
    // If name is missing, use a fallback so the site doesn't crash
    const productName = p.name || "Unknown Product";
    const safeId = productName.replace(/\s+/g, "");
            p.variants.sort((a, b) => a.size - b.size);
            const first = p.variants[0];
            const multiple = p.variants.length > 1;

            return `
                <div class="card">
                    <img src="${p.img}" alt="${p.name}">
                    <h3>${p.name}</h3>
                    <p id="price-${safeId}">R${first.price}</p>

                    ${
                        multiple
                        ? `<select id="select-${safeId}" onchange="updatePrice('${safeId}', this)">
                            ${p.variants.map(v =>
                                `<option value="${v.price}" data-size="${v.size}">
                                    Size ${v.size} - R${v.price}
                                </option>`
                            ).join("")}
                          </select>`
                        : `<input type="hidden" id="select-${safeId}" value="${first.price}" data-size="Standard">`
                    }

                    <button onclick="addToCart('${safeId}', '${p.name}')">
                        Add to Cart
                    </button>
                </div>
            `;
        }).join("");
    });
}

/* =========================
   UI HELPERS
========================= */
window.updatePrice = (id, el) => {
    document.getElementById(`price-${id}`).innerText = `R${el.value}`;
};

/* =========================
   ADD TO CART
========================= */
window.addToCart = async (safeId, name) => {
    if (!currentUser) {
        window.location.href = "login.html?redirect=cart";
        return;
    }

    const el = document.getElementById(`select-${safeId}`);
    let price, size;

    if (el.tagName === "SELECT") {
        const opt = el.options[el.selectedIndex];
        price = parseInt(opt.value);
        size = opt.dataset.size;
    } else {
        price = parseInt(el.value);
        size = el.dataset.size || "Standard";
    }

    try {
        await addDoc(
            collection(db, "cart", currentUser.uid, "items"),
            { name, price, size, createdAt: Date.now() }
        );
    } catch (e) {
        logger.error(e);
        alert("Failed to add item");
    }
};

/* =========================
   CART RENDERING
========================= */
function renderCart(container) {
    onSnapshot(
        collection(db, "cart", currentUser.uid, "items"),
        (snap) => {
            let total = 0;

            container.innerHTML = snap.docs.map(d => {
                const item = d.data();
                total += item.price;

                return `
                    <div class="cart-item">
                        <span>${item.name} (Size ${item.size})</span>
                        <span>
                            R${item.price}
                            <button onclick="removeFromCart('${d.id}')">✖</button>
                        </span>
                    </div>
                `;
            }).join("");

            const totalEl = document.getElementById("cart-total-final");
            const subtotalEl = document.getElementById("cart-total");
            if (subtotalEl) subtotalEl.innerText = total; // ✅ KEEP THIS LINE
updateTotalsWithShipping(); // ✅ This will now add the fee to the subtotal

        }
    );
}

/* =========================
   REMOVE FROM CART
========================= */ 
window.removeFromCart = async (id) => {
    await deleteDoc(doc(db, "cart", currentUser.uid, "items", id));
};

function updateTotalsWithShipping() {
  const subtotalEl = document.getElementById("cart-total");
  const finalEl = document.getElementById("cart-total-final");
  const shippingEl = document.getElementById("shipping-fee");
  const cartItems = document.querySelectorAll(".cart-item"); // Counts items in the UI

  if (!subtotalEl || !finalEl) return;

  const itemCount = cartItems.length;
  const subtotal = parseInt(subtotalEl.innerText.replace(/[^0-9]/g, "")) || 0;
  
  let shippingCost = 0;

  if (selectedShipping === "shipping") {
    if (itemCount >= 1 && itemCount <= 2) {
      shippingCost = 100;
    } else if (itemCount >= 3 && itemCount <= 4) {
      shippingCost = 190;
    } else if (itemCount >= 5) {
      shippingCost = 0;
    }
  }

  if (shippingEl) {
    shippingEl.innerText = shippingCost === 0 && selectedShipping === "shipping" && itemCount >= 5 
      ? "FREE" 
      : shippingCost;
  }

  finalEl.innerText = subtotal + shippingCost;
}

window.toggleAddressFields = (show) => {
    const addressSection = document.getElementById("address-section");
    const addressInput = document.getElementById("cust-address");
    
    if (show) {
        addressSection.style.display = "block";
        addressInput.setAttribute("required", "true");
    } else {
        addressSection.style.display = "none";
        addressInput.removeAttribute("required");
        addressInput.value = ""; // Clear it so old data doesn't accidentally send
    }
};

/* =========================
   PAYSTACK (FIXED)
========================= */
/* =========================
   PAYSTACK (FINAL MOBILE FIX)
========================= */
window.payWithPaystack = async () => {
    if (!currentUser) return alert("Please log in to checkout");

    const customerName = document.getElementById("cust-name").value;
    const customerPhone = document.getElementById("cust-phone").value;
    const selectedShipping = document.querySelector('input[name="shipping"]:checked').value;
    
    // NEW LOGIC: Only require address if they are NOT collecting
    let customerAddress = "";
    if (selectedShipping === "shipping") {
        customerAddress = document.getElementById("cust-address").value;
        if (!customerAddress) {
            alert("Please provide a delivery address for shipping.");
            return;
        }
    } else {
        customerAddress = "IN-STORE COLLECTION";
    }

    if (!customerName || !customerPhone) {
        alert("Please fill in your name and phone number.");
        return;
    }
    
    // ... proceed to PaystackPop.setup

    const totalText = document.getElementById("cart-total-final").innerText;
    const total = parseInt(totalText);

    // 🏷️ Get all item names from your cart UI
    const itemNames = Array.from(document.querySelectorAll(".cart-item span:first-child"))
                           .map(el => el.innerText).join(", ");

    const handler = PaystackPop.setup({
        key: "pk_live_79cce229f97f2a2521bc6645ba0cefab2e2400b1", // Your Paystack Public Key
        email: currentUser.email,        // Automatically uses their logged-in email
        amount: total * 100,             // Amount in cents
        currency: "ZAR",
        metadata: {
    customer_name: document.getElementById("cust-name").value,
    customer_phone: document.getElementById("cust-phone").value,
    delivery_address: selectedShipping === "collection" 
        ? "IN-STORE COLLECTION" 
        : document.getElementById("cust-address").value,
    items_ordered: itemNames,
    shipping_method: selectedShipping,
    shipping_fee: parseInt(document.getElementById("shipping-fee").innerText) || 0,
    user_id: currentUser.uid,
    customer_email: currentUser.email, 
}, 
        callback: (response) => {
            
            //
            window.location.href = "success.html";
        },
        onClose: () => alert("Transaction cancelled.")
    });
    handler.openIframe();
};





/* ----------------------------
   SUBMIT REVIEW
----------------------------- */
/* ----------------------------
   REVIEWS (Updated with User ID & Duplicate Prevention)
----------------------------- */
const reviewForm = document.getElementById("reviewForm");

if (reviewForm) {
  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Check if user is logged in (Assuming you have access to your Firebase Auth instance)
    const user = auth.currentUser; 
    if (!user) {
        alert("You must be logged in to leave a review.");
        return;
    }

    const name = document.getElementById("reviewName").value.trim();
    const rating = Number(document.getElementById("reviewRating").value);
    const comment = document.getElementById("reviewComment").value.trim();

    try {
      // 2. PREVENT DUPLICATES: Check if this user already submitted a review
      const q = query(
        collection(db, "reviews"),
        where("userId", "==", user.uid)
      );
      const existingDocs = await getDocs(q);

      if (!existingDocs.empty) {
        alert("You have already submitted a review. Thank you!");
        return;
      }

      // 3. SUBMIT: Include the userId
      await addDoc(collection(db, "reviews"), {
        userId: user.uid, // Tying the review to the account
        name,
        rating,
        comment,
        approved: true,
        createdAt: serverTimestamp()
      });

      reviewForm.reset();
      loadReviews();
      alert("Review submitted successfully!");

    } catch (error) {
      logger.error("Error submitting review:", error);
    }
  });
}

/* ----------------------------
   LOAD REVIEWS
----------------------------- */
async function loadReviews() {
    const reviewsContainer = document.getElementById("reviewsContainer");
    if (!reviewsContainer) return;

    try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        reviewsContainer.innerHTML = ""; 

        querySnapshot.forEach((doc) => {
            const r = doc.data();
            if (r.approved === false) return;

            const slide = document.createElement("div");
            slide.className = "swiper-slide"; // CRITICAL: Swiper needs this class

            const dateStr = r.createdAt ? new Date(r.createdAt.toDate()).toLocaleDateString() : 'Recently';

            slide.innerHTML = `
                <div class="review-card">
                    <div class="review-header">
                        <strong class="review-name">${r.name}</strong>
                        <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
                    </div>
                    <p class="review-text">${r.comment}</p>
                    <small class="review-date">${dateStr}</small>
                </div>
            `;
            reviewsContainer.appendChild(slide);
        });

        // 2. INITIALIZE SWIPER AFTER LOADING DATA
        new Swiper('.review-swiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
            },
            autoplay: {
                delay: 3000,
            },
        });

    } catch (error) {
        logger.error("Error loading reviews:", error);
    }
}