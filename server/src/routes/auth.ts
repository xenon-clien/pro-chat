import { Router } from 'express';
import { register, login, getCurrentUser, guestLogin } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.get('/me', requireAuth, getCurrentUser);

export default router;
