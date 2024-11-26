import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userAuthSchema = new mongoose.Schema({
  // Existing fields with some optimizations
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Please provide a valid email'],
    index: true // Explicit index since this is frequently queried
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false,
  },
  firebaseUid: {
    type: String,
    sparse: true,
    unique: true,
    index: true
  },
  provider: {
    type: String,
    enum: ['local', 'firebase', 'google', 'both'],
    default: 'local',
    index: true // Add index as this might be used for filtering
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'deleted', 'suspended'],  // Added 'pending'
    default: 'pending',  // Changed default to 'pending'
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },
  // Authentication related fields
  tokenVersion: {
    type: String,
    default: () => crypto.randomBytes(8).toString('hex')
  },
  refreshToken: {
    type: String,
    select: false
  },
  // Profile reference
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    // required: true // Make this required since we're auto-creating profiles
  },
  // Verification and security
  verifiedAt: Date,
  verificationLockUntil: Date,
  lastVerificationEmailSent: Date,
  passwordChangedAt: Date,
  lastLogin: Date,
  lastLogout: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound indexes for common queries
userAuthSchema.index({ email: 1, status: 1 });
userAuthSchema.index({ firebaseUid: 1, status: 1 });
userAuthSchema.index({ provider: 1, status: 1 });

// Virtual for account status
userAuthSchema.virtual('accountStatus').get(function() {
  if (!this.isActive) return 'inactive';
  if (this.status === 'pending') return 'pending_verification';
  if (this.status !== 'active') return this.status;
  if (!this.isEmailVerified) return 'unverified';
  return 'active';
});

// Improved password comparison with error handling
userAuthSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!candidatePassword) return false;
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Improved verification methods
userAuthSchema.methods.canAttemptVerification = function() {
  if (!this.verificationLockUntil) return true;
  return Date.now() > this.verificationLockUntil.getTime();
};

userAuthSchema.methods.activateAccount = async function() {
  this.status = 'active';
  this.isEmailVerified = true;
  this.verifiedAt = new Date();
  await this.save();
  return this;
};
userAuthSchema.methods.markEmailAsVerified = async function() {
  this.isEmailVerified = true;
  this.verifiedAt = new Date();
  this.verificationLockUntil = null;
  await this.save();
  return this;
};

// Password reset token with improved security
userAuthSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  return resetToken;
};

// Pre-save middleware with improved error handling
userAuthSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) return next();

    // Password validation regex - matches your password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
    
    if (!passwordRegex.test(this.password)) {
      throw new Error('Password must contain at least one uppercase letter, lowercase letter, number, and special character');
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    if (!this.isNew) {
      this.passwordChangedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Improved query middleware
userAuthSchema.pre(/^find/, function(next) {
  if (!this._conditions.includeDeleted) {
    this.find({ status: { $ne: 'deleted' } });
  }
  next();
});

// Static method to find active user
userAuthSchema.statics.findActiveUser = function(email) {
  return this.findOne({
    email,
    status: 'active',
    isActive: true
  });
};

const UserAuth = mongoose.model('UserAuth', userAuthSchema);
export default UserAuth;