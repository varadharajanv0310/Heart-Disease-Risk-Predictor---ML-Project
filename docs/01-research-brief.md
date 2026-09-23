# Phase 1 — Research brief

**Product:** Focal (working name, see Phase 2) · **Date:** 23 Sep 2026 · **Status:** approved for build

> Short version: the headline number comes from the **AHA PREVENT base equations** (Khan 2024), implemented from the published coefficients. All 234 coefficients were checked one by one against an independent implementation, and all 12 equations agree with it to ~1e-14 percentage points. We ship **no ML model** in v1. The "insights" layer is built from the equation itself: counterfactual driver analysis and what-if sliders.

---

## 1. Validated risk models

| Model | Required inputs | Ages | Outcome | Derived / validated on | Calibration, incl. South Asians | Coefficients |
|---|---|---|---|---|---|---|
| **AHA PREVENT** (2023/24)¹² | age, sex, total-C, HDL-C, SBP, BP meds, statin, diabetes, current smoking, eGFR; BMI (HF model only). Optional add-ons: UACR, HbA1c, SDI | 30–79 (30-yr: 30–59) | 10- and 30-yr **total CVD**, **ASCVD** (CHD + stroke), **heart failure** | ~6.6 M US adults from 46 cohorts and EHR datasets, split into derivation and validation; race-free | Good calibration overall; predicts roughly half the PCE risk for the same person. Asian groups were under-represented, and performance varies across disaggregated Asian subgroups (C-index 0.74–0.81)¹⁰. No South-Asian-specific recalibration. | Published in the supplement (Tables S12A–H); free to use |
| **ACC/AHA Pooled Cohort Equations** (2013)³ | age, sex, race (White / African American), total-C, HDL-C, SBP, BP meds, diabetes, smoking | 40–79 | 10-yr hard ASCVD | ARIC, CHS, CARDIA, Framingham (1968–1990s) | Overestimates risk in contemporary cohorts. Race-based, with "other" groups defaulting to the White equation. Underestimates in South Asians, especially women⁹; overestimates in East Asians. | Public |
| **Framingham general CVD** (2008)⁴ | age, sex, total-C, HDL-C, SBP, BP meds, smoking, diabetes; the *office* version swaps lipids for BMI | 30–74 | 10-yr general CVD (CHD, stroke, PAD, HF) | 8,491 Framingham participants (white, Massachusetts) | Overestimates in many modern and European populations; underestimates in UK South Asians. Office (BMI) version discriminates almost as well (C 0.763 vs 0.765 in men)⁴ | Public (Table 2 of the paper) |
| **SCORE2 / SCORE2-OP** (2021)⁵⁶ | age, sex, smoking, SBP, total-C, HDL-C, European risk region | 40–69 / ≥70 | 10-yr fatal + non-fatal CVD | 45 European cohorts (~680 k people), recalibrated to 4 risk regions | Europe only. Not calibrated for South Asians or for other continents. | Public (supplement) |
| **QRISK3** (2017)⁷ | 20+ inputs: ethnicity (9 groups incl. Indian, Pakistani, Bangladeshi), UK postcode deprivation, family history, CKD, AF, RA, SLE, migraine, SMI, steroids, antipsychotics, ED, SBP variability, BMI, TC/HDL, … | 25–84 | 10-yr CVD (CHD, ischaemic stroke, TIA) | 7.9 M UK GP records (QResearch) | Best-in-class for UK South Asians, but UK-only (deprivation is tied to postcodes) | Source code published (LGPL); name and device use restricted by ClinRisk |
| **WHO CVD risk charts** (2019)⁸ | lab: age, sex, smoking, SBP, diabetes, total-C · non-lab: age, sex, smoking, SBP, BMI | 40–74 (5-yr bands) | 10-yr fatal + non-fatal MI and stroke | 85 cohorts (ERFC, ~376 k people) recalibrated to **21 GBD regions, including South Asia** | Calibrated to regional incidence, not to individuals. Chart bands (<5, 5–10, 10–20, 20–30, ≥30%) give coarse output and may under-call risk in the diaspora. | Public (supplement) |

