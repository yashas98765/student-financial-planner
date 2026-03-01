// Placeholder GDPR route
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'GDPR endpoint placeholder' });
});

module.exports = router;
