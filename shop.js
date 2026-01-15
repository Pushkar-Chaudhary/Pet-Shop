document.addEventListener("DOMContentLoaded", () => {
    
    // --- ELEMENTS ---
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImg");
    const modalText = document.getElementById("modalText");
    const modalTitle = document.getElementById("modalTitle");
    const cartCountEl = document.getElementById("cartCount");
    const cartBtn = document.querySelector(".cart-btn");
    
    let cartCount = 0;

    // --- MODAL LOGIC ---
    // Open modal when clicking any product image
    document.querySelectorAll(".animal img, .accessory img").forEach(img => {
        img.addEventListener("click", () => {
            modal.style.display = "flex";
            modalImg.src = img.src;
            
            // Get description from the <p> tag below the image
            const description = img.nextElementSibling.textContent;
            modalText.textContent = description;
            
            // Get name from alt or data-name attribute
            modalTitle.textContent = img.getAttribute("data-name") || img.alt;
        });
    });

    // Close modal function
    function closeModal() {
        modal.style.display = "none";
    }

    // Close if clicking outside content
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    // Close button click
    document.querySelector(".close-btn").addEventListener("click", closeModal);


    // --- CART COUNTER LOGIC ---
    function updateCartAnimation() {
        cartCountEl.textContent = cartCount;
        // Visual feedback
        cartBtn.style.transform = "scale(1.3)";
        setTimeout(() => cartBtn.style.transform = "scale(1)", 200);
    }

    // 1. Handle "Add to Cart" buttons on the cards
    document.querySelectorAll(".btn-add").forEach(btn => {
        btn.addEventListener("click", () => {
            cartCount++;
            updateCartAnimation();
            alert("🐾 Added to cart from shop page!");
        });
    });

    // 2. Handle "Add to Cart" button inside Modal
    document.querySelector(".btn-cart").addEventListener("click", () => {
        cartCount++;
        updateCartAnimation();
        closeModal();
        alert("🐾 Added to cart from modal!");
    });

    // --- CART TOGGLE ---
    cartBtn.addEventListener("click", () => {
        if(cartCount === 0) {
            alert("Your cart is empty! 🛒");
        } else {
            alert(`You have ${cartCount} items in your cart. Proceeding to checkout...`);
        }
    });
});