document.addEventListener("DOMContentLoaded", () => {

    // --- ELEMENTS ---
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImg");
    const modalText = document.getElementById("modalText");
    const modalTitle = document.getElementById("modalTitle");
    const modalCategory = document.getElementById("modalCategory");
    const modalPrice = document.getElementById("modalPrice");
    const modalAddToCart = document.getElementById("modalAddToCart");
    const modalBuyNow = document.getElementById("modalBuyNow");

    const cartSidebar = document.getElementById("cartSidebar");
    const cartToggleBtn = document.querySelector(".cart-toggle-btn");
    const cartCloseBtn = document.getElementById("cartCloseBtn");
    const cartCountEl = document.getElementById("cartCount");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartItems = document.getElementById("cartItems");
    const cartFooter = document.getElementById("cartFooter");
    const cartTotal = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutBtn");

    const animalsSection = document.querySelector(".animalstopurchase");
    const accessoriesSection = document.querySelector(".accessories");

    const loadingOverlay = document.getElementById("loadingOverlay");
    const toastContainer = document.getElementById("toastContainer");

    // --- TOAST NOTIFICATIONS ---
    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // --- ERROR HANDLING ---
    const showError = (message) => {
        console.error('Pet Shop Error:', message);
        showToast(message, 'error');
    };

    const showSuccess = (message) => {
        console.log('Pet Shop Success:', message);
        showToast(message, 'success');
    };

    // --- LOADING MANAGEMENT ---
    const showLoading = () => {
        loadingOverlay.classList.add('show');
    };

    const hideLoading = () => {
        loadingOverlay.classList.remove('show');
    };

    // --- THEME MANAGEMENT ---
    const initTheme = () => {
        const savedTheme = localStorage.getItem('petShopTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButtons(savedTheme);
    };

    const updateThemeButtons = (activeTheme) => {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === activeTheme) {
                btn.classList.add('active');
            }
        });
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('petShopTheme', theme);
        updateThemeButtons(theme);
        showSuccess(`Theme changed to ${theme}!`);
    };

    // --- DEFAULT PRODUCTS DATA ---
    const getDefaultProducts = () => {
        return [
            {
                id: 'judging-cat',
                name: 'Judging Cat',
                price: 300,
                category: 'pet',
                description: 'A judging cat who questions your life decisions.',
                image: 'cat1.jpeg'
            },
            {
                id: 'lazy-cat',
                name: 'Lazy Cat',
                price: 280,
                category: 'pet',
                description: 'A lazy cat who will help you to lie on the floor.',
                image: 'cat2.jpeg'
            },
            {
                id: 'cute-shorthair',
                name: 'Cute Shorthair',
                price: 350,
                category: 'pet',
                description: 'A cute shorthair who is just here to grab your attention.',
                image: 'cat3.jpeg'
            },
            {
                id: 'short-legged-cat',
                name: 'Short Legged Cat',
                price: 400,
                category: 'pet',
                description: 'A cute short legged cat who loves to chase laser pointers.',
                image: 'cat4.jpeg'
            },
            {
                id: 'fluffy-cat',
                name: 'Fluffy Cat',
                price: 320,
                category: 'pet',
                description: 'A fluffy cat who enjoys long naps in sunny spots.',
                image: 'cat5.jpeg'
            },
            {
                id: 'friendly-dog',
                name: 'Friendly Dog',
                price: 450,
                category: 'pet',
                description: 'A friendly dog who loves to play fetch and go for walks.',
                image: 'dog1.jpeg'
            },
            {
                id: 'loyal-dog',
                name: 'Loyal Dog',
                price: 500,
                category: 'pet',
                description: 'A loyal and cute dog who will be your best companion.',
                image: 'dog2.jpeg'
            },
            {
                id: 'energetic-dog',
                name: 'Energetic Dog',
                price: 480,
                category: 'pet',
                description: 'An energetic dog who loves to run and play outdoors.',
                image: 'dog3.jpeg'
            },
            {
                id: 'dog-food',
                name: 'Dog Food',
                price: 120,
                category: 'accessory',
                description: 'High-quality food to keep your dog healthy and happy.',
                image: 'petfood.jpeg'
            },
            {
                id: 'cat-food',
                name: 'Cat Food',
                price: 110,
                category: 'accessory',
                description: 'High-quality food to keep your cat healthy and happy.',
                image: 'catfood.jpeg'
            },
            {
                id: 'pet-collar',
                name: 'Pet Collar',
                price: 80,
                category: 'accessory',
                description: 'Durable collars to keep your pets safe and stylish.',
                image: 'petcollar.jpeg'
            },
            {
                id: 'net-carrier',
                name: 'Net Carrier',
                price: 200,
                category: 'accessory',
                description: 'Convenient and comfortable carriers for your pets with nets.',
                image: 'carrybag1.jpeg'
            },
            {
                id: 'shield-carrier',
                name: 'Shield Carrier',
                price: 250,
                category: 'accessory',
                description: 'Comfortable and stylish carriers for your pets with a protective shield.',
                image: 'carrybag2.jpeg'
            },
            {
                id: 'pet-toys',
                name: 'Pet Toys',
                price: 150,
                category: 'accessory',
                description: 'Fun toys to keep your pets entertained and active.',
                image: 'pettoys.jpg'
            }
        ];
    };

    // Initialize theme
    initTheme();

    // Initialize cart from localStorage with error handling
    let cart = [];
    try {
        const storedCart = localStorage.getItem("petShopCart");
        cart = storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
        showError('Failed to load cart from localStorage: ' + error.message);
        cart = [];
    }

    let cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Update cart count display
    const updateCartCount = () => {
        cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = cartCount;
        cartCountEl.style.display = cartCount > 0 ? 'flex' : 'none';
    };

    // Save cart to localStorage with error handling
    const saveCart = () => {
        try {
            localStorage.setItem("petShopCart", JSON.stringify(cart));
            updateCartCount();
            updateCartDisplay();
        } catch (error) {
            showError('Failed to save cart to localStorage: ' + error.message);
            alert('Failed to save cart. Please try again.');
        }
    };

    // Update cart sidebar display
    const updateCartDisplay = () => {
        if (cart.length === 0) {
            cartEmpty.style.display = 'block';
            cartItems.style.display = 'none';
            cartFooter.style.display = 'none';
            return;
        }

        cartEmpty.style.display = 'none';
        cartItems.style.display = 'block';
        cartFooter.style.display = 'block';

        // Clear existing items
        cartItems.innerHTML = '';

        // Calculate total
        let total = 0;

        // Get product data for pricing
        const products = JSON.parse(localStorage.getItem("petShopProducts") || '[]');
        const productMap = {};
        products.forEach(p => productMap[p.name] = p);

        cart.forEach((item, index) => {
            const product = productMap[item.name] || getDefaultProducts().find(p => p.name === item.name);
            const price = product ? product.price : 0;
            const itemTotal = price * item.quantity;
            total += itemTotal;

            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <img src="${product ? product.image : 'placeholder.jpg'}" alt="${item.name}" onerror="this.src='placeholder.jpg'">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>रू${price.toFixed(2)} each</p>
                    <div class="cart-item-price">रू${(price * item.quantity).toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="btn-quantity" data-action="decrease" data-index="${index}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="btn-quantity" data-action="increase" data-index="${index}">+</button>
                    <button class="btn-remove" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartItems.appendChild(cartItemEl);
        });

        cartTotal.textContent = `रू${total.toFixed(2)}`;

        // Attach event listeners for cart item buttons
        attachCartItemListeners();
    };

    // --- MODAL LOGIC ---
    const attachModalListeners = () => {
        // Remove existing listeners first
        document.querySelectorAll(".animal img, .accessory img").forEach(img => {
            img.removeEventListener("click", handleImageClick);
        });

        // Add new listeners
        document.querySelectorAll(".animal img, .accessory img").forEach(img => {
            img.addEventListener("click", handleImageClick);
        });
    };

    const handleImageClick = function() {
        try {
            // Get product data
            const productName = this.getAttribute("data-name");
            const products = JSON.parse(localStorage.getItem("petShopProducts") || '[]');
            const product = products.find(p => p.name === productName) ||
                          getDefaultProducts().find(p => p.name === productName);

            if (product) {
                modal.classList.add("show");
                modalImg.src = product.image;
                modalImg.alt = product.name;
                modalTitle.textContent = product.name;
                modalText.textContent = product.description;
                modalCategory.textContent = product.category === 'pet' ? '🐾 Pet' : '🛍️ Accessory';
                modalPrice.textContent = `रू${product.price.toFixed(2)}`;

                showSuccess('Modal opened for: ' + product.name);
            }
        } catch (error) {
            showError('Failed to open modal: ' + error.message);
        }
    };

    // Close modal function
    const closeModal = () => {
        modal.classList.remove("show");
        showSuccess('Modal closed');
    };

    // --- CART MANAGEMENT ---
    const updateCartAnimation = () => {
        // Visual feedback
        cartToggleBtn.style.transform = "scale(1.2)";
        setTimeout(() => cartToggleBtn.style.transform = "scale(1)", 200);
    };

    // Add item to cart with validation
    const addToCart = (productName) => {
        if (!productName || typeof productName !== 'string') {
            showError('Invalid product name');
            return;
        }

        const existingItem = cart.find(item => item.name === productName);

        try {
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    name: productName,
                    quantity: 1,
                    addedAt: new Date().toISOString()
                });
            }

            saveCart();
            updateCartAnimation();
            showSuccess(`Added ${productName} to cart!`);
        } catch (error) {
            showError('Failed to add item to cart: ' + error.message);
            alert('Failed to add item to cart. Please try again.');
        }
    };

    const attachCartListeners = () => {
        // Remove existing listeners first
        document.querySelectorAll(".btn-add").forEach(btn => {
            btn.removeEventListener("click", handleAddToCart);
        });

        // Add new listeners
        document.querySelectorAll(".btn-add").forEach(btn => {
            btn.addEventListener("click", handleAddToCart);
        });
    };

    const handleAddToCart = function(e) {
        e.preventDefault();
        const productName = this.getAttribute('data-product') || this.closest(".animal, .accessory")?.querySelector("img")?.getAttribute("data-name");

        if (productName) {
            addToCart(productName);
        } else {
            showError('Could not find product name for cart addition');
            alert('Error: Could not add item to cart');
        }
    };

    // Handle cart item quantity changes and removal
    const attachCartItemListeners = () => {
        document.querySelectorAll('.btn-quantity').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const index = parseInt(e.target.getAttribute('data-index'));

                if (action === 'increase') {
                    cart[index].quantity++;
                } else if (action === 'decrease' && cart[index].quantity > 1) {
                    cart[index].quantity--;
                }

                saveCart();
                showSuccess('Cart updated!');
            });
        });

        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index') || e.target.closest('.btn-remove').getAttribute('data-index'));
                const removedItem = cart.splice(index, 1)[0];
                saveCart();
                showSuccess(`Removed ${removedItem.name} from cart`);
            });
        });
    };

    // --- LOAD PRODUCTS DYNAMICALLY ---
    const loadProducts = () => {
        try {
            const storedProducts = localStorage.getItem("petShopProducts");
            let products = storedProducts ? JSON.parse(storedProducts) : getDefaultProducts();

            // Only load dynamic products if they exist and are different from defaults
            if (storedProducts && products.length > 0) {
                // Clear existing products
                animalsSection.innerHTML = "";
                accessoriesSection.innerHTML = "";

                // Separate pets and accessories
                const pets = products.filter(p => p.category === 'pet');
                const accessories = products.filter(p => p.category === 'accessory');

                // Render pets
                pets.forEach(product => {
                    const productEl = document.createElement("div");
                    productEl.className = "animal";
                    productEl.innerHTML = `
                        <img src="${product.image}" alt="${product.name}" data-name="${product.name}" onerror="this.src='placeholder.jpg'">
                        <div class="card-content">
                            <h3>${product.name}</h3>
                            <p>${product.description}</p>
                            <div class="price-badge">रू${product.price.toFixed(2)}</div>
                            <div class="card-actions">
                                <a href="buy.html?product=${encodeURIComponent(product.name)}" class="btn-buy">Buy Now</a>
                                <button class="btn-add" data-product="${product.name}">Add to Cart</button>
                            </div>
                        </div>
                    `;
                    animalsSection.appendChild(productEl);
                });

                // Render accessories
                accessories.forEach(product => {
                    const productEl = document.createElement("div");
                    productEl.className = "accessory";
                    productEl.innerHTML = `
                        <img src="${product.image}" alt="${product.name}" data-name="${product.name}" onerror="this.src='placeholder.jpg'">
                        <div class="card-content">
                            <h3>${product.name}</h3>
                            <p>${product.description}</p>
                            <div class="price-badge">रू${product.price.toFixed(2)}</div>
                            <div class="card-actions">
                                <a href="buy.html?product=${encodeURIComponent(product.name)}" class="btn-buy">Buy Now</a>
                                <button class="btn-add" data-product="${product.name}">Add to Cart</button>
                            </div>
                        </div>
                    `;
                    accessoriesSection.appendChild(productEl);
                });

                showSuccess(`Loaded ${products.length} custom products`);
            } else {
                // Use default products (already in HTML)
                showSuccess('Using default products');
            }

            // Attach event listeners after rendering
            attachModalListeners();
            attachCartListeners();

        } catch (error) {
            showError('Failed to load products: ' + error.message);
            // Default products are already in HTML, so just attach listeners
            attachModalListeners();
            attachCartListeners();
        }
    };

    // --- CART SIDEBAR LOGIC ---
    const toggleCart = () => {
        cartSidebar.classList.toggle('open');
        document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : '';
    };

    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', toggleCart);
    }

    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', toggleCart);
    }

    // Handle "Add to Cart" button inside Modal
    if (modalAddToCart) {
        modalAddToCart.addEventListener("click", () => {
            const productName = modalTitle.textContent;
            if (productName && productName !== 'Product Name') {
                addToCart(productName);
                closeModal();
            } else {
                showError('Invalid product name in modal');
                alert('Error: Could not add item to cart');
            }
        });
    }

    // Handle "Buy Now" button inside Modal
    if (modalBuyNow) {
        modalBuyNow.addEventListener("click", () => {
            const productName = modalTitle.textContent;
            if (productName && productName !== 'Product Name') {
                addToCart(productName);
                closeModal();
                setTimeout(() => {
                    window.location.href = "checkout.html";
                }, 500);
            } else {
                showError('Invalid product name in modal');
            }
        });
    }

    // Handle checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cartCount > 0) {
                window.location.href = "checkout.html";
                showSuccess('Proceeding to checkout...');
            } else {
                showError('Your cart is empty!');
            }
        });
    }

    // --- THEME SELECTOR ---
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });

    // Initialize cart count on page load
    updateCartCount();
    updateCartDisplay();

    // Load products and attach listeners
    loadProducts();

    showSuccess('Pet Shop page loaded successfully!');

    // --- IMAGE ERROR HANDLING ---
    document.addEventListener("error", (e) => {
        if (e.target.tagName === "IMG") {
            showError(`Failed to load image: ${e.target.src}`);
            // Set a fallback image or hide the image
            e.target.style.display = "none";
        }
    }, true);

    // --- ACCESSIBILITY IMPROVEMENTS ---
    // Add keyboard navigation for modal
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("show")) {
            closeModal();
        }
        if (e.key === "Escape" && cartSidebar.classList.contains("open")) {
            toggleCart();
        }
    });

    // Add loading states for buttons
    const addLoadingState = (button) => {
        button.disabled = true;
        const originalText = button.textContent;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = originalText;
        }, 1000);
    };

    document.querySelectorAll(".btn-add, .btn-add-to-cart").forEach(btn => {
        btn.addEventListener("click", function() { addLoadingState(this); });
    });

    // --- RESPONSIVE CART SIDEBAR ---
    // Close cart sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            cartSidebar.classList.contains('open') &&
            !cartSidebar.contains(e.target) &&
            !cartToggleBtn.contains(e.target)) {
            toggleCart();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.body.style.overflow = '';
        }
    });
});
