const router = require('express').Router();
const auth   = require('../middlewares/auth');
const c      = require('../controllers/alertController');

// NOTE: /ack-all must be declared BEFORE /:id to avoid Express matching 'ack-all' as an id param
router.patch('/ack-all',  auth, c.acknowledgeAll);

router.get('/',           auth, c.getAll);
router.post('/',          auth, c.create);
router.patch('/:id/ack',  auth, c.acknowledge);
router.delete('/:id',     auth, c.remove);

module.exports = router;
