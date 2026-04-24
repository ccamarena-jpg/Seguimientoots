// Vercel Serverless Function — proxy para Apps Script
// Archivo: /api/proxy.js en tu repo de GitHub
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrI37dGL2OdDcKa1tq4IMDoCHoQk00rZKL99RH7HEMwvO8ULOo2Wz34_cGBeAYG5_o1Q/exec';

  try {
    // Obtener params de body (POST desde HTML) o query string (GET)
    let params = {};
    if (req.method === 'POST' && req.body) {
      params = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      params = req.query || {};
    }

    // Llamar al Apps Script via GET con params en query string
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v)))
      .join('&');

    const targetUrl = SCRIPT_URL + (qs ? '?' + qs : '');

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Accept': 'application/json, text/javascript, */*' }
    });

    const text = await response.text();

    // Parsear respuesta — JSON puro o JSONP: callback({...})
    const clean = text.trim();
    let json;
    if (clean.startsWith('{') || clean.startsWith('[')) {
      json = JSON.parse(clean);
    } else {
      const m = clean.match(/^[^(]+\((.+)\)\s*;?\s*$/s);
      if (m) json = JSON.parse(m[1]);
      else throw new Error('Respuesta inesperada: ' + clean.substring(0, 100));
    }

    return res.status(200).json(json);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
