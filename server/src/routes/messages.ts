import { Router } from 'express';
import { getMessages, createMessage } from '../controllers/messages.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/:channelId', getMessages);
router.post('/:channelId', createMessage);

export default router;
