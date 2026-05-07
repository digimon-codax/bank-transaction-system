const mongoose = require('mongoose')
const ledgerModel = require('./ledger.models')  

const accountSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true                   
  },
  status:{
    type: String,
    enum: {
      values: ['ACTIVE', 'INACTIVE', 'CLOSED'], 
      message: 'Status should be either ACTIVE, INACTIVE or CLOSED',
    },
    default: 'ACTIVE'
  },
  currency:{
    type: String,
    required: [true, 'Currency is required'],
    default: 'INR'
  }
},{timestamps: true})

accountSchema.index({user: 1, status: 1})

accountSchema.methods.getBalance = async function(){
  const balanceAggregate = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ['$type', 'DEBIT'] }, '$amount', 0]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ['$type', 'CREDIT'] }, '$amount', 0]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ['$totalCredit', '$totalDebit'] }
      }
    }
  ])
  if(balanceAggregate.length === 0){
    return 0;
  }
  return balanceAggregate[0].balance;
}

const accountModel = mongoose.model('Account', accountSchema)

module.exports = accountModel