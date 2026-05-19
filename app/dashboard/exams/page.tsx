'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '../../../utils/supabase'
import { is200QExam, gradeWith200QKey } from '../../../utils/amboss-rescore'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const SCORE_FORMULAS: Record<string, {base: number, multiplier: number}> = {
  'NBME 25': {base: 277.04, multiplier: 1.113},
  'NBME 26': {base: 277.22, multiplier: 1.138},
  'NBME 27': {base: 275.17, multiplier: 1.1125},
  'NBME 28': {base: 274.14, multiplier: 1.0456},
  'NBME 29': {base: 272.18, multiplier: 1.09},
  'NBME 30': {base: 278.60, multiplier: 1.150},
  'NBME 31': {base: 270.48, multiplier: 1.08},
  'UWSA 1':  {base: 294.38, multiplier: 1.109},
  'UWSA 2':  {base: 296.94, multiplier: 1.097},
}

const AMBOSS_CORRELATION = [
  {pct: 25, score: 180},
  {pct: 30, score: 185},
  {pct: 40, score: 202},
  {pct: 50, score: 212},
  {pct: 60, score: 222},
  {pct: 70, score: 232},
  {pct: 80, score: 245},
]

const calcStep1Score = (examName: string, wrongCount: number, pctCorrect?: number): number | null => {
  const name = examName.toLowerCase()
  if (name.includes('200q') || name.includes('amboss')) {
    const pct = pctCorrect ?? 0
    if (pct <= 25) return 180
    if (pct >= 80) return 245
    for (let i = 0; i < AMBOSS_CORRELATION.length - 1; i++) {
      const lo = AMBOSS_CORRELATION[i], hi = AMBOSS_CORRELATION[i + 1]
      if (pct >= lo.pct && pct < hi.pct) {
        const t = (pct - lo.pct) / (hi.pct - lo.pct)
        return Math.round(lo.score + t * (hi.score - lo.score))
      }
    }
    return 245
  }
  const formula = Object.entries(SCORE_FORMULAS).find(([key]) =>
    name.includes(key.toLowerCase())
  )
  if (!formula) return null
  return Math.round(formula[1].base - formula[1].multiplier * wrongCount)
}

const BLOCK_PAGES = [
  { start: 1,   end: 50  },
  { start: 51,  end: 100 },
  { start: 101, end: 150 },
  { start: 151, end: 200 },
]

const LAB_VALUES = [
  { category: 'Blood, Plasma, Serum', values: [
    { name: 'Alanine aminotransferase (ALT)', ref: '8–20 U/L' },
    { name: 'Aspartate aminotransferase (AST)', ref: '8–20 U/L' },
    { name: 'Alkaline phosphatase', ref: '20–70 U/L' },
    { name: 'Amylase, serum', ref: '25–125 U/L' },
    { name: 'Bilirubin, serum (total // direct)', ref: '0.1–1.0 // 0.0–0.3 mg/dL' },
    { name: 'Calcium, serum (Ca²⁺)', ref: '8.4–10.2 mg/dL' },
    { name: 'Cholesterol, serum', ref: '<200 mg/dL' },
    { name: 'Creatinine, serum', ref: '0.6–1.2 mg/dL' },
    { name: 'Sodium (Na⁺)', ref: '135–145 mEq/L' },
    { name: 'Potassium (K⁺)', ref: '3.5–5.0 mEq/L' },
    { name: 'Chloride (Cl⁻)', ref: '95–105 mEq/L' },
    { name: 'Bicarbonate (HCO₃⁻)', ref: '22–28 mEq/L' },
    { name: 'Magnesium (Mg²⁺)', ref: '1.5–2.0 mEq/L' },
    { name: 'Ferritin, serum', ref: '15–200 ng/mL' },
    { name: 'Glucose, serum (fasting)', ref: '70–99 mg/dL' },
    { name: 'Iron, serum', ref: '60–160 μg/dL' },
    { name: 'Lactate dehydrogenase (LDH)', ref: '45–90 U/L' },
    { name: 'Lipase, serum', ref: '10–140 U/L' },
    { name: 'Osmolality, serum', ref: '275–295 mOsmol/kg H₂O' },
    { name: 'Phosphorus (inorganic), serum', ref: '3.0–4.5 mg/dL' },
    { name: 'Protein, serum (total)', ref: '6.0–7.8 g/dL' },
    { name: '  Albumin', ref: '3.5–5.5 g/dL' },
    { name: '  Globulin', ref: '2.3–3.5 g/dL' },
    { name: 'TSH', ref: '0.5–5.0 μU/mL' },
    { name: 'Thyroxine (T4), serum', ref: '5–12 μg/dL' },
    { name: 'Triglycerides, serum', ref: '35–160 mg/dL' },
    { name: 'Urea nitrogen, serum (BUN)', ref: '7–25 mg/dL' },
    { name: 'Uric acid, serum', ref: 'M: 3.5–7.2 mg/dL; F: 2.6–6.0 mg/dL' },
  ]},
  { category: 'Hematology', values: [
    { name: 'Hematocrit', ref: 'M: 41–53%; F: 36–46%' },
    { name: 'Hemoglobin', ref: 'M: 13.5–17.5 g/dL; F: 12.0–16.0 g/dL' },
    { name: 'Leukocyte count (WBC)', ref: '4,500–11,000/mm³' },
    { name: '  Neutrophils', ref: '54–62%' },
    { name: '  Bands', ref: '3–5%' },
    { name: '  Eosinophils', ref: '1–3%' },
    { name: '  Basophils', ref: '0–0.75%' },
    { name: '  Lymphocytes', ref: '25–33%' },
    { name: '  Monocytes', ref: '3–7%' },
    { name: 'MCV', ref: '80–100 μm³' },
    { name: 'MCH', ref: '25–35 pg/cell' },
    { name: 'MCHC', ref: '31–37% Hb/cell' },
    { name: 'Partial thromboplastin time (PTT)', ref: '25–40 sec' },
    { name: 'Platelet count', ref: '150,000–400,000/mm³' },
    { name: 'Prothrombin time (PT)', ref: '11–15 sec' },
    { name: 'Reticulocyte count', ref: '0.5–1.5%' },
    { name: 'ESR', ref: 'M: 0–15 mm/hr; F: 0–20 mm/hr' },
  ]},
  { category: 'Arterial Blood Gas', values: [
    { name: 'pH', ref: '7.35–7.45' },
    { name: 'PCO₂', ref: '35–45 mmHg' },
    { name: 'PO₂', ref: '75–105 mmHg' },
    { name: 'HCO₃⁻', ref: '22–26 mEq/L' },
    { name: 'O₂ saturation', ref: '95–99%' },
  ]},
  { category: 'Cerebrospinal Fluid', values: [
    { name: 'Cell count', ref: '0–5/mm³' },
    { name: 'Chloride', ref: '118–132 mEq/L' },
    { name: 'Glucose', ref: '45–70 mg/dL' },
    { name: 'Opening pressure', ref: '70–180 mm H₂O' },
    { name: 'Protein', ref: '15–45 mg/dL' },
  ]},
  { category: 'Urine', values: [
    { name: 'Calcium', ref: '100–300 mg/24h' },
    { name: 'Creatinine', ref: 'M: 14–26 mg/kg/24h; F: 11–20 mg/kg/24h' },
    { name: 'Osmolality', ref: '50–1,400 mOsmol/kg H₂O' },
    { name: 'Protein', ref: '<150 mg/24h' },
    { name: 'Sodium', ref: '40–220 mEq/L/day' },
    { name: 'Specific gravity', ref: '1.001–1.035' },
  ]},
]

const scoreColor = (pct: number) => {
  if (pct >= 75) return '#6b7c3a'
  if (pct >= 65) return '#c9a84c'
  if (pct >= 55) return '#c07040'
  return '#c0574a'
}

type AKEntry = { answer: string; topic?: string; concept?: string; system?: string; discipline?: string; options?: number }

