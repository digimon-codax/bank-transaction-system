const accountModel = require('../models/account.models')

async function createAccount(req, res){
  const user = req.user
  const account = await accountModel.create({
    user: user._id
  })

  res.status(201).json({message: "Account created successfully",account})

}

async function getUserAccounts(req, res){
  const user = req.user
  const accounts = await accountModel.find({user: user._id})
  res.status(200).json({accounts})
}


module.exports = {createAccount, getUserAccounts}