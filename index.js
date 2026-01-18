const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// --- KONFIGURASI KHUSUS RENDER ---
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

// --- MIDDLEWARE CORS ---
// Render sangat ketat dengan preflight, kita izinkan semua
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json()); 

// --- KONFIGURASI DIGIFLAZZ ---
// Ambil dari Environment Variables Render
const DIGI_USERNAME = process.env.DIGI_USERNAME || 'hosoyagdKvZW';       
const DIGI_PRODI_KEY = process.env.DIGI_PRODI_KEY || 'dev-326ef180-f44c-11f0-ac1a-0dae229853ad'; 
const BASE_URL = 'https://api.digiflazz.com/v1';

// --- FUNGSI HELPER RESPONSE ---
function sendResponse(res, data) {
    // Pastikan Header CORS selalu dikirim
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.json(data);
}

// 1. CEK SALDO
app.get('/cek-saldo', async (req, res) => {
    try {
        const sign = crypto.createHash('md5').update(DIGI_USERNAME + DIGI_PRODI_KEY + "depo").digest('hex');
        const response = await axios.post(`${BASE_URL}/cek-saldo`, {
            cmd: 'deposit',
            username: DIGI_USERNAME,
            sign: sign
        });
        sendResponse(res, { status: 'Berhasil Terkoneksi ke Digiflazz!', saldo: response.data.data });
    } catch (error) {
        sendResponse(res, { status: 'Gagal', pesan: error.message });
    }
});

// 2. CEK PRODUK
app.get('/products', async (req, res) => {
    try {
        const sign = crypto.createHash('md5').update(DIGI_USERNAME + DIGI_PRODI_KEY + "pricelist").digest('hex');
        const response = await axios.post(`${BASE_URL}/price-list`, {
            cmd: 'prepaid',
            username: DIGI_USERNAME,
            sign: sign
        });
        const games = response.data.data.filter(item => item.brand === 'MOBILE LEGENDS' && item.status === true);
        sendResponse(res, games);
    } catch (error) {
        sendResponse(res, { status: 'Gagal', pesan: error.message });
    }
});

// --- HANDLER PREFLIGHT (ANTI ERROR RENDER) ---
app.options('/transaksi', (req, res) => {
    // Kirim status 200 OK untuk permintaan preflight (OPTIONS)
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// 3. TRANSAKSI (BELI)
app.post('/transaksi', async (req, res) => {
    try {
        console.log("Data Masuk:", req.body);

        const { sku_code, customer_no } = req.body;

        if (!sku_code || !customer_no) {
            return sendResponse(res, { status: 'Gagal', pesan: 'SKU Code dan Customer No wajib diisi!' });
        }

        const ref_id = "TRX" + Date.now();
        const sign = crypto.createHash('md5').update(DIGI_USERNAME + DIGI_PRODI_KEY + ref_id).digest('hex');

        const response = await axios.post(`${BASE_URL}/transaction`, {
            username: DIGI_USERNAME,
            buyer_sku_code: sku_code,
            customer_no: customer_no,
            ref_id: ref_id,
            sign: sign
        });

        sendResponse(res, { status: 'Sukses', data_digiflazz: response.data.data });

    } catch (error) {
        console.error("Error Transaksi:", error.message);
        sendResponse(res, { status: 'Gagal', pesan: error.message });
    }
});

// JALANKAN SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server Berjalan di Port ${PORT}`);
});
