import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  company: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  url: { type: String, required: true },
  status: {
    type: String,
    enum: ['Applied', 'In Review', 'Interview', 'Offer', 'Rejected', 'Withdrawn'],
    default: 'Applied',
  },
  source: {
    type: String,
    enum: ['LinkedIn', 'Naukri', 'Internshala', 'Wellfound', 'Greenhouse', 'Lever', 'Manual'],
    default: 'Manual',
  },
  appliedAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  notes: { type: String, default: '', maxlength: 2000 },
  staleSent: { type: Boolean, default: false },
});

JobSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

JobSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastUpdated: new Date() });
  next();
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema);
