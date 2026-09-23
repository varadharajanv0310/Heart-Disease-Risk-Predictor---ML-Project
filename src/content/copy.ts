/**
 * Every word of Focal's product copy lives here.
 *
 * Voice: a good cardiologist who also writes well. Calm, precise, warm.
 * Personality is allowed in the loader, the 404 and corner labels only.
 * Clinical copy aims for about an 8th-grade reading level.
 */
import type { BlockReason, Note } from '@/lib/risk/assess'
import type { Category } from '@/lib/risk/categories'
import type { DriverId } from '@/lib/risk/drivers'
import type { NotComputableReason } from '@/lib/risk/types'

export const brand = {
  name: 'Focal',
  wordmark: 'focal',
  year: '2026',
  tagline: 'Your heart, in focus.',
  positioning:
    "Focal is a private, five-minute heart check that turns the American Heart Association's PREVENT equations into a number you can read and a plan you can act on.",
  description:
    'A private heart-risk check built on the AHA PREVENT equations. Your 10-year risk of heart attack and stroke, heart age, and what would move them — computed on your device.',
}

export const nav = {
  items: [
    { href: '/', label: 'Home' },
    { href: '/check/', label: 'Check' },
    { href: '/method/', label: 'Method' },
  ],
  cta: 'Check your heart',
  privacyLabel: 'Private',
  privacySub: 'On-device',
  skip: 'Skip to content',
}

export const loader = {
  lines: ['Tuning to 60 bpm', 'Warming up the equations', 'Bringing things into focus'],
  skip: 'Skip intro',
  srLabel: 'Loading Focal',
}

export const hero = {
  eyebrow: 'A heart check that shows its work',
  headline: 'Your next ten years, in focus.',
  alternates: [
    'Know your number. Then move it.',
    'A clear look at a quiet risk.',
    'The heart check that shows its work.',
  ],
  subhead:
    "Twelve questions. About five minutes. A risk estimate built on the American Heart Association's PREVENT equations — computed on your device, never sent anywhere.",
  cta: 'Check your heart',
  secondary: 'How it works',
  scroll: 'Scroll',
  corners: {
    tl: ['Est. 10-yr risk', 'of heart attack & stroke'],
    tr: ['Model', 'AHA PREVENT (2024)'],
    bl: ['Computed on your device', 'Nothing stored on any server'],
    br: ['Ages 30–79', 'No prior heart disease'],
  },
}

export const sections = {
  why: {
    index: '01',
    label: 'Why it matters',
    stat: '19.8M',
    statLabel: 'lives lost to cardiovascular disease in 2022',
    heading: 'Heart disease is still the world’s leading cause of death.',
    body: 'In 2022, cardiovascular disease took an estimated 19.8 million lives — about one in every three deaths worldwide. Most of that risk builds quietly, over years, through things you can measure and change.',
    source: 'Source: World Health Organization, Cardiovascular diseases fact sheet, July 2025.',
  },
  measure: {
    index: '02',
    label: 'What we measure',
    heading: 'Eleven honest inputs. Most of the story.',
    intro:
      'Nothing exotic, nothing invasive. These are the numbers from a routine check-up and a basic blood test — the same ones cardiologists use.',
    cards: [
      { k: 'Age & sex', v: 'The starting line. Risk rises with every decade, and differs between women and men.' },
      { k: 'Blood pressure', v: 'The top number. For most people, the most changeable driver of all.' },
      { k: 'Cholesterol', v: 'Total and HDL together give non-HDL — the cholesterol that builds plaque.' },
      { k: 'Kidney function', v: 'eGFR. Healthy kidneys and a healthy heart tend to travel together.' },
      { k: 'Diabetes', v: 'High blood sugar speeds up wear on blood vessels over time.' },
      { k: 'Smoking', v: 'The quickest big win. Risk begins to fall within years of quitting.' },
      { k: 'Medicines', v: 'Blood pressure pills and statins. The equation accounts for treatment.' },
      { k: 'Height & weight', v: 'Together they give BMI, which shapes heart-failure risk.' },
    ],
  },
  how: {
    index: '03',
    label: 'How it works',
    heading: 'Clinical math, made readable.',
    body: 'Focal uses the PREVENT equations, published by the American Heart Association and built from the health records of more than six million US adults. They estimate your chance of a heart attack, stroke or heart failure over the next 10 years — and, if you’re under 60, over the next 30.',
    steps: [
      { n: '01', k: 'Answer', v: 'One question at a time. Don’t know a number? Say so, and we’ll tell you exactly what that changes.' },
      { n: '02', k: 'Compute', v: 'The equation runs in your browser, exactly as published. We checked every coefficient.' },
      { n: '03', k: 'Understand', v: 'Your number, what drives it, and what would move it — in plain language.' },
    ],
    privacyPixel: 'Computed on your device. Nothing stored on any server.',
    privacyBody:
      'No accounts. No analytics on your answers. Your answers are saved only in this browser, so you can come back to them — and you can clear them any time.',
  },
  heartAge: {
    index: '04',
    label: 'What heart age means',
    heading: 'Heart age: your risk, told as a birthday.',
    body: 'Heart age is the age of someone of your sex whose risk matches yours, but whose blood pressure, cholesterol, smoking and blood sugar are all at healthy levels. If you’re 50 with a heart age of 58, your heart is carrying eight extra years of risk.',
    kicker: 'Unlike your real age, this one can go down.',
    note: 'We always show heart age beside your actual risk — never instead of it.',
    demo: { real: 50, heart: 58, realLabel: 'Your age', heartLabel: 'Heart age' },
  },
  final: {
    heading: 'Five minutes now. Ten clearer years ahead.',
    body: 'Have a recent blood test handy if you can. If not, start anyway — we’ll show you what we can and can’t tell without it.',
    cta: 'Check your heart',
  },
}

