const userModel = require('../models/user.models')
const jwt = require('jsonwebtoken')
const tokenBlacklistModel = require('../models/blacklist.models')

async function authMiddleware(req, res, next){
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]

  if(!token){
    return res.status(401).json({message: "Unauthorized"})
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({token})
  if(isBlacklisted){
    return res.status(401).json({message: "Unauthorized"})
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.id)
    req.user = user
    return next()
  }catch(err){
    return res.status(401).json({message: "Unauthorized"})
  }
}

async function authSystemUserMiddleware(req, res, next){
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]
  if(!token){
    return res.status(401).json({message: "Unauthorized"})
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({token})
  if(isBlacklisted){
    return res.status(401).json({message: "Unauthorized"})
  }

  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.id).select('+systemUser')
    if(!user.systemUser){
      return res.status(403).json({message: "Forbidden"})
    }
    req.user = user
    return next()
  }catch(err){
    return res.status(401).json({message: "Unauthorized"})
  }
}

module.exports = {authMiddleware, authSystemUserMiddleware}