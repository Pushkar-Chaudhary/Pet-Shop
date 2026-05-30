document.addEventListener('DOMContentLoaded', async () => {
  const cartItemsEl = document.getElementById('cartItems');
  const cartSectionTitle = document.getElementById('cartSectionTitle');
  const subtotalEl = document.getElementById('subtotal');
  const summarySubtotalEl = document.getElementById('summarySubtotal');
  const finalTotalEl = document.getElementById('finalTotal');
  const discountCodeEl = document.getElementById('discountCode');
  const applyDiscountBtn = document.getElementById('applyDiscount');
  const discountMessageEl = document.getElementById('discountMessage');
  const discountRow = document.getElementById('discountRow');
  const discountAmountEl = document.getElementById('discountAmount');
  const placeOrderBtn = document.getElementById('placeOrder');
  const customerStatusEl = document.getElementById('customerStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  const cardDetails = document.getElementById('cardDetails');
  const upiDetails = document.getElementById('upiDetails');

  let cart = [];
  let productMap = {};
  let discountAmount = 0;
  const deliveryCharge = 100;

  const discountCodes = {
    PET10: 0.10,
    PET20: 0.20,
    WELCOME: 0.15,
    SAVE50: 50
  };

  const applyBuyNowFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const productName = params.get('product');
    if (!productName) return false;

    const qty = Math.max(1, parseInt(params.get('qty') || '1', 10) || 1);
    const buyNow = params.get('buyNow') === '1';

    try {
      cart = JSON.parse(localStorage.getItem('petShopCart') || '[]');
    } catch {
      cart = [];
    }

    if (buyNow) {
      cart = [{ name: productName, quantity: qty, addedAt: new Date().toISOString() }];
    } else {
      const existing = cart.find((item) => item.name === productName);
      if (existing) existing.quantity += qty;
      else cart.push({ name: productName, quantity: qty, addedAt: new Date().toISOString() });
    }

    localStorage.setItem('petShopCart', JSON.stringify(cart));
    window.history.replaceState({}, '', 'checkout.html');
    return buyNow;
  };

  const isBuyNowFlow = applyBuyNowFromUrl();

  const ensureCustomerSession = async () => {
    const session = await PetShopAuth.refreshSession();
    if (!session || session.user.role !== 'customer') {
      window.location.href = 'login.html?next=checkout.html';
      return false;
    }

    if (customerStatusEl) {
      customerStatusEl.textContent = `Logged in as ${session.user.name}${session.user.email ? ' (' + session.user.email + ')' : ''}`;
    }

    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    if (fullNameEl && session.user.name) fullNameEl.value = session.user.name;
    if (emailEl && session.user.email) emailEl.value = session.user.email;

    return true;
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      await PetShopAuth.logout();
      window.location.href = 'login.html?next=checkout.html';
    });
  }

  const getSubtotal = () => cart.reduce((sum, item) => {
    const price = productMap[item.name]?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const updateTotals = (subtotal) => {
    const finalTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);
    subtotalEl.textContent = subtotal;
    summarySubtotalEl.textContent = subtotal;
    finalTotalEl.textContent = finalTotal;
  };

  const saveCart = () => {
    localStorage.setItem('petShopCart', JSON.stringify(cart));
  };

  const loadCart = () => {
    try {
      const storedCart = localStorage.getItem('petShopCart');
      cart = storedCart ? JSON.parse(storedCart) : [];
      cartItemsEl.innerHTML = '';

      if (cartSectionTitle) {
        cartSectionTitle.textContent = isBuyNowFlow && cart.length === 1
          ? 'Buy Now — Your Item'
          : 'Your Cart';
      }

      if (cart.length === 0) {
        cartItemsEl.innerHTML = "<p>Your cart is empty. <a href='index.html'>Continue shopping</a></p>";
        placeOrderBtn.disabled = true;
        updateTotals(0);
        return;
      }

      placeOrderBtn.disabled = false;
      cart.forEach((item, index) => {
        const product = productMap[item.name];
        const price = product?.price || 0;
        const itemTotal = price * item.quantity;
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item checkout-cart-item';
        itemEl.innerHTML = `
          <img src="${product?.image || 'placeholder.jpg'}" alt="${item.name}" onerror="this.src='placeholder.jpg'">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>रू${price} × ${item.quantity} = रू${itemTotal}</p>
          </div>
          <div class="cart-item-actions">
            <button type="button" class="btn-quantity" data-action="decrease" data-index="${index}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button type="button" class="btn-quantity" data-action="increase" data-index="${index}">+</button>
            <button type="button" class="btn-remove" data-index="${index}">Remove</button>
          </div>
        `;
        cartItemsEl.appendChild(itemEl);
      });

      updateTotals(getSubtotal());
    } catch {
      cartItemsEl.innerHTML = "<p>Error loading cart. <a href='index.html'>Go back to shopping</a></p>";
    }
  };

  cartItemsEl.addEventListener('click', (event) => {
    const target = event.target;
    const index = parseInt(target.dataset.index, 10);
    if (Number.isNaN(index)) return;

    if (target.classList.contains('btn-quantity')) {
      if (target.dataset.action === 'increase') cart[index].quantity += 1;
      if (target.dataset.action === 'decrease' && cart[index].quantity > 1) cart[index].quantity -= 1;
      saveCart();
      loadCart();
    }

    if (target.classList.contains('btn-remove')) {
      cart.splice(index, 1);
      saveCart();
      loadCart();
    }
  });

  const showDiscountMessage = (message, type) => {
    discountMessageEl.textContent = message;
    discountMessageEl.className = `discount-message ${type}`;
    setTimeout(() => {
      discountMessageEl.textContent = '';
      discountMessageEl.className = 'discount-message';
    }, 3000);
  };

  applyDiscountBtn.addEventListener('click', () => {
    const code = discountCodeEl.value.trim().toUpperCase();
    if (!code) {
      showDiscountMessage('Please enter a discount code', 'error');
      return;
    }

    const subtotal = getSubtotal();
    if (discountCodes[code] !== undefined) {
      const discount = discountCodes[code];
      discountAmount = typeof discount === 'number' && discount < 1
        ? Math.round(subtotal * discount)
        : Math.min(discount, subtotal);
      discountRow.style.display = 'flex';
      discountAmountEl.textContent = discountAmount;
      showDiscountMessage(`Discount applied! You saved रू${discountAmount}`, 'success');
      updateTotals(subtotal);
    } else {
      discountAmount = 0;
      discountRow.style.display = 'none';
      showDiscountMessage('Invalid discount code', 'error');
      updateTotals(subtotal);
    }
  });

  paymentMethods.forEach((method) => {
    method.addEventListener('change', () => {
      const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      cardDetails.style.display = selectedMethod === 'card' ? 'block' : 'none';
      upiDetails.style.display = selectedMethod === 'upi' ? 'block' : 'none';
    });
  });

  const validateForm = () => {
    const requiredFields = ['fullName', 'phone', 'email', 'address', 'city', 'state', 'pincode'];
    for (const fieldId of requiredFields) {
      const field = document.getElementById(fieldId);
      if (!field || !field.value.trim()) {
        alert(`Please fill in ${field?.labels?.[0]?.textContent || fieldId}`);
        field?.focus();
        return false;
      }
    }

    const email = document.getElementById('email').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email address');
      return false;
    }

    const phone = document.getElementById('phone').value;
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert('Please enter a valid 10-digit phone number');
      return false;
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
    if (!paymentMethod) {
      alert('Please select a payment method');
      return false;
    }

    if (paymentMethod === 'card') {
      for (const fieldId of ['cardNumber', 'expiry', 'cvv', 'cardName']) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value.trim()) {
          alert('Please complete all card details');
          field?.focus();
          return false;
        }
      }
    }

    if (paymentMethod === 'upi') {
      const upiId = document.getElementById('upiId').value.trim();
      if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        alert('Please enter a valid UPI ID');
        return false;
      }
    }

    return true;
  };

  placeOrderBtn.addEventListener('click', async () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    if (!validateForm()) return;

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Processing…';

    try {
      const subtotal = getSubtotal();
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      const session = PetShopAuth.getSession();

      const orderData = {
        items: cart,
        customer: {
          name: document.getElementById('fullName').value.trim(),
          phone: document.getElementById('phone').value.trim(),
          email: document.getElementById('email').value.trim(),
          address: document.getElementById('address').value.trim(),
          city: document.getElementById('city').value.trim(),
          state: document.getElementById('state').value.trim(),
          pincode: document.getElementById('pincode').value.trim(),
          userId: session?.user?.id || null
        },
        payment: { method: paymentMethod },
        totals: {
          subtotal,
          delivery: deliveryCharge,
          discount: discountAmount,
          total: Math.max(0, subtotal + deliveryCharge - discountAmount)
        },
        checkoutType: isBuyNowFlow ? 'buy-now' : 'cart'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to save order');

      localStorage.removeItem('petShopCart');
      alert(`Order placed successfully!\n\nOrder ID: ${result.order.id}\nTotal: रू${orderData.totals.total}\nWe will contact you at ${orderData.customer.email}.`);
      window.location.href = 'index.html';
    } catch (error) {
      alert(error.message || 'Failed to place order. Please try again.');
    } finally {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  });

  if (!(await ensureCustomerSession())) return;

  const products = await PetShopProducts.fetchProducts();
  productMap = PetShopProducts.getProductMap(products);
  loadCart();

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
    });
  });

  document.querySelectorAll('input[id="cardNumber"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      let value = event.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      event.target.value = value.slice(0, 19);
    });
  });

  document.querySelectorAll('input[id="expiry"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      let value = event.target.value.replace(/\D/g, '');
      if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
      event.target.value = value.slice(0, 5);
    });
  });

  document.querySelectorAll('input[id="cvv"]').forEach((input) => {
    input.addEventListener('input', (event) => {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    });
  });
});
