// Groq Vision API - Image Analysis
// Vercel Serverless Function

const GROQ_API_KEY = "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";

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
    // Parse JSON body
    let body = {};
    
    if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else if (req.body && typeof req.body === 'string') {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const imageDataUrl = body.image;

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return res.status(400).json({ error: 'No image provided. Expected base64 data URL.' });
    }

    // Call Groq Vision API
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "List the main objects and items visible in this image. Return ONLY a comma-separated list of keywords (e.g., shoe, sneaker, red, nike). No sentences, no explanations. Just keywords."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_completion_tokens: 200
      })
    });

    const groqData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API error:', groqData);
      return res.status(500).json({ 
        error: 'Groq API error', 
        details: groqData.error?.message || 'Unknown error'
      });
    }

    // Parse the response text into an array of labels
    const rawText = groqData.choices[0]?.message?.content || '';
    
    // Split by commas and clean up
    const labels = rawText
      .split(/[,\n]/) // Split by comma or newline
      .map(label => label.trim().toLowerCase())
      .filter(label => label.length > 0 && label.length < 50); // Remove empty and too-long labels

    return res.status(200).json({ labels });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
