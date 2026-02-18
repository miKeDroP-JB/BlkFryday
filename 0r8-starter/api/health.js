/**
 * Health check endpoint for 0r8-starter
 * GET /api/health
 */

export default function handler(req, res) {
    res.status(200).json({
        status: 'alive',
        service: '0r8-starter',
        version: '1.0.0',
        mode: process.env.ORB_MODE || 'serverless',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
}
