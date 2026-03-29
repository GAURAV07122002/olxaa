const Product = require('../models/Product');
const User = require('../models/User');

// @desc Create Product
// @route POST /api/products
// @access Private
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, category, subcategory, images, thumbnail, condition, location, city, state, zipCode, tags } = req.body;

    // Validation
    if (!title || !description || !price || !category || !images || !thumbnail || !condition || !location || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const seller = await User.findById(req.user.id);

    const product = await Product.create({
      title,
      description,
      price,
      category,
      subcategory,
      images,
      thumbnail,
      condition,
      location,
      city,
      state,
      zipCode,
      seller: req.user.id,
      sellerName: `${seller.firstName} ${seller.lastName}`,
      sellerRating: seller.rating,
      tags: tags || []
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get All Products with Filters
// @route GET /api/products
// @access Public
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, city, condition, sort, page = 1, limit = 10 } = req.query;
    
    let filter = { status: 'active' };

    if (category) filter.category = category;
    if (city) filter.city = city;
    if (condition) filter.condition = condition;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let query = Product.find(filter);

    // Sorting
    if (sort) {
      const sortBy = sort.split('-').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(Number(limit));

    const products = await query.populate('seller', 'firstName lastName profilePicture rating');
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get Single Product
// @route GET /api/products/:id
// @access Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'firstName lastName profilePicture rating phone');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    await product.incrementViews();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Update Product
// @route PUT /api/products/:id
// @access Private
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Delete Product
// @route DELETE /api/products/:id
// @access Private
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await Product.findByIdAndRemove(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Search Products
// @route GET /api/products/search?q=keyword
// @access Public
exports.searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    const skip = (page - 1) * limit;

    const products = await Product.find(
      { $text: { $search: q }, status: 'active' },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(Number(limit))
      .populate('seller', 'firstName lastName profilePicture rating');

    const total = await Product.countDocuments({ $text: { $search: q }, status: 'active' });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get User Products
// @route GET /api/products/user/:userId
// @access Public
exports.getUserProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({ seller: req.params.userId, status: 'active' })
      .skip(skip)
      .limit(Number(limit))
      .sort('-createdAt');

    const total = await Product.countDocuments({ seller: req.params.userId, status: 'active' });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pages: Math.ceil(total / limit),
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};