const router = require('express').Router();
const auth   = require('../middlewares/auth');
const c      = require('../controllers/carePlanController');

router.get('/:residentId', auth, c.getByResident);
router.put('/:residentId', auth, c.upsert);

module.exports = router;
