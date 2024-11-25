import mongoose from 'mongoose';
import argon2 from 'argon2';
import crypto from 'crypto';

const userAuthSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Ensure password is not fetched by default
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
    },
    tokenVersion: {
      type: String,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    refreshToken: String,
    refreshTokenExpires: Date,
    fcmToken: String,
    fcmTokenUpdatedAt: Date,
    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastActivityAt: Date,
    deactivatedAt: Date,
    deactivationReason: String,
    displayName: String,
    photoURL: String,
    metadata: {
      lastSignInTime: Date,
      creationTime: Date,
      lastRefreshTime: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for user profile
userAuthSchema.virtual('profile', {
  ref: 'UserProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Indexes for faster lookups
userAuthSchema.index({ email: 1 });
userAuthSchema.index({ firebaseUid: 1 });
userAuthSchema.index({ verificationToken: 1 });
userAuthSchema.index({ resetPasswordToken: 1 });
userAuthSchema.index({ 'metadata.lastSignInTime': -1 });

// Update the password hashing middleware to use Argon2
userAuthSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // Argon2id with recommended parameters
    this.password = await argon2.hash(this.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 4,
      hashLength: 32
    });
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware to update last activity
userAuthSchema.pre('save', function (next) {
  this.lastActivityAt = new Date();
  next();
});

// Methods
userAuthSchema.methods = {
  // Match password method using Argon2
  matchPassword: async function (enteredPassword) {
    try {
      return await argon2.verify(this.password, enteredPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  },

  // Verify password with debug logs
  verifyPasswordDebug: async function (enteredPassword) {
    try {
      console.log('Starting password verification debug...');
      
      // Generate a new test hash
      const testHash = await argon2.hash(enteredPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        hashLength: 32
      });

      // Verify the password
      const isValid = await argon2.verify(this.password, enteredPassword);

      // Log debug information
      console.log('Debug Info:');
      console.log('Entered Password Length:', enteredPassword.length);
      console.log('Stored Hash Length:', this.password.length);
      console.log('Stored Hash Prefix:', this.password.substring(0, 50));
      console.log('Generated Test Hash Prefix:', testHash.substring(0, 50));
      console.log('Passwords Match:', isValid);

      return {
        isValid,
        enteredPasswordLength: enteredPassword.length,
        storedHashLength: this.password.length,
        hashPrefix: this.password.substring(0, 50),
        testHashPrefix: testHash.substring(0, 50),
        passwordsMatch: isValid,
      };
    } catch (error) {
      console.error('Debug verification error:', error);
      throw error;
    }
  },

  // Generate verification token
  generateVerificationToken: function () {
    this.verificationToken = crypto.randomBytes(32).toString('hex');
    this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return this.verificationToken;
  },

  // Generate password reset token
  generateResetPasswordToken: function () {
    this.resetPasswordToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    return this.resetPasswordToken;
  },

  // Increment login attempts
  incrementLoginAttempts: function () {
    if (this.lockUntil && this.lockUntil < Date.now()) {
      this.loginAttempts = 1;
      this.lockUntil = undefined;
    } else {
      this.loginAttempts += 1;
      if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      }
    }
    return this.save();
  },

  // Check if account is locked
  isLocked: function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  },
};

// Statics for reusable queries
userAuthSchema.statics = {
  findActiveByEmail: function (email) {
    return this.findOne({ email: email.toLowerCase(), isActive: true });
  },
  findByVerificationToken: function (token) {
    return this.findOne({ verificationToken: token, verificationTokenExpires: { $gt: Date.now() } });
  },
  findByResetToken: function (token) {
    return this.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
  },
};

// Create and export the model
const UserAuth = mongoose.model('UserAuth', userAuthSchema);
export default UserAuth;