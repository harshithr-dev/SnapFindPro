// Google Vision API - Image Analysis
// Vercel Serverless Function

const API_KEY = "AIzaSyC9ql8egyqLWI4xyYO6DpjAlSOy1__MFVE";

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse JSON body (Vercel auto-parses JSON when Content-Type is application/json)
    const body = req.body || {};
    const imageDataUrl = body.image;

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'No image provided. Expected base64 data URL.' });
    }

    // Extract base64 content from data URL (remove "data:image/...;base64," prefix)
    const base64Content = imageDataUrl.split(',')[1];

    if (!base64Content) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL.' });
    }

    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Content },
            features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
          }]
        })
      }
    );

    const visionData = await visionResponse.json();

    if (visionData.error) {
      console.error('Vision API error:', visionData.error);
      return res.status(500).json({ 
        error: 'Vision API error', 
        details: visionData.error.message 
      });
    }

    // Extract label descriptions
    const labels = visionData.responses[0]?.labelAnnotations?.map(
      annotation => annotation.description
    ) || [];

    return res.status(200).json({ labels });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
