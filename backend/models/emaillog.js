// models/emailLog.js
import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserAuth',
    required: false
  },
  email: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'verification_email_sent',
      'verification_email_error',
      'verification_success', 
      'verification_failure',
      'registration_completed',    // Add this
      'login_success',            // Add this
      'login_failure',            // Add this
      'password_reset_requested', // Add this
      'password_reset_completed'  // Add this
    ]
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const EmailLog = mongoose.model('EmailLog', emailLogSchema);
export default EmailLog;