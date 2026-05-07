const transactionModel = require('../models/transaction.models')
const ledgerModel = require('../models/ledger.models')
const accountModel = require('../models/account.models') 
const emailService = require('../services/email.services')
const mongoose = require('mongoose')




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
    return res.status(400).json({message: `Insufficient balance in from account. Current balance is ${balance}. Requested amount is ${amount}.`})
  }

  const session = await transactionModel.startSession()
  session.startTransaction()
  const transaction = new transactionModel({
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: 'PENDING'
  })

  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAccount,
    type: 'DEBIT',
    amount,
    transaction: transaction._id
  }], {session})
  
  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    type: 'CREDIT',
    amount,
    transaction: transaction._id
  }], {session})

  transaction.status = 'COMPLETED'
  await transaction.save({session})

  await session.commitTransaction()
  session.endSession()

  await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, fromAcc._id, toAcc._id)

  res.status(201).json({message: "Transaction completed successfully", transaction})

}

async function createInitialFundsTransaction(req, res){
  const{toAccount, amount, idempotencyKey} = req.body

  if(!toAccount || !amount || !idempotencyKey){
    return res.status(422).json({message: "All fields are required"})
  }

  const toAcc = await accountModel.findById(toAccount)
  if(!toAcc){
    return res.status(400).json({message: "Invalid to account ID"})
  }
  const fromAcc = await accountModel.findOne({user: req.user._id})
  if(!fromAcc){
    return res.status(400).json({message: "System account not found for the user"})
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  const transaction = new transactionModel({
    fromAccount: fromAcc._id,
    toAccount,
    amount,
    idempotencyKey,
    status: 'PENDING'
  })
  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAcc._id,
    type: 'DEBIT',
    amount,
    transaction: transaction._id
  }], {session})
  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    type: 'CREDIT',
    amount,
    transaction: transaction._id
  }], {session})
  transaction.status = 'COMPLETED'
  await transaction.save({session})
  await session.commitTransaction()
  session.endSession()
  res.status(201).json({message: "Initial funds transaction completed successfully", transaction})
}

module.exports = {createTransaction, createInitialFundsTransaction}