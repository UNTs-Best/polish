import { jwtDecode } from 'jwt-decode';
import { createUser, getUserbyEmail, getAllUsers } from '../services/user.service.js';

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

async function upsertUserFromJwt(decoded) {
  const email = decoded?.email;
  if (!email) return null;
  const existing = await getUserbyEmail(email);
  if (existing) return existing;
  return await createUser({ email, password: null });
}

export async function me(req, res) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ message: 'Missing token' });
    const decoded = jwtDecode(token);
    const user = await upsertUserFromJwt(decoded);
    if (!user) return res.status(400).json({ message: 'Unable to resolve user from token' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
}

export async function list(req, res) {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(503).json({ message: 'Database unavailable' });
  }
}


