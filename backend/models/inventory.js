// models/inventory.js
import mongoose from "mongoose";
import validator from 'validator';
import xss from 'xss-clean';

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      validate: {
        validator: async function (value) {
          const product = await mongoose.model('Product').findById(value);
          return !!product;
        },
        message: 'Invalid product reference',
      },
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
      validate: {
        validator: async function (value) {
          const supplier = await mongoose.model('Supplier').findById(value);
          return !!supplier;
        },
        message: 'Invalid supplier reference',
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer',
      },
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
      set: (value) => Math.round(value * 100) / 100,
    },
    totalCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      set: function (value) {
        return Math.round(value * 100) / 100;
      },
      get: function () {
        return this.quantity * this.unitPrice;
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      validate: {
        validator: function (value) {
          return validator.isLength(value, { max: 500 });
        },
        message: 'Notes cannot exceed 500 characters',
      },
    },
  },
  { timestamps: true }
);

// Sanitize user input
inventorySchema.pre('save', function (next) {
  this.notes = xss(this.notes);
  next();
});

// Validate quantity and unit price before saving
inventorySchema.pre('save', function (next) {
  if (this.quantity < 0) {
    return next(new Error('Quantity cannot be negative'));
  }
  if (this.unitPrice < 0) {
    return next(new Error('Unit price cannot be negative'));
  }
  next();
});

// Update the product's stock quantity when inventory changes
inventorySchema.post('save', async function () {
  const product = await mongoose.model('Product').findById(this.product);
  if (product) {
    const totalQuantity = await mongoose.model('Inventory').aggregate([
      {
        $match: { product: product._id },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    product.stockQuantity = totalQuantity[0]?.totalQuantity || 0;
    await product.save();
  }
});

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;