function BreakdownTable({ title, data }: { title: string, data: Record<string, {correct:number,total:number}> }) {
  const rows = Object.entries(data).sort(([,a],[,b]) => (b.correct/b.total) - (a.correct/a.total))
  if (rows.length === 0) return null
  return (
    <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:16}}>
      <div style={{background:'#0d2340',padding:'11px 18px'}}>
        <div style={{fontSize:13,fontWeight:600,color:'white'}}>{title}</div>
      </div>
      <div style={{padding:'8px 0'}}>
        {rows.map(([name, s]) => {
          const pct = Math.round((s.correct/s.total)*100)
          return (
            <div key={name} style={{display:'flex',alignItems:'center',gap:12,padding:'7px 18px',borderBottom:'0.5px solid #faf8f4'}}>
              <div style={{width:160,fontSize:13,color:'#1a1008',flexShrink:0}}>{name}</div>
              <div style={{flex:1,height:7,background:'#f0ece0',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:scoreColor(pct),borderRadius:4}}/>
              </div>
              <div style={{width:36,fontSize:13,fontWeight:700,color:scoreColor(pct),textAlign:'right',flexShrink:0}}>{pct}%</div>
              <div style={{width:52,fontSize:11,color:'#a89870',flexShrink:0,textAlign:'right'}}>{s.correct}/{s.total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SYSTEM_NATIONAL_AVG: Record<string, number> = {
  'Cardiology': 71, 'Gastroenterology': 72, 'Musculoskeletal': 75, 'Dermatology': 75,
  'Neurology': 72, 'Psychiatry': 72, 'Hematology': 74, 'Immunology': 74,
  'Reproductive': 74, 'Endocrinology': 74, 'Pulmonology': 70, 'Nephrology': 70,
  'Epidemiology': 76, 'Biostatistics': 76, 'Biochemistry': 73, 'Genetics': 72,
  'Pharmacology': 75, 'Anatomy': 68, 'Behavioral Science': 83,
  'Infectious Disease': 70, 'Oncology': 74, 'Toxicology': 70,
  'Preventive Medicine': 76, 'Pediatrics': 74, 'Respiratory/Infectious Disease': 70,
}
const DISCIPLINE_NATIONAL_AVG: Record<string, number> = {
  'Pathology': 74, 'Pharmacology': 75, 'Microbiology': 72, 'Biochemistry': 73,
  'Physiology': 73, 'Anatomy': 68, 'Behavioral Science': 83, 'Genetics': 72,
  'Biostatistics': 76,
}
// Approximate midpoint of USMLE Step 1 content blueprint ranges
const STEP1_CONTENT_PCT: Record<string, number> = {
  'Neurology': 11, 'Cardiology': 11, 'Biochemistry': 19, 'Psychiatry': 12,
  'Behavioral Science': 12, 'Hematology': 9, 'Immunology': 8, 'Reproductive': 8,
  'Endocrinology': 8, 'Pulmonology': 8, 'Nephrology': 8, 'Gastroenterology': 8,
  'Musculoskeletal': 8, 'Epidemiology': 8, 'Genetics': 7, 'Infectious Disease': 8,
  'Pharmacology': 10, 'Pathology': 10, 'Microbiology': 10, 'Physiology': 10, 'Biostatistics': 8,
}

const Q220_SUBJECT_MAP: Record<number, {subject: string, subtopic: string}> = {
  1:{subject:'GENETICS',subtopic:'X-linked recessive inheritance'},
  2:{subject:'GENETICS',subtopic:'Pleiotropy (PKU)'},
  3:{subject:'GENETICS',subtopic:'Genomic imprinting — Prader-Willi syndrome'},
  4:{subject:'GENETICS',subtopic:'Fragile X syndrome (CGG repeat expansion)'},
  6:{subject:'GENETICS',subtopic:'Trisomy 18 (Edwards syndrome)'},
  26:{subject:'GENETICS',subtopic:'Lynch syndrome — microsatellite instability'},
  7:{subject:'BIOCHEMISTRY',subtopic:'Thiamine (B1) — Wernicke encephalopathy'},
  8:{subject:'BIOCHEMISTRY',subtopic:'Pompe disease (acid maltase deficiency)'},
  9:{subject:'BIOCHEMISTRY',subtopic:'Carcinoid tumor — tryptophan hydroxylase'},
  10:{subject:'BIOCHEMISTRY',subtopic:'DNA replication — fluoroquinolone mechanism'},
  11:{subject:'BIOCHEMISTRY',subtopic:'Gaucher disease (glucocerebrosidase deficiency)'},
  12:{subject:'BIOCHEMISTRY',subtopic:'Ehlers-Danlos syndrome — lysine/hydroxylysine cross-linking'},
  13:{subject:'BIOCHEMISTRY',subtopic:'Insulin — metabolic effects'},
  14:{subject:'BIOCHEMISTRY',subtopic:'Vitamin B12 deficiency — methylmalonyl-CoA mutase'},
  15:{subject:'BIOCHEMISTRY',subtopic:'Vitamin D deficiency — rickets'},
  16:{subject:'BIOCHEMISTRY',subtopic:'Pyridoxine (B6) — aminotransferase cofactor'},
  19:{subject:'BIOCHEMISTRY',subtopic:'Methemoglobinemia (dapsone-induced)'},
  32:{subject:'BIOCHEMISTRY',subtopic:'Enzyme kinetics — increased enzyme concentration'},
  5:{subject:'CELL BIOLOGY',subtopic:'Primary ciliary dyskinesia — dynein arm defect'},
  17:{subject:'CELL BIOLOGY',subtopic:'Apoptosis — intrinsic pathway (cytochrome c)'},
  18:{subject:'PATHOLOGY',subtopic:'Coagulative necrosis'},
  20:{subject:'PATHOLOGY',subtopic:'Acute inflammation — leukotriene B4 (chemotaxis)'},
  21:{subject:'PATHOLOGY',subtopic:'Wound healing — myofibroblasts'},
  22:{subject:'PATHOLOGY',subtopic:'Vascular permeability — endothelial junction separation'},
  23:{subject:'PATHOLOGY',subtopic:'Tuberculosis — granuloma (macrophages/Langhans cells)'},
  24:{subject:'IMMUNOLOGY',subtopic:'IL-2 — activates NK and cytotoxic T cells'},
  36:{subject:'IMMUNOLOGY',subtopic:'Chronic granulomatous disease — Serratia marcescens'},
  44:{subject:'IMMUNOLOGY',subtopic:'HIV — CCR5 coreceptor'},
  45:{subject:'IMMUNOLOGY',subtopic:'HIV opportunistic infections — PCP prophylaxis'},
  51:{subject:'IMMUNOLOGY',subtopic:'Aging — decreased vaccine responsiveness'},
  52:{subject:'IMMUNOLOGY',subtopic:'Chronic mucocutaneous candidiasis — T cell defect'},
  53:{subject:'IMMUNOLOGY',subtopic:'Goodpasture syndrome — type II hypersensitivity'},
  54:{subject:'IMMUNOLOGY',subtopic:'Acute cellular graft rejection'},
  55:{subject:'IMMUNOLOGY',subtopic:'Tetanus vaccine — denatured bacterial product'},
  56:{subject:'IMMUNOLOGY',subtopic:'Leukocyte adhesion deficiency (LAD) — β2-integrin'},
  57:{subject:'IMMUNOLOGY',subtopic:'Terminal complement deficiency — Neisseria infections'},
  59:{subject:'IMMUNOLOGY',subtopic:'Cyclosporine — mechanism of action'},
  120:{subject:'IMMUNOLOGY',subtopic:'SLE — anti-Sm antibodies'},
  37:{subject:'MICROBIOLOGY',subtopic:'S. pneumoniae — polysaccharide capsule'},
  38:{subject:'MICROBIOLOGY',subtopic:'Pseudomonas aeruginosa — Lipid A (endotoxin)'},
  39:{subject:'MICROBIOLOGY',subtopic:'Bordetella pertussis — increases intracellular cAMP'},
  40:{subject:'MICROBIOLOGY',subtopic:'Mycoplasma pneumoniae — atypical walking pneumonia'},
  41:{subject:'MICROBIOLOGY',subtopic:'Bacillus cereus — preformed emetic toxin'},
  42:{subject:'MICROBIOLOGY',subtopic:'Syphilis — transpeptidase (penicillin mechanism)'},
  43:{subject:'MICROBIOLOGY',subtopic:'Hepatitis C — needlestick transmission'},
  47:{subject:'MICROBIOLOGY',subtopic:'Amebiasis — Entamoeba histolytica'},
  48:{subject:'MICROBIOLOGY',subtopic:'Malaria — Plasmodium falciparum'},
  49:{subject:'MICROBIOLOGY',subtopic:'Cryptococcus neoformans'},
  50:{subject:'MICROBIOLOGY',subtopic:'Trichomonas vaginalis'},
  58:{subject:'MICROBIOLOGY',subtopic:'EBV — Hodgkin lymphoma'},
  112:{subject:'MICROBIOLOGY',subtopic:'Congenital rubella'},
  162:{subject:'MICROBIOLOGY',subtopic:'UTI — Staphylococcus saprophyticus'},
  166:{subject:'MICROBIOLOGY',subtopic:'Congenital toxoplasmosis'},
  25:{subject:'ONCOLOGY',subtopic:'TNM staging — mediastinal invasion (T4)'},
  27:{subject:'ONCOLOGY',subtopic:'Li-Fraumeni syndrome — TP53 mutation'},
  28:{subject:'ONCOLOGY',subtopic:'Prostate cancer — PSA tumor marker'},
  71:{subject:'ONCOLOGY',subtopic:'Testicular cancer — para-aortic lymph nodes'},
  93:{subject:'ONCOLOGY',subtopic:'Neuroblastoma — Homer-Wright rosettes'},
  137:{subject:'ONCOLOGY',subtopic:'Meningioma — arachnoid cap cells'},
  180:{subject:'ONCOLOGY',subtopic:'Lung cancer — cigarette smoking'},
  195:{subject:'ONCOLOGY',subtopic:'Bladder cancer — cigarette smoking'},
  29:{subject:'PHARMACOLOGY',subtopic:'Urge incontinence — muscarinic M3 antagonism'},
  30:{subject:'PHARMACOLOGY',subtopic:'Signal transduction — adenylyl cyclase (Gs)'},
  31:{subject:'PHARMACOLOGY',subtopic:'Dose-response — competitive antagonist'},
  33:{subject:'PHARMACOLOGY',subtopic:'Pharmacokinetics — bioavailability'},
  34:{subject:'PHARMACOLOGY',subtopic:'Clinical trials — Phase I'},
  35:{subject:'PHARMACOLOGY',subtopic:'CYP450 — griseofulvin as inducer'},
  46:{subject:'PHARMACOLOGY',subtopic:'HIV antiretrovirals — zidovudine (NRTI)'},
  116:{subject:'PHARMACOLOGY',subtopic:'Neuroleptic malignant syndrome — dantrolene'},
  118:{subject:'PHARMACOLOGY',subtopic:'Serotonin syndrome — sumatriptan'},
  143:{subject:'PHARMACOLOGY',subtopic:'Organophosphate poisoning — muscarinic antagonism'},
  151:{subject:'PHARMACOLOGY',subtopic:'Lithium monitoring — serum TSH'},
  152:{subject:'PHARMACOLOGY',subtopic:'Antipsychotics — chlorpromazine (low-potency)'},
  153:{subject:'PHARMACOLOGY',subtopic:'Alcohol withdrawal — lorazepam'},
  154:{subject:'PHARMACOLOGY',subtopic:'MDMA intoxication'},
  164:{subject:'PHARMACOLOGY',subtopic:'Thiazide diuretics — distal convoluted tubule'},
  165:{subject:'PHARMACOLOGY',subtopic:'Carbamazepine teratogenicity — neural tube defects'},
  60:{subject:'HEMATOLOGY',subtopic:'Sideroblastic anemia — isoniazid adverse effect'},
  61:{subject:'HEMATOLOGY',subtopic:'Lead poisoning — ALA dehydratase inhibition'},
  62:{subject:'HEMATOLOGY',subtopic:'Hemolytic disease of newborn — ABO incompatibility'},
  63:{subject:'HEMATOLOGY',subtopic:'Alpha thalassemia — cis deletion'},
  64:{subject:'HEMATOLOGY',subtopic:'Sickle cell anemia — Howell-Jolly bodies'},
  65:{subject:'HEMATOLOGY',subtopic:'Polycythemia vera — JAK2 mutation'},
  66:{subject:'HEMATOLOGY',subtopic:'AML — myeloperoxidase (MPO)'},
  67:{subject:'HEMATOLOGY',subtopic:'Multiple myeloma — osteoclast activating factors'},
  68:{subject:'HEMATOLOGY',subtopic:'Hemolytic uremic syndrome — lab findings'},
  69:{subject:'HEMATOLOGY',subtopic:'Hemophilia — conversion of factor X'},
  70:{subject:'HEMATOLOGY',subtopic:'Warfarin — γ-carboxylation of glutamate residues'},
  72:{subject:'CARDIOVASCULAR',subtopic:'Beta-1 adrenoreceptor antagonism'},
  75:{subject:'CARDIOVASCULAR',subtopic:'Tetralogy of Fallot — right axis deviation'},
  76:{subject:'CARDIOVASCULAR',subtopic:'Eisenmenger syndrome — right ventricular hypertrophy'},
  77:{subject:'CARDIOVASCULAR',subtopic:'Cor pulmonale — increased capillary hydrostatic pressure'},
  78:{subject:'CARDIOVASCULAR',subtopic:'Hypovolemic shock — hemodynamic findings'},
  79:{subject:'CARDIOVASCULAR',subtopic:'Restrictive cardiomyopathy — cardiac sarcoidosis'},
  80:{subject:'CARDIOVASCULAR',subtopic:'Heart sounds — S1 (mitral valve closure)'},
  81:{subject:'CARDIOVASCULAR',subtopic:'S3 heart sound — increased LV end-systolic volume'},
  82:{subject:'CARDIOVASCULAR',subtopic:'Post-MI complication — Dressler syndrome'},
  83:{subject:'CARDIOVASCULAR',subtopic:'Infective endocarditis — antigen-antibody complex deposition'},
  84:{subject:'CARDIOVASCULAR',subtopic:'Wolff-Parkinson-White — slurred upstroke of QRS'},
  85:{subject:'CARDIOVASCULAR',subtopic:'Polyarteritis nodosa'},
  86:{subject:'CARDIOVASCULAR',subtopic:'Familial hyperchylomicronemia — acute pancreatitis'},
  87:{subject:'CARDIOVASCULAR',subtopic:'Statins — elevated creatine kinase'},
  73:{subject:'EMBRYOLOGY',subtopic:'Branchial arch derivatives — incus (1st arch)'},
  74:{subject:'EMBRYOLOGY',subtopic:'Persistent truncus arteriosus — neural crest failure'},
  167:{subject:'EMBRYOLOGY',subtopic:'Vitelline duct — Meckel diverticulum'},
  88:{subject:'HEAD & NECK',subtopic:'Superior laryngeal nerve — voice pitch limitation'},
  89:{subject:'ENDOCRINOLOGY',subtopic:'Graves disease — TSH receptor autoantibodies'},
  90:{subject:'ENDOCRINOLOGY',subtopic:'Thyroid-binding globulin in pregnancy'},
  91:{subject:'ENDOCRINOLOGY',subtopic:'Secondary hyperparathyroidism (CKD)'},
  92:{subject:'ENDOCRINOLOGY',subtopic:'Diabetes insipidus — posterior pituitary'},
  94:{subject:'ENDOCRINOLOGY',subtopic:'Primary adrenal insufficiency (Addison disease)'},
  95:{subject:'ENDOCRINOLOGY',subtopic:'Glucagonoma — pancreatic α-cells'},
  96:{subject:'ENDOCRINOLOGY',subtopic:'Type 2 diabetes — islet amyloid polypeptide (amylin)'},
  97:{subject:'ENDOCRINOLOGY',subtopic:'Cushing syndrome — small cell lung cancer (ectopic ACTH)'},
  99:{subject:'ENDOCRINOLOGY',subtopic:'MEN 2 — RET proto-oncogene mutation'},
  100:{subject:'ENDOCRINOLOGY',subtopic:'G protein-coupled receptors (TSH receptor)'},
  101:{subject:'ENDOCRINOLOGY',subtopic:'Sulfonylureas — ATP-sensitive K+ channels'},
  98:{subject:'GASTROENTEROLOGY',subtopic:'Hemochromatosis — defective transferrin receptor binding'},
  102:{subject:'GASTROENTEROLOGY',subtopic:'Chagas disease — absence of myenteric plexus neurons'},
  103:{subject:'GASTROENTEROLOGY',subtopic:'Mallory-Weiss syndrome'},
  104:{subject:'GASTROENTEROLOGY',subtopic:'Peptic ulcer disease — H. pylori'},
  105:{subject:'GASTROENTEROLOGY',subtopic:'Whipple disease — intracellular gram-positive bacilli'},
  106:{subject:'GASTROENTEROLOGY',subtopic:'Hirschsprung disease — impaired neural crest migration'},
  107:{subject:'GASTROENTEROLOGY',subtopic:'Crohn disease — Th1 cell-mediated inflammation'},
  108:{subject:'GASTROENTEROLOGY',subtopic:'Portal hypertension — superior epigastric vein (caput medusae)'},
  109:{subject:'GASTROENTEROLOGY',subtopic:'Hepatitis B serology — chronic active infection'},
  110:{subject:'GASTROENTEROLOGY',subtopic:'Acute cholecystitis — cystic duct obstruction'},
  111:{subject:'GASTROENTEROLOGY',subtopic:'Pancreatic cancer — biliary obstruction/neoplasia'},
  113:{subject:'DERMATOLOGY',subtopic:'Tinea versicolor — Malassezia globosa'},
  114:{subject:'DERMATOLOGY',subtopic:'Pemphigus vulgaris — desmosomes'},
  115:{subject:'DERMATOLOGY',subtopic:'Basal cell carcinoma'},
  117:{subject:'NEUROLOGY',subtopic:'Myasthenia gravis — decreased end plate potential'},
  126:{subject:'NEUROLOGY',subtopic:'Visual pathway — Meyer loop (temporal lobe)'},
  127:{subject:'NEUROLOGY',subtopic:'Horner syndrome — Pancoast tumor'},
  128:{subject:'NEUROLOGY',subtopic:'CN III palsy — posterior communicating artery aneurysm'},
  129:{subject:'NEUROLOGY',subtopic:'Facial nerve (CN VII) — Bell palsy/schwannoma'},
  130:{subject:'NEUROLOGY',subtopic:'Dorsal column tract — vitamin B12 deficiency'},
  131:{subject:'NEUROLOGY',subtopic:'Huntington disease — caudate nucleus atrophy'},
  132:{subject:'NEUROLOGY',subtopic:'Epidural hematoma'},
  133:{subject:'NEUROLOGY',subtopic:'Stroke — left anterior cerebral artery'},
  134:{subject:'NEUROLOGY',subtopic:'Multiple sclerosis — Th1 cell-mediated demyelination'},
  135:{subject:'NEUROLOGY',subtopic:'Neurofibromatosis type 2 — meningioma'},
  136:{subject:'NEUROLOGY',subtopic:'Anterior cord syndrome'},
  138:{subject:'NEUROLOGY',subtopic:'Narcolepsy — decreased orexin-A'},
  139:{subject:'NEUROLOGY',subtopic:'Poliomyelitis — hyporeflexia (LMN signs)'},
  140:{subject:'NEUROLOGY',subtopic:'Guillain-Barré syndrome — Schwann cells'},
  141:{subject:'NEUROLOGY',subtopic:'Alzheimer disease — extracellular amyloid plaques'},
  142:{subject:'NEUROLOGY',subtopic:'Radial nerve palsy — mid-shaft humerus fracture'},
  119:{subject:'PHYSIOLOGY',subtopic:'Muscle contraction — troponin C'},
  121:{subject:'RHEUMATOLOGY',subtopic:'Systemic sclerosis — telangiectasias (CREST)'},
  122:{subject:'RHEUMATOLOGY',subtopic:'Rheumatoid arthritis — granulation tissue (pannus)'},
  123:{subject:'RHEUMATOLOGY',subtopic:'Reactive arthritis — HLA-B27'},
  124:{subject:'RHEUMATOLOGY',subtopic:'Dermatomyositis — malignancy association'},
  125:{subject:'MUSCULOSKELETAL',subtopic:'Paget disease of bone'},
  169:{subject:'GYNECOLOGY',subtopic:'PCOS — endometrial carcinoma risk'},
  170:{subject:'GYNECOLOGY',subtopic:'Menopause — increased FSH'},
  171:{subject:'GYNECOLOGY',subtopic:'Turner syndrome — aortic stenosis'},
  172:{subject:'GYNECOLOGY',subtopic:'Turner syndrome — aortic stenosis (variant)'},
  173:{subject:'GYNECOLOGY',subtopic:'Aromatase deficiency'},
  174:{subject:'GYNECOLOGY',subtopic:'Adenomyosis — endometrial tissue in uterine wall'},
  175:{subject:'GYNECOLOGY',subtopic:'PID — ectopic pregnancy'},
  163:{subject:'UROLOGY',subtopic:'Stress urinary incontinence — urethral hypermobility'},
  176:{subject:'UROLOGY',subtopic:'Communicating hydrocele — patent processus vaginalis'},
  177:{subject:'PULMONOLOGY',subtopic:'Influenza pneumonia — type II pneumocytes'},
  178:{subject:'PULMONOLOGY',subtopic:'ABG interpretation — acute respiratory acidosis'},
  179:{subject:'PULMONOLOGY',subtopic:'Severe asthma — physical exam and CXR findings'},
  181:{subject:'PULMONOLOGY',subtopic:'COPD — emphysema'},
  182:{subject:'PULMONOLOGY',subtopic:'Cystic fibrosis — absence of vas deferens'},
  183:{subject:'PULMONOLOGY',subtopic:'Cystic fibrosis — infertility (repeated)'},
  184:{subject:'PULMONOLOGY',subtopic:'Sarcoidosis — elevated CD4+ T cells in BAL'},
  185:{subject:'PULMONOLOGY',subtopic:'Pulmonary fibrosis — excess collagen deposition'},
  186:{subject:'PULMONOLOGY',subtopic:'Pulmonary fibrosis — collagen deposition (variant)'},
  187:{subject:'PULMONOLOGY',subtopic:'Pulmonary embolism — DVT'},
  188:{subject:'PULMONOLOGY',subtopic:'Severe asthma — omalizumab mechanism'},
  144:{subject:'PSYCHIATRY',subtopic:'Stages of behavioral change — contemplation'},
  145:{subject:'PSYCHIATRY',subtopic:'Borderline personality disorder — splitting'},
  146:{subject:'PSYCHIATRY',subtopic:'Schizophreniform disorder'},
  147:{subject:'PSYCHIATRY',subtopic:'Major depressive disorder'},
  148:{subject:'PSYCHIATRY',subtopic:'Antisocial personality disorder'},
  149:{subject:'PSYCHIATRY',subtopic:'Anorexia nervosa — fractures/osteoporosis'},
  150:{subject:'PSYCHIATRY',subtopic:'Bipolar disorder — venlafaxine risk'},
  155:{subject:'RENAL',subtopic:'Acute tubular necrosis — tubular basement membrane'},
  156:{subject:'RENAL',subtopic:'Salicylate toxicity — mixed acid-base disorder'},
  157:{subject:'RENAL',subtopic:'Renal tubular physiology — H+/K+ antiporter'},
  158:{subject:'RENAL',subtopic:'Prerenal AKI — volume depletion'},
  159:{subject:'RENAL',subtopic:'Poststreptococcal GN — granular immune deposits'},
  160:{subject:'RENAL',subtopic:'Diabetic nephropathy — hyaline arteriolosclerosis'},
  161:{subject:'RENAL',subtopic:'Struvite stones — magnesium ammonium phosphate'},
  168:{subject:'PEDIATRICS',subtopic:'Developmental milestones — 2-year-old'},
  189:{subject:'EPIDEMIOLOGY',subtopic:'Measures of association — relative risk'},
  190:{subject:'EPIDEMIOLOGY',subtopic:'Diagnostic testing — lowering threshold increases NPV'},
  191:{subject:'EPIDEMIOLOGY',subtopic:'Precision — interrater reliability'},
  192:{subject:'EPIDEMIOLOGY',subtopic:'Case-control study design'},
  193:{subject:'EPIDEMIOLOGY',subtopic:'Confidence intervals and p-values'},
  194:{subject:'EPIDEMIOLOGY',subtopic:'Statistical power — decrease type II error'},
  196:{subject:'PUBLIC HEALTH',subtopic:'Demographic transition — childhood immunization'},
  197:{subject:'MEDICAL ETHICS',subtopic:'Informed consent — parental refusal/pediatric pain'},
  198:{subject:'MEDICAL ETHICS',subtopic:'Confidentiality — HIPAA/disclosing to family'},
  199:{subject:'MEDICAL ETHICS',subtopic:'Language barriers — professional interpreter'},
  200:{subject:'CHILD ABUSE',subtopic:'Shaken baby syndrome — subdural hematoma'},
}

function NBMEBreakdownTable({ title, data, avgLookup }: { title: string, data: Record<string, {correct:number,total:number}>, avgLookup?: Record<string, number> }) {
  const rows = Object.entries(data).sort(([,a],[,b]) => {
    const pctA = a.total > 0 ? a.correct / a.total : 0
    const pctB = b.total > 0 ? b.correct / b.total : 0
    return pctB - pctA
  })
  if (rows.length === 0) return null
  return (
    <div style={{border:'1px solid #ccc8be',borderRadius:8,overflow:'hidden',marginBottom:14}}>
      <div style={{background:'#d6eeec',padding:'8px 16px'}}>
        <div style={{fontSize:12,fontWeight:700,color:'#0d2340',letterSpacing:'0.03em'}}>{title}</div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',background:'white'}}>
        <thead>
          <tr style={{borderBottom:'1px solid #e0dbd0',background:'#fafaf8'}}>
            <th style={{padding:'6px 16px',textAlign:'left',fontSize:11,color:'#6b6050',fontWeight:400,width:'35%'}}></th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:11,color:'#6b6050',fontWeight:500,width:'11%'}}>Your Score</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,borderLeft:'1px solid #e8e4dc',width:'8%'}}>Correct</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,width:'7%'}}>Total</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,borderLeft:'1px solid #e8e4dc',width:'9%'}}>Priority</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,borderLeft:'1px solid #e8e4dc',width:'10%'}}>Lower</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,width:'10%'}}>Same</th>
            <th style={{padding:'6px 10px',textAlign:'center',fontSize:10,color:'#6b6050',fontWeight:500,width:'10%'}}>Higher</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, s]) => {
            const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
            const nationalAvg = avgLookup?.[name] ?? 70
            const diff = pct - nationalAvg
            const col = diff > 5 ? 'higher' : diff < -5 ? 'lower' : 'same'
            const priorityDot = pct < 65 ? '🔴' : pct < 85 ? '🟡' : '🟢'
            const priorityLabel = pct < 65 ? 'HIGH' : pct < 85 ? 'MOD' : 'STR'
            return (
              <tr key={name} style={{borderBottom:'0.5px solid #f0ece0'}}>
                <td style={{padding:'9px 16px',fontSize:13,color:'#1a1008'}}>{name}</td>
                <td style={{padding:'9px 10px',textAlign:'center',fontSize:13,fontWeight:700,color:scoreColor(pct)}}>{pct}%</td>
                <td style={{padding:'9px 10px',textAlign:'center',fontSize:12,fontWeight:600,color:scoreColor(pct),borderLeft:'1px solid #f0ece0'}}>{s.correct}</td>
                <td style={{padding:'9px 10px',textAlign:'center',fontSize:12,color:'#8a7d6a'}}>{s.total}</td>
                <td style={{padding:'9px 10px',textAlign:'center',borderLeft:'1px solid #f0ece0'}}>
                  <span title={priorityLabel} style={{fontSize:14}}>{priorityDot}</span>
                </td>
                <td style={{padding:'9px 10px',textAlign:'center',borderLeft:'1px solid #f0ece0'}}>
                  {col === 'lower' && <div style={{width:18,height:18,background:'#2a8f8a',borderRadius:3,margin:'0 auto'}}/>}
                </td>
                <td style={{padding:'9px 10px',textAlign:'center'}}>
                  {col === 'same' && <div style={{width:18,height:18,background:'#2a8f8a',borderRadius:3,margin:'0 auto'}}/>}
                </td>
                <td style={{padding:'9px 10px',textAlign:'center'}}>
                  {col === 'higher' && <div style={{width:18,height:18,background:'#2a8f8a',borderRadius:3,margin:'0 auto'}}/>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function ExamCenter() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [view, setView] = useState<'list'|'exam'|'results'>('list')
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Active exam
  const [activeSession, setActiveSession] = useState<any>(null)
  const [activeSheet, setActiveSheet] = useState<any>(null)

  // PDF exam state
  const [pdfUrl, setPdfUrl] = useState<string|null>(null)
  const [answerKey, setAnswerKey] = useState<Record<string, AKEntry>>({})
  const [resultsFilter, setResultsFilter] = useState<'all'|'correct'|'incorrect'>('all')
  const [resultsTab, setResultsTab] = useState<'report'|'weakness'|'questions'|'progress'>('report')
  const [expandedWeaknessRows, setExpandedWeaknessRows] = useState<Set<string>>(new Set())
  const [expandedQ220Subjects, setExpandedQ220Subjects] = useState<Set<string>>(new Set())
  const [showPriorityList, setShowPriorityList] = useState(false)
  const [showStudyChecklist, setShowStudyChecklist] = useState(false)
  const [checkedQuestions, setCheckedQuestions] = useState<Set<number>>(new Set())
  const [showTimingSection, setShowTimingSection] = useState(false)
  const [showFocusSection, setShowFocusSection] = useState(true)
  const [showBreakdownSection, setShowBreakdownSection] = useState(true)
  const [showTopicFullBreakdown, setShowTopicFullBreakdown] = useState(false)
  const [qReviewGrouped, setQReviewGrouped] = useState(true)
  const [focusLinks, setFocusLinks] = useState<Record<string,string>>(() => {
    try { const s = localStorage.getItem('stepup_focus_links'); return s ? JSON.parse(s) : {} } catch { return {} }
  })
  const [isAdminView, setIsAdminView] = useState(false)
  const searchParams = useSearchParams()
  const [editingLink, setEditingLink] = useState<string|null>(null)
  const [editLinkVal, setEditLinkVal] = useState('')
  const [currentSection, setCurrentSection] = useState(1)
  const [sectionAnswers, setSectionAnswers] = useState<Record<number, Record<number, string>>>({1:{},2:{},3:{},4:{}})
  const [sectionTimeLeft, setSectionTimeLeft] = useState(0)
  const [sectionMinutes, setSectionMinutes] = useState(60)
  const [sectionSubmitted, setSectionSubmitted] = useState([false,false,false,false])

  // PDF page navigation
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(900)
  const [zoomLevel, setZoomLevel] = useState(1)
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Overlays
  const [showLabValues, setShowLabValues] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcDisplay, setCalcDisplay] = useState('0')
  const [calcPrev, setCalcPrev] = useState('')
  const [calcOp, setCalcOp] = useState<string|null>(null)
  const [calcFresh, setCalcFresh] = useState(true)

  // Passcode modal
  const [showPasscode, setShowPasscode] = useState(false)
  const [passcodeInput, setPasscodeInput] = useState('')
  const [pendingExam, setPendingExam] = useState<any>(null)
  const [launching, setLaunching] = useState(false)
  const [launchingExamId, setLaunchingExamId] = useState<string|null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [launchProgress, setLaunchProgress] = useState(0)
  const timerRef = useRef<any>(null)
  const submitSectionRef = useRef<() => void>(() => {})
  const pdfBlobUrlRef = useRef<string|null>(null)
  const sectionSubmittingRef = useRef(false)
  const pendingAdminSessionRef = useRef<Record<string,unknown>|null>(null)
  const viewSessionReportRef = useRef<((s: Record<string,unknown>) => void)|null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // When browser restores this page from bfcache (back button), reset to list view
  // so the Resume banner appears instead of a stale exam state
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        clearInterval(timerRef.current)
        if (pdfBlobUrlRef.current) { URL.revokeObjectURL(pdfBlobUrlRef.current); pdfBlobUrlRef.current = null }
        sectionSubmittingRef.current = false
        setView('list')
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/'); return }
        setUser(user)
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(profileData)
        const [{ data: examData }, { data: sessionData }] = await Promise.all([
          supabase.from('exams').select('*').eq('is_live', true).order('sort_order'),
          supabase.from('exam_sessions').select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
        ])
        setExams(examData || [])
        setPastSessions(sessionData || [])

        // Admin/tutor: if ?session=<id> in URL, load that student's report directly
        const targetSessionId = searchParams.get('session')
        if (targetSessionId && (profileData?.role === 'admin' || profileData?.role === 'tutor')) {
          const { data: targetSession } = await supabase
            .from('exam_sessions')
            .select('*, answer_sheets(*)')
            .eq('id', targetSessionId)
            .single()
          if (targetSession) {
            setIsAdminView(true)
            // viewSessionReport is defined below; call it after state settles
            pendingAdminSessionRef.current = targetSession
          }
        }
      } catch (e) {
        console.error('init error:', e)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Section timer — restarts on section change
  useEffect(() => {
    if (view !== 'exam') return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setSectionTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); submitSectionRef.current(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [view, currentSection])

  // Set PDF render width when entering exam view
  useEffect(() => {
    if (view === 'exam' && pdfContainerRef.current) {
      setPdfWidth(pdfContainerRef.current.clientWidth - 32)
    }
  }, [view])

  // Admin/tutor: once loading finishes, auto-load the pending student session report
  useEffect(() => {
    if (!loading && pendingAdminSessionRef.current) {
      const session = pendingAdminSessionRef.current
      pendingAdminSessionRef.current = null
      viewSessionReportRef.current?.(session)
    }
  }, [loading])


  const parseTimeLimit = (timeStr: string) => {
    if (!timeStr) return 240
    const match = timeStr.match(/(\d+\.?\d*)\s*hr/)
    if (match) return Math.round(parseFloat(match[1]) * 60)
    return 240
  }

  const revokePdfBlob = () => {
    if (pdfBlobUrlRef.current) { URL.revokeObjectURL(pdfBlobUrlRef.current); pdfBlobUrlRef.current = null }
  }

  const handleBackFromResults = () => {
    revokePdfBlob()
    if (isAdminView) {
      const ret = searchParams.get('return')
      router.push(ret ? decodeURIComponent(ret) : profile?.role === 'tutor' ? '/tutor' : '/admin?tab=examperformance')
    } else { setView('list'); setActiveSession(null); setActiveSheet(null); setResults(null) }
  }

  const fetchPdfAsBlob = async (signedUrl: string | null, onProgress: (pct: number) => void): Promise<string | null> => {
    if (!signedUrl) return null
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    try {
      const resp = await fetch(signedUrl, { signal: controller.signal })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const total = parseInt(resp.headers.get('content-length') || '0', 10)
      if (resp.body && total > 0) {
        const reader = resp.body.getReader()
        const chunks: Uint8Array[] = []
        let loaded = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) { chunks.push(value); loaded += value.length }
          onProgress(Math.round((loaded / total) * 100))
        }
        const blob = new Blob(chunks as BlobPart[], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        pdfBlobUrlRef.current = url
        return url
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      pdfBlobUrlRef.current = url
      return url
    } catch (e) {
      console.error('[fetchPdfAsBlob] failed, using direct URL', e)
      return signedUrl
    } finally {
      clearTimeout(timeout)
    }
  }

  const getSignedUrl = async (bucket: string, pathOrUrl: string) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http')) return pathOrUrl
    const { data } = await supabase.storage.from(bucket).createSignedUrl(pathOrUrl, 7200)
    return data?.signedUrl || null
  }

  const parseAnswerKey = (json: any): Record<string, AKEntry> => {
    // Unwrap nested { questions: { "1": {...} } } format
    const data = (json && typeof json === 'object' && !Array.isArray(json) && json.questions)
      ? json.questions
      : json

    const toEntry = (v: any): AKEntry => ({
      answer: v.answer != null ? String(v.answer).toUpperCase() : '',
      system: v.system,
      discipline: v.subject ?? v.discipline ?? v.system,
      topic: v.topic,
      concept: v.concept ?? v.description,
      options: v.options ? Number(v.options) : undefined,
    })
    if (Array.isArray(data)) {
      const out: Record<string, AKEntry> = {}
      data.forEach((item: any) => {
        const q = item.question_number ?? item.question ?? item.q ?? item.num ?? item.number
        if (q != null) out[String(q)] = toEntry(item)
      })
      return out
    }
    return Object.fromEntries(
      Object.entries(data)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([k, v]) => [String(k), toEntry(v)])
    )
  }

  const launchExam = async (exam: any, timeMult = 1) => {
    setShowPasscode(false)
    setLaunching(true)
    setLaunchingExamId(exam.id)

    setLaunchProgress(0)
    const signedPdf = await getSignedUrl('exam-pdfs', exam.pdf_url || '')
    const pdf = await fetchPdfAsBlob(signedPdf, pct => setLaunchProgress(pct))

    let key: Record<string, AKEntry> = {}
    if (exam.answer_key_url) {
      const keyUrl = await getSignedUrl('exam-keys', exam.answer_key_url)
      console.log('[answerKey] url:', keyUrl)
      if (keyUrl) {
        try {
          const resp = await fetch(keyUrl, { cache: 'no-store' })
          const raw = await resp.json()
          console.log('[answerKey] raw sample:', JSON.stringify(raw).slice(0, 300))
          key = parseAnswerKey(raw)
          console.log('[answerKey] parsed entries:', Object.keys(key).length)
        } catch (e) {
          console.error('[answerKey] Failed to load answer key', e)
        }
      }
    }

    const baseSecMins = exam.time_per_section_minutes || Math.round(parseTimeLimit(exam.time_limit) / 4)
    const secMins = Math.round(baseSecMins * timeMult)
    const totalMinutes = secMins * (exam.section_count || 4)
    const totalQ = exam.questions || 200

    const { data: session, error: sErr } = await supabase.from('exam_sessions').insert({
      student_id: user.id, exam_id: exam.id, exam_name: exam.name,
      started_at: new Date().toISOString(),
      time_limit_minutes: totalMinutes, total_questions: totalQ, status: 'in_progress'
    }).select().single()
    if (sErr) { setLaunching(false); setLaunchingExamId(null); alert('Failed to start exam session.'); return }

    // Save resume state — requires SQL migration; fails silently if not yet run
    supabase.from('exam_sessions').update({
      current_section: 1, section_started_at: new Date().toISOString(),
      sections_submitted: [], section_minutes: secMins,
    }).eq('id', session.id).then(() => {})

    const { data: sheet } = await supabase.from('answer_sheets').insert({
      exam_session_id: session.id, student_id: user.id,
      exam_name: exam.name, total_questions: totalQ, answers: {}
    }).select().single()

    // Add new session to pastSessions immediately so Resume banner shows if student presses back
    setPastSessions(prev => [{
      ...session, answer_sheets: sheet ? [sheet] : [],
      current_section: 1, sections_submitted: [], section_minutes: secMins,
      section_started_at: new Date().toISOString(),
    }, ...prev])

    setActiveSession(session)
    setActiveSheet(sheet)
    setPdfUrl(pdf)
    setAnswerKey(key)
    setCurrentSection(1)
    setSectionAnswers({1:{},2:{},3:{},4:{}})
    setSectionMinutes(secMins)
    setSectionTimeLeft(secMins * 60)
    setSectionSubmitted([false,false,false,false])
    setPdfPage(1)
    setLaunching(false)
    setLaunchingExamId(null)
    setView('exam')
  }

  const startExam = (exam: any) => {
    const codes = exam.accommodation_codes
    const hasCodes = Array.isArray(codes) && codes.length > 0
    if (hasCodes) {
      setPendingExam(exam)
      setPasscodeInput('')
      setShowPasscode(true)
    } else {
      launchExam(exam, 1)
    }
  }

  const handlePasscodeSubmit = (skip = false) => {
    if (!pendingExam) return
    if (skip) { launchExam(pendingExam, 1); return }
    const codes: {code: string, multiplier: number}[] = pendingExam.accommodation_codes || []
    const match = codes.find(c => c.code.toLowerCase() === passcodeInput.trim().toLowerCase())
    launchExam(pendingExam, match ? match.multiplier : 1)
  }

  const saveSectionAnswer = async (qNum: number, answer: string) => {
    if (!activeSheet?.id) return
    const updated = {
      ...sectionAnswers,
      [currentSection]: {...(sectionAnswers[currentSection] || {}), [qNum]: answer}
    }
    setSectionAnswers(updated)
    const allAnswers = Object.values(updated).reduce((acc, sec) => ({...acc, ...sec}), {})
    try {
      await supabase.from('answer_sheets').update({answers: allAnswers}).eq('id', activeSheet.id)
    } catch (e) { console.error('saveSectionAnswer failed:', e) }
  }

  const submitExam = async (timeUp = false) => {
    if (!activeSession) return
    setSubmitting(true)
    clearInterval(timerRef.current)
    revokePdfBlob()

    try {
      const sheetId = activeSheet?.id
      const allAnswers: Record<string, any> = {}

      if (sheetId) {
        const { data: sheetData } = await supabase.from('answer_sheets').select('answers').eq('id', sheetId).single()
        if (sheetData?.answers) Object.assign(allAnswers, sheetData.answers)
      }

      const submittedAt = new Date()
      const startedAt = new Date(activeSession.started_at)
      const actualMinutes = Math.round((submittedAt.getTime() - startedAt.getTime()) / 60000)
      const withinLimit = actualMinutes <= (activeSession.time_limit_minutes || 240)
      const totalQ = activeSession.total_questions

      let correct = 0
      const systemBreakdown: Record<string, {correct:number, total:number}> = {}
      const topicBreakdown: Record<string, {correct:number, total:number}> = {}
      const disciplineBreakdown: Record<string, {correct:number, total:number}> = {}
      const questionDetails: {qNum:number, studentAnswer:string, correctAnswer:string, correct:boolean, system?:string, topic?:string, concept?:string, discipline?:string}[] = []

      const tally = (bd: Record<string, {correct:number,total:number}>, key: string|undefined, isCorrect: boolean) => {
        if (!key) return
        if (!bd[key]) bd[key] = {correct:0, total:0}
        bd[key].total++
        if (isCorrect) bd[key].correct++
      }

      if (is200QExam(activeSession.exam_name || '')) {
        for (const qd of gradeWith200QKey(allAnswers)) {
          if (qd.correct) correct++
          tally(systemBreakdown, qd.system, qd.correct)
          tally(topicBreakdown, qd.topic, qd.correct)
          tally(disciplineBreakdown, qd.discipline, qd.correct)
          questionDetails.push({ qNum: qd.qNum, studentAnswer: qd.studentAnswer, correctAnswer: qd.correctAnswer, correct: qd.correct, system: qd.system, topic: qd.topic, discipline: qd.discipline })
        }
      } else {
        for (let qNum = 1; qNum <= totalQ; qNum++) {
          const sa = String(allAnswers[String(qNum)] ?? allAnswers[qNum] ?? '').toUpperCase() || ''
          const entry = answerKey[String(qNum)]
          if (!entry) continue
          const isCorrect = !!sa && sa === entry.answer
          if (isCorrect) correct++
          tally(systemBreakdown, entry.system, isCorrect)
          tally(topicBreakdown, entry.topic, isCorrect)
          tally(disciplineBreakdown, entry.discipline, isCorrect)
          questionDetails.push({ qNum, studentAnswer: sa || '—', correctAnswer: entry.answer, correct: isCorrect, system: entry.system, topic: entry.topic, concept: entry.concept, discipline: entry.discipline })
        }
      }

      // 220Q Assessment: override system/discipline/topic with hardcoded map
      if ((activeSession.exam_name || '').toLowerCase().includes('220q assessment')) {
        for (const k of Object.keys(systemBreakdown)) delete systemBreakdown[k]
        for (const k of Object.keys(topicBreakdown)) delete topicBreakdown[k]
        for (const k of Object.keys(disciplineBreakdown)) delete disciplineBreakdown[k]
        for (const qd of questionDetails) {
          const mapped = Q220_SUBJECT_MAP[qd.qNum]
          if (mapped) { qd.system = mapped.subject; qd.discipline = mapped.subject; qd.topic = mapped.subtopic }
          tally(systemBreakdown, qd.system, qd.correct)
          tally(topicBreakdown, qd.topic, qd.correct)
          tally(disciplineBreakdown, qd.discipline, qd.correct)
        }
      }

      const gradedTotal = is200QExam(activeSession.exam_name || '') ? questionDetails.length : totalQ
      const wrongCount = gradedTotal - correct
      const percentCorrect = Math.round((correct / gradedTotal) * 100)
      const predictedStep1 = calcStep1Score(activeSession.exam_name, wrongCount, percentCorrect)

      await supabase.from('exam_sessions').update({
        submitted_at: submittedAt.toISOString(), actual_minutes: actualMinutes,
        within_limit: withinLimit, status: 'submitted',
        score: correct, wrong_count: wrongCount, total_questions: gradedTotal,
        percent_correct: percentCorrect, predicted_step1: predictedStep1,
      }).eq('id', activeSession.id)

      const logRows = questionDetails
        .filter(q => q.system || q.topic || q.discipline)
        .map(q => ({ student_id: user.id, exam_session_id: activeSession.id, question_number: q.qNum, system: q.system || null, topic: q.topic || null, discipline: q.discipline || null, correct: q.correct }))
      if (logRows.length > 0) await supabase.from('exam_question_logs').insert(logRows)

      const { data: sessionData } = await supabase.from('exam_sessions')
        .select('*, answer_sheets(*)').eq('student_id', user.id).order('created_at', {ascending: false})
      setPastSessions(sessionData || [])

      setResultsFilter('all')
      setResultsTab('report')
      setResults({ correct, wrongCount, totalQ, percentCorrect, predictedStep1, actualMinutes, withinLimit, examName: activeSession.exam_name, examId: activeSession.exam_id, timeUp, systemBreakdown, topicBreakdown, disciplineBreakdown, questionDetails })
      setView('results')
    } catch (err) {
      console.error('submitExam error:', err)
      alert('Something went wrong generating your score report. Your answers have been saved — contact your admin if this persists.')
      setView('list')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSection = async (timeUp = false) => {
    if (sectionSubmittingRef.current || sectionSubmitted[currentSection - 1]) return
    sectionSubmittingRef.current = true
    clearInterval(timerRef.current)
    const newSubmitted = [...sectionSubmitted]
    newSubmitted[currentSection - 1] = true
    setSectionSubmitted(newSubmitted)
    if (currentSection < 4) {
      const next = currentSection + 1
      const submittedNums = newSubmitted.map((v, i) => v ? i + 1 : null).filter(Boolean) as number[]
      if (activeSession) {
        await supabase.from('exam_sessions').update({
          current_section: next,
          section_started_at: new Date().toISOString(),
          sections_submitted: submittedNums,
        }).eq('id', activeSession.id)
      }
      setCurrentSection(next)
      setSectionTimeLeft(sectionMinutes * 60)
      setPdfPage(BLOCK_PAGES[next - 1].start)
      sectionSubmittingRef.current = false
    } else {
      await submitExam(timeUp)
      sectionSubmittingRef.current = false
    }
  }
  useEffect(() => { submitSectionRef.current = () => submitSection(true) })

  const resumeExam = async (session: any) => {
    setLaunching(true)
    setLaunchingExamId(session.exam_id)

    const { data: examData } = await supabase.from('exams').select('*').eq('id', session.exam_id).single()
    if (!examData) { setLaunching(false); setLaunchingExamId(null); alert('Could not load exam. Contact your admin.'); return }

    setLaunchProgress(0)
    const signedPdf = await getSignedUrl('exam-pdfs', examData.pdf_url || '')
    const pdf = await fetchPdfAsBlob(signedPdf, pct => setLaunchProgress(pct))
    let key: Record<string, AKEntry> = {}
    if (examData.answer_key_url) {
      const keyUrl = await getSignedUrl('exam-keys', examData.answer_key_url)
      if (keyUrl) {
        try {
          const resp = await fetch(keyUrl, { cache: 'no-store' })
          key = parseAnswerKey(await resp.json())
        } catch (e) { console.error('[resumeExam] answer key load failed', e) }
      }
    }

    const sheet = session.answer_sheets?.[0]
    const savedAnswers: Record<number, Record<number, string>> = {1:{},2:{},3:{},4:{}}

    // Use answers from the already-joined init() data; fall back to a fresh fetch
    let rawAnswers: Record<string, string> | null = sheet?.answers ?? null
    if (!rawAnswers && sheet?.id) {
      const { data: sheetData } = await supabase.from('answer_sheets').select('answers').eq('id', sheet.id).single()
      rawAnswers = sheetData?.answers ?? null
    }
    if (rawAnswers) {
      for (let sec = 1; sec <= 4; sec++) {
        const start = (sec - 1) * 50 + 1
        for (let q = start; q < start + 50; q++) {
          const a = rawAnswers[String(q)] ?? rawAnswers[q as unknown as string]
          if (a) savedAnswers[sec][q] = a
        }
      }
    }

    const currentSec = session.current_section || 1
    const secMins = session.section_minutes || Math.round((session.time_limit_minutes || 240) / 4)
    let timeLeft = secMins * 60
    if (session.section_started_at) {
      const elapsed = Math.floor((new Date().getTime() - new Date(session.section_started_at).getTime()) / 1000)
      timeLeft = Math.max(0, timeLeft - elapsed)
    }

    const submittedNums: number[] = session.sections_submitted || []
    const restoredSubmitted = [1,2,3,4].map(n => submittedNums.includes(n))

    setActiveSession(session)
    setActiveSheet(sheet || null)
    setPdfUrl(pdf)
    setAnswerKey(key)
    setCurrentSection(currentSec)
    setSectionAnswers(savedAnswers)
    setSectionMinutes(secMins)
    setSectionTimeLeft(timeLeft)
    setSectionSubmitted(restoredSubmitted)
    setPdfPage(BLOCK_PAGES[currentSec - 1].start)
    setLaunching(false)
    setLaunchingExamId(null)
    setView('exam')
  }

  const viewSessionReport = async (session: any) => {
    setSubmitting(true)
    try {
      // Fetch exam directly so it works even if it's no longer is_live
      const { data: examData } = await supabase.from('exams').select('*').eq('id', session.exam_id).single()

      // Load saved answers
      const sheet = session.answer_sheets?.[0]
      const allAnswers: Record<string, any> = {}
      if (sheet?.id) {
        const { data: sheetData } = await supabase.from('answer_sheets').select('answers').eq('id', sheet.id).single()
        if (sheetData?.answers) Object.assign(allAnswers, sheetData.answers)
      }

      // Load answer key
      let ak: Record<string, AKEntry> = {}
      if (examData?.answer_key_url) {
        const keyUrl = await getSignedUrl('exam-keys', examData.answer_key_url)
        console.log('[viewReport] answer_key_url field:', examData.answer_key_url)
        console.log('[viewReport] resolved keyUrl:', keyUrl)
        if (keyUrl) {
          try {
            const resp = await fetch(keyUrl, { cache: 'no-store' })
            const raw = await resp.json()
            console.log('[viewReport] raw sample:', JSON.stringify(raw).slice(0, 300))
            ak = parseAnswerKey(raw)
            console.log('[viewReport] parsed entries:', Object.keys(ak).length)
          } catch (e) { console.error('[viewReport] answer key load failed', e) }
        }
      } else {
        console.warn('[viewReport] examData.answer_key_url is empty or exam not found. examData:', examData)
      }

      const totalQ = session.total_questions || 200
      let freshCorrect = 0
      const systemBreakdown: Record<string, {correct:number,total:number}> = {}
      const topicBreakdown: Record<string, {correct:number,total:number}> = {}
      const disciplineBreakdown: Record<string, {correct:number,total:number}> = {}
      const questionDetails: {qNum:number,studentAnswer:string,correctAnswer:string,correct:boolean,system?:string,topic?:string,concept?:string,discipline?:string}[] = []

      const tally = (bd: Record<string,{correct:number,total:number}>, key: string|undefined, isCorrect: boolean) => {
        if (!key) return
        if (!bd[key]) bd[key] = {correct:0,total:0}
        bd[key].total++; if (isCorrect) bd[key].correct++
      }

      if (is200QExam(session.exam_name || '')) {
        for (const qd of gradeWith200QKey(allAnswers)) {
          if (qd.correct) freshCorrect++
          tally(systemBreakdown, qd.system, qd.correct)
          tally(topicBreakdown, qd.topic, qd.correct)
          tally(disciplineBreakdown, qd.discipline, qd.correct)
          questionDetails.push({ qNum: qd.qNum, studentAnswer: qd.studentAnswer, correctAnswer: qd.correctAnswer, correct: qd.correct, system: qd.system, topic: qd.topic, discipline: qd.discipline })
        }
      } else {
        for (let qNum = 1; qNum <= totalQ; qNum++) {
          const sa = String(allAnswers[String(qNum)] ?? allAnswers[qNum] ?? '').toUpperCase() || ''
          const entry = ak[String(qNum)]
          if (!entry) continue
          const isCorrect = !!sa && sa === entry.answer
          if (isCorrect) freshCorrect++
          tally(systemBreakdown, entry.system, isCorrect)
          tally(topicBreakdown, entry.topic, isCorrect)
          tally(disciplineBreakdown, entry.discipline, isCorrect)
          questionDetails.push({ qNum, studentAnswer: sa||'—', correctAnswer: entry.answer, correct: isCorrect, system: entry.system, topic: entry.topic, concept: entry.concept, discipline: entry.discipline })
        }
      }

      // 220Q Assessment: override system/discipline/topic with hardcoded map
      if ((session.exam_name || '').toLowerCase().includes('220q assessment')) {
        for (const k of Object.keys(systemBreakdown)) delete systemBreakdown[k]
        for (const k of Object.keys(topicBreakdown)) delete topicBreakdown[k]
        for (const k of Object.keys(disciplineBreakdown)) delete disciplineBreakdown[k]
        for (const qd of questionDetails) {
          const mapped = Q220_SUBJECT_MAP[qd.qNum]
          if (mapped) { qd.system = mapped.subject; qd.discipline = mapped.subject; qd.topic = mapped.subtopic }
          tally(systemBreakdown, qd.system, qd.correct)
          tally(topicBreakdown, qd.topic, qd.correct)
          tally(disciplineBreakdown, qd.discipline, qd.correct)
        }
      }

      // Use freshly computed scores (saved values were wrong — answer key wasn't loaded at submission)
      const correct = freshCorrect
      const gradedTotal = is200QExam(session.exam_name || '') ? questionDetails.length : totalQ
      const wrongCount = gradedTotal - freshCorrect
      const percentCorrect = gradedTotal > 0 ? Math.round((correct / gradedTotal) * 100) : 0
      const predictedStep1 = calcStep1Score(session.exam_name, wrongCount, percentCorrect)
      const actualMinutes = session.actual_minutes ?? 0
      const withinLimit = session.within_limit ?? true

      await supabase.from('exam_sessions').update({
        score: correct, wrong_count: wrongCount, total_questions: gradedTotal,
        percent_correct: percentCorrect, predicted_step1: predictedStep1,
      }).eq('id', session.id)

      const studentId = (session.student_id as string) || user?.id
      const { data: freshSessions } = await supabase.from('exam_sessions')
        .select('*').eq('student_id', studentId).order('created_at', {ascending: false})
      if (freshSessions) setPastSessions(freshSessions)

      const logRows = questionDetails
        .filter(q => q.system || q.topic || q.discipline)
        .map(q => ({ student_id: (session.student_id as string) || user?.id, exam_session_id: session.id, question_number: q.qNum, system: q.system || null, topic: q.topic || null, discipline: q.discipline || null, correct: q.correct }))
      console.log('[examLogs] rows to write:', logRows.length)
      if (logRows.length > 0) {
        const { error: delErr } = await supabase.from('exam_question_logs').delete().eq('exam_session_id', session.id)
        if (delErr) console.error('[examLogs] delete error:', delErr)
        const { error: insErr } = await supabase.from('exam_question_logs').insert(logRows)
        if (insErr) console.error('[examLogs] insert error:', insErr)
        else console.log('[examLogs] wrote', logRows.length, 'rows successfully')
      }

      setResultsFilter('all')
      setResultsTab('report')
      setResults({ correct, wrongCount, totalQ, percentCorrect, predictedStep1, actualMinutes, withinLimit, examName: session.exam_name, examId: session.exam_id, timeUp: false, systemBreakdown, topicBreakdown, disciplineBreakdown, questionDetails })
      setView('results')
    } catch (err) {
      console.error('viewSessionReport error:', err)
      alert('Could not load the score report. Try again or contact your admin.')
    } finally {
      setSubmitting(false)
    }
  }
  // Keep ref in sync after every render (declared after viewSessionReport to avoid forward-reference)
  useEffect(() => { viewSessionReportRef.current = viewSessionReport })

  const calcInput = (digit: string) => {
    if (calcFresh) { setCalcDisplay(digit === '.' ? '0.' : digit); setCalcFresh(false) }
    else { if (digit === '.' && calcDisplay.includes('.')) return; setCalcDisplay(p => p === '0' && digit !== '.' ? digit : p + digit) }
  }
  const calcDoOp = (op: string) => { setCalcPrev(calcDisplay); setCalcOp(op); setCalcFresh(true) }
  const calcEquals = () => {
    if (!calcOp || !calcPrev) return
    const a = parseFloat(calcPrev), b = parseFloat(calcDisplay)
    const res = calcOp==='+' ? a+b : calcOp==='−' ? a-b : calcOp==='×' ? a*b : b!==0 ? a/b : 0
    setCalcDisplay(String(parseFloat(res.toFixed(10)))); setCalcPrev(''); setCalcOp(null); setCalcFresh(true)
  }
  const calcClear = () => { setCalcDisplay('0'); setCalcPrev(''); setCalcOp(null); setCalcFresh(true) }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
    return `${m}:${s.toString().padStart(2,'0')}`
  }

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60); const m = min % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const diffColor = (d: string) => ({
    Baseline: '#4a8c84', Moderate: '#6b7c3a', Hard: '#c07040', Hardest: '#9e2a2a'
  }[d] || '#c9a84c')

  const navGroups = [
    {section: 'Overview', items: [{name: 'Dashboard', path: '/dashboard'}]},
    {section: 'My Program', items: [
      {name: 'Daily Course Schedule', path: '/dashboard/schedule'},
      {name: 'My Study Schedule', path: '/dashboard/studyschedule'},
      {name: 'Calendar', path: '/dashboard/calendar'},
      {name: 'Assignments', path: '/dashboard/assignments'},
      {name: 'Mentor Meetings', path: '/dashboard/mentor'},
    ]},
    {section: 'Study Tools', items: [
      {name: 'Exam Center', path: '/dashboard/exams', active: true},
      {name: 'Qbank Tracker', path: '/dashboard/qbank'},
      {name: 'NBME Score Tracker', path: '/dashboard/nbme'},
      {name: 'Weakness Map', path: '/dashboard/weakness'},
    ]},
    {section: 'Resources', items: [
      {name: 'HY Topic Notes', path: '/dashboard/notes'},
      {name: 'Session Recordings', path: '/dashboard/recordings'},
      {name: 'Session Slides', path: '/dashboard/slides'},
      {name: 'Resource Drive', path: '/dashboard/resources'},
      {name: 'Course Documents', path: '/dashboard/documents'},
      {name: 'Live Feedback', path: '/dashboard/feedback'},
    ]},
  ]

  if (loading) return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f4ee'}}>
      <div style={{fontFamily:'Georgia,serif',fontSize:24,color:'#0d2340'}}>Loading...</div>
    </main>
  )

  // ─── EXAM VIEW ────────────────────────────────────────────────────────────────
  if (view === 'exam' && activeSession) {
    const sectionStart = (currentSection - 1) * 50 + 1
    const sectionEnd = currentSection * 50
    const curSecAnswers = sectionAnswers[currentSection] || {}
    const answeredCount = Object.keys(curSecAnswers).length
    const timeWarning = sectionTimeLeft > 0 && sectionTimeLeft < 600

    const blockRange = BLOCK_PAGES[currentSection - 1]

    const btnStyle = (active: boolean) => ({
      padding:'4px 12px', borderRadius:6, border:'1px solid rgba(255,255,255,0.2)',
      background: active ? '#c9a84c' : 'rgba(255,255,255,0.1)',
      color: active ? '#0d2340' : 'white',
      fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif'
    })

    return (
      <main style={{height:'100vh',display:'flex',flexDirection:'column',background:'#f7f4ee',fontFamily:'Sora,sans-serif',overflow:'hidden'}}>

        {/* Lab Values panel */}
        {showLabValues && (
          <div style={{position:'fixed',top:60,left:16,zIndex:8000,width:460,maxHeight:'80vh',background:'white',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,0.3)',display:'flex',flexDirection:'column',overflow:'hidden'}}>
            <div style={{background:'#0d2340',padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
              <div style={{color:'white',fontWeight:700,fontSize:13,fontFamily:'Georgia,serif'}}>Reference Laboratory Values</div>
              <button onClick={() => setShowLabValues(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.6)',fontSize:20,cursor:'pointer',lineHeight:1,padding:'0 4px'}}>×</button>
            </div>
            <div style={{overflowY:'auto'}}>
              {LAB_VALUES.map(cat => (
                <div key={cat.category}>
                  <div style={{padding:'8px 16px',background:'#f0ece0',fontSize:11,fontWeight:700,color:'#5a3e1b',textTransform:'uppercase',letterSpacing:'0.07em'}}>{cat.category}</div>
                  {cat.values.map((v,i) => (
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'5px 16px',borderBottom:'0.5px solid #f5f0e8',gap:12}}>
                      <div style={{fontSize:12,color:'#1a1008'}}>{v.name}</div>
                      <div style={{fontSize:12,color:'#1a3a8a',fontWeight:500,flexShrink:0,textAlign:'right'}}>{v.ref}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculator */}
        {showCalculator && (
          <div style={{position:'fixed',bottom:70,left:16,zIndex:8000,background:'#16213e',borderRadius:12,padding:14,boxShadow:'0 8px 40px rgba(0,0,0,0.5)',width:216}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,letterSpacing:'0.1em'}}>CALCULATOR</div>
              <button onClick={() => setShowCalculator(false)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',fontSize:18,cursor:'pointer',padding:'0 2px'}}>×</button>
            </div>
            <div style={{background:'#0a1628',borderRadius:8,padding:'8px 12px',marginBottom:10,textAlign:'right',minHeight:52}}>
              {calcPrev && calcOp && <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:2}}>{calcPrev} {calcOp}</div>}
              <div style={{fontSize:26,color:'white',fontFamily:'Georgia,serif',wordBreak:'break-all'}}>{calcDisplay}</div>
            </div>
            {[['C','±','%','÷'],['7','8','9','×'],['4','5','6','−'],['1','2','3','+'],[' ','0','.','=']].map((row,ri) => (
              <div key={ri} style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:5,marginBottom:5}}>
                {row.map(btn => {
                  const isOp = ['÷','×','−','+','='].includes(btn)
                  const isFn = ['C','±','%'].includes(btn)
                  const isEmpty = btn === ' '
                  return (
                    <button key={btn} disabled={isEmpty}
                      onClick={() => {
                        if (btn==='C') calcClear()
                        else if (btn==='=') calcEquals()
                        else if ('÷×−+'.includes(btn)) calcDoOp(btn)
                        else if (btn==='±') setCalcDisplay(d => String(-parseFloat(d)))
                        else if (btn==='%') setCalcDisplay(d => String(parseFloat(d)/100))
                        else calcInput(btn)
                      }}
                      style={{padding:'9px 0',borderRadius:6,border:'none',
                        background: isEmpty?'transparent': isOp?'#c9a84c': isFn?'#2d3d6b':'#1e2d4a',
                        color: isOp?'#0d2340':'white',
                        fontSize:14,fontWeight:isOp||isFn?700:400,cursor:isEmpty?'default':'pointer',fontFamily:'Sora,sans-serif'}}>
                      {btn}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* Top bar */}
        <div style={{flexShrink:0,background:timeWarning?'#9e2a2a':'#0d2340',padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'white',fontWeight:600}}>{activeSession.exam_name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',background:'rgba(255,255,255,0.08)',padding:'3px 10px',borderRadius:10}}>
              Section {currentSection} of 4
            </div>
            <div style={{display:'flex',gap:5}}>
              {sectionSubmitted.map((done, i) => (
                <div key={i} style={{width:8,height:8,borderRadius:'50%',background:done?'#6b7c3a':i===currentSection-1?'#c9a84c':'rgba(255,255,255,0.2)'}}/>
              ))}
            </div>
            <button onClick={() => { setShowLabValues(v => !v); setShowCalculator(false) }} style={btnStyle(showLabValues)}>Lab Values</button>
            <button onClick={() => { setShowCalculator(v => !v); setShowLabValues(false) }} style={btnStyle(showCalculator)}>Calculator</button>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:24}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Answered</div>
              <div style={{fontSize:16,color:'#c9a84c',fontWeight:700}}>{answeredCount}/50</div>
            </div>
            {sectionTimeLeft > 0 && (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Section time</div>
                <div style={{fontSize:22,color:timeWarning?'#ffaaaa':'#c9a84c',fontWeight:700,fontFamily:'Georgia,serif'}}>{formatTime(sectionTimeLeft)}</div>
              </div>
            )}
            <button
              onClick={() => { if (window.confirm(`End Section ${currentSection}? You cannot return to it.`)) submitSectionRef.current() }}
              disabled={submitting}
              style={{padding:'8px 20px',background:'#c9a84c',border:'none',borderRadius:8,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:700,cursor:submitting?'not-allowed':'pointer'}}>
              {submitting ? 'Saving...' : currentSection < 4 ? 'End Block →' : 'Submit Exam →'}
            </button>
          </div>
        </div>

        {/* Body: PDF + Answer Sheet */}
        <div style={{flex:1,display:'flex',overflow:'hidden'}}>
          {/* PDF viewer */}
          <div style={{flex:1,overflow:'hidden',background:'#e8e4dc',display:'flex',flexDirection:'column'}}>
            <div ref={pdfContainerRef} style={{flex:1,overflow:'auto',display:'flex',justifyContent:'center',padding:'16px'}}>
              {pdfUrl ? (
                <Document
                  file={pdfUrl}
                  onLoadProgress={({loaded, total}) => {
                    const pct = total ? Math.round((loaded/total)*100) : 0
                    const bar = document.getElementById('pdf-load-bar')
                    const lbl = document.getElementById('pdf-load-pct')
                    if (bar) bar.style.width = pct + '%'
                    if (lbl) lbl.textContent = pct + '%'
                  }}
                  loading={
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 40px',gap:16}}>
                      <div style={{fontFamily:'Georgia,serif',fontSize:16,color:'#0d2340'}}>Loading exam PDF…</div>
                      <div style={{width:220,height:6,background:'#e8dfc8',borderRadius:3,overflow:'hidden'}}>
                        <div id="pdf-load-bar" style={{height:'100%',background:'#c9a84c',borderRadius:3,width:'0%',transition:'width 0.3s'}}/>
                      </div>
                      <div id="pdf-load-pct" style={{fontSize:13,color:'#8a7d6a',fontFamily:'Sora,sans-serif'}}>0%</div>
                      <div style={{fontSize:12,color:'#a89870',fontFamily:'Sora,sans-serif',textAlign:'center',maxWidth:240}}>Large file — this may take a minute on slower connections</div>
                    </div>
                  }
                  error={<div style={{color:'#c0574a',padding:40,fontSize:15,fontFamily:'Georgia,serif'}}>Failed to load PDF — contact your admin</div>}
                >
                  <Page pageNumber={pdfPage} width={pdfWidth * zoomLevel} renderTextLayer={false} renderAnnotationLayer={false}/>
                </Document>
              ) : (
                <div style={{color:'#8a7d6a',padding:40,fontSize:15,fontFamily:'Georgia,serif'}}>PDF unavailable — contact your admin</div>
              )}
            </div>
            {/* Page navigation + zoom */}
            <div style={{flexShrink:0,background:'#1a3a5c',padding:'8px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={() => setPdfPage(p => Math.max(blockRange.start, p-1))} disabled={pdfPage<=blockRange.start}
                  style={{padding:'5px 14px',background:pdfPage<=blockRange.start?'rgba(255,255,255,0.08)':'#c9a84c',border:'none',borderRadius:6,color:pdfPage<=blockRange.start?'rgba(255,255,255,0.25)':'#0d2340',fontSize:13,fontWeight:700,cursor:pdfPage<=blockRange.start?'not-allowed':'pointer',fontFamily:'Sora,sans-serif'}}>
                  ← Prev
                </button>
                <span style={{fontSize:13,color:'rgba(255,255,255,0.7)',minWidth:90,textAlign:'center'}}>
                  Page {pdfPage - blockRange.start + 1} of 50
                </span>
                <button onClick={() => setPdfPage(p => Math.min(blockRange.end, p+1))} disabled={pdfPage>=blockRange.end}
                  style={{padding:'5px 14px',background:pdfPage>=blockRange.end?'rgba(255,255,255,0.08)':'#c9a84c',border:'none',borderRadius:6,color:pdfPage>=blockRange.end?'rgba(255,255,255,0.25)':'#0d2340',fontSize:13,fontWeight:700,cursor:pdfPage>=blockRange.end?'not-allowed':'pointer',fontFamily:'Sora,sans-serif'}}>
                  Next →
                </button>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button onClick={() => setZoomLevel(z => Math.max(0.5, parseFloat((z-0.1).toFixed(1))))}
                  style={{width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                <span style={{fontSize:12,color:'rgba(255,255,255,0.6)',minWidth:36,textAlign:'center'}}>{Math.round(zoomLevel*100)}%</span>
                <button onClick={() => setZoomLevel(z => Math.min(2, parseFloat((z+0.1).toFixed(1))))}
                  style={{width:28,height:28,borderRadius:6,border:'1px solid rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.1)',color:'white',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
              </div>
            </div>
          </div>

          {/* Answer sheet */}
          <div style={{width:360,flexShrink:0,background:'white',borderLeft:'0.5px solid #e8dfc8',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'10px 14px',borderBottom:'0.5px solid #f0ece0',flexShrink:0}}>
              <div style={{fontSize:12,fontWeight:600,color:'#0d2340'}}>Section {currentSection} — Answer Sheet</div>
              <div style={{fontSize:11,color:'#8a7d6a',marginTop:1}}>Q1–Q50 · {answeredCount} answered</div>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {Array.from({length:50},(_,i) => {
                const qNum = sectionStart + i
                const displayNum = i + 1
                const sel = curSecAnswers[qNum]
                const opts = ['A','B','C','D','E','F','G','H','I','J']
                const btnStyle = (opt: string) => ({
                  width:26,height:26,borderRadius:5,border:sel===opt?'none':'1px solid #d8cfc0',
                  background:sel===opt?'#0d2340':'#f7f4ee',color:sel===opt?'#c9a84c':'#8a7d6a',
                  fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'Sora,sans-serif',flexShrink:0 as const,padding:0
                })
                return (
                  <div key={qNum} style={{padding:'3px 8px',borderBottom:'0.5px solid #faf8f4'}}>
                    <div style={{display:'flex',alignItems:'center',gap:3}}>
                      <div style={{width:24,fontSize:11,color:'#a89870',fontWeight:500,flexShrink:0,textAlign:'right',paddingRight:3}}>{displayNum}</div>
                      {opts.map(opt => <button key={opt} onClick={() => saveSectionAnswer(qNum, opt)} style={btnStyle(opt)}>{opt}</button>)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ─── RESULTS VIEW ─────────────────────────────────────────────────────────────
  if (view === 'results' && results) {
    const step1Color = results.predictedStep1
      ? results.predictedStep1 >= 240 ? '#6b7c3a'
        : results.predictedStep1 >= 220 ? '#c9a84c'
        : results.predictedStep1 >= 196 ? '#c07040'
        : '#c0574a'
      : '#8a7d6a'

    const filteredQs: typeof results.questionDetails = (results.questionDetails || []).filter((q: any) =>
      resultsFilter === 'all' ? true : resultsFilter === 'correct' ? q.correct : !q.correct
    )

    const hasSystem = Object.keys(results.systemBreakdown || {}).length > 0
    const hasTopic = Object.keys(results.topicBreakdown || {}).length > 0
    const hasDiscipline = Object.keys(results.disciplineBreakdown || {}).length > 0
    const hasBreakdown = hasSystem || hasDiscipline || hasTopic

    const passProb = results.predictedStep1
      ? results.predictedStep1 >= 245 ? 99 : results.predictedStep1 >= 235 ? 95 : results.predictedStep1 >= 225 ? 85
        : results.predictedStep1 >= 215 ? 70 : results.predictedStep1 >= 205 ? 55 : results.predictedStep1 >= 196 ? 40 : 20
      : null

    return (
      <main style={{minHeight:'100vh',display:'flex',background:'#f7f4ee',fontFamily:'Sora,sans-serif',fontSize:'17.6px'}}>

        {/* Sidebar — hidden in admin view (admin has their own nav) */}
        {!isAdminView && (
          <nav style={{width:220,flexShrink:0,background:'#0d2340',display:'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
            <div style={{padding:'20px 18px 16px',borderBottom:'0.5px solid rgba(201,168,76,0.2)'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{width:36,height:36,background:'#c9a84c',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <div style={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderBottom:'11px solid #0d2340'}}/>
                </div>
                <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'white',fontWeight:600}}>StepUp</div>
              </div>
              <div style={{fontSize:10,color:'#c9a84c',letterSpacing:'0.09em',textTransform:'uppercase',paddingLeft:46,marginTop:3}}>P2P Mentoring Program</div>
            </div>
            <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
              {navGroups.map(group => (
                <div key={group.section}>
                  <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.28)',padding:'0 8px',margin:'12px 0 4px'}}>{group.section}</div>
                  {group.items.map((item:any) => (
                    <div key={item.name} onClick={() => router.push(item.path)}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,color:item.active?'#c9a84c':'rgba(255,255,255,0.55)',fontSize:13.5,marginBottom:2,background:item.active?'rgba(255,255,255,0.09)':'transparent',cursor:'pointer'}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>{item.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(201,168,76,0.14)'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'#c9a84c',color:'#0d2340',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,color:'white',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name||user?.email?.split('@')[0]}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
                </div>
                <div onClick={async()=>{await supabase.auth.signOut();router.push('/')}}
                  style={{fontSize:11,color:'rgba(255,255,255,0.35)',cursor:'pointer',padding:'4px 8px',borderRadius:4,border:'0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
              </div>
            </div>
          </nav>
        )}

        {/* Content */}
        <div style={{flex:1,minWidth:0,overflowY:'auto',padding:'32px 40px'}}>

          {/* NBME-style report header */}
          <div style={{background:'#0d2340',borderRadius:'10px 10px 0 0',padding:'14px 24px',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
            <div>
              <div style={{fontSize:9,letterSpacing:'0.15em',color:'rgba(201,168,76,0.65)',textTransform:'uppercase',marginBottom:3}}>StepUp P2P Mentoring Program</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:17,color:'white',fontWeight:700,letterSpacing:0.2}}>Comprehensive Basic Science Self-Assessment</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginTop:2}}>Examinee Performance Report</div>
            </div>
            <div style={{fontSize:11,color:'rgba(201,168,76,0.55)',textAlign:'right'}}>Windsor School of Medicine</div>
          </div>

          {/* Name + date bar */}
          <div style={{background:'white',border:'1px solid #ccc8be',borderTop:'none',padding:'9px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',borderRadius:'0 0 6px 6px'}}>
            <div style={{fontSize:13,color:'#1a1008'}}>Name: <strong>{profile?.full_name || user?.email?.split('@')[0]}</strong></div>
            <div style={{fontSize:13,color:'#1a1008',display:'flex',gap:16}}>
              <span>Exam: <strong>{results.examName}</strong></span>
              <span>Test Date: <strong>{new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</strong></span>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{display:'flex',gap:0,margin:'20px 0 0',borderBottom:'2px solid #e8dfc8'}}>
            {([
              {key:'report', label:'Score Report'},
              {key:'weakness', label:'Weakness Map'},
              {key:'questions', label:`Question Review (${results.questionDetails?.length||0})`},
              {key:'progress', label:'My Progress'},
            ] as const).map(t => (
              <button key={t.key} onClick={() => setResultsTab(t.key)}
                style={{padding:'10px 24px',border:'none',borderBottom:resultsTab===t.key?'2px solid #c9a84c':'2px solid transparent',marginBottom:-2,
                  background:'transparent',fontSize:13,fontWeight:resultsTab===t.key?700:500,
                  color:resultsTab===t.key?'#0d2340':'#a89870',cursor:'pointer',fontFamily:'Sora,sans-serif'}}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── SCORE REPORT TAB ── */}
          {resultsTab === 'report' && (
            <div style={{paddingTop:20}}>

              {/* Answer key warning */}
              {(!results.questionDetails || results.questionDetails.length === 0) && (
                <div style={{background:'#fff3cd',border:'1px solid #ffc107',borderRadius:10,padding:'12px 18px',marginBottom:16,fontSize:13,color:'#856404'}}>
                  ⚠ Answer key could not be loaded — breakdown and question details are unavailable. Contact your admin to verify the answer key file.
                </div>
              )}

              {/* Main score section */}
              <div style={{background:'white',border:'1px solid #ccc8be',borderRadius:8,padding:'32px 28px',marginBottom:16,textAlign:'center'}}>
                <div style={{fontSize:13,color:'#6b6050',letterSpacing:'0.04em',marginBottom:6}}>Total Percent Correct</div>
                <div style={{fontFamily:'Georgia,serif',fontSize:80,fontWeight:700,color:scoreColor(results.percentCorrect),lineHeight:1}}>{results.percentCorrect}%</div>
                <div style={{fontSize:13,color:'#8a7d6a',marginTop:8}}>Raw score: {results.correct} correct out of {results.totalQ} questions</div>
                {results.predictedStep1 && (
                  <div style={{marginTop:20,paddingTop:20,borderTop:'1px solid #f0ece0',fontSize:14,color:'#1a1008',lineHeight:1.7}}>
                    Based on your performance, your predicted Step 1 score is{' '}
                    <strong style={{fontFamily:'Georgia,serif',fontSize:18,color:step1Color}}>{results.predictedStep1}</strong>
                    {passProb && (
                      <span style={{color:'#6b6050'}}>
                        {' '}· estimated probability of passing Step 1:{' '}
                        <strong style={{color:step1Color}}>{passProb}%</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Summary stats row */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:28}}>
                {[
                  {label:'Correct', value:String(results.correct), color:'#6b7c3a'},
                  {label:'Incorrect', value:String(results.wrongCount), color:'#c0574a'},
                  {label:'Time', value:formatDuration(results.actualMinutes), color:'#0d2340'},
                  {label:'Predicted Step 1', value:results.predictedStep1 ? String(results.predictedStep1) : '—', color:step1Color},
                ].map(c => (
                  <div key={c.label} style={{background:'white',border:'1px solid #ccc8be',borderRadius:8,padding:'14px',textAlign:'center'}}>
                    <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',color:'#8a7d6a',marginBottom:6}}>{c.label}</div>
                    <div style={{fontFamily:'Georgia,serif',fontSize:22,fontWeight:700,color:c.color}}>{c.value}</div>
                  </div>
                ))}
              </div>

              {/* ── ⏱ Timing Insight (collapsible) ── */}
              {results.actualMinutes > 0 && (() => {
                const totalSec = results.actualMinutes * 60
                const secsPerQ = results.totalQ > 0 ? totalSec / results.totalQ : 0
                const minsPerQ = Math.floor(secsPerQ / 60)
                const secsRem = Math.round(secsPerQ % 60)
                const blocks = Math.round(results.totalQ / 50) || 1
                const minsPerBlock = Math.round(results.actualMinutes / blocks)
                const blockLimit = 60
                const overBlock = minsPerBlock > blockLimit
                return (
                  <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                    <div onClick={() => setShowTimingSection(v => !v)}
                      style={{background:'#1a3a5a',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>⏱</span>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>Timing Insight</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>How you managed time</span>
                        <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showTimingSection ? '−' : '+'}</span>
                      </div>
                    </div>
                    {showTimingSection && (
                      <div style={{background:'white',padding:'14px 18px'}}>
                        <div style={{fontSize:12,color:'#6b6050',marginBottom:12,lineHeight:1.6}}>
                          Your pacing during this exam. Aim for ~1:20 per question and under 60 minutes per 50-question block to stay on track.
                        </div>
                        <div style={{display:'flex',gap:24,flexWrap:'wrap' as const,alignItems:'center'}}>
                          <div>
                            <div style={{fontSize:10,color:'#a89870'}}>Avg per question</div>
                            <div style={{fontSize:15,fontWeight:700,color:'#0d2340',fontFamily:'Georgia,serif'}}>{minsPerQ}:{String(secsRem).padStart(2,'0')}</div>
                          </div>
                          <div>
                            <div style={{fontSize:10,color:'#a89870'}}>Approx. per block ({results.totalQ > 0 ? Math.round(results.totalQ/blocks) : 50}Q)</div>
                            <div style={{fontSize:15,fontWeight:700,color:overBlock?'#c0574a':'#6b7c3a',fontFamily:'Georgia,serif'}}>{minsPerBlock} min</div>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            <span style={{fontSize:13,color:results.withinLimit?'#6b7c3a':'#c0574a'}}>{results.withinLimit?'✓':'⚠'}</span>
                            <span style={{fontSize:12,color:'#6b6050'}}>{results.withinLimit?'Finished within time limit':'Exceeded total time limit'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── 🎯 Focus Plan + Study Recommendations (collapsible) ── */}
              {hasBreakdown && (() => {
                const sysStats: Record<string,{missed:number,total:number}> = {}
                const discStats: Record<string,{missed:number,total:number}> = {}
                for (const q of (results.questionDetails || [])) {
                  if (q.system) {
                    if (!sysStats[q.system]) sysStats[q.system] = {missed:0,total:0}
                    sysStats[q.system].total++
                    if (!q.correct) sysStats[q.system].missed++
                  }
                  if (q.discipline) {
                    if (!discStats[q.discipline]) discStats[q.discipline] = {missed:0,total:0}
                    discStats[q.discipline].total++
                    if (!q.correct) discStats[q.discipline].missed++
                  }
                }

                type FocusItem = {name:string,missed:number,total:number,pct:number,kind:'System'|'Subject',step1Pct:number}
                const toItems = (map: Record<string,{missed:number,total:number}>, kind: 'System'|'Subject'): FocusItem[] =>
                  Object.entries(map).map(([name,v]) => ({
                    name, missed: v.missed, total: v.total,
                    pct: v.total > 0 ? Math.round(((v.total-v.missed)/v.total)*100) : 0,
                    kind,
                    step1Pct: STEP1_CONTENT_PCT[name] ?? 0,
                  }))

                const seen = new Set<string>()
                const combined = [...toItems(sysStats,'System'), ...toItems(discStats,'Subject')]
                  .filter(e => e.missed > 0)
                  .sort((a,b) => b.missed !== a.missed ? b.missed - a.missed : a.pct - b.pct)
                  .filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true })
                const priorityItems = combined.slice(0, 5)

                const strongItems = toItems(sysStats,'System')
                  .filter(e => e.total >= 3 && e.pct >= 70)
                  .sort((a,b) => b.pct !== a.pct ? b.pct - a.pct : b.total - a.total)
                  .slice(0, 3)

                if (priorityItems.length === 0) return null

                const sameExamSessions = pastSessions
                  .filter((s: {exam_id:string,status:string,percent_correct:number,submitted_at:string}) => s.exam_id === results.examId && s.status === 'submitted' && s.percent_correct != null)
                  .sort((a: {submitted_at:string},b: {submitted_at:string}) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())
                const prevSession = sameExamSessions.length >= 2 ? sameExamSessions[sameExamSessions.length - 2] : null
                const delta = prevSession ? results.percentCorrect - prevSession.percent_correct : null

                const saveFocusLink = (name: string, url: string) => {
                  const updated = {...focusLinks, [name]: url}
                  setFocusLinks(updated)
                  try { localStorage.setItem('stepup_focus_links', JSON.stringify(updated)) } catch {}
                  setEditingLink(null)
                }
                const isAdmin = profile?.role === 'admin' || profile?.role === 'tutor'

                return (
                  <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                    <div onClick={() => setShowFocusSection(v => !v)}
                      style={{background:'#0d2340',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>🎯</span>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>Focus Plan &amp; Study Recommendations</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Personalized study priorities</span>
                        <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showFocusSection ? '−' : '+'}</span>
                      </div>
                    </div>
                    {showFocusSection && (
                      <div style={{padding:'16px',background:'white'}}>
                        <div style={{fontSize:12,color:'#6b6050',marginBottom:14,lineHeight:1.6}}>
                          Your top areas to study based on missed questions, ranked by volume and Step 1 content weight. Use "Practice →" to start a targeted Q-Bank session for each area.
                        </div>
                        {delta !== null && (
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16,padding:'10px 16px',background:'#f5f8fc',border:'1px solid #e0dbd0',borderRadius:8}}>
                            <span style={{fontSize:22,fontWeight:700,color:delta>0?'#6b7c3a':delta<0?'#c0574a':'#8a7d6a'}}>
                              {delta>0?'▲':delta<0?'▼':'–'} {Math.abs(delta)}%
                            </span>
                            <span style={{fontSize:13,color:'#6b6050'}}>
                              {delta>0?'improvement':'change'} from your previous attempt ({prevSession.percent_correct}% → {results.percentCorrect}%)
                            </span>
                          </div>
                        )}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                          {/* Left: Focus Plan */}
                          <div style={{background:'#fafaf7',border:'1px solid #e8dfc8',borderRadius:10,overflow:'hidden'}}>
                            <div style={{background:'#0d2340',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
                              <span style={{fontSize:16}}>🎯</span>
                              <div style={{fontSize:13,fontWeight:700,color:'white'}}>Your Focus Plan</div>
                              <div style={{fontSize:11,color:'rgba(201,168,76,0.7)',marginLeft:'auto'}}>Study these first</div>
                            </div>
                            <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:8}}>
                              {priorityItems.map((item, idx) => {
                                const color = item.missed > 10 ? '#c0574a' : item.missed > 4 ? '#c07040' : '#c9a84c'
                                const link = focusLinks[item.name] || '/dashboard/qbank'
                                const isHighYield = item.step1Pct >= 10
                                return (
                                  <div key={item.name} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:7,background:idx===0?'#fdf5f4':'#fdf9f2',border:`1px solid ${color}22`}}>
                                    <div style={{width:22,height:22,borderRadius:'50%',background:color,color:'white',fontSize:11,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{idx+1}</div>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' as const}}>
                                        <span style={{fontSize:12,fontWeight:600,color:'#0d2340'}}>{item.name}</span>
                                        <span style={{fontSize:9,color:'#8a7d6a',background:'#f0ece0',padding:'1px 5px',borderRadius:3}}>{item.kind}</span>
                                        {isHighYield && (
                                          <span style={{fontSize:9,fontWeight:700,color:'#c07040',background:'#fff3e0',padding:'1px 5px',borderRadius:3,border:'1px solid #f0c060'}}>
                                            ⚡ ~{item.step1Pct}% of Step 1
                                          </span>
                                        )}
                                      </div>
                                      <div style={{fontSize:10,color:'#8a7d6a'}}>{item.missed}/{item.total} missed · {item.pct}% correct</div>
                                    </div>
                                    {isAdmin && editingLink === item.name ? (
                                      <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
                                        <input value={editLinkVal} onChange={e => setEditLinkVal(e.target.value)}
                                          style={{width:110,fontSize:10,padding:'3px 6px',borderRadius:4,border:'1px solid #c9a84c',outline:'none',fontFamily:'Sora,sans-serif'}}
                                          placeholder="/path or URL" autoFocus
                                          onKeyDown={e => { if(e.key==='Enter') saveFocusLink(item.name,editLinkVal); if(e.key==='Escape') setEditingLink(null) }}/>
                                        <button onClick={() => saveFocusLink(item.name, editLinkVal)}
                                          style={{padding:'3px 6px',borderRadius:4,border:'none',background:'#6b7c3a',color:'white',fontSize:11,cursor:'pointer',fontWeight:700}}>✓</button>
                                        <button onClick={() => setEditingLink(null)}
                                          style={{padding:'3px 6px',borderRadius:4,border:'none',background:'#e8e0d0',color:'#6b6050',fontSize:11,cursor:'pointer'}}>✕</button>
                                      </div>
                                    ) : (
                                      <div style={{display:'flex',gap:3,alignItems:'center',flexShrink:0}}>
                                        <button onClick={() => router.push(link)}
                                          style={{padding:'4px 10px',borderRadius:6,border:'1px solid #d8cfc0',background:'white',fontSize:11,fontWeight:600,color:'#0d2340',cursor:'pointer',whiteSpace:'nowrap' as const}}>
                                          Practice →
                                        </button>
                                        {isAdmin && (
                                          <button onClick={() => { setEditingLink(item.name); setEditLinkVal(focusLinks[item.name]||'') }}
                                            title="Edit practice link"
                                            style={{padding:'4px 6px',borderRadius:6,border:'1px solid #e8dfc8',background:'#f7f4ee',fontSize:11,color:'#8a7d6a',cursor:'pointer'}}>✏</button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Right: Keep It Up + Study Recommendations */}
                          <div style={{display:'flex',flexDirection:'column',gap:16}}>
                            <div style={{background:'#fafaf7',border:'1px solid #e8dfc8',borderRadius:10,overflow:'hidden'}}>
                              <div style={{background:'#3a5a2a',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:16}}>✓</span>
                                <div style={{fontSize:13,fontWeight:700,color:'white'}}>Keep It Up</div>
                                <div style={{fontSize:11,color:'rgba(255,255,255,0.55)',marginLeft:'auto'}}>You've got these</div>
                              </div>
                              <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
                                {strongItems.length > 0 ? strongItems.map(item => (
                                  <div key={item.name} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:7,background:'#f3f8ef',border:'1px solid #c8dcc0'}}>
                                    <span style={{fontSize:14,color:'#6b7c3a'}}>✓</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:12,fontWeight:600,color:'#2a4a1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{item.name}</div>
                                      <div style={{fontSize:10,color:'#6b7c3a'}}>{item.pct}% correct · {item.total - item.missed}/{item.total} right</div>
                                    </div>
                                  </div>
                                )) : (
                                  <div style={{fontSize:12,color:'#8a7d6a',padding:'6px 10px',lineHeight:1.5}}>
                                    Keep practicing — your strengths will show here as your scores build.
                                  </div>
                                )}
                              </div>
                            </div>

                            <div style={{background:'#fafaf7',border:'1px solid #e8dfc8',borderRadius:10,overflow:'hidden',flex:1}}>
                              <div style={{background:'#1a3a5a',padding:'10px 16px',display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:16}}>📖</span>
                                <div style={{fontSize:13,fontWeight:700,color:'white'}}>Study Recommendations</div>
                              </div>
                              <div style={{padding:'12px 14px',display:'flex',flexDirection:'column',gap:6}}>
                                {priorityItems.slice(0,3).map(item => (
                                  <div key={item.name} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:7,background:'#f5f8fc',border:'1px solid #d0dcea'}}>
                                    <div style={{width:6,height:6,borderRadius:'50%',background:'#2a6cb0',flexShrink:0}}/>
                                    <div style={{flex:1,fontSize:12,color:'#1a3a5a',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>{item.name}</div>
                                    <span style={{fontSize:10,color:'#8a7d6a',whiteSpace:'nowrap' as const}}>{item.kind} · {item.missed} missed</span>
                                  </div>
                                ))}
                                <div style={{fontSize:11,color:'#a89870',marginTop:4,lineHeight:1.5}}>
                                  Review these areas in First Aid, Sketchy, or your preferred resource, then drill Q-Bank questions for each.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── ✅ Study Checklist (collapsible, all exams with breakdown data) ── */}
              {(results.questionDetails || []).some((qd: any) => !qd.correct) && (() => {
                const is220Q = (results.examName || '').toLowerCase().includes('220q assessment')
                const incorrectItems = (results.questionDetails as any[])
                  .filter(qd => !qd.correct)
                  .map(qd => {
                    const mapped = is220Q ? Q220_SUBJECT_MAP[Number(qd.qNum)] : null
                    return {
                      qNum: Number(qd.qNum),
                      subject: mapped?.subject || qd.discipline || qd.system || 'Other',
                      subtopic: mapped?.subtopic || qd.topic || '—',
                    }
                  })
                  .sort((a,b) => a.qNum - b.qNum)
                if (incorrectItems.length === 0) return null
                const toggleCheck = (qNum: number) => setCheckedQuestions(prev => {
                  const next = new Set(prev)
                  if (next.has(qNum)) next.delete(qNum); else next.add(qNum)
                  return next
                })
                const doneCount = incorrectItems.filter(i => checkedQuestions.has(i.qNum)).length
                return (
                  <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                    <div onClick={() => setShowStudyChecklist(v => !v)}
                      style={{background:'#1a3a5a',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>✅</span>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>Study Checklist — Incorrect Topics</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{doneCount}/{incorrectItems.length} reviewed</span>
                        <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showStudyChecklist ? '−' : '+'}</span>
                      </div>
                    </div>
                    {showStudyChecklist && (
                      <div style={{background:'white'}}>
                        <div style={{padding:'10px 14px',borderBottom:'0.5px solid #f0ece0',fontSize:12,color:'#6b6050',lineHeight:1.6}}>
                          Tick off each topic as you review it. Your progress saves in your browser session. Start with highest-priority subjects first.
                        </div>
                        {doneCount > 0 && (
                          <div style={{padding:'8px 14px',borderBottom:'0.5px solid #f0ece0',display:'flex',alignItems:'center',gap:10}}>
                            <div style={{flex:1,height:6,background:'#e8e4dc',borderRadius:3,overflow:'hidden'}}>
                              <div style={{height:'100%',width:`${Math.round((doneCount/incorrectItems.length)*100)}%`,background:'#6b7c3a',borderRadius:3,transition:'width 0.3s'}}/>
                            </div>
                            <span style={{fontSize:11,color:'#6b7c3a',fontWeight:600,whiteSpace:'nowrap'}}>{Math.round((doneCount/incorrectItems.length)*100)}% reviewed</span>
                            <button onClick={e => { e.stopPropagation(); setCheckedQuestions(new Set()) }}
                              style={{fontSize:10,color:'#a89870',background:'none',border:'none',cursor:'pointer',padding:'2px 6px',textDecoration:'underline'}}>Reset</button>
                          </div>
                        )}
                        <div style={{maxHeight:480,overflowY:'auto'}}>
                          {incorrectItems.map(item => {
                            const done = checkedQuestions.has(item.qNum)
                            return (
                              <div key={item.qNum}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleCheck(item.qNum)}
                                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCheck(item.qNum) } }}
                                style={{display:'flex',alignItems:'center',gap:10,padding:'7px 14px',borderBottom:'0.5px solid #f5f0e8',cursor:'pointer',background:done?'#f3f8ef':'white',transition:'background 0.15s'}}>
                                <div style={{width:16,height:16,borderRadius:3,border:`2px solid ${done?'#6b7c3a':'#c0b8a8'}`,background:done?'#6b7c3a':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.15s'}}>
                                  {done && <span style={{color:'white',fontSize:11,fontWeight:700,lineHeight:1}}>✓</span>}
                                </div>
                                <span style={{fontWeight:700,color:done?'#6b7c3a':'#0d2340',minWidth:42,flexShrink:0,fontSize:12}}>Q{item.qNum}</span>
                                <span style={{fontSize:11,color:'#a89870',minWidth:110,flexShrink:0,whiteSpace:'nowrap'}}>{item.subject}</span>
                                <span style={{fontSize:12,color:done?'#8aaa80':'#1a1008',textDecoration:done?'line-through':'none',flex:1}}>{item.subtopic}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── 📋 Priority Study List (collapsible) ── */}
              {Object.keys(results.systemBreakdown || {}).length > 0 && (() => {
                const rows = Object.entries(results.systemBreakdown as Record<string,{correct:number,total:number}>)
                  .map(([name, s]) => ({
                    name,
                    correct: s.correct,
                    total: s.total,
                    wrong: s.total - s.correct,
                    pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
                  }))
                  .sort((a,b) => a.pct - b.pct)
                const dot = (pct: number) => pct < 65 ? '🔴 HIGH' : pct < 85 ? '🟡 MODERATE' : '🟢 STRONG'
                return (
                  <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                    <div onClick={() => setShowPriorityList(v => !v)}
                      style={{background:'#0d2340',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>📋</span>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>Priority Study List</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>All systems ranked worst → best</span>
                        <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showPriorityList ? '−' : '+'}</span>
                      </div>
                    </div>
                    {showPriorityList && (
                      <div style={{background:'white'}}>
                        <div style={{padding:'10px 14px',borderBottom:'0.5px solid #f0ece0',fontSize:12,color:'#6b6050',lineHeight:1.6}}>
                          Every system ranked lowest to highest. 🔴 High priority means below 65% — these need the most attention before your exam.
                        </div>
                        <div style={{overflowX:'auto'}}>
                          <table style={{width:'100%',borderCollapse:'collapse'}}>
                            <thead>
                              <tr style={{background:'#f5f2eb',borderBottom:'1px solid #e0dbd0'}}>
                                <th style={{padding:'7px 14px',textAlign:'left',fontSize:10,color:'#8a7d6a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',width:50}}>Rank</th>
                                <th style={{padding:'7px 14px',textAlign:'left',fontSize:10,color:'#8a7d6a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}}>System / Subject</th>
                                <th style={{padding:'7px 14px',textAlign:'center',fontSize:10,color:'#8a7d6a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',width:80}}>Score</th>
                                <th style={{padding:'7px 14px',textAlign:'center',fontSize:10,color:'#8a7d6a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',width:80}}>Wrong</th>
                                <th style={{padding:'7px 14px',textAlign:'center',fontSize:10,color:'#8a7d6a',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',width:140}}>Priority</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, i) => (
                                <tr key={r.name} style={{borderBottom:'0.5px solid #f5f0e8',background:i%2===0?'white':'#fdfcfa'}}>
                                  <td style={{padding:'8px 14px',fontSize:13,color:'#a89870',textAlign:'center',fontWeight:600}}>{i+1}</td>
                                  <td style={{padding:'8px 14px',fontSize:13,color:'#0d2340',fontWeight:500}}>{r.name}</td>
                                  <td style={{padding:'8px 14px',fontSize:13,fontWeight:700,color:scoreColor(r.pct),textAlign:'center'}}>{r.pct}%</td>
                                  <td style={{padding:'8px 14px',fontSize:13,color:'#c0574a',fontWeight:600,textAlign:'center'}}>{r.wrong}</td>
                                  <td style={{padding:'8px 14px',fontSize:12,textAlign:'center'}}>{dot(r.pct)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* ── 📊 Performance Breakdown — Strengths & Weaknesses (collapsible) ── */}
              {hasBreakdown && (
                <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                  <div onClick={() => setShowBreakdownSection(v => !v)}
                    style={{background:'#0d2340',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:14}}>📊</span>
                      <div style={{fontSize:13,fontWeight:700,color:'white'}}>Performance Breakdown</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>Strengths &amp; weaknesses vs. national avg</span>
                      <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showBreakdownSection ? '−' : '+'}</span>
                    </div>
                  </div>
                  {showBreakdownSection && (
                    <div style={{padding:'16px',background:'white'}}>
                      <div style={{fontSize:12,color:'#6b6050',marginBottom:14,lineHeight:1.6}}>
                        How your performance compares to the estimated national average for USMLE Step 1 (~70%). A result in "Higher" means you outperformed average; "Lower" means room to grow. Use this alongside the Focus Plan to calibrate your study strategy.
                      </div>
                      <div style={{background:'#f5f2eb',border:'1px solid #e0dbd0',borderRadius:8,padding:'12px 16px',marginBottom:18}}>
                        <div style={{fontSize:11,fontWeight:700,color:'#0d2340',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em'}}>How to read this report</div>
                        <div style={{display:'flex',gap:24,flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:200}}>
                            <div style={{fontSize:11,color:'#7a6d5a',marginBottom:6}}>Your score color</div>
                            <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                              {[
                                {color:'#c0574a', label:'Focus First', range:'<55%'},
                                {color:'#c07040', label:'Needs work', range:'55–64%'},
                                {color:'#c9a84c', label:'Developing', range:'65–74%'},
                                {color:'#6b7c3a', label:'Strong', range:'75%+'},
                              ].map(({color, label, range}) => (
                                <div key={label} style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
                                  <span style={{fontSize:12,color:'#3a3020',fontWeight:500}}>{label}</span>
                                  <span style={{fontSize:11,color:'#8a7d6a'}}>{range}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div style={{flex:1,minWidth:220}}>
                            <div style={{fontSize:11,color:'#7a6d5a',marginBottom:6}}>Compared to national average for each category</div>
                            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                              {[
                                {col:'Lower', desc:'5%+ below'},
                                {col:'Same',  desc:'Within 5%'},
                                {col:'Higher',desc:'5%+ above'},
                              ].map(({col, desc}) => (
                                <div key={col} style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{width:13,height:13,background:'#2a8f8a',borderRadius:3,flexShrink:0}}/>
                                  <span style={{fontSize:12,color:'#3a3020',fontWeight:500}}>{col}</span>
                                  <span style={{fontSize:11,color:'#8a7d6a'}}>{desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      {hasSystem && <NBMEBreakdownTable title="Performance by Organ System" data={results.systemBreakdown} avgLookup={SYSTEM_NATIONAL_AVG}/>}
                      {hasDiscipline && <NBMEBreakdownTable title="Performance by Subject / Discipline" data={results.disciplineBreakdown} avgLookup={DISCIPLINE_NATIONAL_AVG}/>}
                      {hasTopic && <NBMEBreakdownTable title="Performance by Topic" data={results.topicBreakdown}/>}
                    </div>
                  )}
                </div>
              )}

              {/* ── 📖 Topic Full Breakdown 220Q (collapsible) ── */}
              {(results.examName || '').toLowerCase().includes('220q assessment') && (results.questionDetails || []).length > 0 && (() => {
                type Q220Item = {qNum: number, subtopic: string, studentAnswer: string, correctAnswer: string}
                const subjectGroups: Record<string, {correct: Q220Item[], incorrect: Q220Item[]}> = {}
                for (const qd of (results.questionDetails as any[])) {
                  const mapped = Q220_SUBJECT_MAP[qd.qNum as number]
                  if (!mapped) continue
                  const subj = mapped.subject
                  if (!subjectGroups[subj]) subjectGroups[subj] = {correct: [], incorrect: []}
                  const item: Q220Item = {qNum: qd.qNum, subtopic: mapped.subtopic, studentAnswer: qd.studentAnswer, correctAnswer: qd.correctAnswer || '—'}
                  if (qd.correct) subjectGroups[subj].correct.push(item)
                  else subjectGroups[subj].incorrect.push(item)
                }
                const sorted = Object.entries(subjectGroups).sort(([,a],[,b]) => {
                  const pctA = a.correct.length / (a.correct.length + a.incorrect.length || 1)
                  const pctB = b.correct.length / (b.correct.length + b.incorrect.length || 1)
                  return pctA - pctB
                })
                if (sorted.length === 0) return null
                const toggleSubject = (subj: string) => setExpandedQ220Subjects(prev => {
                  const next = new Set(prev)
                  if (next.has(subj)) next.delete(subj); else next.add(subj)
                  return next
                })
                return (
                  <div style={{border:'1px solid #e0dbd0',borderRadius:8,marginBottom:10,overflow:'hidden'}}>
                    <div onClick={() => setShowTopicFullBreakdown(v => !v)}
                      style={{background:'#1a3a5a',padding:'11px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer'}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:14}}>📖</span>
                        <div style={{fontSize:13,fontWeight:700,color:'white'}}>Topic Full Breakdown</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>All 220 topics by subject — worst → best</span>
                        <span style={{color:'#c9a84c',fontSize:18,fontWeight:700,lineHeight:1}}>{showTopicFullBreakdown ? '−' : '+'}</span>
                      </div>
                    </div>
                    {showTopicFullBreakdown && (
                      <div style={{padding:'16px',background:'white'}}>
                        <div style={{fontSize:12,color:'#6b6050',marginBottom:14,lineHeight:1.6}}>
                          Every question from the 220Q Assessment grouped by subject, sorted worst → best. Expand a subject to see individual question results and subtopics.
                        </div>
                        {sorted.map(([subj, {correct: cList, incorrect: iList}]) => {
                          const total = cList.length + iList.length
                          const pct = total > 0 ? Math.round((cList.length / total) * 100) : 0
                          const priorityDot = pct < 65 ? '🔴' : pct < 85 ? '🟡' : '🟢'
                          const priorityLabel = pct < 65 ? 'HIGH' : pct < 85 ? 'MODERATE' : 'STRONG'
                          const isExpanded = expandedQ220Subjects.has(subj)
                          const headerBg = pct < 65 ? '#fdf0ee' : pct < 85 ? '#fdfaee' : '#f0f5eb'
                          const headerBorder = pct < 65 ? '#f0ccc8' : pct < 85 ? '#e8dfc8' : '#c8dcc0'
                          return (
                            <div key={subj} style={{border:`1px solid ${headerBorder}`,borderRadius:8,marginBottom:6,overflow:'hidden'}}>
                              <div style={{background:headerBg,padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>
                                <div style={{flex:1,display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' as const}}>
                                  <span style={{fontWeight:700,fontSize:13,color:'#0d2340'}}>{subj}</span>
                                  <span style={{fontSize:12,color:'#6b6050'}}>{cList.length}/{total} correct ({pct}%)</span>
                                  <span style={{fontSize:12}}>{priorityDot} <span style={{fontSize:11,fontWeight:600,color:pct<65?'#c0574a':pct<85?'#c07040':'#6b7c3a'}}>{priorityLabel}</span></span>
                                </div>
                                <button onClick={() => toggleSubject(subj)}
                                  style={{width:26,height:26,borderRadius:6,border:'1.5px solid #c9a84c',background:'white',color:'#c9a84c',fontSize:18,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,flexShrink:0,padding:0}}>
                                  {isExpanded ? '−' : '+'}
                                </button>
                              </div>
                              {isExpanded && (
                                <div style={{background:'white',padding:'10px 16px'}}>
                                  {iList.length > 0 && (
                                    <div style={{marginBottom: cList.length > 0 ? 12 : 0}}>
                                      <div style={{fontSize:11,fontWeight:700,color:'#c0574a',marginBottom:5,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>✗ INCORRECT ({iList.length})</div>
                                      {iList.sort((a,b)=>a.qNum-b.qNum).map(item => (
                                        <div key={item.qNum} style={{display:'flex',alignItems:'baseline',gap:8,padding:'4px 8px',borderBottom:'0.5px solid #f5f0e8',fontSize:12}}>
                                          <span style={{fontWeight:700,color:'#c0574a',minWidth:34,flexShrink:0}}>Q{item.qNum}</span>
                                          <span style={{flex:1,color:'#1a1008'}}>{item.subtopic}</span>
                                          <span style={{fontSize:11,color:'#a89870',flexShrink:0,whiteSpace:'nowrap' as const}}>Answered {item.studentAnswer} → {item.correctAnswer}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {cList.length > 0 && (
                                    <div>
                                      <div style={{fontSize:11,fontWeight:700,color:'#6b7c3a',marginBottom:5,textTransform:'uppercase' as const,letterSpacing:'0.06em'}}>✓ CORRECT ({cList.length})</div>
                                      {cList.sort((a,b)=>a.qNum-b.qNum).map(item => (
                                        <div key={item.qNum} style={{display:'flex',alignItems:'baseline',gap:8,padding:'4px 8px',borderBottom:'0.5px solid #f5f0e8',fontSize:12}}>
                                          <span style={{fontWeight:700,color:'#6b7c3a',minWidth:34,flexShrink:0}}>Q{item.qNum}</span>
                                          <span style={{flex:1,color:'#1a1008'}}>{item.subtopic}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Actions */}
              <div style={{display:'flex',gap:12,maxWidth:500,marginTop:28}}>
                <button onClick={handleBackFromResults}
                  style={{flex:1,height:46,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {isAdminView ? '← Back' : '← Back to exams'}
                </button>
                <button onClick={() => router.push('/dashboard/nbme')}
                  style={{flex:1,height:46,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  NBME tracker →
                </button>
              </div>
            </div>
          )}

          {/* ── WEAKNESS MAP TAB ── */}
          {resultsTab === 'weakness' && (() => {
            // Build system→topics and discipline→topics maps from question details
            const systemTopics: Record<string, Record<string, {correct:number,total:number}>> = {}
            const disciplineTopics: Record<string, Record<string, {correct:number,total:number}>> = {}
            for (const q of (results.questionDetails || [])) {
              if (q.system && q.topic) {
                if (!systemTopics[q.system]) systemTopics[q.system] = {}
                if (!systemTopics[q.system][q.topic]) systemTopics[q.system][q.topic] = {correct:0,total:0}
                systemTopics[q.system][q.topic].total++
                if (q.correct) systemTopics[q.system][q.topic].correct++
              }
              if (q.discipline && q.topic) {
                if (!disciplineTopics[q.discipline]) disciplineTopics[q.discipline] = {}
                if (!disciplineTopics[q.discipline][q.topic]) disciplineTopics[q.discipline][q.topic] = {correct:0,total:0}
                disciplineTopics[q.discipline][q.topic].total++
                if (q.correct) disciplineTopics[q.discipline][q.topic].correct++
              }
            }

            const buildMap = (data: Record<string, {correct:number,total:number}>, lookup?: Record<string,number>) =>
              Object.entries(data)
                .map(([name, s]) => {
                  const pct = s.total > 0 ? Math.round((s.correct/s.total)*100) : 0
                  const nationalAvg = lookup?.[name] ?? 70
                  return { name, pct, correct: s.correct, total: s.total, missed: s.total - s.correct, nationalAvg }
                })
                .sort((a,b) => b.missed !== a.missed ? b.missed - a.missed : a.pct - b.pct)

            const systemRows = buildMap(results.systemBreakdown || {}, SYSTEM_NATIONAL_AVG)
            const disciplineRows = buildMap(results.disciplineBreakdown || {}, DISCIPLINE_NATIONAL_AVG)

            const urgency = (pct: number, nationalAvg: number, missed: number) =>
              missed > 10 || pct < nationalAvg - 8 ? 'red' :
              missed > 4 || pct < nationalAvg + 5 ? 'amber' : 'green'
            const urgencyColor = (u: string) =>
              u === 'red' ? '#c0574a' : u === 'amber' ? '#c9a84c' : '#6b7c3a'
            const urgencyBg = (u: string) =>
              u === 'red' ? '#fdf0ee' : u === 'amber' ? '#fdfaee' : '#f0f5eb'

            const toggleRow = (key: string) =>
              setExpandedWeaknessRows(prev => {
                const next = new Set(prev)
                if (next.has(key)) { next.delete(key) } else { next.add(key) }
                return next
              })

            const WeaknessSection = ({ title, rows, subtopicMap, prefix }: {
              title: string,
              rows: ReturnType<typeof buildMap>,
              subtopicMap: Record<string, Record<string, {correct:number,total:number}>>,
              prefix: string
            }) => {
              if (rows.length === 0) return null
              const redRows = rows.filter(r => urgency(r.pct, r.nationalAvg, r.missed) === 'red')
              const amberRows = rows.filter(r => urgency(r.pct, r.nationalAvg, r.missed) === 'amber')
              const greenRows = rows.filter(r => urgency(r.pct, r.nationalAvg, r.missed) === 'green')

              const RowGroup = ({ label, color, bg, items }: { label:string, color:string, bg:string, items: typeof rows }) => {
                if (items.length === 0) return null
                return (
                  <div style={{marginBottom:16}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:color,flexShrink:0}}/>
                      <div style={{fontSize:11,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</div>
                    </div>
                    {items.map(row => {
                      const rowKey = `${prefix}:${row.name}`
                      const isExpanded = expandedWeaknessRows.has(rowKey)
                      const barPct = Math.min(row.pct, 100)
                      const avgMarker = Math.min(row.nationalAvg, 100)
                      const diff = row.pct - row.nationalAvg
                      const topicEntries = Object.entries(subtopicMap[row.name] || {})
                        .map(([t, s]) => ({ name: t, pct: s.total > 0 ? Math.round((s.correct/s.total)*100) : 0, correct: s.correct, total: s.total, missed: s.total - s.correct }))
                        .sort((a,b) => b.missed !== a.missed ? b.missed - a.missed : a.pct - b.pct)
                      return (
                        <div key={row.name} style={{background:bg,borderRadius:8,padding:'12px 16px',marginBottom:6,border:`1px solid ${color}22`}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                            <div style={{fontSize:14,fontWeight:600,color:'#0d2340'}}>{row.name}</div>
                            <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                              <span style={{fontSize:11,color:'#8a7d6a'}}>{row.correct}/{row.total} correct</span>
                              <span style={{fontSize:11,fontWeight:600,color:'#c0574a'}}>{row.missed} missed</span>
                              <span style={{fontFamily:'Georgia,serif',fontSize:18,fontWeight:700,color}}>{row.pct}%</span>
                              <span style={{fontSize:11,color,fontWeight:600}}>{diff >= 0 ? '+' : ''}{diff}% vs avg</span>
                              {topicEntries.length > 0 && (
                                <button onClick={() => toggleRow(rowKey)}
                                  style={{width:26,height:26,borderRadius:6,border:`1.5px solid ${color}`,background:'white',color,fontSize:18,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,flexShrink:0,padding:0}}>
                                  {isExpanded ? '−' : '+'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{position:'relative',height:10,background:'#e8e2d8',borderRadius:5,overflow:'visible'}}>
                            <div style={{height:'100%',width:`${barPct}%`,background:color,borderRadius:5,transition:'width 0.4s'}}/>
                            <div style={{position:'absolute',top:-4,left:`${avgMarker}%`,width:2,height:18,background:'#0d2340',borderRadius:1,transform:'translateX(-50%)'}}/>
                          </div>
                          <div style={{display:'flex',justifyContent:'flex-end',marginTop:3}}>
                            <span style={{fontSize:10,color:'#a89870'}}>▲ national avg ({row.nationalAvg}%)</span>
                          </div>
                          {isExpanded && topicEntries.length > 0 && (
                            <div style={{marginTop:10,borderTop:`1px solid ${color}33`,paddingTop:10}}>
                              <div style={{fontSize:10,fontWeight:700,color:'#8a7d6a',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Topics</div>
                              {topicEntries.map(t => {
                                const tColor = t.pct < 60 ? '#c0574a' : t.pct < 75 ? '#c9a84c' : '#6b7c3a'
                                return (
                                  <div key={t.name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:5,padding:'6px 10px',background:'rgba(255,255,255,0.7)',borderRadius:6}}>
                                    <div style={{flex:1,fontSize:12,color:'#1a1008',fontWeight:500}}>{t.name}</div>
                                    <div style={{width:80,height:6,background:'#e8e2d8',borderRadius:3,flexShrink:0}}>
                                      <div style={{height:'100%',width:`${Math.min(t.pct,100)}%`,background:tColor,borderRadius:3}}/>
                                    </div>
                                    <div style={{fontSize:12,fontWeight:700,color:tColor,width:36,textAlign:'right',flexShrink:0}}>{t.pct}%</div>
                                    <div style={{fontSize:11,color:'#8a7d6a',width:52,textAlign:'right',flexShrink:0}}>{t.correct}/{t.total}</div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              return (
                <div style={{background:'white',border:'1px solid #ccc8be',borderRadius:10,overflow:'hidden',marginBottom:20}}>
                  <div style={{background:'#d6eeec',padding:'10px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#0d2340'}}>{title}</div>
                    <div style={{fontSize:10,color:'#5a7a78'}}>Click + to expand topics</div>
                  </div>
                  <div style={{padding:'16px 18px'}}>
                    <RowGroup label="Focus Here First" color={urgencyColor('red')} bg={urgencyBg('red')} items={redRows}/>
                    <RowGroup label="Keep Building — Almost There" color={urgencyColor('amber')} bg={urgencyBg('amber')} items={amberRows}/>
                    <RowGroup label="You've Got This — Solid Foundation" color={urgencyColor('green')} bg={urgencyBg('green')} items={greenRows}/>
                  </div>
                </div>
              )
            }

            const topWeakSystems = systemRows.filter(r => urgency(r.pct, r.nationalAvg, r.missed) === 'red').slice(0,3)
            const topWeakDisciplines = disciplineRows.filter(r => urgency(r.pct, r.nationalAvg, r.missed) === 'red').slice(0,3)

            return (
              <div style={{paddingTop:20}}>
                {/* Priority banner */}
                {(topWeakSystems.length > 0 || topWeakDisciplines.length > 0) && (
                  <div style={{background:'#0d2340',borderRadius:10,padding:'18px 22px',marginBottom:20}}>
                    <div style={{fontFamily:'Georgia,serif',fontSize:16,color:'#c9a84c',marginBottom:10}}>Your Priority Study Areas</div>
                    <div style={{display:'flex',gap:20,flexWrap:'wrap'}}>
                      {topWeakSystems.length > 0 && (
                        <div>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Organ Systems</div>
                          {topWeakSystems.map((r,i) => (
                            <div key={r.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              <span style={{fontFamily:'Georgia,serif',fontSize:13,color:'#c0574a',fontWeight:700,width:18}}>#{i+1}</span>
                              <span style={{fontSize:13,color:'white',fontWeight:500}}>{r.name}</span>
                              <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{r.pct}% · {r.missed} missed</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {topWeakDisciplines.length > 0 && (
                        <div style={{borderLeft:'1px solid rgba(255,255,255,0.1)',paddingLeft:20}}>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>Subjects</div>
                          {topWeakDisciplines.map((r,i) => (
                            <div key={r.name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                              <span style={{fontFamily:'Georgia,serif',fontSize:13,color:'#c0574a',fontWeight:700,width:18}}>#{i+1}</span>
                              <span style={{fontSize:13,color:'white',fontWeight:500}}>{r.name}</span>
                              <span style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{r.pct}% · {r.missed} missed</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {topWeakSystems.length === 0 && topWeakDisciplines.length === 0 && (
                      <div style={{fontSize:13,color:'rgba(255,255,255,0.6)'}}>No priority areas — you are at or above the national average in all content areas.</div>
                    )}
                  </div>
                )}

                <WeaknessSection title="Organ Systems — Weakest to Strongest" rows={systemRows} subtopicMap={systemTopics} prefix="sys"/>
                <WeaknessSection title="Subjects / Disciplines — Weakest to Strongest" rows={disciplineRows} subtopicMap={disciplineTopics} prefix="disc"/>

                <div style={{display:'flex',gap:12,maxWidth:500,marginTop:8}}>
                  <button onClick={handleBackFromResults}
                    style={{flex:1,height:46,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    {isAdminView ? '← Back' : '← Back to exams'}
                  </button>
                  <button onClick={() => router.push('/dashboard/nbme')}
                    style={{flex:1,height:46,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    NBME tracker →
                  </button>
                </div>
              </div>
            )
          })()}

          {/* ── QUESTION REVIEW TAB ── */}
          {resultsTab === 'questions' && (
            <div style={{paddingTop:20}}>
              <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:24}}>
                <div style={{background:'#0d2340',padding:'12px 18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
                  <div style={{fontSize:14,fontWeight:600,color:'white'}}>Question Review</div>
                  <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                    {(['all','correct','incorrect'] as const).map(f => (
                      <button key={f} onClick={() => setResultsFilter(f)}
                        style={{padding:'4px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sora,sans-serif',
                          background:resultsFilter===f?'#c9a84c':'rgba(255,255,255,0.12)',
                          color:resultsFilter===f?'#0d2340':'rgba(255,255,255,0.6)'}}>
                        {f==='all'?`All (${results.questionDetails?.length||0})`:f==='correct'?`✓ Correct (${results.correct})`:`✗ Incorrect (${results.wrongCount})`}
                      </button>
                    ))}
                    <div style={{width:1,height:20,background:'rgba(255,255,255,0.2)',margin:'0 2px'}}/>
                    <button onClick={() => setQReviewGrouped(g => !g)}
                      style={{padding:'4px 12px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Sora,sans-serif',
                        background:qReviewGrouped?'rgba(201,168,76,0.25)':'rgba(255,255,255,0.12)',
                        color:qReviewGrouped?'#c9a84c':'rgba(255,255,255,0.6)'}}>
                      ⊞ Group by System
                    </button>
                  </div>
                </div>
                {filteredQs.length === 0 ? (
                  <div style={{padding:'32px',textAlign:'center',color:'#a89870',fontSize:14}}>No questions to display</div>
                ) : qReviewGrouped ? (() => {
                  const groups: Record<string, Array<{qNum:number,system?:string,discipline?:string,topic?:string,concept?:string,studentAnswer:string,correctAnswer?:string,correct:boolean}>> = {}
                  type QItem = {qNum:number,system?:string,discipline?:string,topic?:string,concept?:string,studentAnswer:string,correctAnswer?:string,correct:boolean}
                  ;(filteredQs as QItem[]).forEach(q => {
                    const key = q.system || 'Other'
                    if (!groups[key]) groups[key] = []
                    groups[key].push(q)
                  })
                  return (
                    <div style={{overflowX:'auto'}}>
                      {Object.entries(groups).sort(([,a],[,b]) => b.filter(q => !q.correct).length - a.filter(q => !q.correct).length).map(([system, qs]) => {
                        const missed = qs.filter(q => !q.correct).length
                        const pct = Math.round(((qs.length - missed) / qs.length) * 100)
                        const headerColor = pct < 55 ? '#c0574a' : pct < 65 ? '#c07040' : pct < 75 ? '#c9a84c' : '#6b7c3a'
                        return (
                          <div key={system} style={{marginBottom:0}}>
                            <div style={{background:'#f0ece0',padding:'8px 14px',display:'flex',alignItems:'center',gap:12,borderBottom:'1px solid #e8dfc8',borderTop:'1px solid #e8dfc8'}}>
                              <div style={{width:10,height:10,borderRadius:'50%',background:headerColor,flexShrink:0}}/>
                              <span style={{fontSize:13,fontWeight:700,color:'#0d2340',flex:1}}>{system}</span>
                              <span style={{fontSize:12,color:'#8a7d6a'}}>{qs.length}Q · {pct}% correct</span>
                              {missed > 0 && <span style={{fontSize:12,fontWeight:600,color:headerColor}}>{missed} missed</span>}
                            </div>
                            <table style={{width:'100%',borderCollapse:'collapse'}}>
                              <thead>
                                <tr style={{background:'#faf8f4'}}>
                                  {['Q#','Subject','Topic','Concept','Your Answer','Correct','Result'].map(h => (
                                    <th key={h} style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'7px 14px',textAlign:'left',borderBottom:'0.5px solid #f0ece0',whiteSpace:'nowrap'}}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {qs.map((q, i) => (
                                  <tr key={q.qNum} style={{borderBottom:'0.5px solid #faf8f4',background:i%2===0?'white':'#fdfcfa'}}>
                                    <td style={{padding:'8px 14px',fontSize:13,color:'#0d2340',fontWeight:600,width:40}}>{q.qNum}</td>
                                    <td style={{padding:'8px 14px',fontSize:12,color:'#3d3020',whiteSpace:'nowrap'}}>{q.discipline||'—'}</td>
                                    <td style={{padding:'8px 14px',fontSize:12,color:'#3d3020'}}>{q.topic||'—'}</td>
                                    <td style={{padding:'8px 14px',fontSize:11,color:'#8a7d6a',maxWidth:200}}>{q.concept||'—'}</td>
                                    <td style={{padding:'8px 14px',fontSize:13,fontWeight:700,color:q.correct?'#6b7c3a':'#c0574a',textAlign:'center',width:56}}>{q.studentAnswer}</td>
                                    <td style={{padding:'8px 14px',fontSize:13,fontWeight:700,color:'#0d2340',textAlign:'center',width:56}}>{q.correctAnswer||'—'}</td>
                                    <td style={{padding:'8px 14px',textAlign:'center',width:44}}>
                                      <span style={{fontSize:15,color:q.correct?'#6b7c3a':'#c0574a'}}>{q.correct?'✓':'✗'}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      })}
                    </div>
                  )
                })() : (
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <thead>
                        <tr style={{background:'#faf8f4'}}>
                          {['Q#','System','Subject','Topic','Concept','Your Answer','Correct','Result'].map(h => (
                            <th key={h} style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'9px 14px',textAlign:'left',borderBottom:'0.5px solid #f0ece0',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredQs as Array<{qNum:number,system?:string,discipline?:string,topic?:string,concept?:string,studentAnswer:string,correctAnswer?:string,correct:boolean}>).map((q, i) => (
                          <tr key={q.qNum} style={{borderBottom:'0.5px solid #faf8f4',background:i%2===0?'white':'#fdfcfa'}}>
                            <td style={{padding:'9px 14px',fontSize:13,color:'#0d2340',fontWeight:600,width:40}}>{q.qNum}</td>
                            <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020',whiteSpace:'nowrap'}}>{q.system||'—'}</td>
                            <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020',whiteSpace:'nowrap'}}>{q.discipline||'—'}</td>
                            <td style={{padding:'9px 14px',fontSize:12,color:'#3d3020'}}>{q.topic||'—'}</td>
                            <td style={{padding:'9px 14px',fontSize:11,color:'#8a7d6a',maxWidth:220}}>{q.concept||'—'}</td>
                            <td style={{padding:'9px 14px',fontSize:13,fontWeight:700,color:q.correct?'#6b7c3a':'#c0574a',textAlign:'center',width:56}}>{q.studentAnswer}</td>
                            <td style={{padding:'9px 14px',fontSize:13,fontWeight:700,color:'#0d2340',textAlign:'center',width:56}}>{q.correctAnswer||'—'}</td>
                            <td style={{padding:'9px 14px',textAlign:'center',width:44}}>
                              <span style={{fontSize:15,color:q.correct?'#6b7c3a':'#c0574a'}}>{q.correct?'✓':'✗'}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div style={{display:'flex',gap:12,maxWidth:500}}>
                <button onClick={handleBackFromResults}
                  style={{flex:1,height:46,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  {isAdminView ? '← Back' : '← Back to exams'}
                </button>
                <button onClick={() => router.push('/dashboard/nbme')}
                  style={{flex:1,height:46,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                  NBME tracker →
                </button>
              </div>
            </div>
          )}

          {/* ── MY PROGRESS TAB ── */}
          {resultsTab === 'progress' && (() => {
            const examSessions = pastSessions
              .filter((s: {exam_id:string,status:string,percent_correct:number|null,submitted_at:string}) => s.exam_id === results.examId && s.status === 'submitted' && s.percent_correct != null)
              .sort((a: {submitted_at:string},b: {submitted_at:string}) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime())

            const PASS = 65
            const W = 560, H = 200
            const PL = 52, PR = 36, PT = 28, PB = 40
            const cW = W - PL - PR, cH = H - PT - PB
            const scores: number[] = examSessions.map((s: {percent_correct:number}) => s.percent_correct)
            const n = scores.length
            const xOf = (i: number) => n <= 1 ? PL + cW / 2 : PL + (i / (n - 1)) * cW
            const yOf = (pct: number) => PT + cH - (pct / 100) * cH

            let trendPath = ''
            let projectedDate: string | null = null
            if (n >= 2) {
              const meanX = (n - 1) / 2
              const meanY = scores.reduce((a: number, b: number) => a + b, 0) / n
              const slope = scores.reduce((acc: number, y: number, i: number) => acc + (i - meanX) * (y - meanY), 0) /
                scores.reduce((acc: number, _: number, i: number) => acc + (i - meanX) ** 2, 0)
              const intercept = meanY - slope * meanX
              const ty1 = Math.max(0, Math.min(100, slope * 0 + intercept))
              const ty2 = Math.max(0, Math.min(100, slope * (n - 1) + intercept))
              trendPath = `M ${xOf(0)} ${yOf(ty1)} L ${xOf(n - 1)} ${yOf(ty2)}`
              if (slope > 0 && meanY < PASS) {
                const stepsNeeded = (PASS - intercept) / slope
                const msPerStep = n > 1
                  ? (new Date(examSessions[n-1].submitted_at).getTime() - new Date(examSessions[0].submitted_at).getTime()) / (n - 1)
                  : 14 * 86400000
                const msUntilReady = (stepsNeeded - (n - 1)) * msPerStep
                const lastSubmittedAt = new Date(examSessions[n-1].submitted_at).getTime()
                const readyDate = new Date(lastSubmittedAt + Math.max(0, msUntilReady))
                projectedDate = readyDate.toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})
              }
            }
            const linePath = n > 1 ? 'M ' + scores.map((s: number, i: number) => `${xOf(i)} ${yOf(s)}`).join(' L ') : ''
            const lastScore = scores[n - 1]
            const bestScore = n > 0 ? Math.max(...scores) : 0
            const avgScore = n > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / n) : 0

            return (
              <div style={{paddingTop:20}}>
                <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:24}}>
                  <div style={{background:'#0d2340',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:14,fontWeight:600,color:'white'}}>My Progress — {results.examName}</div>
                    <div style={{fontSize:12,color:'rgba(255,255,255,0.5)'}}>{n} attempt{n !== 1 ? 's' : ''}</div>
                  </div>
                  {n === 0 ? (
                    <div style={{padding:'48px 24px',textAlign:'center',color:'#a89870',fontSize:14}}>No submitted attempts yet for this exam.</div>
                  ) : (
                    <div style={{padding:'20px 16px'}}>
                      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block',marginBottom:16}}>
                        {[0,25,50,65,75,100].map(pct => (
                          <g key={pct}>
                            <line x1={PL} y1={yOf(pct)} x2={W-PR} y2={yOf(pct)}
                              stroke={pct===PASS?'#c9a84c':'#e8e0d0'} strokeWidth={pct===PASS?1.5:0.5}
                              strokeDasharray={pct===PASS?'6,4':undefined}/>
                            <text x={PL-6} y={yOf(pct)+4} textAnchor="end" fontSize={9} fill={pct===PASS?'#c9a84c':'#b0a080'}>{pct}%</text>
                          </g>
                        ))}
                        <text x={W-PR+4} y={yOf(PASS)+4} fontSize={9} fill="#c9a84c">Pass</text>
                        {linePath && <path d={linePath} stroke="#0d2340" strokeWidth={2} fill="none" strokeLinejoin="round"/>}
                        {trendPath && <path d={trendPath} stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="8,4" fill="none"/>}
                        {scores.map((s: number, i: number) => {
                          const cx = xOf(i), cy = yOf(s)
                          const col = s >= 75 ? '#6b7c3a' : s >= 65 ? '#c9a84c' : '#c0574a'
                          return (
                            <g key={i}>
                              <circle cx={cx} cy={cy} r={6} fill={col} stroke="white" strokeWidth={2}/>
                              <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fontWeight="bold" fill={col}>{s}%</text>
                            </g>
                          )
                        })}
                        {examSessions.map((s: {submitted_at:string}, i: number) => (
                          <text key={i} x={xOf(i)} y={H - PB + 16} textAnchor="middle" fontSize={9} fill="#8a7d6a">
                            {new Date(s.submitted_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                          </text>
                        ))}
                      </svg>
                      <div style={{display:'flex',gap:16,marginBottom:20,flexWrap:'wrap' as const,fontSize:11,color:'#8a7d6a',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke="#0d2340" strokeWidth={2}/></svg>
                          Score history
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="5,3"/></svg>
                          Trend line
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:5}}>
                          <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke="#c9a84c" strokeWidth={1.5} strokeDasharray="4,2"/></svg>
                          Passing threshold (65%)
                        </div>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,marginBottom:20}}>
                        {([
                          {label:'Current Score',value:`${lastScore}%`,color:lastScore>=65?'#6b7c3a':'#c0574a'},
                          {label:'Best Score',value:`${bestScore}%`,color:'#6b7c3a'},
                          {label:'Average Score',value:`${avgScore}%`,color:'#0d2340'},
                          {label:'Attempts',value:`${n}`,color:'#0d2340'},
                        ] as {label:string,value:string,color:string}[]).map(({label,value,color}) => (
                          <div key={label} style={{background:'#f7f4ee',borderRadius:8,padding:'12px 14px'}}>
                            <div style={{fontSize:11,color:'#8a7d6a',marginBottom:4}}>{label}</div>
                            <div style={{fontSize:20,fontWeight:700,color,fontFamily:'Georgia,serif'}}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{background:'#0d2340',borderRadius:10,padding:'16px 20px'}}>
                        <div style={{fontSize:13,fontWeight:700,color:'#c9a84c',marginBottom:8}}>Score Predictor</div>
                        {lastScore >= 65 ? (
                          <div style={{color:'#a0c870',fontSize:13,lineHeight:1.6}}>
                            You are already scoring above the passing threshold. Keep practicing to build a strong buffer before test day!
                          </div>
                        ) : projectedDate ? (
                          <div style={{color:'rgba(255,255,255,0.85)',fontSize:13,lineHeight:1.6}}>
                            Based on your improvement trend, you are on track to reach passing scores by approximately{' '}
                            <span style={{color:'#c9a84c',fontWeight:700}}>{projectedDate}</span>. Keep up the pace!
                          </div>
                        ) : n < 2 ? (
                          <div style={{color:'rgba(255,255,255,0.6)',fontSize:13,lineHeight:1.6}}>
                            Complete at least 2 attempts to unlock your personalized score projection.
                          </div>
                        ) : (
                          <div style={{color:'#f0a880',fontSize:13,lineHeight:1.6}}>
                            Your scores are trending downward. Focus on your priority topics in the Weakness Map and reach out to your mentor.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{display:'flex',gap:12,maxWidth:500}}>
                  <button onClick={handleBackFromResults}
                    style={{flex:1,height:46,background:'white',border:'1px solid #e8dfc8',borderRadius:10,color:'#0d2340',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    {isAdminView ? '← Back' : '← Back to exams'}
                  </button>
                  <button onClick={() => router.push('/dashboard/nbme')}
                    style={{flex:1,height:46,background:'#0d2340',border:'none',borderRadius:10,color:'#c9a84c',fontFamily:'Sora,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer'}}>
                    NBME tracker →
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </main>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────────
  return (
    <main style={{minHeight:'100vh',display:'flex',background:'#f7f4ee',fontFamily:'Sora,sans-serif',fontSize:'17.6px'}}>

      {/* Passcode modal */}
      {showPasscode && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'white',borderRadius:16,padding:'32px',width:360,fontFamily:'Sora,sans-serif'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'#0d2340',marginBottom:8}}>Accommodation Passcode</div>
            <div style={{fontSize:13,color:'#8a7d6a',marginBottom:20,lineHeight:1.6}}>
              Enter your accommodation passcode for extended time, or skip to take with standard timing.
            </div>
            <input
              type="text"
              value={passcodeInput}
              onChange={e => setPasscodeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePasscodeSubmit()}
              placeholder="Enter passcode"
              autoFocus
              style={{width:'100%',padding:'10px 14px',borderRadius:8,border:'1.5px solid #d8cfc0',fontSize:14,fontFamily:'Sora,sans-serif',boxSizing:'border-box',marginBottom:14,outline:'none'}}
            />
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => handlePasscodeSubmit(true)}
                style={{flex:1,height:40,background:'#f7f4ee',border:'1px solid #d8cfc0',borderRadius:8,fontSize:13,color:'#3d3020',fontFamily:'Sora,sans-serif',cursor:'pointer',fontWeight:500}}>
                Skip
              </button>
              <button onClick={() => handlePasscodeSubmit(false)}
                style={{flex:2,height:40,background:'#0d2340',border:'none',borderRadius:8,fontSize:13,color:'#c9a84c',fontFamily:'Sora,sans-serif',cursor:'pointer',fontWeight:600}}>
                Apply & Start →
              </button>
            </div>
          </div>
        </div>
      )}

      <nav style={{width:220,flexShrink:0,background:'#0d2340',display:isMobile?'none':'flex',flexDirection:'column',height:'100vh',position:'sticky',top:0}}>
        <div style={{padding:'20px 18px 16px',borderBottom:'0.5px solid rgba(201,168,76,0.2)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,background:'#c9a84c',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <div style={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderBottom:'11px solid #0d2340'}}/>
            </div>
            <div style={{fontFamily:'Georgia,serif',fontSize:20,color:'white',fontWeight:600}}>StepUp</div>
          </div>
          <div style={{fontSize:10,color:'#c9a84c',letterSpacing:'0.09em',textTransform:'uppercase',paddingLeft:46,marginTop:3}}>P2P Mentoring Program</div>
        </div>
        <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
          {navGroups.map(group => (
            <div key={group.section}>
              <div style={{fontSize:10,textTransform:'uppercase',letterSpacing:'0.12em',color:'rgba(255,255,255,0.28)',padding:'0 8px',margin:'12px 0 4px'}}>{group.section}</div>
              {group.items.map((item:any) => (
                <div key={item.name} onClick={() => router.push(item.path)}
                  style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:7,color:item.active?'#c9a84c':'rgba(255,255,255,0.55)',fontSize:13.5,marginBottom:2,background:item.active?'rgba(255,255,255,0.09)':'transparent',cursor:'pointer'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>{item.name}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(201,168,76,0.14)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'#c9a84c',color:'#0d2340',fontSize:12,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:'white',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name||user?.email?.split('@')[0]}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Windsor SOM</div>
            </div>
            <div onClick={async()=>{await supabase.auth.signOut();router.push('/')}}
              style={{fontSize:11,color:'rgba(255,255,255,0.35)',cursor:'pointer',padding:'4px 8px',borderRadius:4,border:'0.5px solid rgba(255,255,255,0.15)'}}>Sign out</div>
          </div>
        </div>
      </nav>

      <div style={{flex:1,minWidth:0,overflowY:'auto',padding:isMobile?'20px 16px':'32px 36px'}}>
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:'Georgia,serif',fontSize:isMobile?22:30,color:'#0d2340',letterSpacing:-0.5}}>Exam Center</div>
          <div style={{fontSize:14,color:'#8a7d6a',marginTop:5}}>Take timed exams · Get scored instantly · Track your Step 1 prediction</div>
        </div>

        <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden',marginBottom:24}}>
          <div style={{background:'#0d2340',padding:'14px 20px'}}>
            <div style={{fontSize:14,fontWeight:600,color:'white'}}>Available exams</div>
          </div>
          {exams.length === 0 ? (
            <div style={{padding:'24px 16px',textAlign:'center',fontSize:14,color:'#8a7d6a'}}>No exams available</div>
          ) : isMobile ? (
            <div>
              {exams.map((exam, i) => {
                const attempted = pastSessions.filter(s => s.exam_id === exam.id && s.status === 'submitted')
                const bestScore = attempted.length > 0 ? Math.max(...attempted.map((s:any) => s.predicted_step1 || s.percent_correct || 0)) : null
                const bestSession = attempted.find((s:any) => (s.predicted_step1||s.percent_correct||0) === bestScore)
                const timeLabel = (() => { if (!exam.time_per_section_minutes) return exam.time_limit; const t = exam.time_per_section_minutes * (exam.section_count || 4) / 60; return (Number.isInteger(t) ? t : +t.toFixed(1)) + ' hrs' })()
                const inProgress = pastSessions.find(s => s.exam_id === exam.id && s.status === 'in_progress' && !s.submitted_at)
                return (
                  <div key={exam.id} style={{padding:'16px',borderBottom:i<exams.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                      <div>
                        <div style={{fontSize:15,fontWeight:700,color:'#0d2340'}}>{exam.name}</div>
                        {exam.deadline && <div style={{fontSize:12,color:'#c0574a',fontWeight:500,marginTop:2}}>Due {new Date(exam.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>}
                        {attempted.length > 0 && <div style={{fontSize:11,color:'#6b7c3a',marginTop:2}}>Taken {attempted.length}x</div>}
                      </div>
                      {bestSession?.predicted_step1 && <span style={{fontSize:16,fontWeight:700,color:scoreColor(bestSession.percent_correct||0)}}>{bestSession.predicted_step1}</span>}
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap' as const}}>
                      <span style={{fontSize:12,color:'#8a7d6a'}}>{exam.questions}Q</span>
                      <span style={{fontSize:12,color:'#8a7d6a'}}>·</span>
                      <span style={{fontSize:12,color:'#8a7d6a'}}>{timeLabel}</span>
                      <span style={{fontSize:12,color:'#8a7d6a'}}>·</span>
                      <span style={{fontSize:12,padding:'2px 8px',borderRadius:8,background:`${diffColor(exam.difficulty)}18`,color:diffColor(exam.difficulty),fontWeight:500}}>{exam.difficulty}</span>
                    </div>
                    {inProgress ? (
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <button onClick={() => resumeExam(inProgress)} disabled={launching}
                          style={{width:'100%',height:44,background: launchingExamId === inProgress.exam_id ? '#4a5568' : '#c9a84c',border:'none',borderRadius:9,fontSize:15,color:'#0d2340',fontWeight:700,cursor:launching?'not-allowed':'pointer'}}>
                          {launchingExamId === inProgress.exam_id ? 'Loading...' : 'Resume →'}
                        </button>
                        <button onClick={() => startExam(exam)} disabled={launching}
                          style={{width:'100%',height:38,background:'transparent',border:'1px solid #d8cfc0',borderRadius:8,fontSize:13,color:'#8a7d6a',cursor:launching?'not-allowed':'pointer'}}>
                          Start new
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startExam(exam)} disabled={launching}
                        style={{width:'100%',height:44,background: launchingExamId === exam.id ? '#4a5568' : '#0d2340',border:'none',borderRadius:9,fontSize:15,color:'#c9a84c',fontWeight:700,cursor:launching?'not-allowed':'pointer'}}>
                        {launchingExamId === exam.id ? (launchProgress > 0 && launchProgress < 100 ? `Downloading ${launchProgress}%…` : 'Loading…') : attempted.length > 0 ? 'Retake →' : 'Start →'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>
                {['Exam','Questions','Time limit','Difficulty','Deadline','Your best','Action'].map(h => (
                  <th key={h} style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'12px 16px',textAlign:'left',borderBottom:'0.5px solid #f0ece0'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam, i) => {
                const attempted = pastSessions.filter(s => s.exam_id === exam.id && s.status === 'submitted')
                const bestScore = attempted.length > 0 ? Math.max(...attempted.map((s:any) => s.predicted_step1 || s.percent_correct || 0)) : null
                const bestSession = attempted.find((s:any) => (s.predicted_step1||s.percent_correct||0) === bestScore)
                const inProgress = pastSessions.find(s => s.exam_id === exam.id && s.status === 'in_progress' && !s.submitted_at)
                return (
                  <tr key={exam.id} style={{borderBottom:i<exams.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <td style={{padding:'14px 16px'}}>
                      <div style={{fontSize:14,fontWeight:600,color:'#0d2340'}}>{exam.name}</div>
                      {attempted.length > 0 && <div style={{fontSize:11,color:'#6b7c3a',marginTop:2}}>Taken {attempted.length}x</div>}
                    </td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'14px 16px'}}>{exam.questions}Q</td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'14px 16px'}}>{(() => { if (!exam.time_per_section_minutes) return exam.time_limit; const t = exam.time_per_section_minutes * (exam.section_count || 4) / 60; return (Number.isInteger(t) ? t : +t.toFixed(1)) + ' hrs'; })()}</td>
                    <td style={{padding:'14px 16px'}}>
                      <span style={{fontSize:12,padding:'3px 10px',borderRadius:10,background:`${diffColor(exam.difficulty)}18`,color:diffColor(exam.difficulty),fontWeight:500}}>{exam.difficulty}</span>
                    </td>
                    <td style={{fontSize:13,color:exam.deadline?'#c0574a':'#a89870',padding:'14px 16px',fontWeight:exam.deadline?500:400}}>
                      {exam.deadline ? new Date(exam.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '—'}
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      {bestSession?.predicted_step1 ? (
                        <span style={{fontSize:14,fontWeight:700,color:scoreColor(bestSession.percent_correct||0)}}>{bestSession.predicted_step1}</span>
                      ) : bestSession?.percent_correct ? (
                        <span style={{fontSize:13,color:scoreColor(bestSession.percent_correct)}}>{bestSession.percent_correct}%</span>
                      ) : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      {inProgress ? (
                        <div style={{display:'flex',flexDirection:'column',gap:5}}>
                          <button onClick={() => resumeExam(inProgress)} disabled={launching}
                            style={{padding:'7px 14px',background: launchingExamId === inProgress.exam_id ? '#4a5568' : '#c9a84c',border:'none',borderRadius:8,fontSize:13,color:'#0d2340',fontWeight:700,cursor:launching?'not-allowed':'pointer',whiteSpace:'nowrap' as const}}>
                            {launchingExamId === inProgress.exam_id ? 'Loading...' : 'Resume →'}
                          </button>
                          <button onClick={() => startExam(exam)} disabled={launching}
                            style={{padding:'4px 10px',background:'transparent',border:'1px solid #d8cfc0',borderRadius:6,fontSize:11,color:'#8a7d6a',cursor:launching?'not-allowed':'pointer',whiteSpace:'nowrap' as const}}>
                            Start new
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startExam(exam)} disabled={launching}
                          style={{padding:'8px 16px',background: launchingExamId === exam.id ? '#4a5568' : '#0d2340',border:'none',borderRadius:8,fontSize:13,color:'#c9a84c',fontWeight:600,cursor:launching?'not-allowed':'pointer'}}>
                          {launchingExamId === exam.id ? (launchProgress > 0 && launchProgress < 100 ? `Downloading ${launchProgress}%…` : 'Loading…') : attempted.length > 0 ? 'Retake →' : 'Start →'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          )}
        </div>

        {pastSessions.filter(s => s.status === 'submitted').length > 0 && (
          <div style={{background:'white',border:'0.5px solid #e8dfc8',borderRadius:12,overflow:'hidden'}}>
            <div style={{background:'#0d2340',padding:'14px 20px'}}>
              <div style={{fontSize:14,fontWeight:600,color:'white'}}>My exam history</div>
            </div>
            {isMobile ? (
              <div>
                {pastSessions.filter(s=>s.status==='submitted').map((session, i, arr) => (
                  <div key={session.id} style={{padding:'14px 16px',borderBottom:i<arr.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div>
                        <div style={{fontSize:14,fontWeight:600,color:'#0d2340'}}>{session.exam_name}</div>
                        <div style={{fontSize:12,color:'#8a7d6a',marginTop:2}}>{new Date(session.started_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                      </div>
                      {session.predicted_step1 && <span style={{fontSize:18,fontWeight:700,color:scoreColor(session.percent_correct||0)}}>{session.predicted_step1}</span>}
                    </div>
                    {session.percent_correct != null && (
                      <div style={{fontSize:13,color:scoreColor(session.percent_correct),fontWeight:500,marginBottom:10}}>
                        {session.score}/{session.total_questions} ({session.percent_correct}%) · {session.wrong_count ?? 0} wrong
                      </div>
                    )}
                    <button onClick={() => viewSessionReport(session)} disabled={submitting}
                      style={{width:'100%',height:40,background:'#0d2340',border:'none',borderRadius:8,fontSize:13,color:'#c9a84c',fontWeight:600,cursor:'pointer'}}>
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr>
                  {['Exam','Date','Score','Wrong','Predicted Step 1','Time','Status',''].map(h => (
                    <th key={h} style={{fontSize:11,textTransform:'uppercase',letterSpacing:'0.07em',color:'#a89870',padding:'12px 16px',textAlign:'left',borderBottom:'0.5px solid #f0ece0'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastSessions.filter(s=>s.status==='submitted').map((session, i, arr) => (
                  <tr key={session.id} style={{borderBottom:i<arr.length-1?'0.5px solid #f5f0e8':'none'}}>
                    <td style={{fontSize:14,fontWeight:500,color:'#0d2340',padding:'12px 16px'}}>{session.exam_name}</td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'12px 16px'}}>{new Date(session.started_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</td>
                    <td style={{padding:'12px 16px'}}>
                      {session.percent_correct != null
                        ? <span style={{fontSize:13,fontWeight:600,color:scoreColor(session.percent_correct)}}>{session.score}/{session.total_questions} ({session.percent_correct}%)</span>
                        : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{fontSize:13,color:'#c0574a',fontWeight:500,padding:'12px 16px'}}>{session.wrong_count ?? '—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      {session.predicted_step1
                        ? <span style={{fontSize:15,fontWeight:700,color:scoreColor(session.percent_correct||0)}}>{session.predicted_step1}</span>
                        : <span style={{fontSize:12,color:'#a89870'}}>—</span>}
                    </td>
                    <td style={{fontSize:13,color:'#3d3020',padding:'12px 16px'}}>{session.actual_minutes ? formatDuration(session.actual_minutes) : '—'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{fontSize:11,padding:'3px 10px',borderRadius:10,background:'#f0f7f2',color:'#2d6a4f',fontWeight:500}}>Submitted</span>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <button onClick={() => viewSessionReport(session)} disabled={submitting}
                        style={{padding:'6px 14px',background:'#0d2340',border:'none',borderRadius:8,fontSize:12,color:'#c9a84c',fontWeight:600,cursor:submitting?'not-allowed':'pointer',whiteSpace:'nowrap'}}>
                        View Report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
