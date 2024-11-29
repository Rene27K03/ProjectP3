const mongoose = require('mongoose');

const SurveySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  answers: [
    {
      question: String,
      answer: String,
    },
  ],
});

module.exports = mongoose.model('Survey', SurveySchema);
