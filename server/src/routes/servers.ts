import { Router } from 'express';
import { 
  initServers, createServer, createChannel, getServerMembers, 
  updateServer, updateMemberRole, deleteServer 
} from '../controllers/servers.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);
router.get('/init', initServers);
router.post('/', createServer);
router.patch('/:serverId', updateServer);
router.delete('/:serverId', deleteServer);
router.post('/:serverId/channels', createChannel);
router.get('/:serverId/members', getServerMembers);
router.patch('/:serverId/members/:memberId/role', updateMemberRole);

export default router;
