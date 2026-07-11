import jwt from 'jsonwebtoken';

export async function verifyJWT(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { valid: false, error: 'No token provided' };
  }
  
  const token = authHeader.substring(7);
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET environment variable is not set');
    return { valid: false, error: 'Server misconfiguration' };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { username: string; [key: string]: unknown };
    return { valid: true, user: decoded };
  } catch (err) {
    console.error('Token verification failed:', err);
    return { valid: false, error: 'Invalid token' };
  }
}
