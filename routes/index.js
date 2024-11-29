const express = require('express');
const router = express.Router();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/login');
}

// Home route
router.get('/', (req, res) => res.render('sleep-tracking/home')); 

// Benefits route
router.get('/benefits', ensureAuthenticated, (req, res) => res.render('sleep-tracking/benefits')); 

// Negative impacts route
router.get('/negative-impacts', ensureAuthenticated, (req, res) => res.render('sleep-tracking/negative-impacts')); 

// Survey route
router.get('/survey', ensureAuthenticated, (req, res) => res.render('sleep-tracking/survey')); 

// Survey results route (POST)
router.post('/survey-results', ensureAuthenticated, (req, res) => {
    const data = req.body;
    res.render('sleep-tracking/survey-results', { data });
});

module.exports = router;
