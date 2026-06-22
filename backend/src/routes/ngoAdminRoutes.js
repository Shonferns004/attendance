import { Router } from 'express';
import { authenticateRole } from '../middleware/authMiddleware.js';
import {
  getDonors,
  getDonorDetail,
  getFroWorkers,
  createAssignmentHandler,
  getAssignments,
  distributeEqually,
  setTarget,
  getTargets,
  getDashboard,
  getAccountsPending,
  verifyLeadDone,
  getStations,
  saveStationAssignment,
  removeStationAssignment,
  distributeByStation,
  getNewData,
  distributeNewData,
} from '../controllers/ngoAdminController.js';

const router = Router();

router.use(authenticateRole('hoadmin'));

router.get('/dashboard', getDashboard);
router.get('/donors', getDonors);
router.get('/donors/:mobile', getDonorDetail);
router.get('/fro-workers', getFroWorkers);
router.get('/assignments', getAssignments);
router.post('/assignments', createAssignmentHandler);
router.post('/assignments/distribute-equally', distributeEqually);
router.get('/targets', getTargets);
router.post('/targets', setTarget);
router.get('/accounts/pending', getAccountsPending);
router.post('/accounts/:logId/verify', verifyLeadDone);

router.get('/stations', getStations);
router.post('/station-assignments', saveStationAssignment);
router.delete('/station-assignments/:id', removeStationAssignment);
router.post('/station-assignments/distribute', distributeByStation);

router.get('/new-data', getNewData);
router.post('/new-data/distribute', distributeNewData);

export default router;
