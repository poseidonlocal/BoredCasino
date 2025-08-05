export default function handler(req, res) {
  // Get IP address from various possible headers
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;
  
  let ip = 'unknown';
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    ip = forwarded.split(',')[0].trim();
  } else if (realIP) {
    ip = realIP;
  } else if (remoteAddress) {
    ip = remoteAddress;
  }
  
  // Clean up IPv6 localhost
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  res.status(200).json({ ip });
}