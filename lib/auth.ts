import jwt from 'jsonwebtoken';

export async function verifyJWT(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' };
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { username: string; [key: string]: unknown };
    return { valid: true, user: decoded };
  } catch (err) {
    console.error('Token verification failed:', err);
    return { valid: false, error: 'Invalid token' };
  }
}
