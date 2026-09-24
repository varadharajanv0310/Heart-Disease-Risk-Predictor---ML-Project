/** Long-form methodology copy for /method. Kept with the rest of the content. */

export const methodContent = {
  model: [
    'Focal’s headline number comes from the American Heart Association’s PREVENT equations (Predicting Risk of cardiovascular disease EVENTs), published in 2024. They were developed and validated in about 6.6 million US adults from 46 cohorts and health-record datasets, and they do not use race.',
    'We use the base model. It estimates 10-year and 30-year risk of three outcomes: atherosclerotic cardiovascular disease (ASCVD — heart attack or stroke), heart failure, and total cardiovascular disease (any of these). The headline is 10-year ASCVD risk, because that is the outcome current cholesterol guidelines categorise.',
    'Each equation is a sex-specific logistic model. Inputs are centred and scaled — age around 55, non-HDL cholesterol around 3.5 mmol/L — with piecewise splines for systolic blood pressure (knot at 110 mmHg), eGFR (knot at 60) and, for heart failure, BMI (knot at 30). Risk = eˣ ⁄ (1 + eˣ).',
  ],
  formula: `a = (age − 55)/10
nonHDL = (TC − HDL) × 0.02586 − 3.5        HDL′ = (HDL × 0.02586 − 1.3)/0.3
SBPlo = (min(SBP,110) − 110)/20             SBPhi = (max(SBP,110) − 130)/20
eGFRlo = (min(eGFR,60) − 60)/−15            eGFRhi = (max(eGFR,60) − 90)/−15
BMIlo = (min(BMI,30) − 25)/5                BMIhi = (max(BMI,30) − 30)/5   (heart failure only)
x = β₀ + Σ βᵢ·termᵢ + treatment and age interactions      risk = eˣ/(1+eˣ)`,
  categories:
    'Categories follow the 2026 ACC/AHA multisociety dyslipidemia guideline for 10-year PREVENT-ASCVD risk: low under 3%, borderline 3% to under 5%, intermediate 5% to under 10%, high 10% or more. We categorise the number exactly as displayed (to one decimal), so the label can never disagree with what you see. Where relevant we also note the 2025 AHA/ACC high blood pressure guideline threshold: a 10-year total cardiovascular risk of 7.5% or more favours medicine for stage 1 hypertension.',
  ranges: [
    ['Age', '30–79 years (30-year outputs: 30–59)'],
    ['Total cholesterol', '130–320 mg/dL (about 3.4–8.3 mmol/L)'],
    ['HDL cholesterol', '20–100 mg/dL (about 0.5–2.6 mmol/L)'],
    ['Systolic blood pressure', '90–200 mmHg'],
    ['eGFR', '15–140 mL/min/1.73m²'],
    ['BMI', '18.5–39.9 kg/m² (heart-failure equations only)'],
  ] as [string, string][],
  rangesNote:
    'Outside these ranges we show “not computable” for the affected results. We never extrapolate an equation beyond the data it was built on.',
  validFor: [
    'Risk percentages: adults aged 30 to 79. Everyone else from age 2 gets a guideline check of each number instead — see “Every age” below.',
    'People who have not had a heart attack, stroke, heart failure, or a procedure such as a stent or bypass.',
    'People who know their blood pressure, cholesterol and kidney function — or who want a clearly labelled rough estimate without them.',
  ],
  notFor: [
    'Anyone with symptoms right now. Chest pain, trouble breathing or fainting need emergency care — call 911.',
    'People with known cardiovascular disease. Their risk is already high, and treatment follows different guidelines.',
    'Pregnancy. Blood pressure and cholesterol shift temporarily, so the inputs don’t reflect usual levels. This is our precaution, not a PREVENT exclusion.',
    'People with LDL cholesterol of 190 mg/dL (4.9 mmol/L) or higher. Guidelines recommend treatment regardless of calculated risk.',
    'People with kidney failure (eGFR under 15) or on dialysis.',
    'A risk percentage for anyone under 30 or over 79. PREVENT wasn’t built on those ages, so they get a guideline check with no percentage.',
  ],
  ages: [
    'PREVENT was developed on adults aged 30 to 79. Outside that range, any percentage would be an extrapolation, so Focal doesn’t produce one. Instead, every age from 2 gets a guideline check: each number is compared with the published cut-off for that age, and labelled healthy, worth watching, or needing attention.',
    'The check never combines numbers into a risk. It counts how many known numbers sit in a healthy range, and says which guideline each comparison comes from. Questions whose guideline needs data we don’t collect are skipped: children’s blood pressure (under 13) is read on percentile charts for age, sex and height; BMI under 20 uses growth charts; and kidney function under 18 uses pediatric equations. Those factors are marked “not assessed”, never guessed.',
    'Past 80, the same adult cut-offs still describe each number, but treatment decisions are individual — they weigh overall health, other conditions and personal priorities. Focal says so on the result.',
  ],
  ageCutoffs: [
    ['Systolic blood pressure', '13 and over: normal <120, elevated 120–129, stage 1 130–139, stage 2 ≥140 mmHg (AAP 2017 for 13–17; 2025 AHA/ACC for adults). Under 13: not assessed.'],
    ['Total cholesterol', '2–19: acceptable <170, borderline 170–199, high ≥200 mg/dL (NHLBI 2011). 20+: desirable <200, borderline 200–239, high ≥240 (NCEP ATP III).'],
    ['Non-HDL cholesterol', '2–19: acceptable <120, borderline 120–144, high ≥145 (NHLBI 2011). 20+: desirable <130, then 130–159, 160–189, 190–219, ≥220 (NLA 2015).'],
    ['HDL cholesterol', '2–19: acceptable >45, borderline 40–45, low <40 (NHLBI 2011). 20+: low <40, and <50 in women; ≥60 protective (NCEP ATP III).'],
    ['BMI', '20+: underweight <18.5, healthy 18.5–24.9, overweight 25–29.9, obesity ≥30 (WHO). Under 20: not assessed.'],
    ['eGFR', '18+: KDIGO categories G1 ≥90, G2 60–89, G3a 45–59, G3b 30–44, G4 15–29, G5 <15. G1–G2 alone isn’t kidney disease. Under 18: not assessed.'],
    ['Smoking, diabetes', 'Any age: current smoking and diagnosed diabetes need attention (AHA Life’s Essential 8).'],
  ] as [string, string][],
  heartAge: [
    'Heart age uses the Framingham general cardiovascular risk profile (D’Agostino et al., Circulation 2008), the paper that introduced the idea. Your 10-year Framingham risk is calculated from your inputs; heart age is the age at which a person of the same sex with “normal” risk factors — untreated systolic pressure 125 mmHg, total cholesterol 180 mg/dL, HDL 45 mg/dL, no smoking and no diabetes — has the same risk. It is solved exactly, not looked up in a table.',
    'Heart age is reported between 30 and 80 (“under 30” and “over 80” at the edges) and only for ages 30 to 74, the ages the Framingham data covers. It is a way to picture risk and it can motivate change, but research shows it can also alarm people without improving understanding — so we always show it next to your actual risk, never instead of it.',
  ],
  unknown: [
    'PREVENT has no version that works without laboratory values, and we will not guess them. If you don’t know your cholesterol or eGFR, Focal offers a clearly labelled estimate from the Framingham 2008 equations instead: the laboratory model when cholesterol is known, or the office model — which uses BMI in place of cholesterol — when it isn’t. The office model discriminates nearly as well as the laboratory model in the original study.',
    'Estimates carry no risk category and no 30-year or heart-failure results. They predict a broader set of events and tend to overestimate risk in people today. Without a blood pressure reading, nothing can be computed.',
    'If your lab report shows creatinine but not eGFR, you can calculate eGFR with the race-free CKD-EPI 2021 equation (Inker et al., NEJM 2021), using your age and sex.',
  ],
  insights: [
    'The “what’s driving your number” bars are computed from the PREVENT equation itself: for each factor, we recalculate your risk with only that factor at a healthy reference (not smoking, systolic 120 mmHg, non-HDL cholesterol 130 mg/dL, eGFR 90) and show the difference. Because the model is non-linear, the bars don’t add up exactly.',
    'What-if sliders do the same thing live. Lowering LDL is modelled as the same drop in total (and non-HDL) cholesterol, because PREVENT uses total and HDL cholesterol rather than LDL. Systolic pressure can be lowered to 110 mmHg at most. These show what the equation predicts for someone with the new numbers; the real-world benefit of making a change can differ.',
    'There is no machine-learning model in Focal. Public datasets such as UCI Cleveland (disease already present at angiography), the Framingham teaching dataset (permuted for teaching) and CDC BRFSS (self-reported, cross-sectional) cannot answer the question “what is my risk over the next ten years”, so we didn’t train on them.',
  ],
  verification: [
    'Every PREVENT coefficient was transcribed from the published supplement and matched value-for-value against an independent implementation (234 of 234). The full equations agree with it to within 10⁻¹³ percentage points across 240,000 random profiles.',
    'Our automated tests reproduce the published worked example (a 50-year-old woman: 10-year total CVD 14.7%, ASCVD 9.2%, heart failure 8.1%; 30-year 53.0%, 35.4%, 39.0%), both published Framingham worked examples (10.48% and 15.62%), 129 cross-checked profiles across all 12 equations, and every range boundary.',
  ],
  limits: [
    'PREVENT was built on US data. Asian groups were under-represented, and performance varies across Asian subgroups. Equations like it can underestimate risk for people of South Asian ancestry; if that applies to you, we say so on your result.',
    'We use the base model. The full PREVENT model can add urine albumin, HbA1c and a neighbourhood deprivation index; family history, lipoprotein(a), coronary calcium and inflammatory markers are not included at all. Your clinician can weigh these.',
    'Risk equations describe groups of people like you, not your personal future. A single blood pressure reading can vary; averages are better.',
    'Numbers you enter are only as accurate as the source. If something looks off, check your lab report.',
  ],
  privacy: [
    'Focal is a static website with no server-side code. Every calculation runs in your browser.',
    'There are no accounts, no cookies and no analytics on your health answers. Your answers are saved in this browser’s local storage so you can come back to them; “Clear my answers” removes them.',
    'The printable report link and its QR code store your answers after the “#” in the address. Browsers don’t send that part of a link to any server, so the data only travels to a device you choose to open it on. Anyone you share the link with can read those answers.',
  ],
  sources: [
    'Khan SS, Matsushita K, Sang Y, et al. Development and validation of the American Heart Association’s PREVENT equations. Circulation. 2024;149:430–449. doi:10.1161/CIRCULATIONAHA.123.067626',
    'Khan SS, Coresh J, Pencina MJ, et al. Novel prediction equations for absolute risk assessment of total cardiovascular disease incorporating cardiovascular-kidney-metabolic health. Circulation. 2023;148:1982–2004. doi:10.1161/CIR.0000000000001191',
    '2026 ACC/AHA/multisociety guideline on the management of dyslipidemia. Circulation. 2026. doi:10.1161/CIR.0000000000001423',
    '2025 AHA/ACC/multisociety guideline for the prevention, detection, evaluation and management of high blood pressure in adults. Hypertension. 2025. doi:10.1161/HYP.0000000000000249',
    'D’Agostino RB Sr, Vasan RS, Pencina MJ, et al. General cardiovascular risk profile for use in primary care: the Framingham Heart Study. Circulation. 2008;117:743–753.',
    'Inker LA, Eneanya ND, Coresh J, et al. New creatinine- and cystatin C–based equations to estimate GFR without race. N Engl J Med. 2021;385:1737–1749.',
    'Bonner C, et al. Should heart age calculators be used alongside absolute cardiovascular disease risk assessment? BMC Cardiovasc Disord. 2018;18:19.',
    'Ettehad D, et al. Blood pressure lowering for prevention of cardiovascular disease and death. Lancet. 2016;387:957–967.',
    'Cholesterol Treatment Trialists’ Collaboration. Efficacy and safety of more intensive lowering of LDL cholesterol. Lancet. 2010;376:1670–1681.',
    'Duncan MS, et al. Association of smoking cessation with subsequent risk of cardiovascular disease. JAMA. 2019;322:642–650.',
    'Lloyd-Jones DM, et al. Life’s Essential 8. Circulation. 2022;146:e18–e43.',
    'Flynn JT, Kaelber DC, Baker-Smith CM, et al. Clinical practice guideline for screening and management of high blood pressure in children and adolescents. Pediatrics. 2017;140(3):e20171904.',
    'Expert Panel on Integrated Guidelines for Cardiovascular Health and Risk Reduction in Children and Adolescents. Summary report. Pediatrics. 2011;128(Suppl 5):S213–S256.',
    'National Cholesterol Education Program (NCEP) Expert Panel. Third report on detection, evaluation, and treatment of high blood cholesterol in adults (ATP III), final report. Circulation. 2002;106:3143–3421.',
    'Jacobson TA, Ito MK, Maki KC, et al. National Lipid Association recommendations for patient-centered management of dyslipidemia: part 1 — full report. J Clin Lipidol. 2015;9:129–169.',
    'World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. Geneva: WHO; 2000.',
    'KDIGO 2024 clinical practice guideline for the evaluation and management of chronic kidney disease. Kidney Int. 2024;105(4S):S117–S314.',
    'World Health Organization. Cardiovascular diseases (CVDs) fact sheet, 31 July 2025.',
    'Evans E, Fung YC. Improved measurements of the erythrocyte geometry. Microvasc Res. 1972;4:335–347 (the shape of the 3D red blood cell).',
  ],
  changelog: [
    {
      version: '1.1.0',
      date: '24 September 2026',
      items: [
        'Every age from 2 now gets a result. Ages 30 to 79 keep the PREVENT percentage; other ages get a guideline check of each number, with no percentage and no extrapolation.',
        'Questions whose guideline needs growth charts or pediatric equations are skipped for children, and marked “not assessed” on the result.',
        'An unknown blood pressure no longer stops the check outside 30–79, where no equation needs it.',
      ],
    },
    {
      version: '1.0.0',
      date: '23 September 2026',
      items: [
        'First release. AHA PREVENT base equations for 10- and 30-year ASCVD, total CVD and heart failure, verified against an independent implementation.',
        'Risk categories from the 2026 ACC/AHA dyslipidemia guideline; stage 1 blood-pressure context from the 2025 AHA/ACC guideline.',
        'Heart age by the Framingham method (D’Agostino 2008); clearly labelled Framingham estimates when laboratory values are unknown.',
        'CKD-EPI 2021 eGFR helper; unit toggles for cholesterol, creatinine, height and weight.',
        'Printable report with a QR code that carries data only in the URL fragment.',
      ],
    },
  ],
}
