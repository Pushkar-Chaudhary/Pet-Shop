window.PetShopAuth = (function () {
  const USER_KEY = 'petShopUser';

  function getSession() {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return user ? { user } : null;
    } catch {
      return null;
    }
  }

  function saveSession(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    if (user.role === 'customer') {
      localStorage.setItem('petShopCustomer', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role
      }));
    } else {
      localStorage.removeItem('petShopCustomer');
    }
  }

  function clearSession() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('petShopCustomer');
    localStorage.removeItem('sellerLoggedIn');
  }

  function getAuthHeader() {
    return {};
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch {
      // Ignore network errors during logout.
    }
    clearSession();
  }

  async function refreshSession() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!response.ok) {
        clearSession();
        return null;
      }
      const data = await response.json();
      saveSession(data.user);
      return { user: data.user };
    } catch {
      return getSession();
    }
  }

  function isCustomer() {
    return getSession()?.user?.role === 'customer';
  }

  function isSeller() {
    return getSession()?.user?.role === 'seller';
  }

  function updateHeaderAuth() {
    const loginLink = document.getElementById('authLoginLink');
    const userMenu = document.getElementById('authUserMenu');
    const userName = document.getElementById('authUserName');
    const sellerLink = document.getElementById('authSellerLink');
    const session = getSession();

    if (loginLink) {
      loginLink.style.display = session ? 'none' : '';
    }

    if (userMenu) {
      userMenu.style.display = session ? 'flex' : 'none';
    }

    if (userName && session) {
      userName.textContent = session.user.name || 'Account';
    }

    if (sellerLink) {
      if (session?.user?.role === 'seller') {
        sellerLink.href = 'seller.html';
        sellerLink.textContent = 'Seller Dashboard';
        sellerLink.style.display = '';
      } else {
        sellerLink.style.display = 'none';
      }
    }

    document.querySelectorAll('[data-require-customer]').forEach((el) => {
      el.style.display = isCustomer() ? '' : 'none';
    });
  }

  function bindHeaderAuth() {
    updateHeaderAuth();

    const logoutBtn = document.getElementById('authLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        await logout();
        updateHeaderAuth();
        window.location.href = 'index.html';
      });
    }
  }

  function goToCheckout(options = {}) {
    const params = new URLSearchParams();
    if (options.product) params.set('product', options.product);
    if (options.buyNow) params.set('buyNow', '1');
    if (options.qty && options.qty !== 1) params.set('qty', String(options.qty));

    const checkoutPath = params.toString() ? `checkout.html?${params}` : 'checkout.html';
    window.location.href = isCustomer()
      ? checkoutPath
      : `login.html?next=${encodeURIComponent(checkoutPath)}`;
  }

  async function loginWithOtp(endpoint, payload) {
    return postJson(endpoint, payload);
  }

  async function verifyOtp(endpoint, payload) {
    return postJson(endpoint, payload);
  }

  return {
    getSession,
    saveSession,
    clearSession,
    getAuthHeader,
    logout,
    refreshSession,
    isCustomer,
    isSeller,
    updateHeaderAuth,
    bindHeaderAuth,
    goToCheckout,
    loginWithOtp,
    verifyOtp
  };
})();