## 2. Datasets considered for an ML component

| Dataset | Size | Label | Why it's unfit for our headline or insights |
|---|---|---|---|
| **UCI Heart Disease (Cleveland)**¹⁶ | 303 rows (920 across 4 sites), 14 usable features | `num` 0–4: >50% stenosis at **angiography** | Labels disease that is **already present** in referred patients (~46% prevalence), not future risk. Needs exercise-test and fluoroscopy features (oldpeak, ca, thal) that no consumer has. 1980s data. |
| **Framingham teaching dataset** (NHLBI BioLINCC)¹⁸ | 4,434 people, 11,627 exam records (1956–68) | time to CHD / stroke / CVD / death | Deliberately **permuted for teaching**; BioLINCC says it is not for publication. White New England cohort in the pre-statin era. The Kaggle "framingham.csv" has unclear provenance. |
| **CDC BRFSS 2015 heart-disease indicators**¹⁷ | 253,680 survey responses, 22 features | self-reported *ever told* CHD or MI | **Prevalent, self-reported, cross-sectional.** No lab values. ~9% positive. The public version drops survey weights, so a model trained on it learns "who already had it". |

**Conclusion:** none of these produces the label we need: *future* events, in people *without* CVD, from inputs we can collect. We ship **no ML model**. The factor breakdown and what-ifs are computed exactly from PREVENT (see §3), so they are auditable and can never contradict the headline number. If ML is added later, it needs a prospective, licensed cohort (e.g. MESA or UK Biobank), must be clearly labelled "insights", and must stay secondary.

## 3. Recommendation: PREVENT base model

**Why:** it is the risk engine named by the current US guidelines. The **2025 AHA/ACC high blood pressure guideline**¹² uses PREVENT 10-yr total CVD ≥7.5% to recommend medicine in stage 1 hypertension. The **2026 ACC/AHA dyslipidemia guideline**¹³ uses PREVENT-ASCVD with new categories and starts assessment at age 30. PREVENT is also race-free and covers ages 30–79. It adds heart failure and kidney function, and it has 30-yr horizons for younger adults. Its coefficients are public.

**Headline:** 10-yr **ASCVD** risk (heart attack or stroke), because that is the outcome with guideline categories. We also show 10-yr total CVD (which adds heart failure), 10-yr HF, and all three at 30 years when age ≤59.

**South Asian users:** we ask an optional, non-model question. Answering yes adds a clearly labelled note, because guidelines list South Asian ancestry as a risk-enhancing factor. It never changes the number.

### Exact formula (base model, sex-specific; Khan 2024 Suppl. Tables S12A–H)

```
Transforms (cholesterol in mg/dL × 0.02586 → mmol/L)
  a      = (age − 55) / 10                       a² (30-yr models only)
  nonHDL = (TC − HDL)·0.02586 − 3.5
  hdl    = (HDL·0.02586 − 1.3) / 0.3
  sbpLo  = (min(SBP,110) − 110) / 20             sbpHi  = (max(SBP,110) − 130) / 20
  egfrLo = (min(eGFR,60) − 60) / −15             egfrHi = (max(eGFR,60) − 90) / −15
  bmiLo  = (min(BMI,30) − 25) / 5                bmiHi  = (max(BMI,30) − 30) / 5      (HF only)
Linear predictor
  x = β0 + βa·a [+ βa²·a²] + βnh·nonHDL + βh·hdl + βsl·sbpLo + βsh·sbpHi + βdm·DM + βsmk·SMK
        + βel·egfrLo + βeh·egfrHi + βtx·BPRX + βst·STATIN
        + βtx×sh·BPRX·sbpHi + βst×nh·STATIN·nonHDL
        + a·(βa×nh·nonHDL + βa×h·hdl + βa×sh·sbpHi + βa×dm·DM + βa×smk·SMK + βa×el·egfrLo)
  (HF models drop the lipid and statin terms and add βbl·bmiLo + βbh·bmiHi + βa×bh·a·bmiHi)
Risk = eˣ / (1 + eˣ)
```

