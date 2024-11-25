import mongoose from 'mongoose';
import addressSchema from './address.js';

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAuth',
        required: true,
        unique: true,
        index: true
    },
    firstName: {
        type: String,
        trim: true,
        required: [true, 'First name is required'],
        minlength: [2, 'First name must be at least 2 characters long']
    },
    lastName: {
        type: String,
        trim: true,
        required: [true, 'Last name is required'],
        minlength: [2, 'Last name must be at least 2 characters long']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^(09|\+639)\d{9}$/, 'Phone must be a valid Philippine mobile number'],
        required: false
    },
    image: {
        public_id: {
            type: String,
            default: 'default'
        },
        url: {
            type: String,
            default: 'https://res.cloudinary.com/dah5hrzpp/image/upload/v1/ecommerce/defaults/user-default.png'
        }
    },
    primaryAddress: {
        type: addressSchema,
        required: false
    },
    additionalAddresses: {
        type: [addressSchema],
        validate: [arrayLimit, '{PATH} exceeds the limit of 3']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userProfileSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Helper function for limiting addresses
function arrayLimit(val) {
    return val.length <= 3; // Limit additional addresses to 3
}

// Add additional address
userProfileSchema.methods.addAddress = function (newAddress) {
    if (this.additionalAddresses.length >= 3) {
        throw new Error('Maximum of 3 additional addresses allowed');
    }
    this.additionalAddresses.push(newAddress);
    return this.save();
};

// Set primary address
userProfileSchema.methods.setPrimaryAddress = function (addressId) {
    const address = this.additionalAddresses.id(addressId);
    if (!address) throw new Error('Address not found');

    this.primaryAddress = address.toObject();
    this.additionalAddresses.pull(addressId);
    return this.save();
};

// Remove address
userProfileSchema.methods.removeAddress = function (addressId) {
    const addressIndex = this.additionalAddresses.findIndex(
        (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) throw new Error('Address not found');
    
    this.additionalAddresses.splice(addressIndex, 1);
    return this.save();
};

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
export default UserProfile;
