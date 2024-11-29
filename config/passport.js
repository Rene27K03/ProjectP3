const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path if needed

module.exports = function(passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email' // Define usernameField if needed
    }, (email, password, done) => {
        // Check if user exists
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'Email is not registered' });
                }

                // Compare entered password with stored hash
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        return done(null, user); // If password matches, return user
                    } else {
                        return done(null, false, { message: 'Incorrect password' });
                    }
                });
            })
            .catch(err => console.log(err));
    }));

    // Serialize user into session
    passport.serializeUser((user, done) => {
        console.log("User serialized:", user.id); // For debugging
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser((id, done) => {
        User.findById(id)
            .then(user => {
                console.log("User deserialized:", user); // For debugging
                done(null, user);
            })
            .catch(err => console.log(err));
    });
};