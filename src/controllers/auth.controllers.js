const userModel = require('../models/user.models')
const jwt = require('jsonwebtoken')
const emailService = require('../services/email.services')  
const tokenBlacklistModel = require('../models/blacklist.models')

async function register(req, res){
  const {email, name, password} = req.body
  const userExists = await userModel.findOne({email: email})

  if(userExists){
    return res.status(422).json({message: "User already exists"})
  }

  const user = await userModel.create({
    email,
    name,
    password
  })

  const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
  res.cookie('token', token)
  

  res.status(201).json({message: "User registered successfully",
    user:{
      id: user._id,
      name: user.name,
      email: user.email

    },token
  })
  await emailService.sendRegistrationEmail(user.email, user.name)
}

async function login(req, res){
  const {email, password} = req.body
  const user = await userModel.findOne({email}).select('+password')

  if(!user){
    return res.status(401).json({message: "Invalid email or password"})
  }

  const isPasswordValid = await user.comparePassword(password)

  if(!isPasswordValid){
    return res.status(401).json({message: "Invalid email or password"})
  }

  const token = jwt.sign({id: user._id}, process.env.JWT_SECRET)
  res.cookie('token', token)
  return res.status(200).json({message: "User logged in successfully",
    user:{
      id: user._id,
      name: user.name,
      email: user.email

    },token
  })
}

async function logout(req, res){
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1]
  if(!token){
    return res.status(400).json({message: "Unauthorized"})
  }

  await tokenBlacklistModel.create({token})
  res.clearCookie('token')
  return res.status(200).json({message: "User logged out successfully"})
}

  module.exports = {register, login, logout}