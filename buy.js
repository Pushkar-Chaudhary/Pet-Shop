document.addEventListener("DOMContentLoaded", () => {
    
    // --- ELEMENTS ---
    const productSelect = document.getElementById("product");
    const qtyInput = document.getElementById("quantity");
    const totalText = document.getElementById("total");
    const priceField = document.getElementById("priceField");

    // --- PRICE CALCULATION ---
    function updatePrice() {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const price = selectedOption ? (selectedOption.dataset.price || 0) : 0;
        const qty = qtyInput.value || 1;
        const total = price * qty;

        totalText.textContent = total;
        priceField.value = "₹" + total;
    }

    productSelect.addEventListener("change", updatePrice);
    qtyInput.addEventListener("input", updatePrice);

    // --- AUTO-SELECT PRODUCT FROM URL ---
    // Reads the URL (e.g., ?product=Lazy%20Cat)
    const params = new URLSearchParams(window.location.search);
    const petParam = params.get("product");

    if (petParam) {
        // Loop through options to find match
        [...productSelect.options].forEach(opt => {
            if (opt.value === petParam) {
                opt.selected = true;
            }
        });
        // Recalculate price immediately
        updatePrice();
    }

    // --- FORM SUBMISSION ---
    document.getElementById("buyForm").addEventListener("submit", function(e) {
        e.preventDefault();
        
        // NOTE: To use EmailJS, you would uncomment the block below
        /*
        emailjs.sendForm("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", this)
            .then(() => {
                alert("Purchase Successful!");
                window.location.href = "index.html";
            }, (error) => {
                console.log("FAILED...", error);
            });
        */

        // Simulation for preview
        alert("Order Placed Successfully! 🎉\nWe will contact you at: " + this.buyer_email.value);
        window.location.href = "index.html";
    });
});