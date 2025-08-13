const express = require('express');
const router = express.Router();

// Example test endpoint
router.get('/status', (req, res) => {
  res.json({ status: 'API is working!' });
});

module.exports = router;
