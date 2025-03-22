const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    userName : {type: String, required: true, unique: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    fullName: {type :String, required: true},
    dateOfBirth: {type: Date, required: true},
    phoneNumber: {type: String, required: true},
    address: {type: String, required: true},
});


module.exports = mongoose.model("User", UserSchema);