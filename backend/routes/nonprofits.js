const express = require('express');
const router = express.Router();
const Nonprofit = require('../models/Nonprofit');

// Get all nonprofits
router.get('/', async (req, res) => {
  try {
    const nonprofits = await Nonprofit.find();
    res.json(nonprofits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register a new nonprofit
router.post('/register', async (req, res) => {
  try {
    const newNonprofit = new Nonprofit(req.body);
    await newNonprofit.save();
    res.status(201).json(newNonprofit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get nonprofit by ID
router.get('/:id', async (req, res) => {
  try {
    const nonprofit = await Nonprofit.findById(req.params.id);
    if (!nonprofit) return res.status(404).json({ error: 'Not found' });
    res.json(nonprofit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update nonprofit by ID
router.put('/:id', async (req, res) => {
  try {
    const nonprofit = await Nonprofit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!nonprofit) return res.status(404).json({ error: 'Not found' });
    res.json(nonprofit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete nonprofit by ID
router.delete('/:id', async (req, res) => {
  try {
    const result = await Nonprofit.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Nonprofit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
