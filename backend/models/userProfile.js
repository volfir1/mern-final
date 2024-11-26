  import mongoose from 'mongoose';

  const userProfileSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAuth',
      required: true,
      unique: true
    },
    firstName: {
      type: String,
      trim: true,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Last name is required']
    },
    displayName: {
      type: String,
      trim: true
    },
    phoneNumber: {
      type: String,
      default: null,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please provide a valid phone number']
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters']
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    profileImage: {
      url: String,
      publicId: String,
      path: String
    }
  }, {
    timestamps: true
  });

  userProfileSchema.index({ user: 1 });
  // Pre-save middleware to generate displayName if not provided
  userProfileSchema.pre('save', function(next) {
    if (!this.displayName) {
      this.displayName = `${this.firstName} ${this.lastName}`;
    }
    next();
  });

  const UserProfile = mongoose.model('UserProfile', userProfileSchema);
  export default UserProfile;