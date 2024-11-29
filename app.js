const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Add bcryptjs to handle password hashing
const SleepData = require('./models/sleepData'); // Include your SleepData model here
const app = express();
const User = require('./models/User'); // Add this line to import the User model

// Passport configuration
require('./config/passport')(passport);

// MongoDB Connection (Replace with your MongoDB connection string)
mongoose.connect('mongodb://localhost:27017/sleep-tracker', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB connection error: ", err));

// Middleware setup
app.use(express.urlencoded({ extended: true }));  // for parsing form data
app.use(express.json()); // for parsing JSON data
app.use(express.static(path.join(__dirname, 'public'))); // Static files
app.set('view engine', 'ejs'); // Use EJS as the view engine
app.set('views', path.join(__dirname, 'views')); // Set views folder path

app.use(session({
    secret: 'secret', // Change this secret in production
    resave: false, // Set to false to prevent resaving the session on every request
    saveUninitialized: false, // Don’t save an uninitialized session
    cookie: { secure: false } // Set to true if you're using HTTPS
}));

// Flash messages middleware (place this before passport and routes)
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global variables for flash messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Routes setup
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');

// Routes for login and registration
app.get('/auth/login', (req, res) => {
    res.render('login', { message: req.flash('error_msg') }); // Show any error messages from flash
});

// Welcome page (after successful login)
app.get('/welcome', (req, res) => {
    if (req.isAuthenticated()) {  // Check if the user is authenticated
        res.render('welcome', { user: req.user }); // Pass req.user to the welcome view
    } else {
        res.redirect('/auth/login');  // If not authenticated, redirect to login
    }
});

// Sleep Tracker - Survey page (input sleep data)
app.get('/tracker', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('tracker');  // Show form for sleep data
    } else {
        req.flash('error_msg', 'Please log in to access the tracker');
        res.redirect('/auth/login');  // If not authenticated, redirect to login
    }
});

// POST route for login
app.post('/auth/login', passport.authenticate('local', {
    successRedirect: '/tracker', // Redirect to sleep tracker page after successful login
    failureRedirect: '/auth/login', // Redirect back to login page on failure
    failureFlash: true  // Enable flash messages for login failure
}));

// Register route (serve register page)
app.get('/auth/register', (req, res) => {
    res.render('register');
});

// Register form submission (save user data and redirect to login)
app.post('/auth/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Validation checks
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, name, email, password, password2 });
    } else {
        // Check if user exists
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'Email is already registered' });
                res.render('register', { errors, name, email, password, password2 });
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                });

                // Hash password before saving
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                req.flash('success_msg', 'You are now registered and can log in');
                                res.redirect('/auth/login');
                            })
                            .catch(err => {
                                console.log(err);
                                res.render('register', { errors: [{ msg: 'Error saving user' }] });
                            });
                    });
                });
            }
        });
    }
});

// Logout route
app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/auth/login');
    });
});

// Sleep Tracker - Survey page (input sleep data)
app.get('/tracker', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('tracker');  // Show form for sleep data
    } else {
        res.redirect('/auth/login');
    }
});

app.post('/tracker', (req, res) => {
    if (!req.user || !req.user._id) {
        req.flash('error_msg', 'You must be logged in to save sleep data.');
        return res.redirect('/login'); // Redirect to login if user is not authenticated
    }

    const { hours, quality, benefits, negative_impacts, preferred_bedtime, sleep_wake_pattern } = req.body;

    const sleepData = new SleepData({
        user: req.user._id,
        hours,
        quality,
        benefits,
        negative_impacts,
        preferred_bedtime,
        sleep_wake_pattern
    });

    sleepData.save()
        .then(() => {
            req.flash('success_msg', 'Sleep data saved successfully!');
            res.redirect('/tracker/survey-results');
        })
        .catch(err => {
            req.flash('error_msg', 'Error saving sleep data');
            console.error(err);
            res.redirect('/tracker');
        });
});

// Benefits page (show benefits of sleep)
app.get('/tracker/benefits', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('benefits', { user: req.user });  // Pass the 'user' object to the view
    } else {
        res.redirect('/auth/login');  // Redirect if not authenticated
    }
});

// Negative Impacts page (show negative impacts of poor sleep)
app.get('/tracker/negative-impacts', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('negative-impacts');  // Show negative impacts page
    } else {
        res.redirect('/auth/login');
    }
});

app.get('/tracker/survey-results', (req, res) => {
    if (req.isAuthenticated()) {
        // Retrieve the latest sleep data for the logged-in user
        SleepData.findOne({ user: req.user._id }).sort({ createdAt: -1 }).limit(1)
            .then(userSleepData => {
                res.render('survey-results', { 
                    user: req.user, 
                    userSleepData: userSleepData, 
                    title: 'Survey Results',
                    content: `<h2>Survey Results</h2>
                              <ul>
                                  <li><strong>Hours of Sleep:</strong> ${userSleepData.hours} hours</li>
                                  <li><strong>Sleep Quality:</strong> ${userSleepData.quality}</li>
                                  <li><strong>Benefits of Sleep:</strong> ${userSleepData.benefits}</li>
                                  <li><strong>Negative Impacts of Poor Sleep:</strong> ${userSleepData.negative_impacts}</li>
                                  <li><strong>Preferred Bedtime:</strong> ${userSleepData.preferred_bedtime}</li>
                                  <li><strong>Sleep/Wake Pattern:</strong> ${userSleepData.sleep_wake_pattern}</li>
                              </ul>
                              <a href="/tracker" class="btn btn-primary">Back to Tracker</a>` 
                });
            })
            .catch(err => {
                req.flash('error_msg', 'Error retrieving sleep data');
                res.redirect('/tracker');
            });
    } else {
        res.redirect('/auth/login');
    }
});

// Use routes
app.use('/', indexRouter); // All routes for sleep tracking
app.use('/auth', authRouter); // All routes for authentication

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
