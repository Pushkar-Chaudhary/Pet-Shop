# Pet Shop E-Commerce Website

A modern, mobile-friendly, theme-enabled pet shop website with dynamic seller management and interactive UI.

## ✨ New Features (Latest Update)

- **🎨 Theme System**: Light, Dark, and Colorful themes with persistent storage
- **📱 Mobile-First Design**: Fully responsive with touch-friendly interactions
- **🛒 Right-Side Cart**: Slide-out cart sidebar with real-time updates
- **🎯 Interactive UI**: Smooth animations, loading states, and toast notifications
- **👨‍💼 Seller Dashboard**: Dynamic product management (seller.html)
- **💫 Enhanced UX**: Modal improvements, better navigation, accessibility features

## 🚀 Core Features

- **Minimal Design**: Clean, modern interface with subtle shadows and professional typography
- **Dynamic Products**: Seller-managed inventory with real-time updates
- **Cart Management**: Persistent shopping cart with localStorage
- **Product Catalog**: Wide range of pets, food, accessories, and carriers
- **Discount System**: Multiple discount codes for promotions
- **Secure Checkout**: Comprehensive form validation and payment processing
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Robust error handling and user feedback

## 📁 Files Structure

```
├── index.html          # Main shop page with theme selector & right cart
├── checkout.html       # Checkout page with cart and forms
├── buy.html           # Individual product purchase page
├── seller.html        # Seller dashboard for product management
├── styles.css         # Enhanced styling with themes & mobile support
├── shop.js            # Enhanced cart, theme, and UI interactions
├── seller.js          # Seller authentication and product CRUD
├── checkout.js        # Checkout logic and form validation
└── README.md          # This documentation
```

## 🎨 Theme System

Choose from three beautiful themes:
- **☀️ Light**: Clean, bright interface (default)
- **🌙 Dark**: Easy on the eyes for night browsing
- **🌈 Colorful**: Vibrant and playful design

Themes persist across sessions and apply to all pages.

## 📱 Mobile Experience

- Responsive grid layouts that adapt to screen size
- Touch-friendly buttons and interactions
- Slide-out cart optimized for mobile
- Optimized modal dialogs for small screens
- Swipe gestures and mobile navigation

## 🛒 Cart Features

- **Right Sidebar**: Non-intrusive cart that slides from the right
- **Real-time Updates**: Instant quantity changes and price calculations
- **Persistent Storage**: Cart survives browser refreshes
- **Visual Feedback**: Smooth animations and loading states
- **Mobile Optimized**: Full-screen cart on mobile devices

## 👨‍💼 Seller Management

Access the seller dashboard at `seller.html`:
- **Authentication**: Simple login system
- **Add Products**: Create new pets and accessories
- **Edit Products**: Modify existing inventory
- **Delete Products**: Remove items from catalog
- **Statistics**: View sales data and inventory counts
- **Image Upload**: Add product photos

## 🎯 Interactive Elements

- **Toast Notifications**: Non-intrusive success/error messages
- **Loading States**: Visual feedback during actions
- **Smooth Animations**: CSS transitions and transforms
- **Hover Effects**: Interactive card animations
- **Modal Enhancements**: Better product previews with pricing

## 🚀 Getting Started

### Local Development
1. Download all files to a folder
2. Open `index.html` in any modern web browser
3. No server required - runs entirely in the browser

### Try the Features
1. **Change Themes**: Click the theme buttons in the header
2. **Browse Products**: Click product images for detailed modals
3. **Add to Cart**: Use the cart button or "Add to Cart" buttons
4. **View Cart**: Click the cart icon to open the sidebar
5. **Seller Access**: Visit `seller.html` to manage products

### Production Deployment
1. Upload all files to your web hosting service
2. Ensure all files are in the same directory
3. The site works immediately - no build process needed
4. For better SEO, add a proper favicon.ico

## 🌐 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🔧 Technical Details

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Custom properties, flexbox, grid, and animations
- **JavaScript ES6+**: Modern syntax with error handling
- **localStorage**: Client-side data persistence
- **Responsive Images**: Optimized for all screen sizes
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

## 📊 Performance

- **Fast Loading**: No external dependencies except Font Awesome icons
- **Lightweight**: Under 50KB total for core functionality
- **Optimized Images**: Efficient image loading with fallbacks
- **Smooth Animations**: Hardware-accelerated CSS transitions

## 🔒 Security & Privacy

- **Client-Side Only**: No server-side data storage
- **No Tracking**: No analytics or third-party scripts
- **Local Storage**: Data stays on user's device
- **Input Validation**: Client-side form validation
- **Secure Checkout**: Mock payment processing (ready for integration)

---

**Built with ❤️ for pet lovers everywhere**
- Edge 79+

## Features Overview

### Shopping Cart
- Add/remove items with quantity controls
- Persistent cart using localStorage
- Real-time total calculations
- Cart counter in header

### Products
- Pets: Cats and Dogs with various breeds
- Food: Specialized pet nutrition
- Accessories: Collars, carriers, toys
- Competitive pricing in INR

### Checkout Process
- Customer information form
- Delivery address collection
- Payment method selection (Card/UPI)
- Discount code application
- Order summary and confirmation

### Security Features
- Input validation and sanitization
- No sensitive data storage
- Client-side form validation
- Error handling and user feedback

## Customization

### Styling
Edit `styles.css` to modify colors, fonts, and layout. The design uses CSS custom properties (variables) for easy theming.

### Products
Update the `productPrices` object in `shop.js` and `checkout.js` to modify products and prices.

### Discount Codes
Modify the `discountCodes` object in `checkout.js` to add or change promotional codes.

## Technical Details

- **No Dependencies**: Pure HTML/CSS/JS - no frameworks or libraries
- **No Build Tools**: Direct browser execution
- **No Database**: Uses localStorage for cart persistence
- **No Server**: Completely static website
- **SEO Optimized**: Proper meta tags and semantic HTML
- **Performance**: Optimized for fast loading

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please check the code comments or create an issue in the repository.