// ============================================
// === FIREBASE GOOGLE AUTHENTICATION ===
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyBNnkksE3WXGPrMbxwu_LYa0JogI-WDbOI",
    authDomain: "order-manegment-1d33d.firebaseapp.com",
    projectId: "order-manegment-1d33d",
    storageBucket: "order-manegment-1d33d.firebasestorage.app",
    messagingSenderId: "798117022683",
    appId: "1:798117022683:web:56fee1f1f1cd79a6d435fe"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db   = firebase.firestore();   // ← Firestore instance
const googleProvider = new firebase.auth.GoogleAuthProvider();

// --- Dismiss Login Overlay ---
function dismissLogin() {
    const overlay = document.getElementById('loginOverlay');
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}

// --- Show User in Navbar ---
function showUserInNav(user) {
    const navUser = document.getElementById('navUser');
    const navUserPhoto = document.getElementById('navUserPhoto');
    const navUserName = document.getElementById('navUserName');
    if (navUser && user) {
        navUserPhoto.src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=d4af37&color=000';
        navUserName.textContent = user.displayName ? user.displayName.split(' ')[0] : 'User';
        navUser.style.display = 'flex';
    }
}

// --- Listen to Auth State ---
auth.onAuthStateChanged((user) => {
    if (user) {
        // Already signed in — dismiss login and show user
        dismissLogin();
        showUserInNav(user);
    } else {
        // Not signed in — show login overlay
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
                    dismissLogin();
                    showUserInNav(user);
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

    // --- Sign Out Button ---
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Hide user from nav
                document.getElementById('navUser').style.display = 'none';
                // Show login overlay again
                document.getElementById('loginOverlay').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            });
        });
    }
});


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
    const reservationForm = document.getElementById('reservationForm');
    const reservationBox = document.getElementById('reservationBox');
    const bookingConfirmed = document.getElementById('bookingConfirmed');
    
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const date = document.getElementById('date').value;
            const time = document.getElementById('time').value;
            const guests = document.getElementById('guests').value;
            
            if (name && date && time && guests) {
                const submitBtn = reservationForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Confirming...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    // Hide form, show confirmation
                    reservationBox.classList.add('hidden');
                    bookingConfirmed.classList.remove('hidden');
                    
                    // Populate details
                    document.getElementById('conf-name').textContent = name;
                    document.getElementById('conf-table').textContent = Math.floor(Math.random() * 20) + 1; // Random table 1-20
                    document.getElementById('conf-datetime').textContent = `${date} at ${time}`;
                    document.getElementById('conf-guests').textContent = guests;
                    
                    // Show "Order Food" in nav
                    navOrderFood.style.display = 'block';
                    
                }, 1000);
            }
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

        // ── 1. Gather data from existing UI ──────────────────────────────
        const tableNumberText = document.getElementById('conf-table').textContent.trim();
        const tableNumber     = parseInt(tableNumberText) || 0;

        // Build a summary of items from the live cart
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

        // Generate a unique orderId  (timestamp + random suffix)
        const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

        const orderData = {
            orderId:     orderId,
            tableNumber: tableNumber,
            food:        orderItems,          // array of { food, price, type, quantity }
            quantity:    orderCart.length,    // total individual items
            status:      'pending',
            orderTime:   firebase.firestore.FieldValue.serverTimestamp()
        };

        // ── 2. Disable button while saving ───────────────────────────────
        confirmOrderBtn.disabled    = true;
        confirmOrderBtn.textContent = 'Saving…';

        // ── 3. Save to Firestore ─────────────────────────────────────────
        try {
            await db.collection('orders').add(orderData);
            console.log('✅ Order saved to Firestore:', orderId);

            // Brief success indicator on the button before switching views
            confirmOrderBtn.textContent = 'Order Confirmed ✓';

            // Short delay so the user sees the confirmation tick
            await new Promise(resolve => setTimeout(resolve, 600));

        } catch (error) {
            // ── 4. Error handling ─────────────────────────────────────────
            console.error('❌ Firestore save failed:', error);
            confirmOrderBtn.disabled    = false;
            confirmOrderBtn.textContent = 'Confirm Order';
            alert('⚠️ Failed to save your order. Please check your internet connection and try again.\n\nError: ' + error.message);
            return; // Stop here — do NOT proceed to status page
        } finally {
            // Reset button text/state (will be visible if user navigates back)
            confirmOrderBtn.disabled    = false;
            confirmOrderBtn.textContent = 'Confirm Order';
        }

        // ── 5. Original UI flow (unchanged) ──────────────────────────────
        switchView('food-status-page');

        // Reset status
        currentStatus = 1;
        stepPreparing.classList.add('active');
        stepReady.classList.remove('active');
        stepDelivered.classList.remove('active');
        statusMessage.textContent = 'Your food is being prepared with love!';

        // Simulate progress
        setTimeout(() => {
            currentStatus = 2;
            stepReady.classList.add('active');
            statusMessage.textContent = 'Your food is ready and on the way!';

            setTimeout(() => {
                currentStatus = 3;
                stepDelivered.classList.add('active');
                statusMessage.textContent = 'Enjoy your meal!';

                // Show delivery toast
                deliveryToast.classList.remove('hidden');

            }, 3000); // 3 seconds from Ready -> Delivered

        }, 3000); // 3 seconds from Preparing -> Ready
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
