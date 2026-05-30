document.addEventListener('DOMContentLoaded', async () => {
  const pageFilter = document.body.dataset.productFilter || 'all';
  const isHomePage = pageFilter === 'all' && document.querySelector('.main-layout');

  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const modalText = document.getElementById('modalText');
  const modalTitle = document.getElementById('modalTitle');
  const modalCategory = document.getElementById('modalCategory');
  const modalPrice = document.getElementById('modalPrice');
  const modalAddToCart = document.getElementById('modalAddToCart');
  const modalBuyNow = document.getElementById('modalBuyNow');

  const cartSidebar = document.getElementById('cartSidebar');
  const cartToggleBtn = document.querySelector('.cart-toggle-btn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const cartCountEl = document.getElementById('cartCount');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');

  const animalsSection = document.querySelector('.animalstopurchase');
  const accessoriesSection = document.querySelector('.accessories');
  const categorySection = animalsSection || accessoriesSection;

  let productMap = {};
  let cart = [];

  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const showLoading = () => loadingOverlay?.classList.add('show');
  const hideLoading = () => loadingOverlay?.classList.remove('show');

  const initTheme = () => {
    const savedTheme = localStorage.getItem('petShopTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === savedTheme);
    });
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('petShopTheme', theme);
    document.querySelectorAll('.theme-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  };

  try {
    const storedCart = localStorage.getItem('petShopCart');
    cart = storedCart ? JSON.parse(storedCart) : [];
  } catch {
    cart = [];
  }

  const updateCartCount = () => {
    if (!cartCountEl) return;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountEl.textContent = count;
    cartCountEl.style.display = count > 0 ? 'flex' : 'none';
  };

  const saveCart = () => {
    localStorage.setItem('petShopCart', JSON.stringify(cart));
    updateCartCount();
    updateCartDisplay();
  };

  const attachCartItemListeners = () => {
    if (!cartItems) return;

    cartItems.querySelectorAll('.btn-quantity').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const action = btn.dataset.action;
        if (action === 'increase') cart[index].quantity += 1;
        if (action === 'decrease' && cart[index].quantity > 1) cart[index].quantity -= 1;
        saveCart();
      });
    });

    cartItems.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const removed = cart.splice(index, 1)[0];
        saveCart();
        showToast(`Removed ${removed.name}`);
      });
    });
  };

  const updateCartDisplay = () => {
    if (!cartItems || !cartEmpty || !cartFooter || !cartTotal) return;

    if (cart.length === 0) {
      cartEmpty.style.display = 'block';
      cartItems.style.display = 'none';
      cartFooter.style.display = 'none';
      return;
    }

    cartEmpty.style.display = 'none';
    cartItems.style.display = 'block';
    cartFooter.style.display = 'block';
    cartItems.innerHTML = '';

    let total = 0;
    cart.forEach((item, index) => {
      const product = productMap[item.name];
      const price = product ? product.price : 0;
      total += price * item.quantity;

      const cartItemEl = document.createElement('div');
      cartItemEl.className = 'cart-item';
      cartItemEl.innerHTML = `
        <img src="${product?.image || 'placeholder.jpg'}" alt="${item.name}" onerror="this.src='placeholder.jpg'">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>रू${price.toFixed(2)} each</p>
          <div class="cart-item-price">रू${(price * item.quantity).toFixed(2)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="btn-quantity" data-action="decrease" data-index="${index}">-</button>
          <span class="quantity">${item.quantity}</span>
          <button class="btn-quantity" data-action="increase" data-index="${index}">+</button>
          <button class="btn-remove" data-index="${index}"><i class="fas fa-trash"></i></button>
        </div>
      `;
      cartItems.appendChild(cartItemEl);
    });

    cartTotal.textContent = `रू${total.toFixed(2)}`;
    attachCartItemListeners();
  };

  const addToCart = (productName) => {
    if (!productName) return;
    const existing = cart.find((item) => item.name === productName);
    if (existing) existing.quantity += 1;
    else cart.push({ name: productName, quantity: 1, addedAt: new Date().toISOString() });
    saveCart();
    showToast(`Added ${productName} to cart`);
    if (cartToggleBtn) {
      cartToggleBtn.style.transform = 'scale(1.15)';
      setTimeout(() => { cartToggleBtn.style.transform = ''; }, 200);
    }
  };

  const attachProductListeners = () => {
    document.querySelectorAll('.btn-add').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        addToCart(btn.dataset.product);
      });
    });

    if (!modal) return;

    document.querySelectorAll('.animal img, .accessory img').forEach((img) => {
      img.addEventListener('click', () => {
        const product = productMap[img.dataset.name];
        if (!product) return;
        modal.classList.add('show');
        modalImg.src = product.image;
        modalImg.alt = product.name;
        modalTitle.textContent = product.name;
        modalText.textContent = product.description;
        modalCategory.textContent = product.category === 'pet' ? '🐾 Pet' : '🛍️ Accessory';
        modalPrice.textContent = `रू${product.price.toFixed(2)}`;
      });
    });
  };

  const renderPageProducts = (products) => {
    productMap = PetShopProducts.getProductMap(products);

    if (isHomePage) {
      const pets = products.filter((product) => product.category === 'pet');
      const accessories = products.filter((product) => product.category === 'accessory');
      if (animalsSection) PetShopProducts.renderProducts(animalsSection, pets);
      if (accessoriesSection) PetShopProducts.renderProducts(accessoriesSection, accessories);
    } else if (categorySection) {
      PetShopProducts.renderProducts(categorySection, products);
    }

    attachProductListeners();
  };

  const loadProducts = async () => {
    showLoading();
    try {
      const allProducts = await PetShopProducts.fetchProducts();
      const filtered = PetShopProducts.filterByPage(allProducts, pageFilter);
      renderPageProducts(filtered);
    } finally {
      hideLoading();
    }
  };

  const toggleCart = () => {
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('open');
    document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : '';
  };

  if (cartToggleBtn && cartSidebar) {
    cartToggleBtn.addEventListener('click', (event) => {
      event.preventDefault();
      toggleCart();
    });
  }
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', toggleCart);

  if (modalAddToCart) {
    modalAddToCart.addEventListener('click', () => {
      addToCart(modalTitle.textContent);
      modal.classList.remove('show');
    });
  }

  if (modalBuyNow) {
    modalBuyNow.addEventListener('click', () => {
      modal.classList.remove('show');
      PetShopAuth.goToCheckout({ product: modalTitle.textContent, buyNow: true });
    });
  }

  document.querySelector('.close-btn')?.addEventListener('click', () => modal?.classList.remove('show'));

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (event) => {
      event.preventDefault();
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
      }
      PetShopAuth.goToCheckout();
    });
  }

  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.dataset.theme));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      modal?.classList.remove('show');
      if (cartSidebar?.classList.contains('open')) toggleCart();
    }
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth <= 768 && cartSidebar?.classList.contains('open') &&
        !cartSidebar.contains(event.target) && !cartToggleBtn?.contains(event.target)) {
      toggleCart();
    }
  });

  initTheme();
  await PetShopAuth.refreshSession();
  PetShopAuth.bindHeaderAuth();
  updateCartCount();
  updateCartDisplay();
  await loadProducts();
});
