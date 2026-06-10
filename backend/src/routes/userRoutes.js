import { Router } from 'express';
import { addUser, listUsers, getUser, editUser } from '../controllers/userController.js';
import { authenticateRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateRole('super_admin', 'hoadmin', 'hr'), addUser);
router.get('/', authenticateRole('super_admin', 'hoadmin', 'hr'), listUsers);
router.get('/:id', authenticateRole('super_admin', 'hoadmin', 'hr'), getUser);
router.put('/:id', authenticateRole('super_admin', 'hoadmin'), editUser);

export default router;
