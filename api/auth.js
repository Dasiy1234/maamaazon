export default async function handler(req, res) {
    // Set CORS headers to allow requests from your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { username, password } = req.body;

    // Get credentials from environment variables
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    // Check if environment variable is set
    if (!ADMIN_PASSWORD) {
        console.error('ADMIN_PASSWORD environment variable not set');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Validate credentials
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        return res.status(200).json({ success: true, message: 'Authentication successful' });
    } else {
        // Add a small delay to prevent brute force attacks
        await new Promise(resolve => setTimeout(resolve, 1000));
        return res.status(401).json({ error: 'Invalid credentials' });
    }
}