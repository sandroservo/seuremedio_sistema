/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 * Seed de Medicamentos - Dados reais de farmácia
 * Fonte: IQVIA, Close-UP, PróGenéricos 2024
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL não está definida')
}

const pool = new Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface MedicationData {
  name: string
  description: string
  price: number
  category: string
  requiresPrescription: boolean
  stock: number
}

const medications: MedicationData[] = [
  // === ANALGÉSICOS E ANTITÉRMICOS ===
  { name: 'Dipirona Sódica 500mg', description: 'Analgésico e antitérmico para dores e febre', price: 8.90, category: 'Analgésicos', requiresPrescription: false, stock: 200 },
  { name: 'Dipirona Sódica 1g', description: 'Analgésico e antitérmico - dose forte', price: 12.50, category: 'Analgésicos', requiresPrescription: false, stock: 150 },
  { name: 'Paracetamol 750mg', description: 'Analgésico e antitérmico', price: 7.90, category: 'Analgésicos', requiresPrescription: false, stock: 300 },
  { name: 'Paracetamol 500mg', description: 'Analgésico e antitérmico - dose regular', price: 5.90, category: 'Analgésicos', requiresPrescription: false, stock: 250 },
  { name: 'Novalgina 500mg', description: 'Dipirona sódica - referência Sanofi', price: 15.90, category: 'Analgésicos', requiresPrescription: false, stock: 180 },
  { name: 'Tylenol 750mg', description: 'Paracetamol - referência Johnson & Johnson', price: 18.90, category: 'Analgésicos', requiresPrescription: false, stock: 150 },
  { name: 'Neosaldina', description: 'Analgésico para dor de cabeça e enxaqueca', price: 22.90, category: 'Analgésicos', requiresPrescription: false, stock: 200 },
  { name: 'Dorflex', description: 'Relaxante muscular e analgésico', price: 19.90, category: 'Analgésicos', requiresPrescription: false, stock: 180 },
  { name: 'Torsilax', description: 'Relaxante muscular para dores nas costas', price: 24.90, category: 'Analgésicos', requiresPrescription: false, stock: 150 },
  { name: 'Doril', description: 'Analgésico e descongestionante', price: 12.90, category: 'Analgésicos', requiresPrescription: false, stock: 200 },
  { name: 'Doralgina', description: 'Analgésico genérico Neo Química', price: 9.90, category: 'Analgésicos', requiresPrescription: false, stock: 220 },
  { name: 'Lisador', description: 'Analgésico para cólicas e dores', price: 16.90, category: 'Analgésicos', requiresPrescription: false, stock: 170 },
  { name: 'Buscopan Composto', description: 'Antiespasmódico e analgésico', price: 28.90, category: 'Analgésicos', requiresPrescription: false, stock: 140 },
  { name: 'Maxalgina 500mg', description: 'Dipirona sódica Natulab', price: 7.50, category: 'Analgésicos', requiresPrescription: false, stock: 250 },

  // === ANTI-INFLAMATÓRIOS ===
  { name: 'Nimesulida 100mg', description: 'Anti-inflamatório não esteroidal', price: 12.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 180 },
  { name: 'Ibuprofeno 600mg', description: 'Anti-inflamatório e analgésico', price: 14.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 200 },
  { name: 'Ibuprofeno 400mg', description: 'Anti-inflamatório - dose regular', price: 11.90, category: 'Anti-inflamatórios', requiresPrescription: false, stock: 220 },
  { name: 'Diclofenaco Sódico 50mg', description: 'Anti-inflamatório para dores intensas', price: 9.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 180 },
  { name: 'Diclofenaco Potássico 50mg', description: 'Anti-inflamatório de ação rápida', price: 11.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 160 },
  { name: 'Cetoprofeno 100mg', description: 'Anti-inflamatório potente', price: 18.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 140 },
  { name: 'Meloxicam 15mg', description: 'Anti-inflamatório seletivo COX-2', price: 22.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 120 },
  { name: 'Naproxeno 500mg', description: 'Anti-inflamatório de longa duração', price: 19.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 130 },
  { name: 'Toragesic', description: 'Cetorolaco - anti-inflamatório potente EMS', price: 32.90, category: 'Anti-inflamatórios', requiresPrescription: true, stock: 100 },

  // === ANTIBIÓTICOS ===
  { name: 'Amoxicilina 500mg', description: 'Antibiótico de amplo espectro', price: 18.90, category: 'Antibióticos', requiresPrescription: true, stock: 150 },
  { name: 'Amoxicilina 875mg', description: 'Antibiótico - dose alta', price: 28.90, category: 'Antibióticos', requiresPrescription: true, stock: 120 },
  { name: 'Azitromicina 500mg', description: 'Antibiótico macrolídeo - 3 comprimidos', price: 24.90, category: 'Antibióticos', requiresPrescription: true, stock: 140 },
  { name: 'Cefalexina 500mg', description: 'Antibiótico cefalosporina', price: 22.90, category: 'Antibióticos', requiresPrescription: true, stock: 130 },
  { name: 'Ciprofloxacino 500mg', description: 'Antibiótico fluoroquinolona', price: 19.90, category: 'Antibióticos', requiresPrescription: true, stock: 110 },
  { name: 'Amoxicilina + Clavulanato 875mg', description: 'Antibiótico com inibidor de beta-lactamase', price: 45.90, category: 'Antibióticos', requiresPrescription: true, stock: 90 },
  { name: 'Clavulin BD 875mg', description: 'Amoxicilina + Clavulanato - referência GSK', price: 89.90, category: 'Antibióticos', requiresPrescription: true, stock: 60 },
  { name: 'Levofloxacino 500mg', description: 'Antibiótico respiratório', price: 35.90, category: 'Antibióticos', requiresPrescription: true, stock: 80 },
  { name: 'Metronidazol 400mg', description: 'Antibiótico e antiparasitário', price: 15.90, category: 'Antibióticos', requiresPrescription: true, stock: 140 },
  { name: 'Sulfametoxazol + Trimetoprima', description: 'Antibiótico Bactrim genérico', price: 14.90, category: 'Antibióticos', requiresPrescription: true, stock: 120 },

  // === ANTI-HIPERTENSIVOS ===
  { name: 'Losartana Potássica 50mg', description: 'Anti-hipertensivo - bloqueador de angiotensina', price: 12.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 300 },
  { name: 'Losartana Potássica 100mg', description: 'Anti-hipertensivo - dose alta', price: 18.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 250 },
  { name: 'Hidroclorotiazida 25mg', description: 'Diurético para pressão alta', price: 8.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 280 },
  { name: 'Enalapril 10mg', description: 'Inibidor da ECA para hipertensão', price: 11.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 220 },
  { name: 'Enalapril 20mg', description: 'Inibidor da ECA - dose alta', price: 15.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 200 },
  { name: 'Atenolol 50mg', description: 'Betabloqueador para pressão e arritmia', price: 9.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 240 },
  { name: 'Atenolol 100mg', description: 'Betabloqueador - dose alta', price: 14.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 180 },
  { name: 'Anlodipino 5mg', description: 'Bloqueador de canal de cálcio', price: 10.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 260 },
  { name: 'Anlodipino 10mg', description: 'Bloqueador de canal de cálcio - dose alta', price: 16.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 200 },
  { name: 'Captopril 25mg', description: 'Inibidor da ECA - sublingual', price: 8.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 220 },
  { name: 'Propranolol 40mg', description: 'Betabloqueador para ansiedade e pressão', price: 9.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 200 },
  { name: 'Aradois 50mg', description: 'Losartana - marca Biolab', price: 35.90, category: 'Anti-hipertensivos', requiresPrescription: true, stock: 150 },

  // === ANTIDIABÉTICOS ===
  { name: 'Glifage XR 500mg', description: 'Metformina liberação prolongada - Merck', price: 28.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 200 },
  { name: 'Glifage XR 1g', description: 'Metformina XR dose alta', price: 45.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 180 },
  { name: 'Metformina 850mg', description: 'Antidiabético genérico', price: 12.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 250 },
  { name: 'Metformina 500mg', description: 'Antidiabético - dose inicial', price: 9.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 280 },
  { name: 'Glibenclamida 5mg', description: 'Sulfonilureia para diabetes tipo 2', price: 8.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 200 },
  { name: 'Glimepirida 4mg', description: 'Sulfonilureia de terceira geração', price: 22.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 150 },
  { name: 'Jardiance 25mg', description: 'Empagliflozina - inibidor SGLT2', price: 189.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 60 },
  { name: 'Xigduo XR 10/1000mg', description: 'Dapagliflozina + Metformina - AstraZeneca', price: 159.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 50 },
  { name: 'Ozempic 1mg', description: 'Semaglutida injetável - Novo Nordisk', price: 1089.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 20 },
  { name: 'Victoza', description: 'Liraglutida injetável - Novo Nordisk', price: 489.90, category: 'Antidiabéticos', requiresPrescription: true, stock: 30 },

  // === COLESTEROL ===
  { name: 'Sinvastatina 20mg', description: 'Estatina para colesterol', price: 12.90, category: 'Colesterol', requiresPrescription: true, stock: 200 },
  { name: 'Sinvastatina 40mg', description: 'Estatina - dose alta', price: 18.90, category: 'Colesterol', requiresPrescription: true, stock: 180 },
  { name: 'Atorvastatina 20mg', description: 'Estatina potente para colesterol', price: 22.90, category: 'Colesterol', requiresPrescription: true, stock: 160 },
  { name: 'Atorvastatina 40mg', description: 'Estatina - dose alta', price: 35.90, category: 'Colesterol', requiresPrescription: true, stock: 140 },
  { name: 'Rosuvastatina 10mg', description: 'Estatina de última geração', price: 45.90, category: 'Colesterol', requiresPrescription: true, stock: 120 },
  { name: 'Rosuvastatina 20mg', description: 'Estatina potente', price: 65.90, category: 'Colesterol', requiresPrescription: true, stock: 100 },

  // === ANTICOAGULANTES ===
  { name: 'Xarelto 20mg', description: 'Rivaroxabana - anticoagulante oral Bayer', price: 289.90, category: 'Anticoagulantes', requiresPrescription: true, stock: 40 },
  { name: 'Xarelto 15mg', description: 'Rivaroxabana - dose inicial', price: 269.90, category: 'Anticoagulantes', requiresPrescription: true, stock: 35 },
  { name: 'AAS 100mg', description: 'Ácido acetilsalicílico - prevenção cardiovascular', price: 8.90, category: 'Anticoagulantes', requiresPrescription: false, stock: 300 },
  { name: 'AAS Protect 100mg', description: 'Aspirina com revestimento entérico', price: 15.90, category: 'Anticoagulantes', requiresPrescription: false, stock: 250 },

  // === TIREOIDE ===
  { name: 'Puran T4 50mcg', description: 'Levotiroxina para hipotireoidismo - Sanofi', price: 22.90, category: 'Tireoide', requiresPrescription: true, stock: 150 },
  { name: 'Puran T4 75mcg', description: 'Levotiroxina - dose intermediária', price: 25.90, category: 'Tireoide', requiresPrescription: true, stock: 140 },
  { name: 'Puran T4 100mcg', description: 'Levotiroxina - dose alta', price: 28.90, category: 'Tireoide', requiresPrescription: true, stock: 130 },
  { name: 'Levotiroxina 25mcg', description: 'Hormônio tireoidiano genérico', price: 12.90, category: 'Tireoide', requiresPrescription: true, stock: 180 },
  { name: 'Levotiroxina 50mcg', description: 'Hormônio tireoidiano genérico', price: 14.90, category: 'Tireoide', requiresPrescription: true, stock: 170 },

  // === ANSIOLÍTICOS E ANTIDEPRESSIVOS ===
  { name: 'Rivotril 2mg', description: 'Clonazepam - ansiolítico Roche', price: 28.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 100 },
  { name: 'Rivotril 0,5mg', description: 'Clonazepam - dose baixa', price: 22.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 120 },
  { name: 'Clonazepam 2mg', description: 'Ansiolítico genérico', price: 15.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 140 },
  { name: 'Alprazolam 0,5mg', description: 'Ansiolítico de ação rápida', price: 18.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 130 },
  { name: 'Alprazolam 1mg', description: 'Ansiolítico - dose intermediária', price: 22.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 110 },
  { name: 'Sertralina 50mg', description: 'Antidepressivo ISRS', price: 19.90, category: 'Antidepressivos', requiresPrescription: true, stock: 150 },
  { name: 'Sertralina 100mg', description: 'Antidepressivo - dose alta', price: 32.90, category: 'Antidepressivos', requiresPrescription: true, stock: 120 },
  { name: 'Escitalopram 10mg', description: 'Antidepressivo ISRS seletivo', price: 35.90, category: 'Antidepressivos', requiresPrescription: true, stock: 130 },
  { name: 'Escitalopram 20mg', description: 'Antidepressivo - dose alta', price: 55.90, category: 'Antidepressivos', requiresPrescription: true, stock: 100 },
  { name: 'Fluoxetina 20mg', description: 'Antidepressivo Prozac genérico', price: 14.90, category: 'Antidepressivos', requiresPrescription: true, stock: 180 },
  { name: 'Venlafaxina 75mg', description: 'Antidepressivo IRSN', price: 45.90, category: 'Antidepressivos', requiresPrescription: true, stock: 100 },
  { name: 'Quetiapina 25mg', description: 'Antipsicótico atípico', price: 35.90, category: 'Antidepressivos', requiresPrescription: true, stock: 90 },
  { name: 'Zolpidem 10mg', description: 'Indutor de sono', price: 28.90, category: 'Ansiolíticos', requiresPrescription: true, stock: 100 },

  // === GRIPES E RESFRIADOS ===
  { name: 'Neosoro', description: 'Descongestionante nasal - Neo Química', price: 9.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 400 },
  { name: 'Cimegripe', description: 'Antigripal completo - Cimed', price: 14.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 350 },
  { name: 'Benegrip', description: 'Antigripal tradicional', price: 16.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 300 },
  { name: 'Resfenol', description: 'Antigripal para sintomas gripais', price: 12.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 280 },
  { name: 'Coristina D', description: 'Antigripal com vitamina C', price: 18.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 250 },
  { name: 'Naldecon Pack', description: 'Kit dia e noite para gripe', price: 32.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 200 },
  { name: 'Engov', description: 'Para ressaca e mal-estar', price: 15.90, category: 'Gripes e Resfriados', requiresPrescription: false, stock: 300 },

  // === VITAMINAS E SUPLEMENTOS ===
  { name: 'Vitamina C 1g', description: 'Ácido ascórbico efervescente', price: 18.90, category: 'Vitaminas', requiresPrescription: false, stock: 300 },
  { name: 'Vitamina D3 2000UI', description: 'Colecalciferol para imunidade', price: 25.90, category: 'Vitaminas', requiresPrescription: false, stock: 250 },
  { name: 'Addera D3 1000UI', description: 'Vitamina D - Mantecorp', price: 45.90, category: 'Vitaminas', requiresPrescription: false, stock: 200 },
  { name: 'Addera D3 2000UI', description: 'Vitamina D dose alta', price: 55.90, category: 'Vitaminas', requiresPrescription: false, stock: 180 },
  { name: 'Complexo B', description: 'Vitaminas do complexo B', price: 15.90, category: 'Vitaminas', requiresPrescription: false, stock: 280 },
  { name: 'Centrum Adulto', description: 'Multivitamínico completo', price: 89.90, category: 'Vitaminas', requiresPrescription: false, stock: 150 },
  { name: 'Ômega 3 1000mg', description: 'Óleo de peixe para coração', price: 45.90, category: 'Vitaminas', requiresPrescription: false, stock: 200 },
  { name: 'Cálcio + Vitamina D', description: 'Suplemento para ossos', price: 32.90, category: 'Vitaminas', requiresPrescription: false, stock: 180 },
  { name: 'Zinco 30mg', description: 'Mineral para imunidade', price: 22.90, category: 'Vitaminas', requiresPrescription: false, stock: 220 },
  { name: 'Magnésio 400mg', description: 'Mineral para músculos e sono', price: 28.90, category: 'Vitaminas', requiresPrescription: false, stock: 200 },

  // === ESTÔMAGO E INTESTINO ===
  { name: 'Omeprazol 20mg', description: 'Inibidor de bomba de prótons', price: 12.90, category: 'Estômago', requiresPrescription: true, stock: 300 },
  { name: 'Omeprazol 40mg', description: 'IBP dose alta', price: 18.90, category: 'Estômago', requiresPrescription: true, stock: 250 },
  { name: 'Pantoprazol 40mg', description: 'IBP para refluxo', price: 22.90, category: 'Estômago', requiresPrescription: true, stock: 220 },
  { name: 'Esomeprazol 40mg', description: 'IBP de última geração', price: 45.90, category: 'Estômago', requiresPrescription: true, stock: 150 },
  { name: 'Dexilant 60mg', description: 'Dexlansoprazol - Takeda', price: 189.90, category: 'Estômago', requiresPrescription: true, stock: 60 },
  { name: 'Simeticona 125mg', description: 'Antigases', price: 15.90, category: 'Estômago', requiresPrescription: false, stock: 280 },
  { name: 'Luftal', description: 'Simeticona para gases - referência', price: 22.90, category: 'Estômago', requiresPrescription: false, stock: 250 },
  { name: 'Eno', description: 'Antiácido efervescente', price: 12.90, category: 'Estômago', requiresPrescription: false, stock: 300 },
  { name: 'Sonrisal', description: 'Antiácido e analgésico', price: 14.90, category: 'Estômago', requiresPrescription: false, stock: 280 },
  { name: 'Ranitidina 150mg', description: 'Antiácido H2', price: 15.90, category: 'Estômago', requiresPrescription: true, stock: 200 },
  { name: 'Domperidona 10mg', description: 'Antiemético e procinético', price: 18.90, category: 'Estômago', requiresPrescription: true, stock: 180 },
  { name: 'Metoclopramida 10mg', description: 'Plasil genérico - antiemético', price: 12.90, category: 'Estômago', requiresPrescription: true, stock: 200 },

  // === LAXANTES ===
  { name: 'Tamarine', description: 'Laxante natural - Hypera', price: 32.90, category: 'Laxantes', requiresPrescription: false, stock: 150 },
  { name: 'Lacto-Purga', description: 'Laxante suave', price: 18.90, category: 'Laxantes', requiresPrescription: false, stock: 180 },
  { name: 'Naturetti', description: 'Laxante fitoterápico', price: 25.90, category: 'Laxantes', requiresPrescription: false, stock: 160 },
  { name: 'Muvinlax', description: 'Macrogol para constipação - Libbs', price: 45.90, category: 'Laxantes', requiresPrescription: false, stock: 120 },
  { name: 'Dulcolax', description: 'Bisacodil - laxante estimulante', price: 22.90, category: 'Laxantes', requiresPrescription: false, stock: 140 },

  // === ALERGIA ===
  { name: 'Loratadina 10mg', description: 'Anti-histamínico para alergia', price: 12.90, category: 'Antialérgicos', requiresPrescription: false, stock: 250 },
  { name: 'Desloratadina 5mg', description: 'Anti-histamínico de nova geração', price: 22.90, category: 'Antialérgicos', requiresPrescription: false, stock: 200 },
  { name: 'Allegra 180mg', description: 'Fexofenadina - Sanofi', price: 45.90, category: 'Antialérgicos', requiresPrescription: false, stock: 150 },
  { name: 'Allegra 120mg', description: 'Fexofenadina - dose regular', price: 35.90, category: 'Antialérgicos', requiresPrescription: false, stock: 170 },
  { name: 'Polaramine', description: 'Dexclorfeniramina - antialérgico', price: 18.90, category: 'Antialérgicos', requiresPrescription: false, stock: 200 },
  { name: 'Histamin', description: 'Antialérgico genérico', price: 9.90, category: 'Antialérgicos', requiresPrescription: false, stock: 280 },
  { name: 'Prednisolona 20mg', description: 'Corticoide para inflamação e alergia', price: 15.90, category: 'Antialérgicos', requiresPrescription: true, stock: 150 },
  { name: 'Prednisona 20mg', description: 'Corticoide oral', price: 12.90, category: 'Antialérgicos', requiresPrescription: true, stock: 180 },

  // === DISFUNÇÃO ERÉTIL ===
  { name: 'Sildenafila 50mg', description: 'Viagra genérico', price: 25.90, category: 'Disfunção Erétil', requiresPrescription: true, stock: 150 },
  { name: 'Sildenafila 100mg', description: 'Viagra genérico - dose alta', price: 35.90, category: 'Disfunção Erétil', requiresPrescription: true, stock: 120 },
  { name: 'Tadalafila 5mg', description: 'Cialis genérico - uso diário', price: 45.90, category: 'Disfunção Erétil', requiresPrescription: true, stock: 100 },
  { name: 'Tadalafila 20mg', description: 'Cialis genérico - sob demanda', price: 55.90, category: 'Disfunção Erétil', requiresPrescription: true, stock: 90 },

  // === DERMATOLÓGICOS ===
  { name: 'Pantogar', description: 'Vitaminas para cabelo e unhas - Biolab', price: 159.90, category: 'Dermatológicos', requiresPrescription: false, stock: 80 },
  { name: 'Pantogar Neo', description: 'Nova fórmula para queda de cabelo', price: 179.90, category: 'Dermatológicos', requiresPrescription: false, stock: 70 },
  { name: 'Minoxidil 5%', description: 'Solução para queda de cabelo', price: 65.90, category: 'Dermatológicos', requiresPrescription: false, stock: 100 },
  { name: 'Finasterida 1mg', description: 'Para calvície masculina', price: 45.90, category: 'Dermatológicos', requiresPrescription: true, stock: 90 },
  { name: 'Cetoconazol Shampoo', description: 'Antifúngico para caspa', price: 28.90, category: 'Dermatológicos', requiresPrescription: false, stock: 150 },
  { name: 'Hidratante Bepantol', description: 'Dexpantenol para pele', price: 35.90, category: 'Dermatológicos', requiresPrescription: false, stock: 200 },
  { name: 'Protetor Solar FPS 50', description: 'Proteção solar facial', price: 55.90, category: 'Dermatológicos', requiresPrescription: false, stock: 180 },
  { name: 'Anthelios FPS 60', description: 'Protetor solar La Roche-Posay', price: 89.90, category: 'Dermatológicos', requiresPrescription: false, stock: 120 },

  // === VERMÍFUGOS ===
  { name: 'Albendazol 400mg', description: 'Vermífugo dose única', price: 9.90, category: 'Vermífugos', requiresPrescription: false, stock: 200 },
  { name: 'Mebendazol 100mg', description: 'Vermífugo para oxiúros', price: 8.90, category: 'Vermífugos', requiresPrescription: false, stock: 220 },
  { name: 'Ivermectina 6mg', description: 'Antiparasitário de amplo espectro', price: 22.90, category: 'Vermífugos', requiresPrescription: true, stock: 150 },
  { name: 'Annita 500mg', description: 'Nitazoxanida - antiparasitário', price: 45.90, category: 'Vermífugos', requiresPrescription: true, stock: 100 },

  // === CONTRACEPTIVOS ===
  { name: 'Ciclo 21', description: 'Anticoncepcional oral', price: 12.90, category: 'Contraceptivos', requiresPrescription: true, stock: 200 },
  { name: 'Diane 35', description: 'Anticoncepcional para acne', price: 35.90, category: 'Contraceptivos', requiresPrescription: true, stock: 150 },
  { name: 'Yasmin', description: 'Anticoncepcional Bayer', price: 55.90, category: 'Contraceptivos', requiresPrescription: true, stock: 120 },
  { name: 'Selene', description: 'Anticoncepcional genérico', price: 18.90, category: 'Contraceptivos', requiresPrescription: true, stock: 180 },
  { name: 'Pílula do Dia Seguinte', description: 'Contracepção de emergência', price: 22.90, category: 'Contraceptivos', requiresPrescription: false, stock: 100 },
]

async function main() {
  console.log('💊 Iniciando seed de medicamentos...')
  console.log(`📦 Total de medicamentos a inserir: ${medications.length}`)

  let created = 0
  let updated = 0

  for (const med of medications) {
    const result = await prisma.medication.upsert({
      where: { name: med.name },
      update: {
        description: med.description,
        price: med.price,
        category: med.category,
        requiresPrescription: med.requiresPrescription,
        stock: med.stock,
      },
      create: {
        name: med.name,
        description: med.description,
        price: med.price,
        category: med.category,
        requiresPrescription: med.requiresPrescription,
        stock: med.stock,
      },
    })

    if (result.createdAt.getTime() === result.updatedAt?.getTime()) {
      created++
    } else {
      updated++
    }
  }

  console.log(`✅ Medicamentos criados: ${created}`)
  console.log(`🔄 Medicamentos atualizados: ${updated}`)
  console.log('🎉 Seed de medicamentos concluído!')

  // Mostra estatísticas por categoria
  const categories = await prisma.medication.groupBy({
    by: ['category'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  })

  console.log('\n📊 Medicamentos por categoria:')
  for (const cat of categories) {
    console.log(`   ${cat.category}: ${cat._count.id} itens`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro no seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
