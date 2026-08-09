import { Router } from 'express';
import { register, login, getCurrentUser, guestLogin, updateProfile, purchaseNitro, cancelNitro, getNitroStatus } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/guest', guestLogin);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/profile', requireAuth, updateProfile);

// Nitro routes
router.post('/nitro/purchase', requireAuth, purchaseNitro);
router.delete('/nitro', requireAuth, cancelNitro);
router.get('/nitro/status', requireAuth, getNitroStatus);

export default router;
