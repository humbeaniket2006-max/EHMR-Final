const router = require('express').Router();
const auth   = require('../middlewares/auth');
const c      = require('../controllers/emarController');

router.get('/:residentId',                       auth, c.getByResident);
router.post('/:residentId',                      auth, c.create);
router.patch('/:medId/doses/:doseId/administer', auth, c.administerDose);
router.put('/:id',                               auth, c.update);
router.delete('/:id',                            auth, c.remove);

module.exports = router;
