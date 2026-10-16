// ============================================
// === FIREBASE INITIALIZATION (ONCE ONLY) ===
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBNnkksE3WXGPrMbxwu_LYa0JogI-WDbOI",
    authDomain: "order-manegment-1d33d.firebaseapp.com",
    projectId: "order-manegment-1d33d",
    storageBucket: "order-manegment-1d33d.firebasestorage.app",
    messagingSenderId: "798117022683",
    appId: "1:798117022683:web:56fee1f1f1cd79a6d435fe"
};

// Guard: Initialize Firebase only once (prevents duplicate-app errors)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth           = firebase.auth();
const db             = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// NOTE: db.enablePersistence() is NOT used here.
// In Firebase v10 compat, enablePersistence can cause Firestore writes to
// silently fail or remain pending — especially on localhost.
// Long polling fixes connection issues on http://127.0.0.1:5500 / localhost.
db.settings({ 
    experimentalAutoDetectLongPolling: true
});


// domReady: resolves when DOM is ready — used by onAuthStateChanged to avoid null-element crashes
const domReady = new Promise(resolve => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
        resolve();
    }
});

// --- Dismiss overlays (null-safe) ---
function dismissLogin() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

function showRoleSelection(user) {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) loginOverlay.classList.add('hidden');
    const roleOverlay = document.getElementById('roleOverlay');
    if (roleOverlay) roleOverlay.classList.remove('hidden');
    const firstName = user.displayName ? user.displayName.split(' ')[0] : 'User';
    const welcomeMsg = document.getElementById('roleWelcomeMsg');
    if (welcomeMsg) welcomeMsg.textContent = `Hi ${firstName}! Choose your role to continue`;
    document.body.style.overflow = 'hidden';
}

