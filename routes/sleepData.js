const express = require('express');
const router = express.Router();
const SleepData = require('../models/SleepData');  // Import the model

const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');  // Redirect to login if not authenticated
};


// Route to display the sleep tracker form
router.get('/tracker', (req, res) => {
    res.render('tracker');  // Render the form to input sleep data
});

// Route to handle adding sleep data
router.post('/add', ensureAuthenticated, (req, res) => {
    const { hours, quality, benefits, negative_impacts, preferred_bedtime, sleep_wake_pattern } = req.body;

    const newSleepData = new SleepData({
        user: req.user._id,
        hours,
        quality,
        benefits,
        negative_impacts,
        preferred_bedtime,
        sleep_wake_pattern
    });

    newSleepData.save()
        .then(() => {
            req.flash('success_msg', 'Sleep data added successfully!');
            res.redirect('/tracker/survey-results');
        })
        .catch((err) => {
            console.log(err);
            req.flash('error_msg', 'Failed to add sleep data.');
            res.redirect('/tracker');
        });
});

// Route to display all sleep data entries
router.get('/sleep-history', ensureAuthenticated, (req, res) => {
    // Fetch all sleep data entries for the logged-in user
    SleepData.find({ user: req.user._id })
        .sort({ date: -1 })  // Sort by date, most recent first
        .then(sleepData => {
            res.render('sleep-history', { userSleepData: sleepData });
        })
        .catch((err) => {
            console.log(err);
            req.flash('error_msg', 'Failed to retrieve sleep data history.');
            res.redirect('/tracker');
        });
});

// Route to display the saved sleep data (survey results page)
router.get('/survey-results', ensureAuthenticated, (req, res) => {
    // Fetch the latest sleep data for the logged-in user
    SleepData.findOne({ user: req.user._id })
        .then(sleepData => {
            if (sleepData) {
                res.render('survey-results', { userSleepData: sleepData });
            } else {
                req.flash('error_msg', 'No sleep data found.');
                res.redirect('/tracker');  // If no data, redirect back to tracker
            }
        })
        .catch((err) => {
            console.log(err);
            req.flash('error_msg', 'Failed to retrieve sleep data.');
            res.redirect('/tracker');  // In case of error, redirect back to tracker
        });
});

module.exports = router;
