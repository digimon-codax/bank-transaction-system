const userModel = require('../models/user.models')
const jwt = require('jsonwebtoken')

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
  return res.status(201).json({message: "User registered successfully",
    user:{
      id: user._id,
      name: user.name,
      email: user.email

    },token
  })
}

  module.exports = {register}