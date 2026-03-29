const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a product title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters'],
    index: 'text'
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
    index: 'text'
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Electronics',
      'Furniture',
      'Fashion',
      'Books',
      'Sports',
      'Toys',
      'Home',
      'Services',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    maxlength: [50, 'Subcategory cannot be more than 50 characters']
  },
  images: [{
    type: String,
    required: [true, 'Please provide at least one image']
  }],
  thumbnail: {
    type: String,
    required: [true, 'Please provide a thumbnail image']
  },
  condition: {
    type: String,
    required: [true, 'Please provide product condition'],
    enum: ['New', 'Like New', 'Good', 'Fair', 'Used']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  city: {
    type: String,
    required: [true, 'Please provide a city']
  },
  state: {
    type: String,
    required: [true, 'Please provide a state']
  },
  zipCode: {
    type: String,
    required: [true, 'Please provide a zip code']
  },
  seller: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  sellerName: String,
  sellerRating: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'inactive'],
    default: 'active'
  },
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Text search index
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, city: 1 });
productSchema.index({ price: 1 });

// Increment views
productSchema.methods.incrementViews = async function() {
  this.views += 1;
  return await this.save();
};

module.exports = mongoose.model('Product', productSchema);