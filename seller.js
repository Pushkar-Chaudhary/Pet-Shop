document.addEventListener("DOMContentLoaded", () => {

    // --- CONFIGURATION ---
    const SELLER_CREDENTIALS = {
        username: "admin",
        password: "petshop2024"
    };

    // --- ERROR HANDLING & LOGGING ---
    const showError = (message) => {
        console.error('Seller Dashboard Error:', message);
        alert('Error: ' + message);
    };

    const showSuccess = (message) => {
        console.log('Seller Dashboard Success:', message);
        alert('Success: ' + message);
    };

    // --- ELEMENTS ---
    const loginForm = document.getElementById("loginForm");
    const dashboard = document.getElementById("dashboard");
    const loginFormEl = document.getElementById("loginFormEl");
    const logoutBtn = document.getElementById("logoutBtn");
    const productForm = document.getElementById("productForm");
    const productList = document.getElementById("productList");
    const imagePreview = document.getElementById("imagePreview");

    // Stats elements
    const totalProductsEl = document.getElementById("totalProducts");
    const totalPetsEl = document.getElementById("totalPets");
    const totalAccessoriesEl = document.getElementById("totalAccessories");

    // --- AUTHENTICATION ---
    const checkAuth = () => {
        const isLoggedIn = localStorage.getItem("sellerLoggedIn") === "true";
        if (isLoggedIn) {
            showDashboard();
        } else {
            showLogin();
        }
        return isLoggedIn;
    };

    const showLogin = () => {
        loginForm.style.display = "block";
        dashboard.style.display = "none";
    };

    const showDashboard = () => {
        loginForm.style.display = "none";
        dashboard.style.display = "block";
        loadProducts();
        updateStats();
    };

    const login = (username, password) => {
        if (username === SELLER_CREDENTIALS.username && password === SELLER_CREDENTIALS.password) {
            localStorage.setItem("sellerLoggedIn", "true");
            showDashboard();
            showSuccess("Logged in successfully!");
            return true;
        } else {
            showError("Invalid username or password");
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("sellerLoggedIn");
        showLogin();
        showSuccess("Logged out successfully!");
    };

    // --- PRODUCT MANAGEMENT ---
    let products = [];
    let editingProductId = null;

    const loadProducts = () => {
        try {
            const storedProducts = localStorage.getItem("petShopProducts");
            products = storedProducts ? JSON.parse(storedProducts) : getDefaultProducts();
            displayProducts();
            updateStats();
            syncToShop();
        } catch (error) {
            showError('Failed to load products: ' + error.message);
            products = getDefaultProducts();
        }
    };

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

    const saveProducts = () => {
        try {
            localStorage.setItem("petShopProducts", JSON.stringify(products));
            syncToShop();
            showSuccess('Products saved successfully!');
        } catch (error) {
            showError('Failed to save products: ' + error.message);
        }
    };

    const syncToShop = () => {
        // Create product prices object for checkout
        const productPrices = {};
        products.forEach(product => {
            productPrices[product.name] = product.price;
        });
        localStorage.setItem("petShopProductPrices", JSON.stringify(productPrices));
    };

    const displayProducts = () => {
        if (products.length === 0) {
            productList.innerHTML = "<p>No products added yet. Add your first product!</p>";
            return;
        }

        productList.innerHTML = products.map(product => `
            <div class="product-item" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='placeholder.jpg'">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <div class="product-price">रू${product.price}</div>
                    <small style="color: #666;">Category: ${product.category}</small>
                </div>
                <div class="product-actions">
                    <button class="btn-edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" data-id="${product.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    };

    const updateStats = () => {
        const totalProducts = products.length;
        const totalPets = products.filter(p => p.category === 'pet').length;
        const totalAccessories = products.filter(p => p.category === 'accessory').length;

        totalProductsEl.textContent = totalProducts;
        totalPetsEl.textContent = totalPets;
        totalAccessoriesEl.textContent = totalAccessories;
    };

    const addProduct = (productData) => {
        const newProduct = {
            id: Date.now().toString(),
            ...productData
        };
        products.push(newProduct);
        saveProducts();
        displayProducts();
        updateStats();
        return newProduct;
    };

    const updateProduct = (id, productData) => {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            products[index] = { ...products[index], ...productData };
            saveProducts();
            displayProducts();
            updateStats();
            return true;
        }
        return false;
    };

    const deleteProduct = (id) => {
        const index = products.findIndex(p => p.id === id);
        if (index !== -1) {
            const productName = products[index].name;
            products.splice(index, 1);
            saveProducts();
            displayProducts();
            updateStats();
            showSuccess(`Product "${productName}" deleted successfully!`);
            return true;
        }
        return false;
    };

    const getProduct = (id) => {
        return products.find(p => p.id === id);
    };

    // --- FORM HANDLING ---
    const resetForm = () => {
        productForm.reset();
        editingProductId = null;
        document.getElementById("productId").value = "";
        document.getElementById("submitBtn").innerHTML = '<i class="fas fa-plus"></i> Add Product';
        imagePreview.style.display = "none";
        imagePreview.src = "";
    };

    const populateForm = (product) => {
        document.getElementById("productId").value = product.id;
        document.getElementById("productName").value = product.name;
        document.getElementById("productPrice").value = product.price;
        document.getElementById("productCategory").value = product.category;
        document.getElementById("productDescription").value = product.description;

        if (product.image) {
            imagePreview.src = product.image;
            imagePreview.style.display = "block";
        }

        editingProductId = product.id;
        document.getElementById("submitBtn").innerHTML = '<i class="fas fa-save"></i> Update Product';
    };

    // --- IMAGE HANDLING ---
    const handleImageUpload = (file) => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    };

    // --- EVENT LISTENERS ---
    loginFormEl.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        login(username, password);
    });

    logoutBtn.addEventListener("click", logout);

    productForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById("productName").value.trim(),
            price: parseFloat(document.getElementById("productPrice").value),
            category: document.getElementById("productCategory").value,
            description: document.getElementById("productDescription").value.trim(),
            image: imagePreview.src || "placeholder.jpg"
        };

        if (!productData.name || !productData.price || !productData.category || !productData.description) {
            showError("Please fill in all required fields");
            return;
        }

        if (editingProductId) {
            updateProduct(editingProductId, productData);
            showSuccess("Product updated successfully!");
        } else {
            addProduct(productData);
            showSuccess("Product added successfully!");
        }

        resetForm();
    });

    // Image upload
    document.getElementById("productImage").addEventListener("change", (e) => {
        const file = e.target.files[0];
        handleImageUpload(file);
    });

    // Product list actions
    productList.addEventListener("click", (e) => {
        const target = e.target;
        const productId = target.closest(".product-item")?.dataset.id;

        if (target.classList.contains("btn-edit") || target.closest(".btn-edit")) {
            e.preventDefault();
            const product = getProduct(productId);
            if (product) {
                populateForm(product);
            }
        } else if (target.classList.contains("btn-delete") || target.closest(".btn-delete")) {
            e.preventDefault();
            if (confirm("Are you sure you want to delete this product?")) {
                deleteProduct(productId);
            }
        }
    });

    // --- INITIALIZE ---
    checkAuth();

    showSuccess('Seller dashboard loaded successfully');
});