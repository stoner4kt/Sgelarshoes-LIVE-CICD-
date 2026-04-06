import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    getDocs,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfWg0csAAAAAJF90OmpPN6hisFTcV0K4G0z7gHM'),
    isTokenAutoRefreshEnabled: true
});

const db = getFirestore(app);
let selectedShipping = "collection";

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
   CART — localStorage
========================= */
function getCart() {
    try {
        return JSON.parse(localStorage.getItem("sgelar_cart")) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("sgelar_cart", JSON.stringify(cart));
}

function updateCartCount() {
    const count = getCart().length;
    document.querySelectorAll("#cart-count").forEach(el => {
        el.innerText = `CART (${count})`;
    });
}

/* =========================
   DOM READY
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const mobileNav = document.getElementById("mobile-nav");
    if (hamburger && mobileNav) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("open");
            mobileNav.classList.toggle("open");
            hamburger.setAttribute("aria-expanded", mobileNav.classList.contains("open") ? "true" : "false");
        });
        mobileNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                hamburger.classList.remove("open");
                mobileNav.classList.remove("open");
            });
        });
    }

    const mainNav = document.getElementById("main-nav");
    if (mainNav) {
        window.addEventListener("scroll", () => {
            mainNav.classList.toggle("scrolled", window.scrollY > 10);
        }, { passive: true });
    }

    const shopGrid = document.getElementById("product-grid");
    if (shopGrid) renderShop(shopGrid);

    const paystackBtn = document.getElementById("paystack-pay-btn");
    if (paystackBtn) paystackBtn.addEventListener("click", payWithPaystack);

    const cartItemsDiv = document.getElementById("cart-items");
    if (cartItemsDiv) renderCart(cartItemsDiv);

    const revealEls = document.querySelectorAll("[data-reveal]");
    if (revealEls.length) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add("revealed");
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        revealEls.forEach(el => observer.observe(el));
    }

    document.querySelectorAll(".stat-num[data-count]").forEach(el => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const isDecimal = target % 1 !== 0;
        let start = null;
        const duration = 1800;
        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            obs.unobserve(el);
            const step = (timestamp) => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const val = progress * target;
                el.textContent = (isDecimal ? val.toFixed(1) : Math.floor(val)) + suffix;
                if (progress < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, { threshold: 0.5 });
        obs.observe(el);
    });

    const heroBg = document.getElementById("hero-bg");
    if (heroBg) {
        window.addEventListener("scroll", () => {
            heroBg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }, { passive: true });
    }

    initCountdown();
    initReviews();
    updateCartCount();
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
   ADD TO CART
========================= */
window.addToCart = (safeId, name) => {
    const el = document.getElementById(`select-${safeId}`);
    if (!el) return;

    let price, size;
    if (el.tagName === "SELECT") {
        const opt = el.options[el.selectedIndex];
        price = parseInt(opt.value);
        size  = opt.dataset.size;
    } else {
        price = parseInt(el.value);
        size  = el.dataset.size || "Standard";
    }

    const cart = getCart();
    cart.push({
        name,
        price,
        size,
        id: Date.now() + "_" + Math.random()
    });
    saveCart(cart);
    updateCartCount();

    // Brief toast
    const btn = document.querySelector(`button[onclick="addToCart('${safeId}', '${name}')"]`);
    if (btn) {
        const orig = btn.innerText;
        btn.innerText = "Added ✓";
        btn.style.background = "#28a745";
        setTimeout(() => { btn.innerText = orig; btn.style.background = ""; }, 1200);
    }
};

/* =========================
   REMOVE FROM CART
========================= */
window.removeFromCart = (itemId) => {
    const filtered = getCart().filter(item => item.id !== itemId);
    saveCart(filtered);
    const container = document.getElementById("cart-items");
    if (container) renderCart(container);
    updateCartCount();
    updateTotalsWithShipping();
};

/* =========================
   CART RENDERING
========================= */
function renderCart(container) {
    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = '<p style="color:#888; text-align:center; padding: 40px 0;">Your cart is empty.</p>';
        updateTotalsWithShipping();
        return;
    }

    let total = 0;
    container.innerHTML = cart.map(item => {
        total += item.price;
        return `
            <div class="cart-item">
                <span>${item.name} (Size ${item.size})</span>
                <span>
                    R${item.price}
                    <button onclick="removeFromCart('${item.id}')">✖</button>
                </span>
            </div>
        `;
    }).join("");

    const subtotalEl = document.getElementById("cart-total");
    if (subtotalEl) subtotalEl.innerText = total;

    updateTotalsWithShipping();
}

