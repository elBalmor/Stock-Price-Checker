'use strict';
const express = require('express');
const fetch = require('node-fetch'); // si no está instalado: npm i node-fetch@2
const crypto = require('crypto');
const Stock = require('../models/Stock');

const router = express.Router();

// Proxy oficial de FCC
const STOCK_API_URL = process.env.STOCK_API_URL
  || 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock';

// --- Funciones auxiliares ---

// Anonimizar IP para cumplir privacidad
function anonymizeIp(ipRaw = '') {
  const first = String(ipRaw).split(',')[0].trim();

  if (first.includes(':')) { // IPv6
    const parts = first.split(':');
    if (parts.length > 1) parts[parts.length - 1] = '0';
    const masked = parts.join(':');
    return crypto.createHash('sha256').update(masked).digest('hex');
  }

  // IPv4
  const parts = first.split('.');
  if (parts.length === 4) parts[3] = '0';
  const masked = parts.join('.');
  return crypto.createHash('sha256').update(masked).digest('hex');
}

// Pedir precio al proxy de FCC
async function fetchPrice(symbol) {
  const url = `${STOCK_API_URL}/${encodeURIComponent(symbol)}/quote`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error al pedir precio (${res.status})`);
  const data = await res.json();

  // El proxy devuelve algo como { symbol, latestPrice }
  const price = data.latestPrice ?? data.delayedPrice ?? data.iexRealtimePrice ?? data.previousClose ?? null;
  if (price == null) throw new Error('Precio no encontrado en la respuesta');
  return Number(price);
}

// Buscar o crear documento en Mongo
async function findOrCreate(symbol) {
  const up = symbol.toUpperCase();
  let doc = await Stock.findOne({ symbol: up });
  if (!doc) doc = await Stock.create({ symbol: up });
  return doc;
}

// Si hay "like", verificar que esa IP no haya dado like antes
async function likeIfNew(doc, ipHash, likeFlag) {
  if (!likeFlag) return doc;
  if (!doc.ipHashes.includes(ipHash)) {
    doc.likes += 1;
    doc.ipHashes.push(ipHash);
    await doc.save();
  }
  return doc;
}

// --- RUTA PRINCIPAL ---
router.get('/stock-prices', async (req, res) => {
  try {
    const { stock, like } = req.query;
    const likeFlag = String(like).toLowerCase() === 'true' || like === 'on';

    const clientIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '';
    const ipHash = anonymizeIp(clientIp);

    if (!stock) return res.status(400).json({ error: 'Debes pasar un stock' });

    // Caso 1: un solo stock
    if (typeof stock === 'string') {
      const sym = stock.toUpperCase();
      const [price, doc] = await Promise.all([fetchPrice(sym), findOrCreate(sym)]);
      await likeIfNew(doc, ipHash, likeFlag);

      return res.json({ stockData: { stock: sym, price, likes: doc.likes } });
    }

    // Caso 2: dos stocks
    if (Array.isArray(stock) && stock.length === 2) {
      const s1 = stock[0].toUpperCase();
      const s2 = stock[1].toUpperCase();

      const [price1, price2, doc1, doc2] = await Promise.all([
        fetchPrice(s1), fetchPrice(s2), findOrCreate(s1), findOrCreate(s2)
      ]);

      await Promise.all([
        likeIfNew(doc1, ipHash, likeFlag),
        likeIfNew(doc2, ipHash, likeFlag)
      ]);

      const rel1 = doc1.likes - doc2.likes;
      const rel2 = doc2.likes - doc1.likes;

      return res.json({
        stockData: [
          { stock: s1, price: price1, rel_likes: rel1 },
          { stock: s2, price: price2, rel_likes: rel2 }
        ]
      });
    }

    return res.status(400).json({ error: 'Debes pasar uno o dos stocks' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno', detail: err.message });
  }
});

module.exports = router;