All 12 coefficient sets (10- and 30-yr × total CVD, ASCVD, HF × female, male) live in `src/lib/risk/prevent-coefficients.ts`, with table references.

| Input | Unit | Valid range (outside → "not computable") |
|---|---|---|
| Age | years | 30–79 (30-yr outputs: 30–59) |
| Total cholesterol | mg/dL (mmol/L ÷ 0.02586) | 130–320 (3.36–8.28 mmol/L) |
| HDL cholesterol | mg/dL | 20–100 (0.52–2.59 mmol/L); must be below total |
| Systolic BP | mmHg | 90–200 |
| eGFR | mL/min/1.73 m² | 15–140 (optional helper: CKD-EPI 2021 race-free from creatinine¹⁴) |
| BMI | kg/m² | 18.5–39.9 (only the HF equations use BMI; outside this range → HF "not computable") |
| Diabetes, current smoking, BP meds, statin | yes / no | — |

**Verification done in this environment.** AHA Journals, PMC and CRAN are blocked here, so the supplement could not be opened directly.
- **Coefficients:** transcribed, then checked value by value against the float64 constants inside `pyprevent` 0.1.6²⁰, an independent Rust build. 234/234 found. One transcription error was caught this way: female 10-yr CVD `sbpHi` is 0.3600781, not 0.360078.
- **Equations:** compared with `pyprevent` on 240,000 random in-range profiles. Maximum difference: 4e-14 percentage points.
- **A pitfall we avoid:** a second PyPI package (`cvd-risk`) has **wrong** ASCVD age×eGFR terms and invented HF terms. Independent verification matters.

### Reference test cases (these are the unit tests)

| # | Source | Inputs | Expected |
|---|---|---|---|
| 1 | **Published**: preventr README¹⁹ (the package states it matches the official AHA calculator) | F, 50 y, TC 200, HDL 45, SBP 160, BP meds ✔, statin ✘, diabetes ✔, smoker ✘, eGFR 90, BMI 35 | 10-yr CVD **14.7%**, ASCVD **9.2%**, HF **8.1%** · 30-yr CVD **53.0%**, ASCVD **35.4%**, HF **39.0%** |
| 2 | Independent implementation (pyprevent README profile) | M, 40, TC 200, HDL 50, SBP 120, none, eGFR 70, BMI 25 | 10-yr CVD 1.275%, ASCVD 0.913%, HF 0.392% · 30-yr CVD 10.458%, ASCVD 7.008%, HF 3.889% |
| 3 | Independent implementation (range edges + eGFR <60 spline + statin interaction) | F, 65, TC 180, HDL 60, SBP 145, BP meds ✔, statin ✔, eGFR 55, BMI 27 | 10-yr CVD 10.914%, ASCVD 6.055%, HF 6.664% · 30-yr not computable (age >59) |
| 4 | **Published**: D'Agostino 2008 worked example⁴ (heart-age engine) | F, 61, TC 180, HDL 47, SBP 124 untreated, smoker, no diabetes | Framingham 10-yr CVD **10.48%** |
| 5 | **Published**: D'Agostino 2008 worked example⁴ | M, 53, TC 161, HDL 55, SBP 125 treated, non-smoker, diabetes | Framingham 10-yr CVD **15.62%** |

The test suite also checks six more oracle profiles, the edges of every range, and properties such as risk rising with SBP above 130 and every out-of-range input returning "not computable". **Before public launch:** enter cases 2 and 3 into the official AHA PREVENT calculator and record the screenshots. It was unreachable from the build sandbox.

### "I don't know my numbers"

