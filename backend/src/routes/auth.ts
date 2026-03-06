import { Router, Request, Response } from 'express';

export const authRouter = Router();

authRouter.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === adminUser && password === adminPass) {
    req.session.authenticated = true;
    req.session.username = username;
    res.json({ message: 'Login successful', username });
    return;
  }

  res.status(401).json({ error: 'Invalid credentials' });
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

authRouter.get('/me', (req: Request, res: Response): void => {
  if (req.session?.authenticated) {
    res.json({ authenticated: true, username: req.session.username });
    return;
  }
  res.status(401).json({ authenticated: false });
});
