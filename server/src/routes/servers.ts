import { Router } from 'express';
import { initServers, createServer } from '../controllers/servers.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/init', initServers);
router.post('/', createServer);

export default router;
