const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  categoryName: { 
    type: String, 
    required: true,
    minlength: [2, 'Category name must be at least 2 characters long'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: { 
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  icon: { 
    type: String,
    default: 'receipt' // Default icon
  },
  color: { 
    type: String,
    default: '#000000' // Default color
  },
  type: { 
    type: String, 
    enum: ['expense', 'income', 'both'], 
    default: 'expense' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
CategorySchema.index({ userID: 1, categoryName: 1 }, { unique: true });

module.exports = mongoose.model("Category", CategorySchema);
