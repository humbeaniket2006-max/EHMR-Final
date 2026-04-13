const router = require('express').Router();
const auth   = require('../middlewares/auth');
const c      = require('../controllers/vitalController');

router.get('/:residentId',  auth, c.getByResident);
router.post('/:residentId', auth, c.create);
router.delete('/:id',       auth, c.remove);

module.exports = router;
