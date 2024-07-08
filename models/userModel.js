const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const user = new mongoose.Schema({
    username: {
        type: String,
        minLength: 4,
        required: [true, 'Username is required']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required']
    },
    password: {
        type: String,
        minLength: 5,
        required: [true, 'Password is required']
    },    
})


user.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password,12)
    next()
})

user.methods.checkPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

const User = mongoose.model('User',user);
module.exports = User