const fetch = require('node-fetch');

const API_KEY = "AIzaSyC9ql8egyqLWI4xyYO6DpjAlSOy1__MFVE";

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Google Vision API request
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
    
    const visionRequest = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'LABEL_DETECTION',
          maxResults: 10
        }]
      }]
    };

    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest),
    });

    const visionData = await visionResponse.json();

    if (visionData.error) {
      console.error('Vision API Error:', visionData.error);
      return res.status(500).json({ error: 'Image analysis failed' });
    }

    // Extract labels
    const labels = visionData.responses[0]?.labelAnnotations?.map(item => item.description) || [];

    res.status(200).json({ 
      labels: labels.map(label => label.toLowerCase()) 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};