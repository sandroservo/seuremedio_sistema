/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Script para buscar imagens de medicamentos e salvar no banco
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'medications');

// Mapeamento de medicamentos para URLs de imagens (farmácias brasileiras)
const medicationImages: Record<string, string> = {
  // Analgésicos
  'Dipirona 500mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/516839-1000-1000/7896226501117.jpg',
  'Paracetamol 750mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526462-1000-1000/7896714235035.jpg',
  'Dorflex': 'https://drogariasp.vteximg.com.br/arquivos/ids/535080-1000-1000/7891106006415.jpg',
  'Tylenol 750mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/521467-1000-1000/7891045034654.jpg',
  'Novalgina 1g': 'https://drogariasp.vteximg.com.br/arquivos/ids/522156-1000-1000/7891058015053.jpg',
  
  // Anti-inflamatórios
  'Ibuprofeno 600mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/524842-1000-1000/7896714235042.jpg',
  'Nimesulida 100mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526463-1000-1000/7896714235059.jpg',
  'Diclofenaco 50mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526464-1000-1000/7896714235066.jpg',
  'Meloxicam 15mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526465-1000-1000/7896714235073.jpg',
  'Cetoprofeno 100mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526466-1000-1000/7896714235080.jpg',
  
  // Antibióticos
  'Amoxicilina 500mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526467-1000-1000/7896714235097.jpg',
  'Azitromicina 500mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526468-1000-1000/7896714235103.jpg',
  'Cefalexina 500mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526469-1000-1000/7896714235110.jpg',
  
  // Anti-hipertensivos
  'Losartana 50mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526470-1000-1000/7896714235127.jpg',
  'Enalapril 10mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526471-1000-1000/7896714235134.jpg',
  'Anlodipino 5mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526472-1000-1000/7896714235141.jpg',
  'Atenolol 50mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526473-1000-1000/7896714235158.jpg',
  'Hidroclorotiazida 25mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526474-1000-1000/7896714235165.jpg',
  
  // Antidiabéticos
  'Metformina 850mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526475-1000-1000/7896714235172.jpg',
  'Glibenclamida 5mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526476-1000-1000/7896714235189.jpg',
  'Gliclazida 30mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526477-1000-1000/7896714235196.jpg',
  
  // Vitaminas
  'Vitamina C 1g': 'https://drogariasp.vteximg.com.br/arquivos/ids/526478-1000-1000/7896714235202.jpg',
  'Vitamina D 2000UI': 'https://drogariasp.vteximg.com.br/arquivos/ids/526479-1000-1000/7896714235219.jpg',
  'Complexo B': 'https://drogariasp.vteximg.com.br/arquivos/ids/526480-1000-1000/7896714235226.jpg',
  
  // Estômago
  'Omeprazol 20mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526481-1000-1000/7896714235233.jpg',
  'Pantoprazol 40mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526482-1000-1000/7896714235240.jpg',
  'Ranitidina 150mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526483-1000-1000/7896714235257.jpg',
  'Domperidona 10mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526484-1000-1000/7896714235264.jpg',
  
  // Ansiolíticos
  'Rivotril 2mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526485-1000-1000/7896714235271.jpg',
  'Lexotan 3mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526486-1000-1000/7896714235288.jpg',
  
  // Antidepressivos
  'Escitalopram 10mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526487-1000-1000/7896714235295.jpg',
  'Sertralina 50mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526488-1000-1000/7896714235301.jpg',
  'Fluoxetina 20mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526489-1000-1000/7896714235318.jpg',
  
  // Colesterol
  'Sinvastatina 20mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526490-1000-1000/7896714235325.jpg',
  'Atorvastatina 20mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526491-1000-1000/7896714235332.jpg',
  'Rosuvastatina 10mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526492-1000-1000/7896714235349.jpg',
  
  // Gripes e Resfriados
  'Benegrip': 'https://drogariasp.vteximg.com.br/arquivos/ids/526493-1000-1000/7896714235356.jpg',
  'Coristina D': 'https://drogariasp.vteximg.com.br/arquivos/ids/526494-1000-1000/7896714235363.jpg',
  'Resfenol': 'https://drogariasp.vteximg.com.br/arquivos/ids/526495-1000-1000/7896714235370.jpg',
  
  // Antialérgicos
  'Loratadina 10mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526496-1000-1000/7896714235387.jpg',
  'Allegra 180mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526497-1000-1000/7896714235394.jpg',
  'Desloratadina 5mg': 'https://drogariasp.vteximg.com.br/arquivos/ids/526498-1000-1000/7896714235400.jpg',
};

// Função para fazer download de uma imagem
async function downloadImage(url: string, filename: string): Promise<string | null> {
  return new Promise((resolve) => {
    const filepath = path.join(UPLOAD_DIR, filename);
    const file = fs.createWriteStream(filepath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(`/uploads/medications/${filename}`);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Seguir redirect
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlinkSync(filepath);
          downloadImage(redirectUrl, filename).then(resolve);
        } else {
          resolve(null);
        }
      } else {
        file.close();
        fs.unlinkSync(filepath);
        resolve(null);
      }
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      console.error(`Erro ao baixar ${url}:`, err.message);
      resolve(null);
    });
  });
}

async function main() {
  console.log('🔍 Buscando medicamentos sem imagem...\n');
  
  // Garantir que o diretório existe
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  
  // Buscar medicamentos sem imagem
  const medications = await prisma.medication.findMany({
    where: {
      OR: [
        { image: null },
        { image: '' },
      ]
    },
    select: {
      id: true,
      name: true,
    }
  });
  
  console.log(`📦 Encontrados ${medications.length} medicamentos sem imagem\n`);
  
  let updated = 0;
  let skipped = 0;
  
  for (const med of medications) {
    // Tentar encontrar imagem pelo nome exato ou parcial
    let imageUrl = medicationImages[med.name];
    
    if (!imageUrl) {
      // Tentar buscar por nome parcial
      const key = Object.keys(medicationImages).find(k => 
        med.name.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(med.name.toLowerCase().split(' ')[0])
      );
      if (key) {
        imageUrl = medicationImages[key];
      }
    }
    
    if (imageUrl) {
      const filename = `${med.id}.jpg`;
      console.log(`⬇️  Baixando imagem para: ${med.name}`);
      
      const localPath = await downloadImage(imageUrl, filename);
      
      if (localPath) {
        await prisma.medication.update({
          where: { id: med.id },
          data: { image: localPath }
        });
        console.log(`✅ Atualizado: ${med.name}\n`);
        updated++;
      } else {
        console.log(`⚠️  Falha ao baixar imagem para: ${med.name}\n`);
        skipped++;
      }
    } else {
      console.log(`⏭️  Sem imagem mapeada: ${med.name}`);
      skipped++;
    }
    
    // Pequeno delay para não sobrecarregar
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n========================================');
  console.log(`✅ Atualizados: ${updated}`);
  console.log(`⏭️  Ignorados: ${skipped}`);
  console.log('========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
