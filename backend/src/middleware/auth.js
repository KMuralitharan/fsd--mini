import jwt from 'jsonwebtoken';
import { queryOne } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'englishconnect_super_secret_jwt_token_key_2026';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await queryOne('SELECT id, email, full_name, role, avatar FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user session.' });
    }

    let profile = null;
    if (user.role === 'student') {
      profile = await queryOne('SELECT * FROM student_profiles WHERE user_id = ?', [user.id]);
    }

    req.user = {
      ...user,
      profile
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
  }
  next();
}
