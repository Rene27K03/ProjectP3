const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { check, validationResult } = require('express-validator'); // Ensure you have express-validator installed

// Login Page
router.get('/login', (req, res) => {
    res.render('authentication/login', { 
        success_msg: req.flash('success_msg'), 
        error_msg: req.flash('error_msg') 
    });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('authentication/register', { 
        success_msg: req.flash('success_msg'), 
        error_msg: req.flash('error_msg') 
    });
});

// Register Logic
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.render('authentication/register', {
            errors, 
            name,
            email,
            password,
            password2
        });
    }

    User.findOne({ email: email }).then(user => {
        if (user) {
            errors.push({ msg: 'Email is already registered' });
            return res.render('authentication/register', { 
                errors, 
                name,
                email,
                password,
                password2
            });
        } else {
            const newUser = new User({
                name,
                email,
                password
            });

            newUser.save()
                .then(user => {
                    req.flash('success_msg', 'You are now registered and can log in');
                    res.redirect('/auth/login');
                })
                .catch(err => console.log(err));
        }
    });
});


// Login Logic
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, next);
});

// Logout Logic
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
});

module.exports = router;
