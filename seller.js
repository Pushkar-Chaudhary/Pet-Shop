document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const dashboard = document.getElementById('dashboard');
  const loginFormEl = document.getElementById('loginFormEl');
  const logoutBtn = document.getElementById('logoutBtn');
  const productForm = document.getElementById('productForm');
  const productList = document.getElementById('productList');
  const orderList = document.getElementById('orderList');
  const imagePreview = document.getElementById('imagePreview');
  const sellerHeaderBar = document.getElementById('sellerHeaderBar');
  const statusMessage = document.getElementById('statusMessage');

  const totalProductsEl = document.getElementById('totalProducts');
  const totalPetsEl = document.getElementById('totalPets');
  const totalAccessoriesEl = document.getElementById('totalAccessories');
  const totalOrdersEl = document.getElementById('totalOrders');

  let products = [];
  let orders = [];
  let editingProductId = null;

  const showStatus = (message, type = 'success') => {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.className = `auth-message ${type}`;
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'auth-message';
    }, 3500);
  };

  const getToken = () => PetShopAuth.getSession()?.token || '';

  const showLogin = () => {
    loginForm.style.display = 'block';
    dashboard.style.display = 'none';
    if (sellerHeaderBar) sellerHeaderBar.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
  };

  const showDashboard = () => {
    loginForm.style.display = 'none';
    dashboard.style.display = 'block';
    if (sellerHeaderBar) sellerHeaderBar.style.display = 'flex';
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    loadProducts();
    loadOrders();
  };

  const checkAuth = async () => {
    const session = await PetShopAuth.refreshSession();
    if (session?.user?.role === 'seller') {
      showDashboard();
      return true;
    }
    showLogin();
    return false;
  };

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid username or password');
      if (data.user.role !== 'seller') throw new Error('Seller account required');

      PetShopAuth.saveSession(data.user, data.token);
      showDashboard();
      showStatus('Welcome back, ' + data.user.name + '!');
      return true;
    } catch (error) {
      showStatus(error.message || 'Invalid username or password', 'error');
      return false;
    }
  };

  const logout = async () => {
    await PetShopAuth.logout();
    showLogin();
    showStatus('Logged out successfully.');
  };

  const loadProducts = async () => {
    try {
      products = await PetShopProducts.fetchProducts(true);
      displayProducts();
      updateStats();
    } catch (error) {
      showStatus('Failed to load products: ' + error.message, 'error');
      products = PetShopProducts.getCachedProducts();
      displayProducts();
      updateStats();
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: { Authorization: getToken() }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load orders');
      orders = Array.isArray(data) ? data : [];
      displayOrders();
      if (totalOrdersEl) totalOrdersEl.textContent = orders.length;
    } catch (error) {
      showStatus('Failed to load orders: ' + error.message, 'error');
      orders = [];
      displayOrders();
    }
  };

  const saveProducts = async () => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getToken()
      },
      body: JSON.stringify(products)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save products');
    localStorage.setItem('petShopProducts', JSON.stringify(products));
    PetShopProducts.syncPriceMap(products);
    return data;
  };

  const displayProducts = () => {
    if (products.length === 0) {
      productList.innerHTML = '<p class="subtle">No products yet. Add your first product using the form.</p>';
      return;
    }

    productList.innerHTML = products.map((product) => `
      <div class="product-item" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='placeholder.jpg'">
        <div class="product-info">
          <h4>${product.name}</h4>
          <p>${product.description}</p>
          <div class="product-price">रू${product.price}</div>
          <small class="subtle">${product.category} · ${product.subcategory || 'general'}</small>
        </div>
        <div class="product-actions">
          <button type="button" class="btn-edit" data-id="${product.id}"><i class="fas fa-edit"></i> Edit</button>
          <button type="button" class="btn-delete" data-id="${product.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `).join('');
  };

  const displayOrders = () => {
    if (!orderList) return;

    if (orders.length === 0) {
      orderList.innerHTML = '<p class="subtle">No orders yet. Customer orders will appear here.</p>';
      return;
    }

    orderList.innerHTML = orders.map((order) => {
      const customer = order.customer || {};
      const total = order.totals?.total ?? order.total ?? 0;
      const items = (order.items || []).map((item) => `${item.name} × ${item.quantity}`).join(', ');
      const status = order.status || 'pending';

      return `
        <div class="order-item" data-id="${order.id}">
          <div class="order-item-main">
            <strong>${order.id}</strong>
            <span class="order-status status-${status}">${status}</span>
            <p>${customer.name || 'Customer'} · ${customer.phone || ''}</p>
            <p class="subtle">${items || 'No items listed'}</p>
            <p><strong>रू${total}</strong> · ${new Date(order.createdAt || order.orderDate).toLocaleString()}</p>
          </div>
          <div class="order-item-actions">
            <select class="order-status-select" data-id="${order.id}">
              <option value="pending" ${status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="shipped" ${status === 'shipped' ? 'selected' : ''}>Shipped</option>
              <option value="delivered" ${status === 'delivered' ? 'selected' : ''}>Delivered</option>
              <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
        </div>
      `;
    }).join('');
  };

  const updateStats = () => {
    totalProductsEl.textContent = products.length;
    totalPetsEl.textContent = products.filter((product) => product.category === 'pet').length;
    totalAccessoriesEl.textContent = products.filter((product) => product.category === 'accessory').length;
  };

  const resetForm = () => {
    productForm.reset();
    editingProductId = null;
    document.getElementById('productId').value = '';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Product';
    imagePreview.style.display = 'none';
    imagePreview.src = '';
  };

  const populateForm = (product) => {
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productSubcategory').value = product.subcategory || 'gear';
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productImageUrl').value = product.image || '';
    imagePreview.src = product.image || '';
    imagePreview.style.display = product.image ? 'block' : 'none';
    editingProductId = product.id;
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Product';
  };

  loginFormEl.addEventListener('submit', (event) => {
    event.preventDefault();
    login(document.getElementById('username').value.trim(), document.getElementById('password').value);
  });

  logoutBtn.addEventListener('click', logout);

  productForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const productData = {
      name: document.getElementById('productName').value.trim(),
      price: parseFloat(document.getElementById('productPrice').value),
      category: document.getElementById('productCategory').value,
      subcategory: document.getElementById('productSubcategory').value,
      description: document.getElementById('productDescription').value.trim(),
      image: document.getElementById('productImageUrl').value.trim() || imagePreview.src || 'placeholder.jpg'
    };

    if (!productData.name || !productData.price || !productData.category || !productData.description) {
      showStatus('Please fill in all required fields', 'error');
      return;
    }

    try {
      if (editingProductId) {
        const index = products.findIndex((product) => product.id === editingProductId);
        if (index !== -1) products[index] = { ...products[index], ...productData };
        showStatus('Product updated successfully!');
      } else {
        products.push({ id: 'product-' + Date.now(), ...productData });
        showStatus('Product added successfully!');
      }

      await saveProducts();
      displayProducts();
      updateStats();
      resetForm();
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('productImageUrl').addEventListener('input', (event) => {
    const value = event.target.value.trim();
    if (value) {
      imagePreview.src = value;
      imagePreview.style.display = 'block';
    } else {
      imagePreview.style.display = 'none';
    }
  });

  productList.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('.btn-edit');
    const deleteBtn = event.target.closest('.btn-delete');
    const productId = event.target.closest('.product-item')?.dataset.id;
    if (!productId) return;

    if (editBtn) {
      const product = products.find((item) => item.id === productId);
      if (product) populateForm(product);
    }

    if (deleteBtn && confirm('Delete this product?')) {
      products = products.filter((item) => item.id !== productId);
      try {
        await saveProducts();
        displayProducts();
        updateStats();
        showStatus('Product deleted.');
      } catch (error) {
        showStatus(error.message, 'error');
      }
    }
  });

  orderList?.addEventListener('change', async (event) => {
    const select = event.target.closest('.order-status-select');
    if (!select) return;

    try {
      const response = await fetch('/api/orders/' + select.dataset.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: getToken()
        },
        body: JSON.stringify({ status: select.value })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update order');
      await loadOrders();
      showStatus('Order status updated.');
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  checkAuth();
});
