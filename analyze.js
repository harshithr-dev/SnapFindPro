const fetch = require('node-fetch');

const API_KEY = "AIzaSyC9ql8egyqLWI4xyYO6DpjAlSOy1__MFVE"; // ← YOUR KEY HERE

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fix: Vercel now uses req.body directly for FormData
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'No image data' });
    }

    // Parse multipart form data manually (Vercel fix)
    const buffer = req.body;
    
    // Simple base64 conversion from buffer
    const base64Image = buffer.toString('base64');
    
    if (!base64Image || base64Image.length < 100) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // Google Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
    
    const visionRequest = {
      requests: [{
        image: { content: base64Image },
        features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
      }]
    };

    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visionRequest),
    });

    const visionData = await visionResponse.json();

    if (visionData.error) {
      console.error('Vision API Error:', visionData.error);
      return res.status(500).json({ 
        error: 'Vision API failed', 
        details: visionData.error.message 
      });
    }

    const labels = visionData.responses[0]?.labelAnnotations?.map(item => item.description.toLowerCase()) || [];

    return res.status(200).json({ labels });

  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
