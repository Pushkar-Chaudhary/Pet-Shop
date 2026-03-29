document.addEventListener("DOMContentLoaded", () => {

    // --- ERROR HANDLING & LOGGING ---
    const showError = (message) => {
        console.error('Checkout Error:', message);
        // In production, send to error tracking service
    };

    const showSuccess = (message) => {
        console.log('Checkout Success:', message);
    };

    // --- LOADING STATES ---
    const setLoading = (element, loading) => {
        if (loading) {
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.textContent = "Processing...";
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || element.textContent;
        }
    };

    // --- ELEMENTS ---
    const cartItemsEl = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const summarySubtotalEl = document.getElementById("summarySubtotal");
    const finalTotalEl = document.getElementById("finalTotal");
    const discountCodeEl = document.getElementById("discountCode");
    const applyDiscountBtn = document.getElementById("applyDiscount");
    const discountMessageEl = document.getElementById("discountMessage");
    const discountRow = document.getElementById("discountRow");
    const discountAmountEl = document.getElementById("discountAmount");
    const placeOrderBtn = document.getElementById("placeOrder");
    const cartCountEl = document.getElementById("cartCount");

    // Payment method elements
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const cardDetails = document.getElementById("cardDetails");
    const upiDetails = document.getElementById("upiDetails");

    // --- CART DATA ---
    let cart = [];
    let discountAmount = 0;
    const deliveryCharge = 100;

    // Product prices (same as in buy.html)
    const productPrices = {
        "Judging Cat": 300,
        "Lazy Cat": 280,
        "Cute Shorthair": 350,
        "Short Legged Cat": 400,
        "Fluffy Cat": 320,
        "Friendly Dog": 450,
        "Loyal Dog": 500,
        "Energetic Dog": 480,
        "Dog Food": 120,
        "Cat Food": 110,
        "Pet Collar": 80,
        "Net Carrier": 200,
        "Shield Carrier": 250,
        "Pet Toys": 150
    };

    // Discount codes
    const discountCodes = {
        "PET10": 0.10, // 10% off
        "PET20": 0.20, // 20% off
        "WELCOME": 0.15, // 15% off
        "SAVE50": 50 // Fixed रू50 off
    };

    // --- LOAD CART ---
    const loadCart = () => {
        try {
            const storedCart = localStorage.getItem("petShopCart");
            cart = storedCart ? JSON.parse(storedCart) : [];

            cartItemsEl.innerHTML = "";
            let subtotal = 0;

            if (cart.length === 0) {
                cartItemsEl.innerHTML = "<p>Your cart is empty. <a href='index.html'>Continue shopping</a></p>";
                placeOrderBtn.disabled = true;
                return;
            }

            placeOrderBtn.disabled = false;

            cart.forEach((item, index) => {
                const price = productPrices[item.name] || 0;
                if (price === 0) {
                    showError(`Unknown product: ${item.name}`);
                }
                const itemTotal = price * item.quantity;
                subtotal += itemTotal;

                const itemEl = document.createElement("div");
                itemEl.className = "cart-item";
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>रू${price} × ${item.quantity} = रू${itemTotal}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="btn-quantity" data-action="decrease" data-index="${index}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="btn-quantity" data-action="increase" data-index="${index}">+</button>
                        <button class="btn-remove" data-index="${index}">Remove</button>
                    </div>
                `;
                cartItemsEl.appendChild(itemEl);
            });

            updateTotals(subtotal);
            showSuccess(`Loaded ${cart.length} items from cart`);
        } catch (error) {
            showError('Failed to load cart: ' + error.message);
            cartItemsEl.innerHTML = "<p>Error loading cart. <a href='index.html'>Go back to shopping</a></p>";
        }
    };

    // --- UPDATE TOTALS ---
    const updateTotals = (subtotal) => {
        const finalTotal = Math.max(0, subtotal + deliveryCharge - discountAmount);

        subtotalEl.textContent = subtotal;
        summarySubtotalEl.textContent = subtotal;
        finalTotalEl.textContent = finalTotal;

        // Update cart count in header
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = totalItems;
    };

    // --- SAVE CART ---
    const saveCart = () => {
        try {
            localStorage.setItem("petShopCart", JSON.stringify(cart));
            showSuccess('Cart saved to localStorage');
        } catch (error) {
            showError('Failed to save cart: ' + error.message);
        }
    };

    // --- CART ITEM ACTIONS ---
    cartItemsEl.addEventListener("click", (e) => {
        const target = e.target;
        const index = parseInt(target.dataset.index);

        if (target.classList.contains("btn-quantity")) {
            const action = target.dataset.action;
            if (action === "increase") {
                cart[index].quantity++;
            } else if (action === "decrease" && cart[index].quantity > 1) {
                cart[index].quantity--;
            }
            saveCart();
            loadCart();
        } else if (target.classList.contains("btn-remove")) {
            cart.splice(index, 1);
            saveCart();
            loadCart();
        }
    });

    // --- DISCOUNT CODE ---
    applyDiscountBtn.addEventListener("click", () => {
        const code = discountCodeEl.value.trim().toUpperCase();

        if (!code) {
            showDiscountMessage("Please enter a discount code", "error");
            return;
        }

        if (discountCodes[code] !== undefined) {
            const discount = discountCodes[code];
            const subtotal = cart.reduce((sum, item) => sum + (productPrices[item.name] * item.quantity), 0);

            if (typeof discount === "number" && discount < 1) {
                // Percentage discount
                discountAmount = Math.round(subtotal * discount);
            } else {
                // Fixed amount discount
                discountAmount = Math.min(discount, subtotal);
            }

            discountRow.style.display = "flex";
            discountAmountEl.textContent = discountAmount;
            showDiscountMessage(`Discount applied! You saved रू${discountAmount}`, "success");
            updateTotals(subtotal);
            showSuccess(`Applied discount code: ${code}`);
        } else {
            discountAmount = 0;
            discountRow.style.display = "none";
            showDiscountMessage("Invalid discount code", "error");
            showError(`Invalid discount code attempted: ${code}`);
        }
    });

    const showDiscountMessage = (message, type) => {
        discountMessageEl.textContent = message;
        discountMessageEl.className = `discount-message ${type}`;
        setTimeout(() => {
            discountMessageEl.textContent = "";
            discountMessageEl.className = "discount-message";
        }, 3000);
    };

    // --- PAYMENT METHOD SWITCHING ---
    paymentMethods.forEach(method => {
        method.addEventListener("change", () => {
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

            // Hide all payment details
            cardDetails.style.display = "none";
            upiDetails.style.display = "none";

            // Show relevant payment details
            if (selectedMethod === "card") {
                cardDetails.style.display = "block";
            } else if (selectedMethod === "upi") {
                upiDetails.style.display = "block";
            }

            showSuccess(`Payment method changed to: ${selectedMethod}`);
        });
    });

    // --- FORM VALIDATION ---
    const validateForm = () => {
        const requiredFields = [
            "fullName", "phone", "email", "address", "city", "state", "pincode"
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                alert(`Please fill in the ${field?.previousElementSibling?.textContent || fieldId}`);
                field?.focus();
                return false;
            }
        }

        // Email validation
        const email = document.getElementById("email").value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address");
            document.getElementById("email").focus();
            return false;
        }

        // Phone validation
        const phone = document.getElementById("phone").value;
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            alert("Please enter a valid 10-digit phone number");
            document.getElementById("phone").focus();
            return false;
        }

        // Payment method specific validation
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

        if (!paymentMethod) {
            alert("Please select a payment method");
            return false;
        }

        if (paymentMethod === "card") {
            const cardFields = ["cardNumber", "expiry", "cvv", "cardName"];
            for (const fieldId of cardFields) {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    alert(`Please fill in the ${field?.previousElementSibling?.textContent}`);
                    field?.focus();
                    return false;
                }
            }

            // Basic card number validation
            const cardNumber = document.getElementById("cardNumber").value.replace(/\s/g, '');
            if (!/^\d{13,19}$/.test(cardNumber)) {
                alert("Please enter a valid card number");
                document.getElementById("cardNumber").focus();
                return false;
            }

            // Expiry validation
            const expiry = document.getElementById("expiry").value;
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
                alert("Please enter expiry date in MM/YY format");
                document.getElementById("expiry").focus();
                return false;
            }

            // CVV validation
            const cvv = document.getElementById("cvv").value;
            if (!/^\d{3,4}$/.test(cvv)) {
                alert("Please enter a valid CVV");
                document.getElementById("cvv").focus();
                return false;
            }

        } else if (paymentMethod === "upi") {
            const upiId = document.getElementById("upiId").value;
            if (!upiId || !upiId.trim()) {
                alert("Please enter your UPI ID");
                document.getElementById("upiId").focus();
                return false;
            }

            // Basic UPI ID validation
            const upiRegex = /^[\w\.-]+@[\w\.-]+$/;
            if (!upiRegex.test(upiId)) {
                alert("Please enter a valid UPI ID");
                document.getElementById("upiId").focus();
                return false;
            }
        }

        return true;
    };

    // --- PLACE ORDER ---
    placeOrderBtn.addEventListener("click", async () => {
        if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(placeOrderBtn, true);

        try {
            // Collect order data
            const orderData = {
                items: cart,
                customer: {
                    name: document.getElementById("fullName").value.trim(),
                    phone: document.getElementById("phone").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    address: document.getElementById("address").value.trim(),
                    city: document.getElementById("city").value.trim(),
                    state: document.getElementById("state").value.trim(),
                    pincode: document.getElementById("pincode").value.trim()
                },
                payment: {
                    method: document.querySelector('input[name="paymentMethod"]:checked').value
                },
                totals: {
                    subtotal: parseInt(subtotalEl.textContent),
                    delivery: deliveryCharge,
                    discount: discountAmount,
                    total: parseInt(finalTotalEl.textContent)
                },
                orderDate: new Date().toISOString(),
                orderId: 'ORD-' + Date.now()
            };

            // Add payment details based on method
            if (orderData.payment.method === "card") {
                const cardNumber = document.getElementById("cardNumber").value;
                orderData.payment.card = {
                    number: cardNumber.slice(-4), // Only last 4 digits
                    expiry: document.getElementById("expiry").value,
                    name: document.getElementById("cardName").value.trim()
                };
            } else if (orderData.payment.method === "upi") {
                orderData.payment.upiId = document.getElementById("upiId").value.trim();
            }

            // Simulate order processing (replace with actual API call)
            await new Promise(resolve => setTimeout(resolve, 2000));

            showSuccess('Order placed successfully: ' + orderData.orderId);

            // Clear cart and redirect
            localStorage.removeItem("petShopCart");
            alert(`Order placed successfully! 🎉\n\nOrder ID: ${orderData.orderId}\nTotal: रू${orderData.totals.total}\nWe will contact you at: ${orderData.customer.email}\n\nThank you for shopping with Pet Shop!`);

            window.location.href = "index.html";

        } catch (error) {
            showError('Failed to place order: ' + error.message);
            alert('Failed to place order. Please try again.');
        } finally {
            setLoading(placeOrderBtn, false);
        }
    });

    // --- INITIALIZE ---
    loadCart();

    // --- ACCESSIBILITY ---
    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target === discountCodeEl) {
            applyDiscountBtn.click();
        }
    });

    // Form field enhancements
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
        });
    });

    document.querySelectorAll('input[id="cardNumber"]').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value.slice(0, 19);
        });
    });

    document.querySelectorAll('input[id="expiry"]').forEach(input => {
        input.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value.slice(0, 5);
        });
    });

    document.querySelectorAll('input[id="cvv"]').forEach(input => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
        });
    });

    showSuccess('Checkout page loaded successfully');
});