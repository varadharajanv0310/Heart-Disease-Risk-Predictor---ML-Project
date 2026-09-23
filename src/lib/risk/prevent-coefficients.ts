/**
 * AHA PREVENT base-model coefficients.
 *
 * Source: Khan SS, Matsushita K, Sang Y, et al. Development and Validation of the
 * American Heart Association's PREVENT Equations. Circulation 2024;149:430–449.
 * doi:10.1161/CIRCULATIONAHA.123.067626 — Supplemental Tables S12A–S12H
 * (sex-specific base models for 10- and 30-year total CVD, ASCVD and heart failure).
 *
 * Verification: every value below was matched, as an IEEE-754 double, against the
 * constants compiled into the independent `pyprevent` 0.1.6 implementation
 * (234/234 present), and the full equations agree with it to < 1e-13 percentage
 * points over 240,000 random in-range profiles. See docs/01-research-brief.md.
 *
 * Do not edit by hand without re-running that verification.
 */

export type Sex = 'female' | 'male'
export type Outcome = 'cvd' | 'ascvd' | 'hf'
export type Horizon = 10 | 30

/** Term names. Lipid/statin terms are absent from HF models; BMI terms only exist in HF models. */
export interface PreventCoefficients {
  const: number
  age: number
  age2?: number
  nonHdl?: number
  hdl?: number
  sbpLo: number
  sbpHi: number
  diabetes: number
  smoker: number
  bmiLo?: number
  bmiHi?: number
  egfrLo: number
  egfrHi: number
  bpTreated: number
  statin?: number
  bpTreatedXSbpHi: number
  statinXNonHdl?: number
  ageXNonHdl?: number
  ageXHdl?: number
  ageXSbpHi: number
  ageXDiabetes: number
  ageXSmoker: number
  ageXBmiHi?: number
  ageXEgfrLo: number
}

type Key = `${Sex}:${Outcome}:${Horizon}`

