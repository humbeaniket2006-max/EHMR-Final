const router = require('express').Router();
const auth   = require('../middlewares/auth');
const c      = require('../controllers/noteController');

router.get('/:residentId',  auth, c.getByResident);
router.post('/:residentId', auth, c.create);
router.put('/:id',          auth, c.update);
router.delete('/:id',       auth, c.remove);

module.exports = router;
