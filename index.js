const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json()); 

// --- KONFIGURASI DIGIFLAZZ ---
const DIGI_USERNAME = 'hosoyagdKvZW';       
const DIGI_PRODI_KEY = 'dev-326ef180-f44c-11f0-ac1a-0dae229853ad'; 
const BASE_URL = 'https://api.digiflazz.com/v1';

// 1. CEK SALDO
app.get('/cek-saldo', async (req, res) => {
    try {
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

// 3. TRANSAKSI (BELI)
app.post('/transaksi', async (req, res) => {
    try {
        // Debug sudah saya pindahkan ke dalam sini
        console.log("Data Masuk:", req.body);

        const { sku_code, customer_no } = req.body;

        if (!sku_code || !customer_no) {
            return res.status(400).json({ status: 'Gagal', pesan: 'SKU Code dan Customer No wajib diisi!' });
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

        res.json({ status: 'Sukses', data_digiflazz: response.data.data });

    } catch (error) {
        console.error("Error Transaksi:", error.message);
        res.status(500).json({ status: 'Gagal', pesan: error.message });
    }
});

// JALANKAN SERVER
const PORT = process.env.PORT || 3000; // Railway akan mengubah PORT secara otomatis
app.listen(PORT, () => {
    console.log(`✅ Server Berjalan di Port ${PORT}`);
});
