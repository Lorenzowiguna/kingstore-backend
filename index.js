const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// --- KONFIGURASI KHUSUS UNTUK RENDER ---
// Mengambil variable Environment dari Render
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARE CORS ---
// Render membutuhkan ini agar mengizinkan request dari Netlify
app.use(cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json()); 

// --- KONFIGURASI DIGIFLAZZ ---
// Kita ambil langsung dari Environment Variable, bukan hardcode di file
const DIGI_USERNAME = process.env.DIGI_USERNAME || 'hosoyagdKvZW';       
const DIGI_PRODI_KEY = process.env.DIGI_PRODI_KEY || 'dev-326ef180-f44c-11f0-ac1a-0dae229853ad'; 
const BASE_URL = 'https://api.digiflazz.com/v1';

// 1. CEK SALDO
app.get('/cek-saldo', async (req, res) => {
    try {
        // Signature Depo
        const sign = crypto.createHash('md5').update(DIGI_USERNAME + DIGI_PRODI_KEY + "depo").digest('hex');
        const response = await axios.post(`${BASE_URL}/cek-saldo`, {
            cmd: 'deposit',
            username: DIGI_USERNAME,
            sign: sign
        });
        res.json({ status: 'Berhasil Terkoneksi ke Digiflazz!', saldo: response.data.data });
    } catch (error) {
        res.status(500).json({ status: 'Gagal', pesan: error.message });
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
        res.json(games);
    } catch (error) {
        res.status(500).json({ status: 'Gagal', pesan: error.message });
    }
});

// 3. TRANSAKSI
app.post('/transaksi', async (req, res) => {
    try {
        console.log("Data Masuk:", req.body);

        const { sku_code, customer_no } = req.body;

        if (!sku_code || !customer_no) {
            return res.status(400).json({ status: 'Gagal', pesan: 'Data kurang lengkap' });
        }

        const ref_id = "TRX" + Date.now();
        
        // Rumus MD5 Signature Digiflazz
        const sign = crypto.createHash('md5').update(DIGI_USERNAME + DIGI_PRODI_KEY + ref_id).digest('hex');

        const response = await axios.post(`${BASE_URL}/transaction`, {
            username: DIGI_USERNAME,
            buyer_sku_code: sku_code,
            customer_no: customer_no,
            ref_id: ref_id,
            sign: sign
        });

        res.json({ status: 'Sukses', data_digiflazz: response.data.data });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ status: 'Gagal', pesan: error.message });
    }
});

// JALANKAN SERVER
app.listen(PORT, () => {
    console.log(`✅ Server Berjalan di Port ${PORT}`);
});
