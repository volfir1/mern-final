// Part 1: Imports and Setup
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User, 
  X,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cartApi } from '@/api/cartApi';
import { productApi } from '@/api/productApi';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import { useNavigate } from 'react-router-dom';

// Main Component
const Navbar = () => {
  // States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate(); // Add this at the top with other imports

  // Cart Fetching Logic
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await cartApi.getCart();
      if (response.success) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
    window.addEventListener('cart-updated', fetchCart);
    return () => window.removeEventListener('cart-updated', fetchCart);
  }, []);

  // Cart Update Handler
  const handleUpdateQuantity = async (productId, currentQuantity, change) => {
    console.log('Starting quantity update with cart:', cart);

    const cartItem = cart?.items?.find(item => {
      const itemId = item.product?._id || item.product;
      const searchId = productId?.toString().trim();
      const itemProductId = itemId?.toString().trim();
      
      return itemProductId === searchId;
    });

    if (!cartItem) {
      console.error('Cart item not found:', { productId, cartItems: cart?.items });
      toast.error('Item not found in cart');
      return;
    }

    try {
      setUpdatingItemId(productId);
      const newQuantity = Math.max(1, currentQuantity + change);
      const targetProductId = cartItem.product?._id || cartItem.product;
      
      const response = await cartApi.updateCartItem(targetProductId.toString(), newQuantity);
      
      if (response.success) {
        setCart(response.data);
        toast.success('Cart updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update cart');
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      toast.error(error.message || 'Failed to update quantity');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Remove Item Handler
  const handleRemoveItem = async (productId) => {
    const cartItem = cart?.items?.find(item => {
      const itemId = item.product?._id || item.product;
      const searchId = productId?.toString().trim();
      const itemProductId = itemId?.toString().trim();
      return itemProductId === searchId;
    });

    if (!cartItem) {
      toast.error('Item not found in cart');
      return;
    }

    try {
      setUpdatingItemId(productId);
      const targetProductId = cartItem.product?._id || cartItem.product;
      const response = await cartApi.removeCartItem(targetProductId.toString());
      
      if (response.success) {
        setCart(response.data);
        toast.success('Item removed from cart');
      } else {
        throw new Error(response.message || 'Failed to remove item');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Search functionality
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        if (!query.trim()) {
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        try {
          setIsSearching(true);
          const response = await productApi.searchProducts(query);
          
          if (response.data?.success) {
            setSearchResults(response.data.data || []);
          } else {
            throw new Error(response.data?.message || 'Search failed');
          }
        } catch (error) {
          console.error('Search error:', error);
          toast.error('Failed to search products');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300),
    []
  );

  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSearchResults(true);
    debouncedSearch(query);
  };

  // Click outside handler for search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Continue to Part 2...
  // Part 2: Components and UI Rendering

  // Search Results Component
  const SearchResults = () => (
    showSearchResults && (searchResults.length > 0 || isSearching) && (
      <div className="absolute mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
        {isSearching ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {searchResults.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchQuery('');
                }}
              >
                <div className="flex-shrink-0 w-12 h-12">
                  <img
                    src={product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      e.target.src = '/placeholder.png';
                    }}
                  />
                </div>

                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-gray-500">${product.price?.toFixed(2)}</p>
                </div>

                <div className="ml-4">
                  {product.inStock ? (
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </>
        )}
      </div>
    )
  );

  // Search Bar Component
  const SearchBar = () => (
    <div className="hidden md:flex items-center flex-1 max-w-md mx-4" ref={searchRef}>
      <div className="relative w-full">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInput}
          onFocus={() => setShowSearchResults(true)}
          placeholder="Search products..."
          className="w-full px-4 py-2 pl-10 pr-4 rounded-full border border-gray-300 
                   focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <SearchResults />
      </div>
    </div>
  );

  // Cart Modal Component
  const CartModal = () => (
    <div 
      className={`fixed inset-0 z-50 ${isCartOpen ? 'visible' : 'invisible'}`}
      onClick={() => setIsCartOpen(false)}
    >
      <div className={`fixed inset-0 bg-black transition-opacity duration-300 ${
        isCartOpen ? 'bg-opacity-50' : 'bg-opacity-0'
      }`} />

      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform 
                   transition-transform duration-300 ease-in-out ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Cart Header */}
        <div className="px-4 py-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
            <button 
              onClick={() => setIsCartOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Cart Content */}
        <div className="flex flex-col h-[calc(100vh-180px)] overflow-y-auto">
          {loading && !updatingItemId ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ShoppingCart className="h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="px-4 py-4 space-y-4">
              {cart.items.map((item) => {
                const itemId = item.product?._id || item.product;
                
                return (
                  <div key={itemId} className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200 relative">
                    {updatingItemId === itemId && (
                      <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}

                    <div className="flex-shrink-0 w-20 h-20">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">${item.price?.toFixed(2)}</p>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(itemId, item.quantity, -1);
                          }}
                          disabled={item.quantity <= 1 || updatingItemId === itemId}
                          className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>
                        <span className="text-gray-600 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(itemId, item.quantity, 1);
                          }}
                          disabled={updatingItemId === itemId}
                          className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      <p className="text-sm font-medium text-gray-900 mt-1">
                        Subtotal: ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(itemId);
                      }}
                      disabled={updatingItemId === itemId}
                      className="p-2 hover:bg-gray-100 rounded-full text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cart?.items?.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-medium text-gray-900">
                Total ({cart.itemCount} items)
              </span>
              <span className="text-lg font-semibold text-gray-900">
                ${cart.total?.toFixed(2)}
              </span>
            </div>
            <button 
              onClick={() => {
             
                navigate('/user/checkout'); // Navigate to checkout
              }}
              disabled={loading || updatingItemId}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Main Render
  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-blue-600">Brand</span>
          </Link>

          <div className="hidden md:flex items-center space-x-4">
            <Link to="/user/products" className="text-gray-700 hover:text-blue-600 px-3 py-2">
              Products
            </Link>
            <Link to="/user/profile" className="text-gray-700 hover:text-blue-600 px-3 py-2">
               Your Profile
            </Link>
           
          </div>

          <SearchBar />

          <div className="hidden md:flex items-center space-x-6">
            <button 
              className="relative p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {cart?.itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-full"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                  {/* Profile dropdown content */}
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <button 
              className="relative p-2 hover:bg-gray-100 rounded-full"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart className="h-6 w-6 text-gray-600" />
              {cart?.itemCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-blue-500 rounded-full text-xs text-white flex items-center justify-center">
                  {cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <CartModal />
    </nav>
  );
};

export default Navbar;