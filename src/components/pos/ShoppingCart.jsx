import { Plus, Minus, X, ShoppingCart as CartIcon, Percent, DollarSign, Calculator, Undo2, User } from 'lucide-react';
import { useState } from 'react';

const ShoppingCart = ({ 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  onProcessSale,
  isProcessing,
  showDiscount,
  onToggleDiscount,
  showRefund,
  onToggleRefund, 
  discountType, 
  onDiscountTypeChange,
  discountValue,
  onDiscountValueChange,
  saleNotes,
  onSaleNotesChange,
  selectedCustomer
}) => {
  
  // Calculate values needed for display
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = discountType === 'percentage' 
    ? subtotal * (discountValue / 100) 
    : discountValue;
  const taxRate = 16; // Default tax rate (you might want to make this configurable)
  const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
  const total = subtotal - discountAmount + taxAmount;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Shopping Cart ({cart.length})</h2>
      
      {/* Customer Info Display */}
      {selectedCustomer && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <User size={16} className="text-blue-600" />
            <div>
              <p className="font-medium text-sm text-blue-900">{selectedCustomer.name}</p>
              <p className="text-xs text-blue-700">{selectedCustomer.phone}</p>
            </div>
          </div>
        </div>
      )}
      
      {cart.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <CartIcon size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Cart is empty</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between border-b pb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{item.name}</h4>
                  <p className="text-xs text-gray-600">KES {item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 rounded hover:bg-red-100 text-red-600 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount Section */}
          {showDiscount && (
            <div className="p-4 border-t bg-blue-50">
              <h3 className="font-semibold mb-3">Discount</h3>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => onDiscountTypeChange('percentage')}
                  className={`px-3 py-2 rounded text-sm ${
                    discountType === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  <Percent size={14} className="inline mr-1" />
                  %
                </button>
                <button
                  onClick={() => onDiscountTypeChange('fixed')}
                  className={`px-3 py-2 rounded text-sm ${
                    discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                  }`}
                >
                  <DollarSign size={14} className="inline mr-1" />
                  Fixed
                </button>
              </div>
              <input
                type="number"
                placeholder={`Enter ${discountType === 'percentage' ? 'percentage' : 'amount'}`}
                value={discountValue}
                onChange={(e) => onDiscountValueChange(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg mb-2"
              />
              <button
                onClick={() => onToggleDiscount()}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Hide Discount
              </button>
            </div>
          )}
          
          {/* Sale Notes */}
          <div className="p-4 border-t">
            <textarea
              placeholder="Sale notes..."
              value={saleNotes}
              onChange={(e) => onSaleNotesChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={2}
            />
          </div>
          
          {/* Totals Section */}
          {cart.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KES {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Fixed'}):</span>
                    <span>-KES {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>KES {taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>KES {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="p-4 border-t space-y-2">
            <button
              onClick={onToggleDiscount}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              {showDiscount ? 'Hide Discount' : 'Add Discount (F2)'}
            </button>
            
            <button
              onClick={onProcessSale}
              disabled={cart.length === 0 || isProcessing}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold flex items-center justify-center gap-2"
            >
              {isProcessing ? 'Processing...' : 'Complete Sale (F3)'}
            </button>
            
            <button
              onClick={() => onToggleRefund(true)}
              className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2"
            >
              <Undo2 size={16} />
              Process Refund (F5)
            </button>
          </div>
          
          {/* Keyboard Shortcuts Help */}
          <div className="p-3 border-t bg-gray-100 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-1">
              <div>F1: Search</div>
              <div>F2: Discount</div>
              <div>F3: Complete</div>
              <div>F4: Clear Cart</div>
              <div>F5: Refund</div>
              <div>F6: Customer</div>
              <div>+/-: Quantity</div>
              <div>ESC: Cancel</div>
            </div>
          </div>
        </>
      )}
      
      {/* Refund Modal */}
      {showRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Process Refund</h3>
            <p className="text-gray-600 mb-4">Enter sale ID or scan receipt to process refund</p>
            <input
              type="text"
              placeholder="Sale ID"
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onToggleRefund(false)}
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Refund functionality will be implemented');
                  onToggleRefund(false);
                }}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;