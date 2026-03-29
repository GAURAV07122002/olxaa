import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    city: '',
    page: 1,
    limit: 12
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/products`,
        { params: filters }
      );
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-semibold">Filters</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Books">Books</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Min Price</label>
                <input
                  type="number"
                  name="minPrice"
                  value={filters.minPrice}
                  onChange={handleFilterChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Max Price</label>
                <input
                  type="number"
                  name="maxPrice"
                  value={filters.maxPrice}
                  onChange={handleFilterChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={filters.city}
                  onChange={handleFilterChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter city"
                />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.condition}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{product.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">No products found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;