// ── Assessment ─────────────────────────────────────────────────────────────

export const assess = {
  title: 'Your heart check',
  stepOf: (n: number, total: number) => `${String(n).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
  next: 'Next',
  back: 'Back',
  start: 'Start',
  review: 'Review answers',
  seeResult: 'See my result',
  unknown: 'I don’t know this',
  whereToFind: 'Where do I find this?',
  saved: 'Saved on this device',
  clear: 'Clear my answers',
  clearConfirm: 'Clear all answers? This can’t be undone.',
  keyboardHint: 'Enter to continue · Esc to go back',
  requiredChoice: 'Choose an answer to continue.',
  requiredNumber: 'Enter a number to continue.',
  implausible: (min: number, max: number, unit: string) =>
    `That doesn’t look right — please check the number. We accept ${min}–${max} ${unit}.`,
  outOfModel: (min: string, max: string) =>
    `PREVENT covers ${min} to ${max}. You can continue, but we won’t be able to compute a result from this value — we never guess outside the range the equations were built on.`,
  yes: 'Yes',
  no: 'No',
  notSure: 'Not sure',
  skip: 'Prefer not to say',
}

export const questions = {
  symptoms: {
    eyebrow: 'Before we start',
    label: 'Right now, do you have chest pain or pressure, trouble breathing, or have you fainted?',
    help: 'If something feels wrong, this check can wait. Your safety can’t.',
    yes: 'Yes, right now',
    no: 'No, I feel fine',
  },
  history: {
    eyebrow: 'Your history',
    label: 'Have you ever had a heart attack, stroke, or heart failure — or needed a stent or bypass?',
    help: 'This tool estimates risk for people who haven’t had heart disease yet.',
  },
  age: {
    eyebrow: 'About you',
    label: 'How old are you?',
    help: 'PREVENT works for ages 30 to 79.',
    unit: 'years',
  },
  sex: {
    eyebrow: 'About you',
    label: 'What sex were you assigned at birth?',
    help: 'The equations were built separately for women and men, because baseline risk differs. If you’re transgender or nonbinary, or take gender-affirming hormones, treat the result as a rough guide and talk it through with your clinician.',
    female: 'Female',
    male: 'Male',
  },
  pregnant: {
    eyebrow: 'About you',
    label: 'Are you pregnant right now?',
    help: 'Pregnancy changes blood pressure and cholesterol for a while.',
  },
  sbp: {
    eyebrow: 'Blood pressure',
    label: 'What’s your systolic blood pressure?',
    help: 'The top number — like the 128 in 128/82. Use your usual reading, ideally the average of two or three.',
    where:
      'Check your last visit summary, a home cuff, or a free pharmacy machine. Sit quietly for five minutes first, feet flat, arm resting at heart height. Take two readings a minute apart and use the average.',
    unit: 'mmHg',
    unknown: 'I don’t know my blood pressure',
    crisis:
      'A reading of 180 or higher is very high. Rest for five minutes and check again. If it’s still 180 or higher, contact a clinician today. If you also have chest pain, shortness of breath, back pain, numbness, weakness, vision changes or trouble speaking, call 911 now.',
  },
  bpTreated: {
    eyebrow: 'Blood pressure',
    label: 'Do you take medicine to lower your blood pressure?',
    help: 'Count any pill prescribed for blood pressure, even if your readings are normal now.',
  },
  totalCholesterol: {
    eyebrow: 'Cholesterol',
    label: 'What’s your total cholesterol?',
    help: 'From a lipid panel — a routine blood test.',
    where: 'On a lab report it’s listed as “Total cholesterol”, “Cholesterol, total” or “CHOL”, usually at the top of the lipid panel. Fasting isn’t required.',
    unknown: 'I don’t know my cholesterol',
  },
  hdl: {
    eyebrow: 'Cholesterol',
    label: 'And your HDL cholesterol?',
    help: 'The “good” cholesterol.',
    where: 'Listed as “HDL”, “HDL-C” or “HDL cholesterol”, usually just below total cholesterol on the same lipid panel.',
    unknown: 'I don’t know my HDL',
  },
  statin: {
    eyebrow: 'Cholesterol',
    label: 'Do you take a statin?',
    help: 'Statins include atorvastatin, rosuvastatin, simvastatin and pravastatin. The equation was built around statin use specifically.',
  },
  diabetes: {
    eyebrow: 'Blood sugar',
    label: 'Have you been diagnosed with diabetes?',
    help: 'Type 1 or type 2. Prediabetes and diabetes during a past pregnancy don’t count here — but both are worth mentioning to your clinician.',
  },
  smoker: {
    eyebrow: 'Smoking',
    label: 'Do you smoke cigarettes?',
    help: 'If you’ve quit, answer no. Vaping isn’t part of the equation, but it isn’t harmless either.',
  },
  body: {
    eyebrow: 'Body',
    label: 'How tall are you, and what do you weigh?',
    help: 'We turn these into BMI, which the heart-failure equation uses.',
    height: 'Height',
    weight: 'Weight',
    bmi: (v: string) => `BMI ${v}`,
    bmiOut: 'Your BMI is outside 18.5–39.9, so we’ll skip the heart-failure estimate. Everything else still works.',
    unknown: 'Skip this question',
  },
  egfr: {
    eyebrow: 'Kidney function',
    label: 'What’s your eGFR?',
    help: 'Estimated glomerular filtration rate — a measure of kidney function, in mL/min/1.73m².',
    where: 'Look for “eGFR” on a basic or comprehensive metabolic panel (BMP or CMP). It’s often right next to creatinine. If it just says “>60” or “>90”, we need the exact number — ask your clinic, or calculate it from creatinine below.',
    unit: 'mL/min/1.73m²',
    unknown: 'I don’t know my eGFR',
    calc: {
      toggle: 'Only have creatinine? Calculate eGFR',
      label: 'Serum creatinine',
      result: (v: number) => `Your eGFR is about ${v}.`,
      use: 'Use this value',
      method: 'CKD-EPI 2021 equation (race-free), using your age and sex.',
      needs: 'Enter your age and sex first — the equation uses both.',
    },
  },
  context: {
    eyebrow: 'Optional context',
    label: 'Two optional questions.',
    help: 'They don’t change the number. They change what it means.',
    southAsian: 'Do you have South Asian ancestry — for example Indian, Pakistani, Bangladeshi, Sri Lankan or Nepali?',
    familyHistory: 'Did a parent or sibling have heart disease early — a man before 55, or a woman before 65?',
  },
  review: {
    eyebrow: 'Almost there',
    label: 'Check your answers.',
    help: 'Tap any answer to change it.',
    edit: 'Edit',
    unknown: 'Don’t know',
    notAnswered: 'Not answered',
  },
}

export const blocks: Record<Exclude<BlockReason, 'incomplete'>, { title: string; body: string[]; primary: string; secondary?: string }> = {
  symptoms: {
    title: 'Please get help now.',
    body: [
      'Call 911 — or your local emergency number — or have someone take you to the nearest emergency department. Don’t drive yourself.',
      'Chest pain or pressure, sudden trouble breathing and fainting can be signs of a heart attack or another emergency. Fast treatment matters, and it’s always right to get checked.',
    ],
    primary: 'Call 911',
    secondary: 'I answered by mistake',
  },
  history: {
    title: 'This tool isn’t built for you — and that matters.',
    body: [
      'PREVENT estimates risk for people who haven’t had a heart attack, stroke or heart failure. If you have, your risk is already higher than any calculator like this would show.',
      'Your care team is the right guide now. Keep taking your medicines as prescribed, and bring your latest numbers to your next visit.',
    ],
    primary: 'Read about who this is for',
    secondary: 'Change my answer',
  },
  age: {
    title: 'The equations weren’t built for this age.',
    body: [
      'PREVENT was developed on adults aged 30 to 79, so we can’t give you a reliable number — and we won’t guess.',
      'Under 30? The habits you build now pay off the most. Over 79? A clinician can weigh your risk in person, with your whole history in view.',
    ],
    primary: 'Change my age',
    secondary: 'Read the method',
  },
  pregnancy: {
    title: 'Let’s wait until after your pregnancy.',
    body: [
      'Pregnancy temporarily shifts blood pressure and cholesterol, so the equations can’t read them fairly. Come back a few months after giving birth.',
      'Meanwhile, if your blood pressure runs high during pregnancy, tell your care team. It matters for your long-term heart health too.',
    ],
    primary: 'Change my answer',
    secondary: 'Back to home',
  },
  sbp_unknown: {
    title: 'We need one number to start: your blood pressure.',
    body: [
      'Without it, no heart-risk equation can run — including ours. Most pharmacies have a free machine, and it takes five minutes.',
      'Sit quietly for five minutes, feet flat, arm supported at heart level. Take two readings a minute apart and use the average. Your other answers are saved on this device, so you can pick up where you left off.',
    ],
    primary: 'I have a reading now',
    secondary: 'Back to home',
  },
}

// ── Calculating & results ─────────────────────────────────────────────────

export const calculating = {
  lines: ['Running the PREVENT equations', 'Checking every range', 'Bringing it into focus'],
  sr: 'Calculating your result',
}

export const results = {
  eyebrow: 'Your result',
  label: 'Est. 10-yr risk',
  outcome: 'of a heart attack or stroke',
  model: 'AHA PREVENT · base model',
  frequency: (pct: number) => {
    if (pct < 1) return 'Fewer than 1 in 100 people with your profile will have a heart attack or stroke in the next 10 years.'
    const n = Math.round(pct)
    return `About ${n} in 100 people with your profile will have a heart attack or stroke in the next 10 years. ${100 - n} won’t.`
  },
  categoryLabel: 'Risk category',
  categorySource: '2026 ACC/AHA cholesterol guideline categories',
  categories: {
    low: {
      name: 'Low',
      range: 'under 3%',
      text: 'Your chance of a heart attack or stroke in the next 10 years is low. Keep doing what you’re doing, and recheck your numbers every few years or when something changes.',
    },
    borderline: {
      name: 'Borderline',
      range: '3% to under 5%',
      text: 'Your risk is a little above low. Healthy habits are the main tool right now. If other things add to your risk — like family history — ask your clinician whether a statin makes sense for you.',
    },
    intermediate: {
      name: 'Intermediate',
      range: '5% to under 10%',
      text: 'Your risk is high enough that guidelines suggest talking with a clinician about a statin, alongside healthy habits. If you’re unsure, a heart calcium scan can sometimes help you decide together.',
    },
    high: {
      name: 'High',
      range: '10% or more',
      text: 'Your risk is high. That’s a good reason to see a clinician soon to talk about treatment — most often a statin and blood pressure control — along with healthy habits. High risk is not a diagnosis, and it can come down.',
    },
  } satisfies Record<Category, { name: string; range: string; text: string }>,
  heartAge: {
    title: 'Heart age',
    yourAge: 'Your age',
    heartAge: 'Heart age',
    older: (d: number) => `Your heart is carrying about ${d} extra ${d === 1 ? 'year' : 'years'} of risk.`,
    olderAtLeast: (d: number) => `Your heart is carrying at least ${d} extra years of risk. That’s a strong reason to talk with a clinician — and a lot of room to improve.`,
    younger: (d: number) => `Your heart is about ${d} ${d === 1 ? 'year' : 'years'} younger than you. Nice work.`,
    same: 'Your heart age matches your real age.',
    below: 'Under 30',
    above: 'Over 80',
    unavailable: 'Heart age is only available for ages 30 to 74, with cholesterol results.',
    method: 'Heart age uses the published Framingham method (D’Agostino, 2008). It’s a way to picture risk, not a separate diagnosis.',
  },
  table: {
    title: 'Every horizon',
    tenYear: '10 years',
    thirtyYear: '30 years',
    rows: {
      ascvd: 'Heart attack or stroke',
      cvd: 'Any cardiovascular event',
      hf: 'Heart failure',
    },
    rowsSub: {
      ascvd: 'ASCVD — the headline number',
      cvd: 'Heart attack, stroke or heart failure',
      hf: 'The heart can’t pump as well as it should',
    },
    notComputable: 'Not computable',
  },
  drivers: {
    title: 'What’s driving your number',
    body: 'Each bar shows how much lower your 10-year risk would be if only that one thing were at a healthy level. The bars don’t add up exactly — risk factors interact.',
    baseline: (v: string) => `Age and sex alone: ${v}`,
    baselineNote: 'This part you can’t change. It’s the starting line.',
    none: 'None of your changeable factors is adding meaningful risk right now. That’s worth protecting.',
    labels: {
      smoking: 'Smoking',
      bloodPressure: 'Blood pressure',
      cholesterol: 'Cholesterol',
      diabetes: 'Diabetes',
      kidney: 'Kidney function',
    } satisfies Record<DriverId, string>,
    detail: {
      smoking: 'If you didn’t smoke',
      bloodPressure: 'At 120 mmHg systolic',
      cholesterol: 'At non-HDL 130 mg/dL',
      diabetes: 'The model can’t switch diabetes off — but good control lowers real-world risk',
      kidney: 'At normal kidney function',
    } satisfies Record<DriverId, string>,
    /** Short counterfactual labels for the printed report. */
    ifShort: {
      smoking: 'if not smoking',
      bloodPressure: 'at 120 mmHg',
      cholesterol: 'at non-HDL 130 mg/dL',
      diabetes: 'without diabetes',
      kidney: 'at eGFR 90',
    } satisfies Record<DriverId, string>,
    modifiable: { yes: 'Changeable', partly: 'Partly changeable', no: 'Not directly changeable' },
  },
  whatIf: {
    title: 'What if…',
    body: 'Move the sliders. Your result updates instantly.',
    quit: 'I quit smoking',
    sbp: (v: number) => `Lower my systolic pressure by ${v} mmHg`,
    ldl: (v: number) => `Lower my LDL cholesterol by ${v} mg/dL`,
    sbpShort: 'Systolic blood pressure',
    ldlShort: 'LDL cholesterol',
    now: 'Now',
    then: 'With these changes',
    reset: 'Reset',
    caveat:
      'This shows what the equation predicts for someone with these numbers. The real-world benefit of making a change can differ — but the direction is well established. Lowering LDL is modelled as the same drop in total cholesterol.',
    noLevers: 'Your blood pressure and cholesterol are already near healthy levels, and you don’t smoke. There’s nothing here to slide — and that’s good news.',
  },
  nextSteps: {
    title: 'Next steps',
    share: 'Share this report with your clinician. It includes every number and the method.',
    bp: 'Blood pressure: aim for under 130. Less salt, more movement and home readings all help. Each 10-point drop lowers heart attack and stroke risk by about a fifth.',
    smoking: 'Smoking: quitting is the biggest single change you can make. Free, confidential help: call 1-800-QUIT-NOW.',
    cholesterol: 'Cholesterol: ask about a repeat lipid panel and whether a statin fits you. Every 39 mg/dL drop in LDL lowers risk by about a fifth.',
    diabetes: 'Diabetes: keeping blood sugar, blood pressure and cholesterol in range all protect your heart. Ask whether your diabetes medicines also protect the heart.',
    activity: 'Move: aim for 150 minutes a week of brisk walking, cycling or anything that gets your heart going.',
    weight: 'Weight: losing 5 to 10% of your body weight improves blood pressure, cholesterol and blood sugar.',
    sleep: 'Sleep: 7 to 9 hours a night is now part of the American Heart Association’s heart-health checklist.',
    recheck: 'Recheck your risk when your numbers change, or at least every few years.',
  },
  notes: {
    south_asian:
      'You told us you have South Asian ancestry. Equations like PREVENT can underestimate risk for South Asian adults, and US guidelines treat South Asian ancestry as a risk-enhancing factor. Mention it when you discuss this result.',
    family_history:
      'A parent or sibling with early heart disease raises your risk beyond what this equation captures. Guidelines count it as a risk-enhancing factor — worth raising with your clinician.',
    history_unsure:
      'You weren’t sure about past heart disease. If you’ve ever had a heart attack, stroke or heart failure, this estimate doesn’t apply — please check with your clinician.',
    bp_stage1_over_threshold:
      'Your blood pressure is in the stage 1 range (130–139). With a 10-year cardiovascular risk of 7.5% or more, the 2025 AHA/ACC guideline favors starting blood pressure medicine alongside lifestyle changes. Worth discussing.',
    bp_stage1_under_threshold:
      'Your blood pressure is in the stage 1 range (130–139). With your 10-year cardiovascular risk under 7.5%, the 2025 AHA/ACC guideline starts with 3 to 6 months of lifestyle changes, then a recheck.',
    hf_bmi_unavailable:
      'We couldn’t estimate heart-failure risk, because your BMI is outside 18.5–39.9 or wasn’t given. Your other results aren’t affected.',
    thirty_year_age: '30-year estimates are only available for ages 30 to 59.',
  } satisfies Record<Note, string>,
  estimate: {
    badge: 'Estimate — different model',
    title: 'A rough estimate, not your PREVENT result.',
    missing: { lipids: 'cholesterol', egfr: 'kidney function (eGFR)' },
    body: (missing: string, model: string) =>
      `You didn’t have your ${missing} numbers, so we can’t run PREVENT — and we won’t guess them. Instead, this is an estimate from the ${model} (2008). It predicts a broader set of heart and blood vessel events, and it tends to overestimate risk in people today. Treat it as a rough guide.`,
    models: {
      'framingham-lab': 'Framingham laboratory model',
      'framingham-office': 'Framingham office model, which uses BMI instead of cholesterol',
    },
    label: 'Est. 10-yr risk (Framingham)',
    outcome: 'of any cardiovascular event',
    addNumbers: 'Add my numbers',
    getNumbers:
      'A routine blood test gives you everything: a lipid panel (total and HDL cholesterol) and a basic metabolic panel (eGFR). Ask your clinician, or check your patient portal — you may already have them.',
  },
  notComputable: {
    title: 'We can’t compute this result.',
    body: 'One or more of your answers is outside the range the equations were built on. Rather than guess, we stop here.',
    fix: 'Change my answers',
  },
  disclaimer:
    'Focal is an educational tool. It is not a diagnosis, and it is not a substitute for a clinician who knows your history.',
  actions: {
    print: 'Print or save report',
    report: 'Open printable report',
    edit: 'Change my answers',
    restart: 'Start over',
    method: 'How we calculate this',
  },
  qr: {
    label: 'Scan for your report',
    note: 'The code carries your answers inside the link itself — after the “#”, which browsers never send to a server.',
  },
  empty: {
    title: 'No answers yet.',
    body: 'Your result appears here once you’ve finished the heart check. It takes about five minutes.',
    cta: 'Check your heart',
  },
}

export const reasons: Record<NotComputableReason, string> = {
  age_out_of_range: 'Age must be 30 to 79.',
  age_over_59_for_30yr: '30-year estimates need an age of 30 to 59.',
  age_over_74_for_framingham: 'This method covers ages 30 to 74.',
  sbp_missing: 'Systolic blood pressure is needed.',
  sbp_out_of_range: 'Systolic blood pressure must be 90 to 200 mmHg.',
  tc_missing: 'Total cholesterol is needed.',
  tc_out_of_range: 'Total cholesterol must be 130 to 320 mg/dL (about 3.4 to 8.3 mmol/L).',
  hdl_missing: 'HDL cholesterol is needed.',
  hdl_out_of_range: 'HDL cholesterol must be 20 to 100 mg/dL (about 0.5 to 2.6 mmol/L).',
  hdl_not_below_tc: 'HDL must be lower than total cholesterol.',
  egfr_missing: 'eGFR is needed.',
  egfr_out_of_range: 'eGFR must be 15 to 140 mL/min/1.73m².',
  bmi_missing: 'Height and weight are needed.',
  bmi_out_of_range: 'BMI must be 18.5 to 39.9.',
}

export const report = {
  title: 'Heart risk report',
  generated: (d: string) => `Generated ${d} on this device`,
  patient: 'Inputs',
  results: 'Results',
  notes: 'Notes',
  method:
    'Method: AHA PREVENT base equations (Khan SS et al., Circulation 2024;149:430–449), sex-specific, ages 30–79. Categories: 2026 ACC/AHA dyslipidemia guideline (10-yr ASCVD: low <3%, borderline 3–<5%, intermediate 5–<10%, high ≥10%). Heart age: Framingham general CVD (D’Agostino RB et al., Circulation 2008;117:743–753).',
  forClinician: 'For your clinician',
  empty: 'There’s nothing to print yet. Finish the heart check first, or open this page from the QR code on your result.',
  print: 'Print',
  back: 'Back to result',
}

export const method = {
  eyebrow: 'Methodology & sources',
  title: 'How Focal calculates.',
  intro:
    'Every number Focal shows comes from a published, peer-reviewed equation, implemented exactly as published and tested against reference cases. Here is what we use, who it works for, and where it falls short.',
  sections: {
    model: 'The model',
    validity: 'Who it’s for — and who it isn’t',
    heartAge: 'Heart age',
    unknown: 'When you don’t know your numbers',
    insights: 'Drivers and what-ifs',
    verification: 'How we verified it',
    limits: 'Limitations',
    privacy: 'Privacy',
    sources: 'Sources',
    changelog: 'Changelog',
  },
}

export const notFound = {
  code: '404',
  title: 'This page skipped a beat.',
  body: 'The link may be old, or the page may have moved. Your answers are safe — they never left your device.',
  home: 'Back to home',
  check: 'Check your heart',
}

export const footer = {
  paragraph:
    'Focal is an educational tool that estimates cardiovascular risk using the American Heart Association’s PREVENT equations (Khan et al., Circulation, 2024). It is not a diagnosis, not medical advice, and not a substitute for a clinician who knows your history. Results apply to adults aged 30 to 79 without known heart disease. Every calculation runs on your device; your answers are never sent to a server, and there are no accounts or analytics on health inputs. Answers are saved only in this browser until you clear them. Focal is independent and is not affiliated with or endorsed by the American Heart Association. If you have chest pain, trouble breathing or have fainted, call 911 or your local emergency number now.',
  links: [
    { href: '/method/', label: 'Method' },
    { href: '/method/#privacy', label: 'Privacy' },
    { href: '/method/#sources', label: 'Sources' },
  ],
  emergency: 'Emergency? Call 911',
  rights: '© 2026 Focal',
  credits: 'Type: Inter Tight & Silkscreen (OFL) · 3D cell after Evans & Fung (1972)',
  qrLabel: 'Start here',
}

export const disclaimerLine =
  'Educational estimate only — not a diagnosis. Valid for adults aged 30–79 without known cardiovascular disease. Computed entirely on the patient’s device.'
