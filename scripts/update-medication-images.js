/**
 * Script para atualizar imagens de medicamentos via API
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'medications');

// Imagens de exemplo de medicamentos (URLs públicas)
const medicationImages = {
  'Dipirona': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop',
  'Paracetamol': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200&h=200&fit=crop',
  'Ibuprofeno': 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=200&h=200&fit=crop',
  'Amoxicilina': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=200&h=200&fit=crop',
  'Losartana': 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200&h=200&fit=crop',
  'Metformina': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200&h=200&fit=crop',
  'Omeprazol': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=200&h=200&fit=crop',
  'Vitamina': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=200&h=200&fit=crop',
  'Loratadina': 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=200&h=200&fit=crop',
  'Sinvastatina': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=200&h=200&fit=crop',
};

async function fetchMedications() {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE}/medications?limit=1000`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadImage(url, filename) {
  return new Promise((resolve) => {
    const filepath = path.join(UPLOAD_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(`/uploads/medications/${filename}`);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(filepath);
        downloadImage(response.headers.location, filename).then(resolve);
      } else {
        file.close();
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        resolve(null);
      }
    }).on('error', () => {
      file.close();
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
      resolve(null);
    });
  });
}

function updateMedication(id, imageUrl) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ image: imageUrl });
    
    const req = http.request(`${API_BASE}/medications/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔍 Buscando medicamentos...\n');
  
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  const medications = await fetchMedications();
  const withoutImage = medications.filter(m => !m.image);
  
  console.log(`📦 Total: ${medications.length} medicamentos`);
  console.log(`📷 Sem imagem: ${withoutImage.length}\n`);
  
  let updated = 0;
  
  for (const med of withoutImage) {
    // Encontrar imagem correspondente
    const key = Object.keys(medicationImages).find(k => 
      med.name.toLowerCase().includes(k.toLowerCase())
    );
    
    if (key) {
      const imageUrl = medicationImages[key];
      const filename = `${med.id}.jpg`;
      
      console.log(`⬇️  ${med.name}`);
      const localPath = await downloadImage(imageUrl, filename);
      
      if (localPath) {
        const success = await updateMedication(med.id, localPath);
        if (success) {
          console.log(`   ✅ Atualizado`);
          updated++;
        }
      }
    }
    
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log(`\n✅ Atualizados: ${updated} medicamentos com imagens`);
}

main().catch(console.error);
