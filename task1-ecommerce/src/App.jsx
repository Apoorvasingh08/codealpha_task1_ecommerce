import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import { 
  ShoppingBag, 
  ShoppingCart, 
  User, 
  LogOut, 
  Search, 
  Star, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle,
  Package,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  const { user, token, logout, loading } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('none'); // 'none', 'price-asc', 'price-desc', 'rating'
  
  // Views: 'shop' or 'orders'
  const [activeView, setActiveView] = useState('shop');
  const [orders, setOrders] = useState([]);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Fetch products
  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Fetch orders when switching to orders view
  useEffect(() => {
    if (user && activeView === 'orders') {
      fetchOrders();
    }
  }, [user, activeView]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/products/orders/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // Cart operations
  const addToCart = (product) => {
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQty = (productId, change) => {
    setCart(cart.map(item => {
      if (item._id === productId) {
        const newQty = item.quantity + change;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  // Order checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const orderItems = cart.map(item => ({
        productId: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      }));

      const res = await fetch(`${API_URL}/products/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          totalAmount: getCartTotal()
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOrderSuccess(data);
        setCart([]);
        setIsCartOpen(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  // Filter and sort products
  const categories = ['All', ...new Set(products.map(p => p.category))];
  
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                            p.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating.rate - a.rating.rate;
      return 0; // none
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-violet-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveView('shop'); setOrderSuccess(null); }}>
            <div className="w-9 h-9 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-violet-400" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AeroShop
            </span>
          </div>

          {/* Search bar */}
          {activeView === 'shop' && (
            <div className="flex-1 max-w-md relative hidden md:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search premium goods..."
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-full pl-10 pr-4 py-1.5 text-sm outline-none transition duration-200 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          )}

          {/* Nav Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveView('shop'); setOrderSuccess(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeView === 'shop' && !orderSuccess
                  ? 'bg-slate-900 border border-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shop
            </button>
            <button
              onClick={() => setActiveView('orders')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeView === 'orders'
                  ? 'bg-slate-900 border border-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Orders
            </button>

            <div className="h-6 w-px bg-slate-800 mx-2"></div>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl cursor-pointer text-slate-300 hover:text-white transition"
            >
              <ShoppingCart className="w-5 h-5" />
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-violet-600 border border-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-bounce">
                  {getCartItemCount()}
                </span>
              )}
            </button>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-3 pl-2">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                alt={user.username}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
              />
              <button
                onClick={logout}
                title="Logout"
                className="p-2.5 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent rounded-xl cursor-pointer text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* SUCCESS CHECKOUT PAGE */}
        {orderSuccess ? (
          <div className="max-w-md mx-auto text-center py-16 px-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl shadow-violet-500/5 animate-fade-in mt-10">
            <div className="inline-flex p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 mb-6">
              <CheckCircle className="w-16 h-16" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Thank you for your purchase. Your order <span className="font-mono text-violet-400">#{orderSuccess._id}</span> has been processed successfully.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { setActiveView('orders'); setOrderSuccess(null); }}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-violet-600/20"
              >
                View Order History
              </button>
              <button
                onClick={() => { setActiveView('shop'); setOrderSuccess(null); }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl transition cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : activeView === 'shop' ? (
          /* SHOPPING VIEW */
          <div>
            {/* Search bar on mobile */}
            <div className="mb-6 relative md:hidden">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-slate-900/60 border border-slate-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition"
              />
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition border ${
                      selectedCategory === cat
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/10'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort controls */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-500 font-medium">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none cursor-pointer focus:border-violet-500 transition"
                >
                  <option value="none">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 border border-slate-900 rounded-2xl">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-300">No products found</h3>
                <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(prod => (
                  <div
                    key={prod._id}
                    className="group bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-xl border border-slate-800/85 hover:border-violet-500/30 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-violet-500/5"
                  >
                    {/* Image block */}
                    <div className="relative pt-[70%] bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(prod)}>
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-1 border border-slate-800 rounded-md text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {prod.category}
                      </span>
                    </div>

                    {/* Description block */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span className="font-semibold text-slate-300">{prod.rating.rate}</span>
                        <span className="text-slate-500 text-[10px] font-normal">({prod.rating.count})</span>
                      </div>
                      
                      <h3 
                        onClick={() => setSelectedProduct(prod)}
                        className="text-base font-bold text-white line-clamp-1 group-hover:text-violet-400 transition cursor-pointer mb-2"
                      >
                        {prod.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                        {prod.description}
                      </p>

                      <div className="mt-auto pt-4 border-t border-slate-850 flex items-center justify-between gap-4">
                        <span className="text-lg font-extrabold text-white">${prod.price.toFixed(2)}</span>
                        <button
                          onClick={() => addToCart(prod)}
                          className="px-3.5 py-2 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-md shadow-violet-600/10 flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ORDERS HISTORY VIEW */
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-violet-400" />
              Your Order History
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl">
                <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-slate-400">No orders placed yet</h3>
                <p className="text-xs text-slate-500 mt-1">Start shopping and place orders to see them here.</p>
                <button
                  onClick={() => setActiveView('shop')}
                  className="mt-5 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-semibold rounded-xl text-white transition cursor-pointer"
                >
                  Browse Store
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map(order => (
                  <div key={order._id} className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    {/* Order header */}
                    <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Order ID</div>
                        <div className="text-sm font-mono text-violet-400 font-semibold">{order._id}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Placed On</div>
                          <div className="text-sm text-slate-350">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status</div>
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {order.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</div>
                          <div className="text-sm font-extrabold text-white">${order.totalAmount.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Order items */}
                    <div className="px-6 py-4 divide-y divide-slate-800/60">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-lg bg-slate-950 border border-slate-850"
                            />
                            <div>
                              <div className="text-sm font-bold text-white line-clamp-1">{item.title}</div>
                              <div className="text-xs text-slate-500">Qty: {item.quantity} • Unit Price: ${item.price.toFixed(2)}</div>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-300">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SHOPPING CART DRAWER (Slide-out panel) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
          ></div>
          
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl shadow-violet-500/5">
              {/* Cart Header */}
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-400 text-sm font-medium">Your cart is empty</p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-xs font-semibold rounded-lg text-white transition cursor-pointer"
                    >
                      Fill it with goods
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item._id} className="flex gap-4 p-3 bg-slate-950/50 border border-slate-850 rounded-xl">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg bg-slate-900 border border-slate-800"
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white line-clamp-1">{item.title}</h4>
                          <span className="text-xs text-slate-500">${item.price.toFixed(2)}</span>
                        </div>
                        {/* Qty selectors */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQty(item._id, -1)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item._id, 1)}
                              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="p-1.5 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-slate-800 bg-slate-950/40 p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Subtotal</span>
                      <span className="text-slate-200">${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-400">
                      <span>Shipping</span>
                      <span className="text-emerald-400 font-medium">Free</span>
                    </div>
                    <div className="border-t border-slate-850 my-2 pt-2 flex justify-between text-base font-extrabold text-white">
                      <span>Total Amount</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-violet-600/10 flex items-center justify-center gap-2"
                  >
                    Place Your Order
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS DIALOG (Modal) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row animate-scale-up">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 bg-slate-950/60 backdrop-blur hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-white transition z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Col: Image */}
            <div className="w-full md:w-1/2 bg-slate-950 flex items-center justify-center relative min-h-[300px] md:min-h-0">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.title}
                className="w-full h-full object-cover max-h-[350px] md:max-h-full"
              />
            </div>

            {/* Right Col: Details */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <span className="inline-block bg-violet-600/15 border border-violet-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-3">
                  {selectedProduct.category}
                </span>
                
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  {selectedProduct.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 text-amber-400 text-xs mb-4">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-slate-200">{selectedProduct.rating.rate}</span>
                  <span className="text-slate-500">({selectedProduct.rating.count} reviews)</span>
                </div>

                <p className="text-xs text-slate-450 leading-relaxed mb-6">
                  {selectedProduct.description}
                </p>
              </div>

              <div className="border-t border-slate-800 pt-5 mt-auto flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Price</span>
                  <span className="text-2xl font-extrabold text-white">${selectedProduct.price.toFixed(2)}</span>
                </div>
                
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-violet-600/10 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add To Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
