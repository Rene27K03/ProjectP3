// routes/sleepData.js
const express = require('express');
const router = express.Router();
const SleepData = require('../models/SleepData');  // Import the model

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
            res.redirect('/tracker');
        })
        .catch((err) => {
            console.log(err);
            res.flash('error_msg', 'Failed to add sleep data.');
            res.redirect('/tracker');
        });
});

module.exports = router;
