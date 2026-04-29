import axios from 'axios';

const API_KEY = "AIzaSyC9ql8egyqLWI4xyYO6DpjAlSOy1__MFVE";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { image } = req.body;
        const url = `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`;

        const response = await axios.post(url, {
            requests: [{
                image: { content: image },
                features: [{ type: "LABEL_DETECTION", maxResults: 10 }]
            }]
        });

        const labels = response.data.responses[0].labelAnnotations.map(l => l.description);
        res.status(200).json({ labels });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
