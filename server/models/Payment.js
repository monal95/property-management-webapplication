const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    tenant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaseMonth: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue', 'partial'],
        default: 'pending'
    },
    paymentDate: {
        type: Date,
        default: null
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'cash', 'bank_transfer'],
        default: 'razorpay'
    },
    notes: {
        type: String,
        default: ''
    },
    lateFees: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for better query performance
paymentSchema.index({ tenant: 1, leaseMonth: 1 });
paymentSchema.index({ property: 1, leaseMonth: 1 });
paymentSchema.index({ owner: 1, status: 1 });
paymentSchema.index({ dueDate: 1, status: 1 });

// Virtual for formatted lease month
paymentSchema.virtual('formattedLeaseMonth').get(function() {
    return this.leaseMonth.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    });
});

// Virtual for formatted due date
paymentSchema.virtual('formattedDueDate').get(function() {
    return this.dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
});

// Virtual for days overdue
paymentSchema.virtual('daysOverdue').get(function() {
    if (this.status === 'paid' || this.status === 'partial') return 0;
    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
});

// Virtual for total amount including late fees
paymentSchema.virtual('totalAmountWithFees').get(function() {
    return this.amount + this.lateFees;
});

// Method to calculate late fees
paymentSchema.methods.calculateLateFees = function() {
    if (this.status === 'paid' || this.status === 'partial') return 0;
    
    const daysOverdue = this.daysOverdue;
    if (daysOverdue <= 0) return 0;
    
    // Calculate late fees: 5% of rent amount for each month overdue
    const monthsOverdue = Math.ceil(daysOverdue / 30);
    const lateFeeRate = 0.05; // 5% per month
    this.lateFees = this.amount * lateFeeRate * monthsOverdue;
    this.totalAmount = this.amount + this.lateFees;
    
    return this.lateFees;
};

// Method to mark as paid
paymentSchema.methods.markAsPaid = function(paymentId, signature) {
    this.status = 'paid';
    this.paymentDate = new Date();
    this.razorpayPaymentId = paymentId;
    this.razorpaySignature = signature;
    this.lateFees = 0;
    this.totalAmount = this.amount;
    return this.save();
};

// Static method to generate monthly payments for a lease
paymentSchema.statics.generateMonthlyPayments = async function(tenantId, propertyId, ownerId, startDate, endDate, monthlyRent) {
    const payments = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let currentDate = new Date(start);
    
    while (currentDate <= end) {
        const dueDate = new Date(currentDate);
        dueDate.setDate(dueDate.getDate() + 5); // Due 5 days after lease month starts
        
        const payment = new this({
            tenant: tenantId,
            property: propertyId,
            owner: ownerId,
            leaseMonth: currentDate,
            dueDate: dueDate,
            amount: monthlyRent,
            status: 'pending'
        });
        
        payments.push(payment);
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return this.insertMany(payments);
};

module.exports = mongoose.model('Payment', paymentSchema);
