import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { translateGoogleText } from '../server/services/googleTranslate.js';

const LOCALES_DIR = path.join(process.cwd(), 'src', 'locales');
const EN_DIR = path.join(LOCALES_DIR, 'en');
const PT_DIR = path.join(LOCALES_DIR, 'pt');

if (!fs.existsSync(PT_DIR)) {
  fs.mkdirSync(PT_DIR, { recursive: true });
}

// Helper to translate ICU string safely
async function translateIcuString(str) {
  if (!str || typeof str !== 'string') return str;
  if (!str.trim()) return str;

  // Simple string without ICU braces
  if (!str.includes('{')) {
    const res = await translateGoogleText({ text: str, targetLanguage: 'pt', sourceLanguage: 'en' });
    return res.translatedText;
  }

  // ICU Plural format: {count, plural, one {# ...} other {# ...}}
  const pluralMatch = str.match(/^\{([a-zA-Z0-9_]+),\s*plural,\s*(.+)\}$/s);
  if (pluralMatch) {
    const varName = pluralMatch[1];
    const body = pluralMatch[2];
    
    // Extract branches: one {...} other {...} zero {...}
    const branchRegex = /([a-zA-Z0-9_=]+)\s*\{([^}]+)\}/g;
    let newBranches = [];
    let match;
    while ((match = branchRegex.exec(body)) !== null) {
      const branchKey = match[1];
      const branchText = match[2];
      // Translate branch text
      const sub = await translateGoogleText({ text: branchText, targetLanguage: 'pt', sourceLanguage: 'en' });
      newBranches.push(`${branchKey} {${sub.translatedText}}`);
    }
    if (newBranches.length > 0) {
      return `{${varName}, plural, ${newBranches.join(' ')}}`;
    }
  }

  // Parameterized string like "Hello {name}, welcome to {place}"
  // Replace {param} with [[VAR_param]]
  const placeholders = [];
  const masked = str.replace(/\{([a-zA-Z0-9_]+)\}/g, (m, name) => {
    const token = `__PARAM_${name}__`;
    placeholders.push({ token, original: `{${name}}` });
    return token;
  });

  const res = await translateGoogleText({ text: masked, targetLanguage: 'pt', sourceLanguage: 'en' });
  let result = res.translatedText;

  // Restore placeholders
  for (const { token, original } of placeholders) {
    result = result.replaceAll(token, original);
    // Also handle possible lowercase or spaced tokens from translator
    result = result.replaceAll(token.toLowerCase(), original);
    result = result.replace(new RegExp(`__\\s*PARAM_${token.replace(/__PARAM_|_/g, '')}\\s*__`, 'gi'), original);
  }

  return result;
}

async function translateFile(filename) {
  const enPath = path.join(EN_DIR, filename);
  const ptPath = path.join(PT_DIR, filename);

  if (!fs.existsSync(enPath)) return;

  console.log(`\n📄 Processando ${filename}...`);
  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  let ptData = fs.existsSync(ptPath) ? JSON.parse(fs.readFileSync(ptPath, 'utf8')) : {};

  let translatedCount = 0;
  const keys = Object.keys(enData);

  for (let i = 0; i < keys.length; i += 20) {
    const batch = keys.slice(i, i + 20);
    await Promise.all(batch.map(async (key) => {
      const enVal = enData[key];
      if (typeof enVal === 'string') {
        try {
          const ptVal = await translateIcuString(enVal);
          ptData[key] = ptVal;
          translatedCount++;
        } catch (e) {
          console.error(`  ⚠️ Erro ao traduzir chave "${key}":`, e.message);
          ptData[key] = enVal;
        }
      } else {
        ptData[key] = enVal;
      }
    }));
    process.stdout.write(`  Traduzidas ${Math.min(i + 20, keys.length)}/${keys.length} chaves...\r`);
  }

  fs.writeFileSync(ptPath, JSON.stringify(ptData, null, 2), 'utf8');
  console.log(`\n✅ ${filename} finalizado com ${translatedCount} chaves traduzidas.`);
}

async function main() {
  const files = fs.readdirSync(EN_DIR).filter(f => f.endsWith('.json'));
  console.log(`🌟 Iniciando tradução profissional para PT-BR de ${files.length} arquivos com Google Translate...`);

  for (const file of files) {
    await translateFile(file);
  }

  console.log('\n🎉 Todos os arquivos de idioma foram traduzidos para Português Brasileiro com sucesso!');
}

main().catch(console.error);
