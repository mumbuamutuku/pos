import { Search, Zap, Star } from 'lucide-react';
import { useState } from 'react';

const ProductGrid = ({ inventory = [], searchTerm, onSearchChange, onAddToCart, recentItems = [] }) => {
  const filteredInventory = Array.isArray(inventory) 
    ? inventory.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  const categories = ['All', ...new Set(inventory.map(item => item.category))];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favoriteItems, setFavoriteItems] = useState([]);

  const toggleFavorite = (itemId) => {
    setFavoriteItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Recent & Favorite Items */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex gap-6">
          {/* Recent Items */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-orange-500" />
              <h3 className="font-semibold text-sm">Recent Items</h3>
            </div>
            <div className="flex gap-2">
              {recentItems.slice(0, 3).map(itemId => {
                const item = inventory.find(inv => inv.id === itemId);
                if (!item) return null;
                return (
                  <button
                    key={itemId}
                    onClick={() => onAddToCart(item)}
                    className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-xs hover:bg-orange-100 transition-colors"
                  >
                    {item.name.substring(0, 15)}...
                  </button>
                );
              })}
            </div>
          </div>

          {/* Favorite Items */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="text-yellow-500" />
              <h3 className="font-semibold text-sm">Favorites</h3>
            </div>
            <div className="flex gap-2">
              {favoriteItems.slice(0, 3).map(itemId => {
                const item = inventory.find(inv => inv.id === itemId);
                if (!item) return null;
                return (
                  <button
                    key={itemId}
                    onClick={() => onAddToCart(item)}
                    className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs hover:bg-yellow-100 transition-colors"
                  >
                    {item.name.substring(0, 15)}...
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredInventory.map(item => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              item.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'
            }`}
            onClick={() => item.stock > 0 && onAddToCart(item)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.id);
                }}
                className="p-1"
              >
                <Star 
                  size={16} 
                  className={favoriteItems.includes(item.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}
                />
              </button>
            </div>
            <p className="text-gray-600 text-xs mb-2">{item.category}</p>
            <div className="flex justify-between items-center">
              <span className="font-bold text-indigo-600">KES {item.price.toFixed(2)}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                item.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                Stock: {item.stock}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;