/* =========================
   SHIPPING TOTALS
========================= */
function updateTotalsWithShipping() {
    const subtotalEl = document.getElementById("cart-total");
    const finalEl    = document.getElementById("cart-total-final");
    const shippingEl = document.getElementById("shipping-fee");
    const cartItems  = document.querySelectorAll(".cart-item");

    if (!subtotalEl || !finalEl) return;

    const itemCount = cartItems.length;
    const subtotal  = parseInt(subtotalEl.innerText.replace(/[^0-9]/g, "")) || 0;

    let shippingCost = 0;
    if (selectedShipping === "shipping") {
        if (itemCount >= 1 && itemCount <= 2)      shippingCost = 100;
        else if (itemCount >= 3 && itemCount <= 4) shippingCost = 190;
        else if (itemCount >= 5)                   shippingCost = 0;
    }

    if (shippingEl) {
        shippingEl.innerText = (shippingCost === 0 && selectedShipping === "shipping" && itemCount >= 5)
            ? "FREE"
            : shippingCost;
    }

    finalEl.innerText = subtotal + shippingCost;
}

/* =========================
   SHOP RENDERING
========================= */
function renderShop(container) {
    // Try `products` collection first (admin-managed)
    const unsubProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        if (!snapshot.empty) {
            renderFromProductsCollection(container, snapshot);
            return;
        }

        // Fallback to legacy `inventory` collection
        onSnapshot(collection(db, "inventory"), (invSnapshot) => {
            if (invSnapshot.empty) {
                container.innerHTML = "<p>No products available.</p>";
                return;
            }
            renderFromInventoryCollection(container, invSnapshot);
        });
    });
}

function renderFromProductsCollection(container, snapshot) {
    container.innerHTML = snapshot.docs.map(d => {
        const p      = d.data();
        const name   = p.name || "Unknown Product";
        const safeId = name.replace(/\s+/g, "");
        const img    = p.imageUrl || localImages[name] || "assets/img/placeholder.jpg";
        const variants = (p.variants && p.variants.length > 0)
            ? p.variants
            : [{ size: "Standard", price: p.price || 0 }];
        const first    = variants[0];
        const multiple = variants.length > 1;

        return `
            <div class="card">
                <img src="${img}" alt="${name}">
                <h3>${name}</h3>
                <p id="price-${safeId}">R${first.price}</p>

                ${
                    multiple
                    ? `<select id="select-${safeId}" onchange="updatePrice('${safeId}', this)">
                        ${variants.map(v =>
                            `<option value="${v.price}" data-size="${v.size || 'Standard'}">
                                Size ${v.size || 'Standard'} - R${v.price}
                            </option>`
                        ).join("")}
                       </select>`
                    : `<input type="hidden" id="select-${safeId}" value="${first.price}" data-size="${first.size || 'Standard'}">`
                }

                <button onclick="addToCart('${safeId}', '${name.replace(/'/g, "\\'")}')">
                    Add to Cart
                </button>
            </div>
        `;
    }).join("");
}