PREVENT has **no non-laboratory version**, so without cholesterol and eGFR it cannot be computed. We never impute. The research *does* support one estimate path: Framingham 2008 (D'Agostino⁴).
- **Cholesterol known, eGFR unknown:** Framingham lab model.
- **No lipids:** Framingham **office model**, which uses BMI. It discriminates almost as well as the lab model⁴; WHO also publishes non-lab charts⁸.

Both are shown only as a clearly labelled **"Estimate — different model"**. They carry no guideline category and no 30-yr or HF outputs, and come with a note that Framingham tends to over-estimate risk today. Office-model coefficients were cross-checked against published reproductions (women 2.72107 / 0.51125 / 2.81291 / 2.88267 / 0.61868 / 0.77763, S₀ 0.94833, mean 26.0145; men 3.11296 / 0.79277 / 1.85508 / 1.92672 / 0.70953 / 0.53160, S₀ 0.88431, mean 23.9388). Lab-model coefficients match an independent implementation and reproduce both published worked examples (cases 4–5). **Without systolic BP, nothing is computable**, and we show how to get a reading in five minutes.

## 4. Clinical context

- **Categories** (2026 ACC/AHA dyslipidemia guideline¹³, 10-yr PREVENT-ASCVD): **Low <3%**, **Borderline 3–<5%**, **Intermediate 5–<10%**, **High ≥10%**. BP context (2025 guideline¹²): with stage 1 hypertension (SBP 130–139), a 10-yr total CVD risk **≥7.5%** favours starting medicine.
- **Heart age:** this is the age of a person of the same sex whose risk equals yours but whose risk factors are "normal". It uses the published Framingham method (D'Agostino 2008⁴): the reference person has SBP 125 untreated, total-C 180, HDL 45, no smoking, no diabetes, and we solve the equation for age. Heart age is only valid for chronological ages 30–74 and is reported between <30 and >80. We label it as a communication aid, not the clinical number. Heart age can raise emotion more than understanding²³, so it always sits *beside* absolute risk, never instead of it.
- **Not modifiable:** age, sex, kidney function (largely), diabetes status (though control matters), family history, ancestry.
- **Modifiable, with evidence:**
  - **Blood pressure:** every 10 mmHg lower SBP means ~20% fewer major CVD events²⁴.
  - **LDL:** every 1 mmol/L (≈39 mg/dL) lower LDL means ~22% fewer major vascular events²⁵.
  - **Smoking:** heavy smokers who quit see CVD risk fall ~39% within 5 years²⁶.
  - **Activity:** at least 150 min/week moderate or 75 min vigorous²⁷.
  - **Diabetes:** control per the guideline²⁷.
  - **Weight:** losing 5–10% of body weight improves BP, lipids and glucose²⁸.
  - **Sleep:** 7–9 h, now part of AHA Life's Essential 8²⁹.
- **Why it matters:** CVD is the world's leading cause of death, with an estimated **19.8 million deaths in 2022, about 32% of all deaths**¹⁵.

## 5. Competitive scan

| Tool | Does well | Weak UX | How we beat it |
|---|---|---|---|
| ACC **ASCVD Risk Estimator Plus** | Therapy-impact modelling, follow-up mode | Clinician jargon, dense form, older race-based PCE | PREVENT, one question per screen, plain language |
| AHA **PREVENT calculator** | Authoritative; all outcomes at 10 and 30 yr | Form-like and clinician-facing; numbers with no explanation, no what-ifs | Natural-frequency explanations, drivers, live what-ifs |
| **QRISK3** | Ethnicity-aware (South Asian subgroups), rich inputs | Dated UI, UK-only, jargon | Modern flow; South Asian note without faking calibration |
| **NHS Heart Age** | Friendly, consumer tone, heart-age hook | Heart age can alarm and hides absolute risk; method is opaque | Absolute risk first, heart age second, method fully open |
| **MDCalc** (PREVENT/Framingham) | Evidence summaries | Clinician-only; no guidance for patients | Printable report with QR that patients can take to a clinician |

**Our edge:** private by construction (nothing leaves the device, and the QR carries data only in the URL *fragment*); honest "not computable" states; every number explained twice, once as a percentage and once as "about N in 100".

---

### References
1. Khan SS, Matsushita K, Sang Y, et al. Development and validation of the American Heart Association's PREVENT equations. *Circulation* 2024;149:430–449. doi:10.1161/CIRCULATIONAHA.123.067626
2. Khan SS, Coresh J, Pencina MJ, et al. Novel prediction equations for absolute risk assessment of total CVD incorporating cardiovascular-kidney-metabolic health. AHA Scientific Statement. *Circulation* 2023;148:1982–2004. doi:10.1161/CIR.0000000000001191
3. Goff DC Jr, et al. 2013 ACC/AHA guideline on the assessment of cardiovascular risk. *Circulation* 2014;129(suppl 2):S49–S73.
4. D'Agostino RB Sr, Vasan RS, Pencina MJ, et al. General cardiovascular risk profile for use in primary care: the Framingham Heart Study. *Circulation* 2008;117:743–753. doi:10.1161/CIRCULATIONAHA.107.699579
5. SCORE2 working group. SCORE2 risk prediction algorithms. *Eur Heart J* 2021;42:2439–2454.
6. SCORE2-OP working group. SCORE2-OP risk prediction algorithms. *Eur Heart J* 2021;42:2455–2467.
7. Hippisley-Cox J, Coupland C, Brindle P. Development and validation of QRISK3. *BMJ* 2017;357:j2099.
8. WHO CVD Risk Chart Working Group. WHO cardiovascular disease risk charts: revised models for 21 global regions. *Lancet Glob Health* 2019;7:e1332–e1345.
9. Performance of the pooled cohort equation in South Asians: insights from a large integrated healthcare delivery system. PMC9789536.
10. PREVENT equation performance in Asian and Native Hawaiian and Other Pacific Islander groups. PMC12902880.
11. Performance of the AHA PREVENT equations among disaggregated racial and ethnic subgroups. PMC12199177.
12. 2025 AHA/ACC/multisociety guideline for the prevention, detection, evaluation and management of high blood pressure in adults. *Hypertension* 2025. doi:10.1161/HYP.0000000000000249
13. 2026 ACC/AHA/multisociety guideline on the management of dyslipidemia. *Circulation* 2026. doi:10.1161/CIR.0000000000001423
14. Inker LA, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. *N Engl J Med* 2021;385:1737–1749.
15. WHO. Cardiovascular diseases (CVDs) fact sheet, updated 31 July 2025.
16. Detrano R, et al. International application of a new probability algorithm for the diagnosis of coronary artery disease. *Am J Cardiol* 1989;64:304–310 (UCI Heart Disease).
17. CDC Behavioral Risk Factor Surveillance System 2015 (heart-disease-indicators curation).
18. NHLBI BioLINCC. Framingham Longitudinal Data — teaching dataset and documentation.
19. Mayer M. *preventr*: an implementation of the PREVENT and Pooled Cohort Equations (R package, CRAN), README example.
20. Hegstrom L. *pyprevent* 0.1.6 (PyPI), a Rust implementation of the 2024 AHA PREVENT equations.
21. Evans E, Fung YC. Improved measurements of the erythrocyte geometry. *Microvasc Res* 1972;4:335–347 (the 3D cell profile).
22. Yang Q, et al. Vital Signs: predicted heart age and racial disparities in heart age among US adults. *MMWR* 2015;64:950–958.
23. Bonner C, et al. Should heart age calculators be used alongside absolute cardiovascular disease risk assessment? *BMC Cardiovasc Disord* 2018;18:19.
24. Ettehad D, et al. Blood pressure lowering for prevention of cardiovascular disease and death. *Lancet* 2016;387:957–967.
25. Cholesterol Treatment Trialists' Collaboration. Efficacy and safety of more intensive lowering of LDL cholesterol. *Lancet* 2010;376:1670–1681.
26. Duncan MS, et al. Association of smoking cessation with subsequent risk of cardiovascular disease. *JAMA* 2019;322:642–650.
27. Arnett DK, et al. 2019 ACC/AHA guideline on the primary prevention of cardiovascular disease. *Circulation* 2019;140:e596–e646.
28. Jensen MD, et al. 2013 AHA/ACC/TOS guideline for the management of overweight and obesity in adults. *Circulation* 2014;129:S102–S138.
29. Lloyd-Jones DM, et al. Life's Essential 8. *Circulation* 2022;146:e18–e43.
