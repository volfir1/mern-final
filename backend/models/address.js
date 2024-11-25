import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
    street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
        minlength: [3, 'Street must be at least 3 characters long']
    },
    barangay: {
        type: String,
        required: [true, 'Barangay is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    province: {
        type: String,
        required: [true, 'Province is required'],
        trim: true
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required'],
        trim: true,
        match: [/^\d{4}$/, 'Postal code must be a valid 4-digit number (e.g., 1234)']
    },
    label: {
        type: String,
        enum: ['Home', 'Work', 'Other'],
        default: 'Home'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    contactPerson: {
        type: String,
        required: [true, 'Contact person is required'],
        trim: true,
        minlength: [2, 'Contact person must be at least 2 characters long']
    },
    contactNumber: {
        type: String,
        required: [true, 'Contact number is required'],
        match: [/^(09|\+639)\d{9}$/, 'Contact number must be a valid Philippine mobile number (e.g., 09123456789)']
    }
}, {
    _id: true,
    timestamps: true
});

// Prevent multiple default addresses
addressSchema.pre('save', async function (next) {
    if (this.isDefault) {
        const existingDefault = await this.constructor.findOne({
            isDefault: true,
            _id: { $ne: this._id }
        });
        if (existingDefault) {
            throw new Error('Only one address can be set as the default');
        }
    }
    next();
});

export default addressSchema;
