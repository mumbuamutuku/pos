import ProductGrid from '../components/pos/ProductGrid';
import ShoppingCart from '../components/pos/ShoppingCart';
import { useInventory } from '../hooks/useInventory';
import { useState, useEffect } from 'react';
import { createSale } from '../api/pos';

const POSPage = () => {
  const { inventory } = useInventory();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showRefund, setShowRefund] = useState(false); 
  const [discountType, setDiscountType] = useState('percentage'); 
  const [discountValue, setDiscountValue] = useState(0); 
  const [saleNotes, setSaleNotes] = useState(''); 
  
  const addToCart = (item) => {
    if (item.stock <= 0) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      if (existingItem.quantity < item.stock) {
        setCart(cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      }
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }

    //update recent items
    setRecentItems(prev => {
      const newRecent = [item.id, ...prev.filter(id => id !== item.id)].slice(0, 5);
      return newRecent;
    });
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId, change) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        const maxStock = inventory.find(inv => inv.id === itemId)?.stock || 0;
        if (newQuantity <= 0) return null;
        if (newQuantity > maxStock) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountAmount = discountType === 'percentage' 
        ? subtotal * (discountValue / 100) 
        : discountValue;

      const saleData = {
        items: cart.map(item => {
          const itemSubtotal = item.price * item.quantity;
          const itemDiscount = discountAmount * (itemSubtotal / subtotal);
        
          // Calculate discounted price per unit
          const discountedPricePerUnit = (itemSubtotal - itemDiscount) / item.quantity;
        
          return {
            inventory_item_id: item.id,
            quantity: item.quantity,
            price_at_sale: discountedPricePerUnit,
            original_price: item.price,
            discount_applied: itemDiscount
          };
        }),
        total_discount: discountAmount,
        sales_notes: saleNotes,
        total_amount: subtotal - discountAmount
      };
      
      await createSale(saleData);
      
      // Clear cart on successful sale
      setCart([]);
      setDiscountValue(0);
      setSaleNotes('');
      // You might want to refresh inventory here
    } catch (error) {
      console.error("Failed to process sale:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'f1':
          e.preventDefault();
          document.getElementById('search-input')?.focus();
          break;
        case 'f2':
          e.preventDefault();
          setShowDiscount(!showDiscount);
          break;
        case 'f3':
          e.preventDefault();
          if (cart.length > 0) processSale();
          break;
        case 'f4':
          e.preventDefault();
          setCart([]);
          break;
        case 'f5':
          e.preventDefault();
          setShowRefund(true);
          break;
        case 'escape':
          setShowDiscount(false);
          setShowRefund(false);
          break;
        case '+':
          e.preventDefault();
          if (cart.length > 0) {
            const lastItem = cart[cart.length - 1];
            updateCartQuantity(lastItem.id, 1);
          }
          break;
        case '-':
          e.preventDefault();
          if (cart.length > 0) {
            const lastItem = cart[cart.length - 1];
            updateCartQuantity(lastItem.id, -1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart, showDiscount, processSale, updateCartQuantity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ProductGrid 
          inventory={inventory} 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm}
          onAddToCart={addToCart}
          recentItems={recentItems}
        />
      </div>
      <div className="lg:col-span-1">
        <ShoppingCart 
          cart={cart} 
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onProcessSale={processSale}
          isProcessing={isProcessing}
          showDiscount={showDiscount} // Pass these as props
          onToggleDiscount={() => setShowDiscount(!showDiscount)}
          showRefund={showRefund}
          onToggleRefund={setShowRefund}
          discountType={discountType} 
          onDiscountTypeChange={setDiscountType}
          discountValue={discountValue}
          onDiscountValueChange={setDiscountValue}
          saleNotes={saleNotes}
          onSaleNotesChange={setSaleNotes}
        />
      </div>
    </div>
  );
};

export default POSPage;