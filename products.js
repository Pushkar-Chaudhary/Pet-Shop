window.PetShopProducts = (function () {
  let cache = null;

  const defaultProducts = [
    { id: 'judging-cat', name: 'Judging Cat', price: 300, category: 'pet', subcategory: 'cat', description: 'A judging cat who questions your life decisions.', image: 'cat1.jpeg' },
    { id: 'lazy-cat', name: 'Lazy Cat', price: 280, category: 'pet', subcategory: 'cat', description: 'A lazy cat who will help you to lie on the floor.', image: 'cat2.jpeg' },
    { id: 'cute-shorthair', name: 'Cute Shorthair', price: 350, category: 'pet', subcategory: 'cat', description: 'A cute shorthair who is just here to grab your attention.', image: 'cat3.jpeg' },
    { id: 'short-legged-cat', name: 'Short Legged Cat', price: 400, category: 'pet', subcategory: 'cat', description: 'A cute short legged cat who loves to chase laser pointers.', image: 'cat4.jpeg' },
    { id: 'fluffy-cat', name: 'Fluffy Cat', price: 320, category: 'pet', subcategory: 'cat', description: 'A fluffy cat who enjoys long naps in sunny spots.', image: 'cat5.jpeg' },
    { id: 'friendly-dog', name: 'Friendly Dog', price: 450, category: 'pet', subcategory: 'dog', description: 'A friendly dog who loves to play fetch and go for walks.', image: 'dog1.jpeg' },
    { id: 'loyal-dog', name: 'Loyal Dog', price: 500, category: 'pet', subcategory: 'dog', description: 'A loyal and cute dog who will be your best companion.', image: 'dog2.jpeg' },
    { id: 'energetic-dog', name: 'Energetic Dog', price: 480, category: 'pet', subcategory: 'dog', description: 'An energetic dog who loves to run and play outdoors.', image: 'dog3.jpeg' },
    { id: 'dog-food', name: 'Dog Food', price: 120, category: 'accessory', subcategory: 'food', description: 'High-quality food to keep your dog healthy and happy.', image: 'petfood.jpeg' },
    { id: 'cat-food', name: 'Cat Food', price: 110, category: 'accessory', subcategory: 'food', description: 'High-quality food to keep your cat healthy and happy.', image: 'catfood.jpeg' },
    { id: 'pet-collar', name: 'Pet Collar', price: 80, category: 'accessory', subcategory: 'gear', description: 'Durable collars to keep your pets safe and stylish.', image: 'petcollar.jpeg' },
    { id: 'net-carrier', name: 'Net Carrier', price: 200, category: 'accessory', subcategory: 'gear', description: 'Convenient and comfortable carriers for your pets with nets.', image: 'carrybag1.jpeg' },
    { id: 'shield-carrier', name: 'Shield Carrier', price: 250, category: 'accessory', subcategory: 'gear', description: 'Comfortable and stylish carriers with a protective shield.', image: 'carrybag2.jpeg' },
    { id: 'pet-toys', name: 'Pet Toys', price: 150, category: 'accessory', subcategory: 'gear', description: 'Fun toys to keep your pets entertained and active.', image: 'pettoys.jpg' }
  ];

  async function fetchProducts(forceRefresh = false) {
    if (cache && !forceRefresh) return cache;

    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to load products');
      const data = await response.json();
      cache = Array.isArray(data) && data.length ? data : defaultProducts;
    } catch {
      cache = defaultProducts;
    }

    localStorage.setItem('petShopProducts', JSON.stringify(cache));
    syncPriceMap(cache);
    return cache;
  }

  function syncPriceMap(products) {
    const productPrices = {};
    products.forEach((product) => {
      productPrices[product.name] = product.price;
    });
    localStorage.setItem('petShopProductPrices', JSON.stringify(productPrices));
  }

  function getCachedProducts() {
    if (cache) return cache;
    try {
      const stored = localStorage.getItem('petShopProducts');
      cache = stored ? JSON.parse(stored) : defaultProducts;
    } catch {
      cache = defaultProducts;
    }
    return cache;
  }

  function getProductMap(products = getCachedProducts()) {
    const map = {};
    products.forEach((product) => {
      map[product.name] = product;
    });
    return map;
  }

  function filterByPage(products, pageFilter) {
    if (!pageFilter || pageFilter === 'all') return products;

    switch (pageFilter) {
      case 'cat':
        return products.filter((product) => product.subcategory === 'cat');
      case 'dog':
        return products.filter((product) => product.subcategory === 'dog');
      case 'food':
        return products.filter((product) => product.subcategory === 'food');
      case 'accessory':
        return products.filter((product) => product.category === 'accessory' && product.subcategory !== 'food');
      case 'pets':
        return products.filter((product) => product.category === 'pet');
      case 'accessories':
        return products.filter((product) => product.category === 'accessory');
      default:
        return products;
    }
  }

  function renderProductCard(product) {
    const cardClass = product.category === 'pet' ? 'animal' : 'accessory';
    return `
      <div class="${cardClass}">
        <img src="${product.image}" alt="${product.name}" data-name="${product.name}" onerror="this.src='placeholder.jpg'">
        <div class="card-content">
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="price-badge">रू${Number(product.price).toFixed(2)}</div>
          <div class="card-actions">
            <a href="checkout.html?product=${encodeURIComponent(product.name)}&amp;buyNow=1" class="btn-buy">Buy Now</a>
            <button type="button" class="btn-add" data-product="${product.name}">Add to Cart</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderProducts(container, products) {
    if (!container) return;
    container.innerHTML = products.map(renderProductCard).join('');
  }

  return {
    defaultProducts,
    fetchProducts,
    getCachedProducts,
    getProductMap,
    filterByPage,
    renderProductCard,
    renderProducts,
    syncPriceMap
  };
})();
