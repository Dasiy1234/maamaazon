import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
    // Set CORS headers to allow requests from your domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Handle GET requests - fetch orders for admin panel
    if (req.method === 'GET') {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }

            return res.status(200).json({ orders });
        } catch (err) {
            console.error('Server error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Handle POST requests - authentication or create order
    if (req.method === 'POST') {
        const { action, username, password, orderData } = req.body;

        // Handle login
        if (action === 'login') {
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

        // Handle order creation
        if (action === 'create_order') {
            try {
                const { data: order, error } = await supabase
                    .from('orders')
                    .insert([{
                        minecraft_name: orderData.minecraftName,
                        items: orderData.items,
                        total: orderData.total,
                        status: 'pending'
                    }])
                    .select()
                    .single();

                if (error) {
                    console.error('Supabase error:', error);
                    return res.status(500).json({ error: 'Failed to create order' });
                }

                return res.status(200).json({ 
                    success: true, 
                    message: 'Order created successfully',
                    orderId: order.id
                });
            } catch (err) {
                console.error('Server error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }

        // Handle order status update
        if (action === 'update_order') {
            try {
                const { orderId, status } = req.body;
                
                const { error } = await supabase
                    .from('orders')
                    .update({ status })
                    .eq('id', orderId);

                if (error) {
                    console.error('Supabase error:', error);
                    return res.status(500).json({ error: 'Failed to update order' });
                }

                return res.status(200).json({ success: true, message: 'Order updated successfully' });
            } catch (err) {
                console.error('Server error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