export const PREVENT_COEFFICIENTS: Record<Key, PreventCoefficients> = {
  // ── 10-year ───────────────────────────────────────────────────────────────
  'female:cvd:10': {
    const: -3.307728, age: 0.7939329, nonHdl: 0.0305239, hdl: -0.1606857,
    sbpLo: -0.2394003, sbpHi: 0.3600781, diabetes: 0.8667604, smoker: 0.5360739,
    egfrLo: 0.6045917, egfrHi: 0.0433769, bpTreated: 0.3151672, statin: -0.1477655,
    bpTreatedXSbpHi: -0.0663612, statinXNonHdl: 0.1197879, ageXNonHdl: -0.0819715,
    ageXHdl: 0.0306769, ageXSbpHi: -0.0946348, ageXDiabetes: -0.27057,
    ageXSmoker: -0.078715, ageXEgfrLo: -0.1637806,
  },
  'male:cvd:10': {
    const: -3.031168, age: 0.7688528, nonHdl: 0.0736174, hdl: -0.0954431,
    sbpLo: -0.4347345, sbpHi: 0.3362658, diabetes: 0.7692857, smoker: 0.4386871,
    egfrLo: 0.5378979, egfrHi: 0.0164827, bpTreated: 0.288879, statin: -0.1337349,
    bpTreatedXSbpHi: -0.0475924, statinXNonHdl: 0.150273, ageXNonHdl: -0.0517874,
    ageXHdl: 0.0191169, ageXSbpHi: -0.1049477, ageXDiabetes: -0.2251948,
    ageXSmoker: -0.0895067, ageXEgfrLo: -0.1543702,
  },
  'female:ascvd:10': {
    const: -3.819975, age: 0.719883, nonHdl: 0.1176967, hdl: -0.151185,
    sbpLo: -0.0835358, sbpHi: 0.3592852, diabetes: 0.8348585, smoker: 0.4831078,
    egfrLo: 0.4864619, egfrHi: 0.0397779, bpTreated: 0.2265309, statin: -0.0592374,
    bpTreatedXSbpHi: -0.0395762, statinXNonHdl: 0.0844423, ageXNonHdl: -0.0567839,
    ageXHdl: 0.0325692, ageXSbpHi: -0.1035985, ageXDiabetes: -0.2417542,
    ageXSmoker: -0.0791142, ageXEgfrLo: -0.1671492,
  },
  'male:ascvd:10': {
    const: -3.500655, age: 0.7099847, nonHdl: 0.1658663, hdl: -0.1144285,
    sbpLo: -0.2837212, sbpHi: 0.3239977, diabetes: 0.7189597, smoker: 0.3956973,
    egfrLo: 0.3690075, egfrHi: 0.0203619, bpTreated: 0.2036522, statin: -0.0865581,
    bpTreatedXSbpHi: -0.0322916, statinXNonHdl: 0.114563, ageXNonHdl: -0.0300005,
    ageXHdl: 0.0232747, ageXSbpHi: -0.0927024, ageXDiabetes: -0.2018525,
    ageXSmoker: -0.0970527, ageXEgfrLo: -0.1217081,
  },
  'female:hf:10': {
    const: -4.310409, age: 0.8998235, sbpLo: -0.4559771, sbpHi: 0.3576505,
    diabetes: 1.038346, smoker: 0.583916, bmiLo: -0.0072294, bmiHi: 0.2997706,
    egfrLo: 0.7451638, egfrHi: 0.0557087, bpTreated: 0.3534442,
    bpTreatedXSbpHi: -0.0981511, ageXSbpHi: -0.0946663, ageXDiabetes: -0.3581041,
    ageXSmoker: -0.1159453, ageXBmiHi: -0.003878, ageXEgfrLo: -0.1884289,
  },
  'male:hf:10': {
    const: -3.946391, age: 0.8972642, sbpLo: -0.6811466, sbpHi: 0.3634461,
    diabetes: 0.923776, smoker: 0.5023736, bmiLo: -0.0485841, bmiHi: 0.3726929,
    egfrLo: 0.6926917, egfrHi: 0.0251827, bpTreated: 0.2980922,
    bpTreatedXSbpHi: -0.0497731, ageXSbpHi: -0.1289201, ageXDiabetes: -0.3040924,
    ageXSmoker: -0.1401688, ageXBmiHi: 0.0068126, ageXEgfrLo: -0.1797778,
  },
  // ── 30-year (adds age², valid for ages 30–59) ─────────────────────────────
  'female:cvd:30': {
    const: -1.318827, age: 0.5503079, age2: -0.0928369, nonHdl: 0.0409794, hdl: -0.1663306,
    sbpLo: -0.1628654, sbpHi: 0.3299505, diabetes: 0.6793894, smoker: 0.3196112,
    egfrLo: 0.1857101, egfrHi: 0.0553528, bpTreated: 0.2894, statin: -0.075688,
    bpTreatedXSbpHi: -0.056367, statinXNonHdl: 0.1071019, ageXNonHdl: -0.0751438,
    ageXHdl: 0.0301786, ageXSbpHi: -0.0998776, ageXDiabetes: -0.3206166,
    ageXSmoker: -0.1607862, ageXEgfrLo: -0.1450788,
  },
  'male:cvd:30': {
    const: -1.148204, age: 0.4627309, age2: -0.0984281, nonHdl: 0.0836088, hdl: -0.1029824,
    sbpLo: -0.2140352, sbpHi: 0.2904325, diabetes: 0.5331276, smoker: 0.2141914,
    egfrLo: 0.1155556, egfrHi: 0.0603775, bpTreated: 0.232714, statin: -0.0272112,
    bpTreatedXSbpHi: -0.0384488, statinXNonHdl: 0.134192, ageXNonHdl: -0.0511759,
    ageXHdl: 0.0165865, ageXSbpHi: -0.1101437, ageXDiabetes: -0.2585943,
    ageXSmoker: -0.1566406, ageXEgfrLo: -0.1166776,
  },
  'female:ascvd:30': {
    const: -1.974074, age: 0.4669202, age2: -0.0893118, nonHdl: 0.1256901, hdl: -0.1542255,
    sbpLo: -0.0018093, sbpHi: 0.322949, diabetes: 0.6296707, smoker: 0.268292,
    egfrLo: 0.100106, egfrHi: 0.0499663, bpTreated: 0.1875292, statin: 0.0152476,
    bpTreatedXSbpHi: -0.0276123, statinXNonHdl: 0.0736147, ageXNonHdl: -0.0521962,
    ageXHdl: 0.0316918, ageXSbpHi: -0.1046101, ageXDiabetes: -0.2727793,
    ageXSmoker: -0.1530907, ageXEgfrLo: -0.1299149,
  },
  'male:ascvd:30': {
    const: -1.736444, age: 0.3994099, age2: -0.0937484, nonHdl: 0.1744643, hdl: -0.120203,
    sbpLo: -0.0665117, sbpHi: 0.2753037, diabetes: 0.4790257, smoker: 0.1782635,
    egfrLo: -0.0218789, egfrHi: 0.0602553, bpTreated: 0.1421182, statin: 0.0135996,
    bpTreatedXSbpHi: -0.0218265, statinXNonHdl: 0.1013148, ageXNonHdl: -0.0312619,
    ageXHdl: 0.020673, ageXSbpHi: -0.0920935, ageXDiabetes: -0.2159947,
    ageXSmoker: -0.1548811, ageXEgfrLo: -0.0712547,
  },
  'female:hf:30': {
    const: -2.205379, age: 0.6254374, age2: -0.0983038, sbpLo: -0.3919241, sbpHi: 0.3142295,
    diabetes: 0.8330787, smoker: 0.3438651, bmiLo: 0.0594874, bmiHi: 0.2525536,
    egfrLo: 0.2981642, egfrHi: 0.0667159, bpTreated: 0.333921,
    bpTreatedXSbpHi: -0.0893177, ageXSbpHi: -0.0974299, ageXDiabetes: -0.404855,
    ageXSmoker: -0.1982991, ageXBmiHi: -0.0035619, ageXEgfrLo: -0.1564215,
  },
  'male:hf:30': {
    const: -1.95751, age: 0.5681541, age2: -0.1048388, sbpLo: -0.4761564, sbpHi: 0.30324,
    diabetes: 0.6840338, smoker: 0.2656273, bmiLo: 0.0833107, bmiHi: 0.26999,
    egfrLo: 0.2541805, egfrHi: 0.0638923, bpTreated: 0.2583631,
    bpTreatedXSbpHi: -0.0391938, ageXSbpHi: -0.1269124, ageXDiabetes: -0.3273572,
    ageXSmoker: -0.2043019, ageXBmiHi: -0.0182831, ageXEgfrLo: -0.1342618,
  },
}

export function coefficientsFor(sex: Sex, outcome: Outcome, horizon: Horizon): PreventCoefficients {
  return PREVENT_COEFFICIENTS[`${sex}:${outcome}:${horizon}`]
}