function dismissRoleOverlay() {
    const roleOverlay = document.getElementById('roleOverlay');
    if (roleOverlay) roleOverlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// --- Show User in Navbar (null-safe) ---
function showUserInNav(user, role) {
    const navUser      = document.getElementById('navUser');
    const navUserPhoto = document.getElementById('navUserPhoto');
    const navUserName  = document.getElementById('navUserName');
    const navRoleBadge = document.getElementById('navRoleBadge');
    if (!navUser || !user) return;
    if (navUserPhoto) {
        navUserPhoto.src = user.photoURL ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') +
            '&background=d4af37&color=000';
    }
    if (navUserName) navUserName.textContent = user.displayName ? user.displayName.split(' ')[0] : 'User';
    navUser.style.display = 'flex';
    if (navRoleBadge) {
        navRoleBadge.textContent = role === 'cook' ? '🍳 Cook' : '🍽️ Server';
        navRoleBadge.className   = 'nav-role-badge' + (role === 'cook' ? ' cook-badge' : '');
    }
}

// --- Listen to Auth State ---
// --- Listen to Auth State ---
// IMPORTANT: await domReady so we never touch DOM elements before they exist
auth.onAuthStateChanged(async (user) => {
    await domReady;   // wait for DOM to be ready before accessing any element

    if (user) {
        const savedRole = sessionStorage.getItem('userRole');
        if (savedRole) {
            dismissLogin();
            dismissRoleOverlay();
            showUserInNav(user, savedRole);
            if (savedRole === 'cook') {
                setupCookView();
            } else {
                setupServerView();
            }
        } else {
            showRoleSelection(user);
        }
    } else {
        // Not signed in — show login overlay
        sessionStorage.removeItem('userRole');
        const loginOverlay = document.getElementById('loginOverlay');
        if (loginOverlay) loginOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
});

// --- Google Sign-In Button ---
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.overflow = 'hidden'; // Block scroll until login

    const googleLoginBtn = document.getElementById('googleLoginBtn');
    const loginError = document.getElementById('loginError');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            // Show loading state
            googleLoginBtn.innerHTML = `<span style="display:flex;align-items:center;gap:10px;justify-content:center;">
                <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2">
                    <circle stroke-opacity=".3" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18" stroke="#d4af37"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g>
                </svg>Signing in...</span>`;
            googleLoginBtn.disabled = true;
            if (loginError) loginError.textContent = '';

            // Firebase Google Sign-In Popup
            auth.signInWithPopup(googleProvider)
                .then((result) => {
                    const user = result.user;
                    // Show role selection instead of directly logging in
                    showRoleSelection(user);
                })
                .catch((error) => {
                    console.error('Sign-in error:', error);
                    // Reset button
                    googleLoginBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.2 0-9.5-3.1-11.3-7.5l-6.5 5C9.5 39.6 16.3 44 24 44z"/>
                        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.9 2.4-2.5 4.5-4.6 6l6.2 5.2C42 35.3 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                    </svg><span>Sign in with Google</span>`;
                    googleLoginBtn.disabled = false;
                    if (loginError) {
                        loginError.textContent = error.code === 'auth/popup-closed-by-user'
                            ? 'Popup closed. Please try again.'
                            : 'Sign-in failed. Please try again.';
                    }
                });
        });
    }

    // --- Email / Password Auth ---
    const emailLoginBtn   = document.getElementById('emailLoginBtn');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPassInput  = document.getElementById('loginPassword');
    const switchToSignup  = document.getElementById('switchToSignup');
    const togglePwBtn     = document.getElementById('togglePw');
    let isSignUpMode = false;

    // Toggle Sign In ↔ Sign Up
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;
            emailLoginBtn.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
            switchToSignup.textContent = isSignUpMode ? 'Sign In' : 'Sign Up';
            switchToSignup.closest('.login-switch-text').querySelector('span') || null;
            const switchText = switchToSignup.closest('.login-switch-text');
            if (switchText) {
                const label = isSignUpMode ? "Already have an account? " : "Don't have an account? ";
                switchText.childNodes[0].textContent = label;
            }
            if (loginError) loginError.textContent = '';
        });
    }

    // Show/Hide password
    if (togglePwBtn && loginPassInput) {
        togglePwBtn.addEventListener('click', () => {
            const isText = loginPassInput.type === 'text';
            loginPassInput.type = isText ? 'password' : 'text';
            togglePwBtn.textContent = isText ? '👁️' : '🙈';
        });
    }

    // Email/Password Sign In or Sign Up
    if (emailLoginBtn) {
        emailLoginBtn.addEventListener('click', async () => {
            const email    = loginEmailInput ? loginEmailInput.value.trim() : '';
            const password = loginPassInput  ? loginPassInput.value         : '';

            if (!email || !password) {
                if (loginError) loginError.textContent = 'Please enter your email and password.';
                return;
            }

            emailLoginBtn.disabled    = true;
            emailLoginBtn.textContent = isSignUpMode ? 'Creating...' : 'Signing in...';
            if (loginError) loginError.textContent = '';

            try {
                let result;
                if (isSignUpMode) {
                    result = await auth.createUserWithEmailAndPassword(email, password);
                } else {
                    result = await auth.signInWithEmailAndPassword(email, password);
                }
                showRoleSelection(result.user);
            } catch (error) {
                console.error('Email auth error code:', error.code, error.message);
                const msgs = {
                    'auth/user-not-found':       'No account found with this email.',
                    'auth/wrong-password':        'Incorrect password. Please try again.',
                    'auth/invalid-email':         'Please enter a valid email address.',
                    'auth/email-already-in-use':  'An account already exists with this email.',
                    'auth/weak-password':         'Password must be at least 6 characters.',
                    'auth/invalid-credential':    'Invalid email or password. Please try again.',
                    'auth/operation-not-allowed': '⚠️ Email/Password sign-in is not enabled. Please enable it in Firebase Console → Authentication → Sign-in methods.',
                    'auth/too-many-requests':     'Too many failed attempts. Please try again later.',
                    'auth/network-request-failed':'Network error. Please check your internet connection.',
                };
                if (loginError) loginError.textContent = msgs[error.code] || `Error: ${error.code || 'Authentication failed. Please try again.'}`;

            } finally {
                emailLoginBtn.disabled    = false;
                emailLoginBtn.textContent = isSignUpMode ? 'Create Account' : 'Sign In';
            }
        });

        // Allow Enter key to submit
        [loginEmailInput, loginPassInput].forEach(input => {
            if (input) input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') emailLoginBtn.click();
            });
        });
    }


    // --- Role Selection Buttons ---
    const roleServerBtn = document.getElementById('roleServerBtn');
    const roleCookBtn   = document.getElementById('roleCookBtn');

    if (roleServerBtn) {
        roleServerBtn.addEventListener('click', () => {
            sessionStorage.setItem('userRole', 'server');
            dismissRoleOverlay();
            const user = auth.currentUser;
            if (user) showUserInNav(user, 'server');
            setupServerView();
        });
    }

    if (roleCookBtn) {
        roleCookBtn.addEventListener('click', () => {
            sessionStorage.setItem('userRole', 'cook');
            dismissRoleOverlay();
            const user = auth.currentUser;
            if (user) showUserInNav(user, 'cook');
            setupCookView();
        });
    }

    // --- Sign Out Button ---
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            // Stop Firestore listener before signing out
            if (cookUnsubscribe) { cookUnsubscribe(); cookUnsubscribe = null; }

            auth.signOut().then(() => {
                sessionStorage.removeItem('userRole');
                const navUser = document.getElementById('navUser');
                if (navUser) navUser.style.display = 'none';
                const cookNav = document.getElementById('nav-cook-dashboard');
                if (cookNav) cookNav.style.display = 'none';
                const foodNav = document.getElementById('nav-order-food');
                if (foodNav) foodNav.style.display = 'none';
                const billNav = document.getElementById('nav-bill');
                if (billNav) billNav.style.display = 'none';
                const loginOverlay = document.getElementById('loginOverlay');
                if (loginOverlay) loginOverlay.classList.remove('hidden');
                const roleOverlay = document.getElementById('roleOverlay');
                if (roleOverlay) roleOverlay.classList.add('hidden');
                document.body.style.overflow = 'hidden';
            }).catch(err => console.error('Sign-out error:', err));
        });
    }
});




// ============================================================
// ===        SERVER VIEW SETUP (Table book + Food order)   ===
// ============================================================
function setupServerView() {
    const cookNav = document.getElementById('nav-cook-dashboard');
    if (cookNav) cookNav.style.display = 'none';

    document.querySelectorAll('.view-section').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    const homeView = document.getElementById('home-view');
    if (homeView) {
        homeView.classList.remove('hidden');
        homeView.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State Management ---
    let orderCart = [];
    let currentStatus = 0; // 0: none, 1: preparing, 2: ready, 3: delivered
    let statusInterval = null;

    // --- View Navigation ---
    const views = document.querySelectorAll('.view-section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const navOrderFood = document.getElementById('nav-order-food');
    const navBill = document.getElementById('nav-bill');

    function switchView(targetId) {
        views.forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden'); // Ensure it's hidden
        });
        
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update nav active state
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            if (targetId) switchView(targetId);
            
            // Close mobile menu if open
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    });

    // --- Navbar & Mobile Menu ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            // Keep it scrolled if we are not on home
            const homeView = document.getElementById('home-view');
            if (homeView.classList.contains('active')) {
                navbar.classList.remove('scrolled');
            }
        }
    });

    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // --- Reservation Form Handling ---
    const reservationForm  = document.getElementById('reservationForm');
    const reservationBox   = document.getElementById('reservationBox');
    const bookingConfirmed = document.getElementById('bookingConfirmed');

    if (reservationForm) {
        reservationForm.addEventListener('submit', e => {
            e.preventDefault();

            const nameEl   = document.getElementById('name');
            const dateEl   = document.getElementById('date');
            const timeEl   = document.getElementById('time');
            const guestsEl = document.getElementById('guests');

            const name   = nameEl   ? nameEl.value.trim() : '';
            const date   = dateEl   ? dateEl.value        : '';
            const time   = timeEl   ? timeEl.value        : '';
            const guests = guestsEl ? guestsEl.value      : '';

            if (!name || !date || !time || !guests) return;

            const submitBtn = reservationForm.querySelector('button[type="submit"]');
            const origText  = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) { submitBtn.textContent = 'Confirming...'; submitBtn.disabled = true; }

            setTimeout(() => {
                if (reservationBox)   reservationBox.classList.add('hidden');
                if (bookingConfirmed) bookingConfirmed.classList.remove('hidden');

                const confName  = document.getElementById('conf-name');
                const confTable = document.getElementById('conf-table');
                const confDT    = document.getElementById('conf-datetime');
                const confGuest = document.getElementById('conf-guests');

                if (confName)  confName.textContent  = name;
                if (confTable) confTable.textContent  = Math.floor(Math.random() * 20) + 1;
                if (confDT)    confDT.textContent     = `${date} at ${time}`;
                if (confGuest) confGuest.textContent  = guests;

                if (navOrderFood) navOrderFood.style.display = 'block';
                if (submitBtn) { submitBtn.textContent = origText; submitBtn.disabled = false; }
            }, 1000);
        });
    }

    // Go to food page button
    document.getElementById('goToFoodBtn').addEventListener('click', () => {
        switchView('food-page');
    });

    // --- Menu Filter ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const menuItems = document.querySelectorAll('.menu-item');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            menuItems.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    item.style.display = 'flex';
                    item.style.opacity = '0';
                    setTimeout(() => item.style.opacity = '1', 50);
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // --- Cart Logic: Replace buttons with +/- qty controls ---
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    const cartCount = document.getElementById('cart-count');

    addToCartBtns.forEach(btn => {
        const name  = btn.getAttribute('data-name');
        const price = parseFloat(btn.getAttribute('data-price'));
        const type  = btn.getAttribute('data-type');

        // Build qty control widget
        const qtyControl = document.createElement('div');
        qtyControl.className = 'qty-control';
        qtyControl.innerHTML = `
            <button class="qty-btn qty-minus" disabled aria-label="Remove one">−</button>
            <span class="qty-display">0</span>
            <button class="qty-btn qty-plus" aria-label="Add one">+</button>
        `;

        // Replace old button with new widget
        btn.parentNode.replaceChild(qtyControl, btn);

        const minusBtn = qtyControl.querySelector('.qty-minus');
        const plusBtn  = qtyControl.querySelector('.qty-plus');
        const display  = qtyControl.querySelector('.qty-display');
        let qty = 0;

        // + button
        plusBtn.addEventListener('click', () => {
            qty++;
            display.textContent = qty;
            minusBtn.disabled = false;
            qtyControl.classList.add('has-items');
            orderCart.push({ name, price, type });
            cartCount.textContent = orderCart.length;

            // Pulse animation
            display.classList.add('qty-pulse');
            setTimeout(() => display.classList.remove('qty-pulse'), 300);
        });

        // − button
        minusBtn.addEventListener('click', () => {
            if (qty > 0) {
                qty--;
                display.textContent = qty;
                if (qty === 0) {
                    minusBtn.disabled = true;
                    qtyControl.classList.remove('has-items');
                }
                // Remove one matching item from cart
                const idx = orderCart.findIndex(item => item.name === name);
                if (idx !== -1) orderCart.splice(idx, 1);
                cartCount.textContent = orderCart.length;

                display.classList.add('qty-pulse');
                setTimeout(() => display.classList.remove('qty-pulse'), 300);
            }
        });
    });

    // --- View Cart / Confirm Order ---
    const viewCartBtn = document.getElementById('viewCartBtn');
    const orderList = document.getElementById('orderList');
    
    viewCartBtn.addEventListener('click', () => {
        if (orderCart.length === 0) {
            alert('Please add some items to your order first.');
            return;
        }

        // --- Group items by name to count quantity ---
        const groupedItems = {};
        orderCart.forEach(item => {
            const key = item.name;
            if (groupedItems[key]) {
                groupedItems[key].qty += 1;
                groupedItems[key].subtotal += item.price;
            } else {
                groupedItems[key] = { ...item, qty: 1, subtotal: item.price };
            }
        });

        // --- Group by Category ---
        const byCategory = {};
        Object.values(groupedItems).forEach(item => {
            const cat = item.type; // "Main Dish" or "Side Dish"
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(item);
        });

        // --- Render grouped order list ---
        orderList.innerHTML = '';
        let total = 0;

        Object.keys(byCategory).forEach(category => {
            // Category header
            orderList.innerHTML += `
                <div class="order-category-header">
                    <span>${category === 'Main Dish' ? '🍛' : '🥗'} ${category}</span>
                </div>
            `;

            byCategory[category].forEach(item => {
                total += item.subtotal;
                orderList.innerHTML += `
                    <div class="order-item">
                        <div class="order-item-left">
                            <span class="item-name">${item.name}</span>
                            <span class="item-qty-badge">x${item.qty}</span>
                        </div>
                        <div class="order-item-right">
                            <span class="item-unit-price">₹${item.price.toFixed(0)} each</span>
                            <span class="item-price">₹${item.subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            });
        });

        // --- Total Row ---
        orderList.innerHTML += `
            <div class="order-item order-total-row">
                <span class="item-name">Total Items: ${orderCart.length}</span>
                <span class="item-price">₹${total.toFixed(2)}</span>
            </div>
        `;

        switchView('food-confirm-page');
    });

    
    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        switchView('food-page');
    });

    // --- Order Status ---
    const confirmOrderBtn = document.getElementById('confirmOrderBtn');
    const statusMessage = document.getElementById('statusMessage');
    const stepPreparing = document.getElementById('step-preparing');
    const stepReady = document.getElementById('step-ready');
    const stepDelivered = document.getElementById('step-delivered');
    const deliveryToast = document.getElementById('deliveryToast');

    confirmOrderBtn.addEventListener('click', async () => {

        // ════════════════════════════════════════════════════════════════
        // STEP 1 — Gather data from existing UI (no changes to variables)
        // ════════════════════════════════════════════════════════════════
        const tableNumberText = document.getElementById('conf-table').textContent.trim();
        const tableNumber     = parseInt(tableNumberText) || 0;

        // Group cart items by name (uses existing orderCart array)
        const groupedForFirestore = {};
        orderCart.forEach(item => {
            if (groupedForFirestore[item.name]) {
                groupedForFirestore[item.name].quantity += 1;
            } else {
                groupedForFirestore[item.name] = {
                    food:     item.name,
                    price:    item.price,
                    type:     item.type,
                    quantity: 1
                };
            }
        });
        const orderItems = Object.values(groupedForFirestore);

        // Generate unique orderId — used as Firestore document ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

        // ════════════════════════════════════════════════════════════════
        // STEP 2 — Verify Firebase Authentication
        // ════════════════════════════════════════════════════════════════

        // 2A. Basic null check
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please login before confirming the order.');
            return;
        }

        // 2B. Force-refresh ID token → ensures Firestore gets a fresh,
        //     valid token (prevents permission-denied from expired tokens)
        try {
            await currentUser.getIdToken(true);
        } catch (authError) {
            console.error('Token refresh failed:', authError);
            alert('Authentication error. Please sign in again.');
            return;
        }

        // 2C. Re-read after refresh (guards against session expiry edge case)
        const verifiedUser = auth.currentUser;
        if (!verifiedUser) {
            alert('Authentication session expired. Please sign in again.');
            return;
        }

        // ════════════════════════════════════════════════════════════════
        // STEP 3 — Pre-save console logs
        // ════════════════════════════════════════════════════════════════
        console.log('--- Confirm Order: Starting Firestore save ---');
        console.log('Authenticated user:', verifiedUser.displayName || verifiedUser.email);
        console.log('User UID:', verifiedUser.uid);
        console.log('User Email:', verifiedUser.email);
        console.log('Order ID:', orderId);
        console.log('Table number:', tableNumber);
        console.log('Selected food items:', orderItems);
        console.log('Firestore path: orders/' + orderId);
        console.log('Saving to Firestore...');

        // ════════════════════════════════════════════════════════════════
        // STEP 4 — Disable button + show loading state
        // ════════════════════════════════════════════════════════════════
        confirmOrderBtn.disabled    = true;
        confirmOrderBtn.textContent = 'Saving…';

        // ════════════════════════════════════════════════════════════════
        // STEP 5 — Save to Firestore using doc(orderId).set()
        //          .doc(orderId) = orderId is the Firestore document ID
        //          No duplicate documents — one write per confirm click
        // ════════════════════════════════════════════════════════════════
        const orderRef = db.collection('orders').doc(orderId);
        let saveSuccess = false; // flag to control finally block reset

        try {
            await orderRef.set({
                orderId:        orderId,
                tableNumber:    tableNumber,
                food:           orderItems,           // { food, price, type, quantity }[]
                quantity:       orderCart.length,     // total individual item count
                status:         'pending',
                orderTime:      firebase.firestore.FieldValue.serverTimestamp(),
                createdBy:      verifiedUser.uid,
                createdByEmail: verifiedUser.email || ''
            });

            // ── STEP 6: Verify document actually exists after saving ───────
            const savedDoc = await orderRef.get();
            if (!savedDoc.exists) {
                throw new Error('Verification failed: document not found after save.');
            }

            // ── STEP 7: Success — log and show confirmation ───────────────
            console.log('ORDER SAVED SUCCESSFULLY');
            console.log('Firestore document ID:', savedDoc.id);
            console.log('Saved data:', savedDoc.data());

            saveSuccess = true;
            confirmOrderBtn.textContent = 'Order Confirmed ✓';

            // Brief pause so user sees the confirmation tick
            await new Promise(resolve => setTimeout(resolve, 700));

        } catch (error) {
            // ── STEP 8: Failure — log exact code + message, block navigation
            console.error('--- Firestore save FAILED ---');
            console.error('Firestore error code:', error.code);
            console.error('Firestore error message:', error.message);
            console.error('Full error object:', error);

            alert(
                'Order save failed.\n\n' +
                'Code: '    + (error.code    || 'unknown') + '\n' +
                'Message: ' + (error.message || 'Unknown error')
            );
            return; // ← DO NOT proceed to food-status-page

        } finally {
            // Only reset button if save did NOT succeed
            // (on success the button shows "Order Confirmed ✓" briefly)
            if (!saveSuccess) {
                confirmOrderBtn.disabled    = false;
                confirmOrderBtn.textContent = 'Confirm Order';
            }
        }

        // ════════════════════════════════════════════════════════════════
        // STEP 9 — Continue existing workflow (only reached on success)
        // ════════════════════════════════════════════════════════════════
        confirmOrderBtn.disabled    = false;
        confirmOrderBtn.textContent = 'Confirm Order';

        switchView('food-status-page');

        currentStatus = 1;
        stepPreparing.classList.add('active');
        stepReady.classList.remove('active');
        stepDelivered.classList.remove('active');
        statusMessage.textContent = 'Your food is being prepared with love!';

        // Simulate kitchen progress
        setTimeout(() => {
            currentStatus = 2;
            stepReady.classList.add('active');
            statusMessage.textContent = 'Your food is ready and on the way!';

            setTimeout(() => {
                currentStatus = 3;
                stepDelivered.classList.add('active');
                statusMessage.textContent = 'Enjoy your meal!';
                deliveryToast.classList.remove('hidden');
            }, 3000);

        }, 3000);
    });


    // --- Delivery Confirmation & Bill ---
    const confirmReceiptBtn = document.getElementById('confirmReceiptBtn');
    
    confirmReceiptBtn.addEventListener('click', () => {
        deliveryToast.classList.add('hidden');
        navBill.style.display = 'block'; // Show bill in nav
        generateBill();
        switchView('bill-page');
    });
    
    function generateBill() {
        const billDetails = document.getElementById('billDetails');
        let subtotal = 0;

        billDetails.innerHTML = '';

        // --- Group items by name ---
        const groupedItems = {};
        orderCart.forEach(item => {
            if (groupedItems[item.name]) {
                groupedItems[item.name].qty += 1;
                groupedItems[item.name].subtotal += item.price;
            } else {
                groupedItems[item.name] = { ...item, qty: 1, subtotal: item.price };
            }
        });

        // --- Group by Category ---
        const byCategory = {};
        Object.values(groupedItems).forEach(item => {
            const cat = item.type;
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(item);
        });

        // --- Render Bill Items ---
        Object.keys(byCategory).forEach(category => {
            billDetails.innerHTML += `
                <div class="order-category-header">
                    <span>${category === 'Main Dish' ? '🍛' : '🥗'} ${category}</span>
                </div>
            `;
            byCategory[category].forEach(item => {
                subtotal += item.subtotal;
                billDetails.innerHTML += `
                    <div class="order-item">
                        <div class="order-item-left">
                            <span class="item-name">${item.name}</span>
                            <span class="item-qty-badge">x${item.qty}</span>
                        </div>
                        <div class="order-item-right">
                            <span class="item-unit-price">₹${item.price.toFixed(0)} × ${item.qty}</span>
                            <span class="item-price">₹${item.subtotal.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            });
        });

        const tax = subtotal * 0.10;
        const grandTotal = subtotal + tax;

        document.getElementById('bill-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
        document.getElementById('bill-tax').textContent = `₹${tax.toFixed(2)}`;
        document.getElementById('bill-total').textContent = `₹${grandTotal.toFixed(2)}`;
    }
    
    // --- Pay Button ---
    document.getElementById('payBtn').addEventListener('click', function() {
        const originalText = this.textContent;
        this.textContent = 'Processing...';
        this.disabled = true;
        
        setTimeout(() => {
            this.textContent = 'Payment Successful ✓';
            this.style.backgroundColor = '#4CAF50';
            this.style.color = '#fff';
            
            setTimeout(() => {
                alert('Thank you for dining with Culinary Haven! See you next time.');
                // Reset everything and go to home
                orderCart = [];
                cartCount.textContent = '0';
                navOrderFood.style.display = 'none';
                navBill.style.display = 'none';
                reservationBox.classList.remove('hidden');
                bookingConfirmed.classList.add('hidden');
                reservationForm.reset();
                this.textContent = originalText;
                this.disabled = false;
                this.style.backgroundColor = '';
                this.style.color = '';
                switchView('home-view');
            }, 2000);
            
        }, 1500);
    });
});


// ============================================================
// ===        COOK VIEW SETUP (Kitchen Order Dashboard)     ===
// ============================================================
function setupCookView() {
    const cookNav = document.getElementById('nav-cook-dashboard');
    if (cookNav) cookNav.style.display = 'block';
    const foodNav = document.getElementById('nav-order-food');
    if (foodNav) foodNav.style.display = 'none';
    const billNav = document.getElementById('nav-bill');
    if (billNav) billNav.style.display = 'none';

    document.querySelectorAll('.view-section').forEach(v => {
        v.classList.remove('active');
        v.classList.add('hidden');
    });
    const cookDash = document.getElementById('cook-dashboard');
    if (cookDash) {
        cookDash.classList.remove('hidden');
        cookDash.classList.add('active');
    }

    loadCookOrders();

    // Refresh button — replace with clone to avoid duplicate listeners
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    if (refreshBtn) {
        const newBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newBtn, refreshBtn);
        newBtn.addEventListener('click', loadCookOrders);
    }
}

let cookUnsubscribe = null; // To unsubscribe Firestore listener when needed

function loadCookOrders() {
    const grid           = document.getElementById('cookOrdersGrid');
    const pendingCountEl = document.getElementById('pendingCount');
    const readyCountEl   = document.getElementById('readyCount');

    if (!grid) return;

    // Check auth before querying Firestore
    const currentUser = auth.currentUser;
    if (!currentUser) {
        grid.innerHTML = `<div class="cook-empty-state"><div class="empty-icon">🔒</div><p>Not signed in. Please sign in to view orders.</p></div>`;
        return;
    }

    grid.innerHTML = `<div class="cook-empty-state"><div class="empty-icon" style="animation:pulse 1.5s infinite;">⏳</div><p>Loading orders...</p></div>`;

    if (cookUnsubscribe) { cookUnsubscribe(); cookUnsubscribe = null; }

    // Real-time listener: fetch recent orders and filter by status in JS
    cookUnsubscribe = db.collection('orders')
        .orderBy('orderTime', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const allOrders = [];
            snapshot.forEach(doc => {
                allOrders.push({ id: doc.id, ...doc.data() });
            });
            // Filter only pending/ready in JS to avoid composite index
            const orders = allOrders.filter(o => o.status === 'pending' || o.status === 'ready');
            // Reverse so oldest (pending longest) shows first
            orders.reverse();

            const pending = orders.filter(o => o.status === 'pending').length;
            const ready   = orders.filter(o => o.status === 'ready').length;

            if (pendingCountEl) pendingCountEl.textContent = pending;
            if (readyCountEl)   readyCountEl.textContent   = ready;

            grid.innerHTML = '';

            if (orders.length === 0) {
                grid.innerHTML = `
                    <div class="cook-empty-state" id="cookEmptyState">
                        <div class="empty-icon">🍽️</div>
                        <p>No pending orders right now.<br>Waiting for new orders...</p>
                    </div>`;
                return;
            }

            orders.forEach(order => {
                const isReady   = order.status === 'ready';
                const foodItems = Array.isArray(order.food) ? order.food : [];

                // Format order time
                let timeStr = '';
                if (order.orderTime && order.orderTime.toDate) {
                    const d = order.orderTime.toDate();
                    timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                }

                // Build food list HTML
                const foodListHTML = foodItems.map(item => `
                    <li>
                        <span>${item.food}</span>
                        <span class="food-qty-tag">x${item.quantity}</span>
                    </li>
                `).join('');

                const card = document.createElement('div');
                card.className = `cook-order-card${isReady ? ' status-ready' : ''}`;
                card.dataset.docId = order.id;

                card.innerHTML = `
                    <div class="cook-card-header">
                        <div>
                            <div class="cook-table-num">Table ${order.tableNumber || '?'}</div>
                            <div class="cook-order-id">${order.orderId || order.id}</div>
                        </div>
                        <span class="cook-status-pill ${isReady ? 'pill-ready' : 'pill-pending'}">
                            ${isReady ? '✅ Ready' : '⏳ Pending'}
                        </span>
                    </div>
                    <div class="cook-card-body">
                        <ul class="cook-food-list">${foodListHTML}</ul>
                    </div>
                    <div class="cook-card-footer">
                        <span class="cook-time">${timeStr ? '🕐 ' + timeStr : ''}</span>
                        ${isReady
                            ? `<button class="btn-mark-ready done" disabled>✅ Marked Ready</button>`
                            : `<button class="btn-mark-ready" data-doc-id="${order.id}">✅ Mark as Ready</button>`
                        }
                    </div>
                `;

                grid.appendChild(card);
            });

            // Attach click events to all "Mark as Ready" buttons
            grid.querySelectorAll('.btn-mark-ready:not(.done)').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const docId = btn.dataset.docId;
                    btn.disabled = true;
                    btn.textContent = 'Updating...';
                    try {
                        await db.collection('orders').doc(docId).update({ status: 'ready' });
                        // Real-time listener will auto-refresh the card
                    } catch (err) {
                        console.error('Failed to update order:', err);
                        btn.disabled = false;
                        btn.textContent = '✅ Mark as Ready';
                        alert('Failed to update order. Please try again.');
                    }
                });
            });

        }, error => {
            console.error('Firestore listener error:', error.code, error.message);
            let msg = 'Failed to load orders.<br>Check your connection.';
            if (error.code === 'permission-denied') {
                msg = '⚠️ Permission denied.<br>Fix Firestore Security Rules in Firebase Console:<br><code>allow read, write: if request.auth != null;</code>';
            }
            grid.innerHTML = `<div class="cook-empty-state"><div class="empty-icon">⚠️</div><p>${msg}</p></div>`;
        });
}
