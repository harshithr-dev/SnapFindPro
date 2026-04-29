// /api/analyze.js - VERCEL 2024 COMPATIBLE
import { IncomingForm } from 'formidable';
import fs from 'fs';
import fetch from 'node-fetch';

const API_KEY = "AIzaSyC9ql8egyqLWI4xyYO6DpjAlSOy1__MFVE"; // ← YOUR KEY HERE!

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  try {
    // Parse form data with formidable (Vercel compatible)
    const form = new IncomingForm();
    
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Form parse error:', err);
        res.status(400).json({ error: 'Invalid form data' });
        return;
      }

      const file = Array.isArray(files.image) ? files.image[0] : files.image;
      
      if (!file) {
        res.status(400).json({ error: 'No image file found' });
        return;
      }

      // Read image file
      const imageBuffer = fs.readFileSync(file.filepath);
      const base64Image = imageBuffer.toString('base64');
      
      if (!base64Image || base64Image.length < 1000) {
        res.status(400).json({ error: 'Invalid image' });
        return;
      }

      // Google Vision API Call
      const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;
      
      const visionRequest = {
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
        }]
      };

      try {
        const visionResponse = await fetch(visionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visionRequest),
        });

        const visionData = await visionResponse.json();

        if (visionData.error) {
          console.error('Google Vision Error:', visionData.error);
          res.status(500).json({ 
            error: 'Vision API failed', 
            details: visionData.error.message 
          });
          return;
        }

        const labels = visionData.responses[0]?.labelAnnotations?.map(item => 
          item.description.toLowerCase().replace(/[^\w\s]/g, '')
        ) || [];

        console.log('✅ Labels detected:', labels);
        res.status(200).json({ labels });

      } catch (visionError) {
        console.error('Vision fetch error:', visionError);
        res.status(500).json({ error: 'Vision API unreachable' });
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
