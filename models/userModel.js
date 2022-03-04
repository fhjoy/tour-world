const crypto = require('crypto'); // builtin module for encrypting password but not strong as bcrypt
const mongoose = require('mongoose');
const validator = require('validator'); // 3rd pary validator module
const bcrypt = require('bcryptjs'); //3rd party module for encrypting password

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'] // 3rd pary validator for validating email.
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!        like User.Create()/ User.save() in authController module
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {                              // user account is active or not.
    type: Boolean,
    default: true,
    select: false                       // not showing to the user
  }
});

userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12. cost of 12 means 
  this.password = await bcrypt.hash(this.password, 12);// this pointing to current document password. here hash is async so it returns promise and aslo provides a unique string for our password.

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;    // changing the pass one sec before (1 sec in the past) because saving in the database a bit slower than than generating JWT.
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function(                  // Here methods is the instance method which is avaible in all document and it is available in UserSchema.
  candidatePassword,                                 // Here candidatePassword is what user is provind and  userPassword what we hashed before.
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);  // here we decrypting our password that we encrypted before for comparing to userPassword. compare method provies a boolean value.
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {  //changedPasswordAfter instance method availble to every document
  if (this.passwordChangedAt) {
	  // console.log(this.passwordChangedAt,JWTTimestamp)
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,    // making the date and time in seconds because getTime() gives it in miliSeceonds. and JWTTimestamp also gives the time in seconds.
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');// changing the email to hexadecimal string coming from authController.

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);// this.passwordResetToken we will store in the database and resetToken we will send to the user.

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;// expires in milisecs

  return resetToken;
};

const User = mongoose.model('User', userSchema);// its a convention to write model name in uppercase. mongoose.model('User' here User is the name of the model. 

module.exports = User;
