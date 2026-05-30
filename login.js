document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authMessage = document.getElementById('authMessage');

  const showMessage = (message, type = 'success') => {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
  };

  const redirectAfterLogin = (user) => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || 'index.html';

    if (user.role === 'seller') {
      window.location.href = 'seller.html';
      return;
    }

    window.location.href = next;
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.user.role === 'seller') throw new Error('Use the seller dashboard to sign in as a seller.');

      PetShopAuth.saveSession(data.user, data.token);
      showMessage('Login successful. Redirecting…');
      setTimeout(() => redirectAfterLogin(data.user), 400);
    } catch (error) {
      showMessage(error.message || 'Could not log in.', 'error');
    }
  });

  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
      showMessage('Please fill in all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Signup failed');

      PetShopAuth.saveSession(data.user, data.token);
      showMessage('Account created. Redirecting…');
      setTimeout(() => redirectAfterLogin(data.user), 400);
    } catch (error) {
      showMessage(error.message || 'Could not create account.', 'error');
    }
  });
});
