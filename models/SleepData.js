// models/SleepData.js
const mongoose = require('mongoose');

// Define the SleepData schema
const SleepDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // References the User model
        required: true
    },
    hours: {
        type: Number,
        required: true,
        min: 0,
        max: 24  // Validates that the hours are between 0 and 24
    },
    quality: {
        type: String,
        enum: ['Good', 'Fair', 'Poor'],  // Enum ensures only these values can be chosen
        required: true
    },
    benefits: {
        type: [String],  // Array of benefits (e.g., 'Improved memory', 'Increased productivity')
        required: true
    },
    negative_impacts: {
        type: [String],  // Array of negative impacts (e.g., 'Increased stress', 'Weight gain')
        required: true
    },
    date: {
        type: Date,
        default: Date.now  // Automatically set the date when the entry is created
    },
    preferred_bedtime: {  // This is the new field for Preferred Bedtime
        type: String,
        required: true
    },
    sleep_wake_pattern: {  // This is the new field for Sleep/Wake Pattern
        type: String,
        required: true
    }
});

// Create the model based on the schema
const SleepData = mongoose.model('SleepData', SleepDataSchema);

// Export the model to use in other parts of the app
module.exports = SleepData;
