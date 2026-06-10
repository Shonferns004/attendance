import { Router } from 'express';
import { addNgo, listNgos, getNgo, editNgo, removeNgo } from '../controllers/ngoController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateRole('super_admin'));
router.post('/', addNgo);
router.get('/', listNgos);
router.get('/:id', getNgo);
router.put('/:id', editNgo);
router.delete('/:id', removeNgo);

export default router;
