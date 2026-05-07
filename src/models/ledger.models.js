const mongoose = require('mongoose')

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required'],
    index: true,
    immutable: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required for ledger entry'],
    min: [0, 'Amount must be positive'],
    immutable: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: [true, 'Transaction is required for ledger entry'],
    index: true,
    immutable: true
  },
  type: {
    type: String,
    enum: {
      values: ['DEBIT', 'CREDIT'],
      message: 'Type should be either DEBIT or CREDIT',
    },
    required: [true, 'Type is required for ledger entry'],
    immutable: true
  },


})

function preventLedegerModification() {
  throw new Error('Ledger entries cannot be modified or deleted')
}

ledgerSchema.pre('findOneAndUpdate', preventLedegerModification)
ledgerSchema.pre('updateOne', preventLedegerModification)
ledgerSchema.pre('deleteOne', preventLedegerModification)
ledgerSchema.pre('deleteMany', preventLedegerModification)
ledgerSchema.pre('remove', preventLedegerModification)
ledgerSchema.pre('updateMany', preventLedegerModification)
ledgerSchema.pre('findOneAndDelete', preventLedegerModification)
ledgerSchema.pre('findOneAndReplace', preventLedegerModification)

const ledgerModel = mongoose.model('Ledger', ledgerSchema)

module.exports = ledgerModel