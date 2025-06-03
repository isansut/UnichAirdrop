const fs = require('fs');
const axios = require('axios');
const path = require('path');
const HttpsProxyAgent = require('https-proxy-agent');

const headersTemplate = {
  'Accept': 'application/json, text/plain, */*',
  'Origin': 'https://unich.com',
  'Referer': 'https://unich.com/',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36'
};

const tokensFile = path.join(__dirname, 'data.txt');
const proxyFile = path.join(__dirname, 'proxy.txt');

function readLinesFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function getAxiosInstance(token, proxyUrl = null) {
  const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;
  return axios.create({
    httpsAgent: agent,
    headers: {
      ...headersTemplate,
      'Authorization': `Bearer ${token}`
    }
  });
}

async function showUserInfo(token, index, proxyUrl) {
  try {
    const instance = getAxiosInstance(token, proxyUrl);
    const res = await instance.get('https://api.unich.com/airdrop/user/v1/info/my-info');
    const { email, mUn } = res.data.data;
    console.log(`🔄 Memproses akun ke-${index + 1}`);
    if (proxyUrl) {
      console.log(`🌐 Menggunakan proxy: ${proxyUrl}`);
    } else {
      console.log(`🌐 Tanpa proxy`);
    }
    console.log(`📧 Email  : ${email}`);
    console.log(`🏆 Point  : ${mUn}`);
  } catch (err) {
    console.log(`⚠️  Gagal mengambil info akun ke-${index + 1}`);
    console.log('    Detail:', err.response?.data || err.message);
  }
}

async function checkRecentMining(token, index, proxyUrl) {
  try {
    const instance = getAxiosInstance(token, proxyUrl);
    const res = await instance.get('https://api.unich.com/airdrop/user/v1/mining/recent');
    const { isMining } = res.data.data;
    if (isMining) {
      console.log('⛏️  Mining sudah aktif');
    } else {
      console.log('🟢 Mining belum aktif');
    }
    return isMining;
  } catch (err) {
    console.log(`❌ Gagal cek status mining akun ke-${index + 1}`);
    console.log('   Respon:', err.response?.data || err.message);
    return true;
  }
}

async function startMining(token, index, proxyUrl) {
  try {
    const instance = getAxiosInstance(token, proxyUrl);
    await instance.post('https://api.unich.com/airdrop/user/v1/mining/start', null);
    console.log('✅ Mining berhasil dimulai!');
  } catch (err) {
    console.log(`❌ Gagal start mining akun ke-${index + 1}`);
    console.log('   Respon:', err.response?.data || err.message);
  }
}

async function runMultiMining() {
  const tokens = readLinesFromFile(tokensFile);
  const proxies = readLinesFromFile(proxyFile);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const proxy = proxies[i] || null;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    await showUserInfo(token, i, proxy);

    const isMining = await checkRecentMining(token, i, proxy);
    if (!isMining) {
      await startMining(token, i, proxy);
    } else {
      console.log('⏭️  Skip mining');
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log('\n🎉 Semua akun selesai!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function loopForever() {
  while (true) {
    await runMultiMining();

    const nextRun = new Date(Date.now() + 86460000).toLocaleString();
    console.log(`🕒 Menunggu 24 jam 1 menit...`);
    console.log(`📅 Berikutnya: ${nextRun}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await new Promise(resolve => setTimeout(resolve, 86460000));
  }
}

loopForever();