function renderFromInventoryCollection(container, snapshot) {
    const grouped = {};

    snapshot.docs.forEach(d => {
        const data = d.data();
        if (!data.name) return;
        if (!grouped[data.name]) {
            grouped[data.name] = {
                name: data.name,
                img: localImages[data.name] || "assets/img/placeholder.jpg",
                description: data.description || "High quality product",
                variants: []
            };
        }
        grouped[data.name].variants.push({ price: data.price, size: data.size });
    });

    container.innerHTML = Object.values(grouped).map(p => {
        const safeId = p.name.replace(/\s+/g, "");
        p.variants.sort((a, b) => a.size - b.size);
        const first    = p.variants[0];
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

                <button onclick="addToCart('${safeId}', '${p.name.replace(/'/g, "\\'")}')">
                    Add to Cart
                </button>
            </div>
        `;
    }).join("");
}

/* =========================
   UI HELPERS
========================= */
window.updatePrice = (id, el) => {
    document.getElementById(`price-${id}`).innerText = `R${el.value}`;
};

window.toggleAddressFields = (show) => {
    const addressSection = document.getElementById("address-section");
    const addressInput   = document.getElementById("cust-address");

    if (show) {
        addressSection.style.display = "block";
        addressInput.setAttribute("required", "true");
    } else {
        addressSection.style.display = "none";
        addressInput.removeAttribute("required");
        addressInput.value = "";
    }
};

/* =========================
   PAYSTACK
========================= */
window.payWithPaystack = async () => {
    const customerName  = document.getElementById("cust-name").value;
    const customerPhone = document.getElementById("cust-phone").value;
    const customerEmail = document.getElementById("cust-email").value;
    const shippingVal   = document.querySelector('input[name="shipping"]:checked').value;

    let customerAddress = "";
    if (shippingVal === "shipping") {
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

    if (!customerEmail) {
        alert("Please fill in your email address.");
        return;
    }

    const totalText = document.getElementById("cart-total-final").innerText;
    const total     = parseInt(totalText);

    const itemNames = Array.from(document.querySelectorAll(".cart-item span:first-child"))
                          .map(el => el.innerText).join(", ");

    const handler = PaystackPop.setup({
        key:      "pk_live_79cce229f97f2a2521bc6645ba0cefab2e2400b1",
        email:    customerEmail,
        amount:   total * 100,
        currency: "ZAR",
        metadata: {
            customer_name:    customerName,
            customer_phone:   customerPhone,
            delivery_address: customerAddress,
            items_ordered:    itemNames,
            shipping_method:  shippingVal,
            shipping_fee:     parseInt(document.getElementById("shipping-fee").innerText) || 0,
            user_id:          "guest",
            customer_email:   customerEmail
        },
        callback: (response) => {
            window.location.href = "success.html";
        },
        onClose: () => alert("Transaction cancelled.")
    });
    handler.openIframe();
};


function initCountdown() {
    const daysEl = document.getElementById("cd-days");
    const hoursEl = document.getElementById("cd-hours");
    const minsEl = document.getElementById("cd-mins");
    const secsEl = document.getElementById("cd-secs");
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

    const target = new Date();
    target.setDate(target.getDate() + 7);

    const tick = () => {
        const now = new Date().getTime();
        const diff = Math.max(0, target.getTime() - now);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);
        daysEl.textContent = String(days).padStart(2, "0");
        hoursEl.textContent = String(hours).padStart(2, "0");
        minsEl.textContent = String(mins).padStart(2, "0");
        secsEl.textContent = String(secs).padStart(2, "0");
    };
    tick();
    setInterval(tick, 1000);
}

function initReviews() {
    const reviewForm = document.getElementById("reviewForm");
    const reviewsContainer = document.getElementById("reviewsContainer");
    if (!reviewForm || !reviewsContainer) return;

    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        reviewsContainer.innerHTML = snapshot.docs.map((d) => {
            const r = d.data();
            const stars = "★".repeat(Number(r.rating || 5));
            return `
                <div class="swiper-slide card">
                    <h4>${r.name || "Anonymous"}</h4>
                    <p style="color:var(--gold)">${stars}</p>
                    <p>${r.comment || ""}</p>
                </div>
            `;
        }).join("");

        if (window.Swiper) {
            if (window.__reviewSwiper) window.__reviewSwiper.destroy(true, true);
            window.__reviewSwiper = new Swiper(".review-swiper", {
                slidesPerView: 1,
                spaceBetween: 16,
                pagination: { el: ".swiper-pagination", clickable: true },
                breakpoints: { 720: { slidesPerView: 2 } }
            });
        }
    });

    reviewForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("reviewName").value.trim();
        const rating = document.getElementById("reviewRating").value;
        const comment = document.getElementById("reviewComment").value.trim();
        if (!name || !rating || !comment) return;
        await addDoc(reviewsRef, { name, rating, comment, createdAt: serverTimestamp() });
        reviewForm.reset();
    });
}
