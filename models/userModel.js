const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const user = new mongoose.Schema({
    username: {
        type: String,
        minLength: 4,
        maxLength: 16,
        required: [true, 'Username is required']
    },
    password: {
        type: String,
        minLength: 5,
        required: [true, 'Password is required']
    },
    clientID: String,
    clientSecret: String
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