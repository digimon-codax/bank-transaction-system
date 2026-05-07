const transactionModel = require('../models/transaction.models')
const ledgerModel = require('../models/ledger.models')
const accountModel = require('../models/account.models') 
const emailService = require('../services/email.services')
  




async function createTransaction(req, res){
  const{fromAccount, toAccount, amount, idempotencyKey} = req.body

  if(!fromAccount || !toAccount || !amount || !idempotencyKey){
    return res.status(422).json({message: "All fields are required"})
  }

  const fromAcc = await accountModel.findById(fromAccount)
  const toAcc = await accountModel.findById(toAccount)

  if(!fromAcc || !toAcc){
    return res.status(400).json({message: "Invalid account IDs"})
  }

  const isTransactionAlreadyExists = await transactionModel.findOne({idempotencyKey: idempotencyKey})

  if(isTransactionAlreadyExists){
    if(isTransactionAlreadyExists.status === 'COMPLETED'){
      return res.status(200).json({message: "Transaction already completed", transaction: isTransactionAlreadyExists})
    }
    if(isTransactionAlreadyExists.status === 'PENDING'){
      return res.status(200).json({message: "Transaction is pending", transaction: isTransactionAlreadyExists})
    }
    if(isTransactionAlreadyExists.status === 'FAILED'){
      return res.status(500).json({message: "Transaction already failed", transaction: isTransactionAlreadyExists})
    }
    if(isTransactionAlreadyExists.status === 'REVERSED'){
      return res.status(500).json({message: "Transaction already reversed", transaction: isTransactionAlreadyExists})
    }

  }
  if(fromAcc.status !== 'ACTIVE' || toAcc.status !== 'ACTIVE'){
    return res.status(400).json({message: "Both accounts must be active"})
  }

  const balance = await fromAcc.getBalance()

  if(balance < amount){
    return res.status(400).json({message: 'Insufficient balance in from account. Current balance is ${balance}. Requested amount is ${amount}.'})
  }
}