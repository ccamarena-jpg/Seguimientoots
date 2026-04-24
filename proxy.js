// Vercel Serverless Function — proxy para Apps Script
// Archivo: /api/proxy.js en tu repo de GitHub
export default async function handler(req, res) {
  // Permitir CORS desde cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrI37dGL2OdDcKa1tq4IMDoCHoQk00rZKL99RH7HEMwvO8ULOo2Wz34_cGBeAYG5_o1Q/exec';

  try {
    // Construir URL con los parámetros recibidos
    const params = req.query || {};
    const qs = Object.entries(params)
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
      .join('&');
    
    const targetUrl = SCRIPT_URL + (qs ? '?' + qs : '');

    const response = await fetch(targetUrl, {
      method: req.method === 'POST' ? 'POST' : 'GET',
      redirect: 'follow',
      headers: { 'Content-Type': 'application/json' },
      ...(req.method === 'POST' && req.body ? { body: JSON.stringify(req.body) } : {})
    });

    const text = await response.text();
    
    // Intentar parsear como JSON
    try {
      const json = JSON.parse(text);
      return res.status(200).json(json);
    } catch(e) {
      // Si es JSONP: callback({...}) — extraer el JSON
      const m = text.trim().match(/^[^(]+\((.+)\)\s*;?\s*$/s);
      if (m) {
        return res.status(200).json(JSON.parse(m[1]));
      }
      return res.status(200).send(text);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
