# Stock Price Checker

Proyecto de **freeCodeCamp**: API que consulta el precio de acciones y gestiona “likes” **anonimizados por IP**. Incluye medidas de seguridad (Helmet + CSP), pruebas funcionales y soporte para despliegue en Render.

## 🚀 Demo
- **URL de producción**: _https://stock-price-checker-6rbl.onrender.com_ (Caido)
- **Ruta principal**: `GET /api/stock-prices`

---

## 🧱 Requisitos

- **Node.js** 18+ (probado en Node 22)
- **MongoDB**
  - Local (`mongodb://127.0.0.1:27017`) o
  - Docker (`mongo:7`) o
  - **MongoDB Atlas** (recomendado para deploy)

---

## ⚙️ Configuración

Crea un archivo `.env` en la raíz:

```env
MONGO_URI=mongodb://127.0.0.1:27017/fcc-stock
En producción (Render), usa tu cadena de MongoDB Atlas, por ejemplo:

ini
Copiar código
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/fcc-stock?retryWrites=true&w=majority&appName=Cluster0
📦 Instalación
bash
Copiar código
npm ci
# o, si prefieres:
# npm install
🧪 Tests (freeCodeCamp)
Este proyecto usa el runner del boilerplate FCC cuando NODE_ENV=test.

bash
Copiar código
# Ejecuta los tests (levanta el server con runner)
npm test
Se levantará en puerto 3001 y correrá los 5 tests funcionales en tests/2_functional-tests.js.

💻 Desarrollo local
bash
Copiar código
npm run dev
Servidor en http://localhost:3000

Asegúrate de que tu Mongo esté corriendo (local, Docker o Atlas).

Docker rápido para Mongo local:

bash
Copiar código
docker run --name mongo-fcc -p 27017:27017 -d mongo:7
🔐 Seguridad
Helmet con CSP estricta: solo permite scripts y estilos desde 'self'.

CORS (actualmente '*' para FCC; ajusta si necesitas).

Rate limiting (desactivado en test).

trust proxy solo en producción.

Privacidad (GDPR-friendly): likes por IP anonimizadas (truncado + hash SHA-256). No se guarda la IP cruda.

🧭 Endpoints
1) Ver un stock
bash
Copiar código
GET /api/stock-prices?stock=GOOG
Respuesta:

json
Copiar código
{
  "stockData": {
    "stock": "GOOG",
    "price": 133.12,
    "likes": 0
  }
}
2) Ver un stock y darle like (una sola vez por IP)
sql
Copiar código
GET /api/stock-prices?stock=GOOG&like=true
3) Ver dos stocks
bash
Copiar código
GET /api/stock-prices?stock=GOOG&stock=MSFT
Respuesta:

json
Copiar código
{
  "stockData": [
    { "stock": "GOOG", "price": 133.12, "rel_likes": 1 },
    { "stock": "MSFT", "price": 328.22, "rel_likes": -1 }
  ]
}
4) Ver dos stocks y darles like
sql
Copiar código
GET /api/stock-prices?stock=GOOG&stock=MSFT&like=true
🧪 Tests funcionales incluidos
Archivo: tests/2_functional-tests.js

Ver un stock

Ver un stock y darle like

Reintentar like al mismo stock (no duplica)

Ver dos stocks

Ver dos stocks y gustarles (valida rel_likes opuestos)

🗂️ Estructura del proyecto
bash
Copiar código
.
├─ server.js                 # App + seguridad + arranque tras conectar a Mongo
├─ routes/
│  ├─ api.js                 # Ruta/handler principal /api/stock-prices
│  └─ fcctesting.js          # Solo se carga en NODE_ENV=test
├─ models/
│  └─ Stock.js               # Schema: symbol, likes, ipHashes
├─ tests/
│  └─ 2_functional-tests.js  # Pruebas funcionales FCC
├─ views/
│  └─ index.html             # Página de inicio FCC
├─ public/
│  ├─ client.js
│  └─ style.css
└─ .env                      # MONGO_URI (no se sube a git)
☁️ Deploy en Render
Conecta tu repo (elBalmor/Stock-Price-Checker).

Build Command: npm ci

Start Command: node server.js

Environment:

MONGO_URI = (cadena Atlas)

Durante evaluación de FCC, puedes usar NODE_ENV=test para que el runner de FCC se exponga en /_api. Luego vuelve a production si prefieres.

🧰 Troubleshooting
Auth fallida (Atlas): revisa usuario/clave, que la IP allowlist incluya 0.0.0.0/0, y que tu password no requiera escape de caracteres. Usa el string de conexión que te da Atlas en “Connect your application”.

Time out / buffering en Mongoose: asegúrate de que tu MONGO_URI es correcto y que el server escucha SOLO tras conectar (ya está implementado en server.js).

CSP falla en FCC: este proyecto fuerza la cabecera mínima que FCC valida:
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'

📄 Licencia
MIT — usa, modifica y comparte libremente.