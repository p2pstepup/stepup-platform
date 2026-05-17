import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Edit this path to point to your downloaded answer_key.json ──
const INPUT  = join(__dirname, 'answer_key.json')
const OUTPUT = join(__dirname, 'answer_key_updated.json')

// Options map: question number → how many options (A=1, B=2 … J=10)
const OPTIONS = {
  // 6 options (A–F)
   4:6,  5:6, 21:6, 30:6, 34:6, 47:6, 48:6,
  56:6, 58:6, 64:6, 65:6, 66:6, 67:6, 83:6, 97:6,
  110:6,111:6,117:6,119:6,120:6,125:6,130:6,138:6,
  153:6,159:6,165:6,182:6,196:6,199:6,200:6,
  // 7 options (A–G)
  17:7, 55:7, 59:7, 71:7, 121:7, 151:7, 157:7, 193:7,
  // 8 options (A–H)
  25:8, 108:8, 156:8, 173:8, 181:8,
  // 9 options (A–I)
  33:9, 46:9,
  // 10 options (A–J)
  15:10, 163:10, 168:10, 170:10,
}

const raw  = JSON.parse(readFileSync(INPUT, 'utf8'))
const qs   = raw.questions ?? raw   // handle both wrapped and flat format

let count = 0
for (const [num, opts] of Object.entries(OPTIONS)) {
  if (qs[num]) {
    qs[num].options = opts
    count++
  } else {
    console.warn(`  ⚠ Q${num} not found in JSON`)
  }
}

if (raw.questions) raw.questions = qs
const out = raw.questions ? raw : qs
writeFileSync(OUTPUT, JSON.stringify(out, null, 2))
console.log(`✓ Updated ${count} questions → ${OUTPUT}`)
