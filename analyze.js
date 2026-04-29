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
    // Parse multipart form data manually (no external libraries)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    // Extract image from multipart body
    const imageBase64 = extractImageFromMultipart(buffer);
    
    if (!imageBase64) {
      return res.status(400).json({ error: 'No image found in request' });
    }

    // Call Google Vision API
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
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
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper: Extract base64 image from multipart form data
function extractImageFromMultipart(buffer) {
  const bodyStr = buffer.toString('binary');
  
  // Find the content of the file (between headers and next boundary)
  const contentStart = bodyStr.indexOf('\r\n\r\n');
  if (contentStart === -1) return null;
  
  // Find the boundary
  const boundaryMatch = bodyStr.match(/boundary=([^\s;]+)/);
  if (!boundaryMatch) return null;
  
  const boundary = boundaryMatch[1].replace(/["']/g, '');
  
  // Find the end of the file content (before the next boundary)
  const fileContentStart = contentStart + 4;
  const nextBoundaryIndex = bodyStr.indexOf(`--${boundary}`, fileContentStart);
  
  if (nextBoundaryIndex === -1) return null;
  
  // Extract the binary image data
  const fileContentEnd = nextBoundaryIndex - 2; // -2 for \r\n before boundary
  const imageBuffer = buffer.slice(fileContentStart, fileContentEnd);
  
  // Convert to base64
  return imageBuffer.toString('base64');
}
