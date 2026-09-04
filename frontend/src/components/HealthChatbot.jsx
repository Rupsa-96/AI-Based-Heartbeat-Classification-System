import { useState, useEffect, useRef, useCallback } from 'react'

const SEX_MAP      = { 0: 'female', 1: 'male' }
const CP_MAP       = { 0: 'typical angina', 1: 'atypical angina', 2: 'non-anginal pain', 3: 'asymptomatic' }
const RESTECG_MAP  = { 0: 'normal', 1: 'ST-T wave abnormality', 2: 'left ventricular hypertrophy' }
const SLOPE_MAP    = { 0: 'upsloping', 1: 'flat', 2: 'downsloping' }
const THAL_MAP     = { 0: 'normal', 1: 'fixed defect', 2: 'reversible defect', 3: 'unknown' }
const FBS_MAP      = { 0: 'normal (≤120 mg/dl)', 1: 'elevated (>120 mg/dl)' }
const EXANG_MAP    = { 0: 'no', 1: 'yes' }

function fv(map, val) { return map[val] ?? String(val) }



function buildContext(result, patientData) {
  const p   = patientData ?? {}
  const age = Number(p.age ?? 0)

  return {
    // ── prediction ──────────────────────────────────────────────────────────
    riskLevel:   result?.risk_level ?? 'Unknown',
    prediction:  result?.prediction ?? '',
    probability: Math.round((result?.probability ?? 0) * 100),

    // ── demographics ────────────────────────────────────────────────────────
    age,
    sex:         fv(SEX_MAP, p.sex),
    isMale:      Number(p.sex) === 1,
    isFemale:    Number(p.sex) === 0,

    // ── chest pain ──────────────────────────────────────────────────────────
    cpLabel:     fv(CP_MAP, p.cp),
    isAsymptomatic: Number(p.cp) === 3,

    // ── vitals & labs ────────────────────────────────────────────────────────
    bp:          Number(p.trestbps ?? 0),
    chol:        Number(p.chol ?? 0),
    fbsLabel:    fv(FBS_MAP, p.fbs),
    fbsHigh:     Number(p.fbs) === 1,
    ecgLabel:    fv(RESTECG_MAP, p.restecg),
    ecgAbnormal: Number(p.restecg) !== 0,
    maxHR:       Number(p.thalach ?? 0),
    exang:       fv(EXANG_MAP, p.exang),
    exangYes:    Number(p.exang) === 1,
    oldpeak:     Number(p.oldpeak ?? 0),
    slopeLabel:  fv(SLOPE_MAP, p.slope),
    vessels:     Number(p.ca ?? 0),
    thalLabel:   fv(THAL_MAP, p.thal),
    thalBad:     Number(p.thal) === 2,  // reversible defect — highest risk thal

    // ── derived flags ────────────────────────────────────────────────────────
    bpHigh:      Number(p.trestbps) >= 130,
    bpVeryHigh:  Number(p.trestbps) >= 160,
    cholHigh:    Number(p.chol) >= 200,
    cholVeryHigh:Number(p.chol) >= 240,
    hrLow:       Number(p.thalach) < 120,
    hrVeryLow:   Number(p.thalach) < 100,
    stDepressed: Number(p.oldpeak) >= 1.5,
    vesselsSevere: Number(p.ca) >= 2,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const INTENTS = [
  // ── prediction-result explanations ──────────────────────────────────────
  { id: 'why_high',      patterns: [/why.*(high|danger|bad|serious|concern)/i, /reason.*risk/i, /what.*caus/i, /explain.*result/i, /why.*this.*result/i] },
  { id: 'why_low',       patterns: [/why.*(low|safe|good|fine|ok)/i, /mean.*low/i, /does.*low.*mean/i] },
  { id: 'why_moderate',  patterns: [/why.*moderate/i, /mean.*moderate/i, /moderate.*mean/i] },
  { id: 'what_is_result',patterns: [/what.*result/i, /what.*predict/i, /what.*mean/i, /interpret/i, /understand.*result/i, /explain.*score/i] },
  { id: 'probability',   patterns: [/probab/i, /percent/i, /\d+\s*%/i, /confidence/i, /score.*mean/i, /what.*number/i] },

  // ── specific clinical parameters ─────────────────────────────────────────
  { id: 'blood_pressure',patterns: [/blood pressure/i, /\bbp\b/i, /hypertens/i, /trestbps/i, /systolic/i, /diastolic/i] },
  { id: 'cholesterol',   patterns: [/cholesterol/i, /\bchol\b/i, /ldl/i, /hdl/i, /lipid/i, /triglyc/i] },
  { id: 'heart_rate',    patterns: [/heart.?rate/i, /\bhr\b/i, /thalach/i, /max.*rate/i, /pulse/i, /bpm/i] },
  { id: 'chest_pain',    patterns: [/chest.?pain/i, /angina/i, /\bcp\b/i, /chest.*discomfort/i, /chest.*tight/i] },
  { id: 'st_depression', patterns: [/st.?depression/i, /oldpeak/i, /st.?segment/i, /ecg.*change/i, /ekg/i] },
  { id: 'thalassemia',   patterns: [/thal/i, /thalassemia/i, /haemoglobin/i, /hemoglobin/i, /blood.?disorder/i] },
  { id: 'vessels',       patterns: [/vessel/i, /\bca\b/i, /coronary/i, /artery/i, /arteries/i, /fluoroscopy/i, /blockage/i, /block/i] },
  { id: 'ecg',           patterns: [/ecg/i, /ekg/i, /electrocardiogram/i, /restecg/i, /heart.*rhythm/i] },
  { id: 'blood_sugar',   patterns: [/blood.?sugar/i, /\bfbs\b/i, /glucose/i, /diabet/i, /insulin/i] },

  // ── risk reduction & lifestyle ────────────────────────────────────────────
  { id: 'reduce_risk',   patterns: [/reduce.*risk/i, /lower.*risk/i, /improve/i, /prevent/i, /avoid/i, /decrease/i, /what.*can.*do/i, /how.*help/i, /how.*better/i, /reverse/i] },
  { id: 'diet',          patterns: [/diet/i, /eat/i, /food/i, /nutrition/i, /meal/i, /fruit/i, /vegetabl/i, /mediterranean/i, /sodium/i, /salt/i, /fat/i, /fiber/i] },
  { id: 'exercise',      patterns: [/exercis/i, /workout/i, /physical.?activ/i, /walk/i, /run/i, /swim/i, /cardio/i, /gym/i, /sport/i, /aerobic/i, /yoga/i] },
  { id: 'smoking',       patterns: [/smok/i, /tobacco/i, /cigarette/i, /nicotine/i, /quit/i] },
  { id: 'alcohol',       patterns: [/alcohol/i, /drink/i, /wine/i, /beer/i, /liquor/i] },
  { id: 'stress',        patterns: [/stress/i, /mental/i, /anxiety/i, /depression/i, /meditat/i, /relax/i, /sleep/i, /rest/i, /mindful/i] },
  { id: 'weight',        patterns: [/weight/i, /obes/i, /bmi/i, /overweight/i, /lose.*weight/i, /fat/i, /body.*mass/i] },
  { id: 'medication',    patterns: [/medic/i, /drug/i, /prescri/i, /statin/i, /aspirin/i, /pill/i, /tablet/i, /treatment/i, /therap/i, /dose/i] },

  // ── about the model / system ──────────────────────────────────────────────
  { id: 'about_model',   patterns: [/how.*model/i, /how.*work/i, /dnn/i, /neural/i, /ai/i, /machine.?learn/i, /deep.?learn/i, /algorithm/i, /trained/i, /accurate/i, /accuracy/i] },
  { id: 'about_dataset', patterns: [/dataset/i, /uci/i, /data/i, /train.*data/i, /cleveland/i, /sample/i] },
  { id: 'doctor',        patterns: [/doctor/i, /physician/i, /cardiolog/i, /hospital/i, /specialist/i, /consult/i, /should.*see/i, /appointment/i, /when.*see/i] },

  // ── conversation ─────────────────────────────────────────────────────────
  { id: 'greeting',      patterns: [/^hi\b/i, /^hello/i, /^hey/i, /^good\s*(morning|afternoon|evening)/i, /^namaste/i] },
  { id: 'thanks',        patterns: [/thank/i, /\bthx\b/i, /appreciate/i, /helpful/i, /great/i, /good answer/i] },
  { id: 'help',          patterns: [/^help/i, /what.*ask/i, /what.*can.*you/i, /what.*topic/i, /guide me/i] },
]

function detectIntent(userInput, ctx) {
  const text = userInput.trim()
  for (const { id, patterns } of INTENTS) {
    if (patterns.some(re => re.test(text))) return id
  }
  // Fallback: if message is very short, treat as a request for summary
  if (text.length < 25) return 'what_is_result'
  return 'unknown'
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

const CONSULT = '\n\n💡 *Always consult a qualified cardiologist or your physician before making any health decisions.*'
const DISCLAIMER_SHORT = '*(This is educational information only — not medical advice.)*'

function buildResponse(intent, ctx) {
  const { riskLevel, probability, age, sex, bp, chol, maxHR,
          bpHigh, bpVeryHigh, cholHigh, cholVeryHigh, hrLow, hrVeryLow,
          fbsHigh, ecgAbnormal, exangYes, stDepressed, thalBad,
          vessels, vesselsSevere, cpLabel, fbsLabel, ecgLabel,
          slopeLabel, thalLabel, isMale, oldpeak } = ctx

  // ── helper: risk-specific colour word ──────────────────────────────────
  const riskWord = riskLevel === 'High' ? '⚠️ high' : riskLevel === 'Moderate' ? '🟡 moderate' : '✅ low'

  switch (intent) {

    // ── Result explanations ────────────────────────────────────────────────

    case 'greeting':
      return `Hello! 👋 I'm the **Heart Health AI Assistant**.

I can see you just received a **${riskWord} risk** prediction with a probability of **${probability}%**.

I can help you understand:
• What your result means
• Which clinical values influenced it
• Heart-healthy lifestyle tips
• Diet, exercise & stress management

What would you like to know?`

    case 'help':
      return `Here are things you can ask me about:

**📊 About your result**
• "Why is my risk ${riskLevel.toLowerCase()}?"
• "What does ${probability}% probability mean?"
• "Explain my result"

**🩺 Your clinical values**
• "What does my blood pressure mean?"
• "Is my cholesterol concerning?"
• "Explain my chest pain type"
• "What is ST depression?"

**💚 Improving heart health**
• "How can I reduce my risk?"
• "What diet is good for heart health?"
• "What exercises should I do?"
• "How does smoking affect my heart?"
• "How does stress affect heart health?"

**🤖 About the AI**
• "How does the model work?"
• "When should I see a doctor?"

${DISCLAIMER_SHORT}`

    case 'what_is_result':
    case 'probability': {
      const meaning = riskLevel === 'High'
        ? `This is a **high-risk result**. The model detected multiple clinical patterns associated with heart disease — particularly your combination of ${[
            bpHigh && `elevated blood pressure (${bp} mm Hg)`,
            cholHigh && `high cholesterol (${chol} mg/dl)`,
            hrLow && `lower peak heart rate (${maxHR} bpm)`,
            exangYes && 'exercise-induced angina',
            stDepressed && `ST depression (${oldpeak})`,
            thalBad && 'reversible thalassemia defect',
            vesselsSevere && `${vessels} major vessels affected`,
          ].filter(Boolean).join(', ') || 'the pattern of your overall clinical profile'}.`
        : riskLevel === 'Moderate'
        ? `This is a **moderate-risk result**. The model found some clinical indicators that warrant attention, but the overall pattern is not as strongly associated with heart disease as in a high-risk profile.`
        : `This is a **low-risk result**. The model found that your clinical profile closely resembles patterns seen in patients without significant heart disease. This is encouraging!`

      return `**Your Result:** ${ctx.prediction}
**Probability Score:** ${probability}%
**Risk Category:** ${riskWord}

${meaning}

**What does the probability mean?**
The Deep Neural Network outputs a score between 0% and 100% representing the likelihood of heart disease based on your 13 clinical features. The thresholds are:
• **0–34%** → Low Risk
• **35–64%** → Moderate Risk
• **65–100%** → High Risk

Your score of **${probability}%** places you in the **${riskLevel}** category.

This is an **educational AI model** — not a clinical diagnosis. The model has ~82% accuracy on its test set, which means it is not perfect.${CONSULT}`
    }

    case 'why_high': {
      if (riskLevel !== 'High') {
        return `Your result is actually **${riskWord}** (${probability}%), not high risk. ${riskLevel === 'Low' ? 'Your clinical profile looks relatively favourable.' : 'There are some values to watch, but you\'re not in the high-risk category.'} Would you like me to explain what contributed to your ${riskLevel.toLowerCase()} risk?`
      }
      const factors = [
        bpVeryHigh   && `🔴 **Very high BP** (${bp} mm Hg) — significantly above the normal range`,
        bpHigh && !bpVeryHigh && `🟡 **Elevated BP** (${bp} mm Hg) — above the 130 mm Hg threshold`,
        cholVeryHigh && `🔴 **Very high cholesterol** (${chol} mg/dl) — above 240 mg/dl is considered high risk`,
        cholHigh && !cholVeryHigh && `🟡 **Borderline high cholesterol** (${chol} mg/dl)`,
        hrVeryLow    && `🔴 **Very low peak heart rate** (${maxHR} bpm) — reduced cardiac reserve`,
        hrLow && !hrVeryLow && `🟡 **Below-average peak heart rate** (${maxHR} bpm)`,
        exangYes     && `🔴 **Exercise-induced angina** — chest pain during exertion is a strong cardiac indicator`,
        stDepressed  && `🔴 **ST depression** of ${oldpeak} — indicates possible ischaemia during stress`,
        thalBad      && `🔴 **Reversible thalassemia defect** — associated with reduced blood flow to the heart`,
        vesselsSevere && `🔴 **${vessels} major vessels** coloured — indicates arterial involvement`,
        fbsHigh      && `🟡 **Elevated fasting blood sugar** — suggests possible insulin resistance`,
        ecgAbnormal  && `🟡 **Abnormal resting ECG** (${ecgLabel})`,
      ].filter(Boolean)

      return `**Why your risk is HIGH (${probability}%)**

The DNN identified these contributing factors in your clinical profile:

${factors.length > 0 ? factors.join('\n') : `• The combination of your overall clinical parameters matches patterns seen in patients with heart disease.`}

**Important context:**
• Having multiple risk factors compounds the overall risk non-linearly.
• Some of these (like ECG changes and thalassemia) are structural findings that require medical evaluation.
• Others (like BP, cholesterol, and blood sugar) are often **modifiable** with lifestyle changes and/or medication.${CONSULT}`
    }

    case 'why_low': {
      if (riskLevel !== 'Low') {
        return `Your result is **${riskWord}** (${probability}%), which is not the low category. Would you like me to explain what contributed to your ${riskLevel.toLowerCase()} risk instead?`
      }
      return `**Why your risk is LOW (${probability}%)**

Your clinical profile has several protective features:

${[
  bp < 130     && `✅ **Good blood pressure** (${bp} mm Hg)`,
  chol < 200   && `✅ **Healthy cholesterol** (${chol} mg/dl)`,
  maxHR >= 140 && `✅ **Good peak heart rate** (${maxHR} bpm) — suggests healthy cardiac reserve`,
  !exangYes    && `✅ **No exercise-induced angina**`,
  !stDepressed && `✅ **Minimal ST depression** (${oldpeak})`,
  !fbsHigh     && `✅ **Normal fasting blood sugar**`,
  !ecgAbnormal && `✅ **Normal resting ECG**`,
  !thalBad     && `✅ **No reversible thalassemia defect**`,
].filter(Boolean).join('\n')}

A low-risk result is encouraging, but it doesn't mean zero risk — heart health requires ongoing attention.${CONSULT}`
    }

    case 'why_moderate': {
      if (riskLevel !== 'Moderate') {
        return `Your result is actually **${riskWord}** (${probability}%), not moderate. Would you like me to explain what contributed to your ${riskLevel.toLowerCase()} risk?`
      }
      return `**Why your risk is MODERATE (${probability}%)**

Your profile has a mixed picture — some concerning values alongside some protective ones:

**⚠️ Values to watch:**
${[
  bpHigh       && `• Elevated BP (${bp} mm Hg)`,
  cholHigh     && `• High cholesterol (${chol} mg/dl)`,
  hrLow        && `• Lower peak heart rate (${maxHR} bpm)`,
  exangYes     && `• Exercise-induced angina`,
  stDepressed  && `• ST depression (${oldpeak})`,
  fbsHigh      && `• Elevated fasting blood sugar`,
  ecgAbnormal  && `• Abnormal ECG (${ecgLabel})`,
].filter(Boolean).join('\n') || '• Overall pattern is mildly elevated'}

**✅ Protective factors:**
${[
  !bpHigh      && `• Blood pressure within range (${bp} mm Hg)`,
  !cholHigh    && `• Cholesterol within range (${chol} mg/dl)`,
  !exangYes    && `• No exercise-induced angina`,
  !stDepressed && `• Low ST depression`,
  !fbsHigh     && `• Normal blood sugar`,
].filter(Boolean).join('\n') || '• Some clinical values are within normal range'}

Moderate risk is an important signal to take preventive action — lifestyle changes at this stage can make a significant difference.${CONSULT}`
    }

    // ── Clinical parameters ────────────────────────────────────────────────

    case 'blood_pressure':
      return `**Blood Pressure (Resting BP)**
Your resting BP: **${bp} mm Hg**

**Normal ranges:**
• Optimal: below 120 mm Hg
• Normal: 120–129 mm Hg
• Elevated: 130–139 mm Hg
• High (Stage 1): 140–159 mm Hg
• High (Stage 2): 160+ mm Hg

**Your reading (${bp} mm Hg):** ${
  bp < 120 ? '✅ Optimal — well within the healthy range.' :
  bp < 130 ? '✅ Normal — within acceptable limits.' :
  bp < 140 ? '🟡 Elevated — worth monitoring and addressing with lifestyle changes.' :
  bp < 160 ? '⚠️ Stage 1 Hypertension — medical evaluation recommended.' :
             '🔴 Stage 2 Hypertension — this significantly increases cardiac risk and requires prompt medical attention.'
}

**Why BP matters for heart disease:**
High blood pressure forces the heart to work harder, thickens the heart muscle, and accelerates artery damage — one of the strongest modifiable risk factors for heart disease.

**Tips to reduce BP naturally:**
• Reduce sodium intake (aim for <2,300 mg/day)
• Regular aerobic exercise (30 min, 5 days/week)
• Maintain healthy weight
• Limit alcohol
• Manage stress through meditation or breathing exercises${CONSULT}`

    case 'cholesterol':
      return `**Serum Cholesterol**
Your cholesterol: **${chol} mg/dl**

**Standard categories:**
• Desirable: below 200 mg/dl
• Borderline high: 200–239 mg/dl
• High: 240+ mg/dl

**Your reading (${chol} mg/dl):** ${
  chol < 200 ? '✅ Desirable — good cholesterol level.' :
  chol < 240 ? '🟡 Borderline high — dietary and lifestyle changes are advisable.' :
               '🔴 High — this significantly raises cardiovascular risk and usually warrants medical advice.'
}

**Why cholesterol matters:**
LDL ("bad") cholesterol builds up in artery walls forming plaques that narrow blood vessels (atherosclerosis), reducing blood flow to the heart.

**Heart-healthy tips to lower cholesterol:**
• Replace saturated fats with unsaturated fats (olive oil, nuts, avocado)
• Eat more soluble fibre (oats, beans, lentils, fruits)
• Include omega-3 rich foods (salmon, walnuts, flaxseed)
• Limit processed foods, red meat, and full-fat dairy
• Exercise regularly — physical activity raises HDL ("good") cholesterol${CONSULT}`

    case 'heart_rate':
      return `**Maximum Heart Rate Achieved (Thalach)**
Your peak heart rate: **${maxHR} bpm**

**Context:**
The maximum heart rate achieved during an exercise stress test reflects cardiac reserve — how hard your heart can work when demanded.

A rough estimated maximum HR for a healthy person is: **220 − age = ${220 - age} bpm** (for age ${age}).
Your achieved rate is **${maxHR} bpm**, which is ${
  maxHR >= (220 - age) * 0.85
    ? `✅ good — you reached ≥85% of estimated maximum, indicating solid cardiac fitness.`
    : maxHR >= (220 - age) * 0.70
    ? `🟡 moderate — you reached ${Math.round((maxHR / (220 - age)) * 100)}% of estimated maximum.`
    : `⚠️ relatively low — reaching less than 70% of estimated maximum heart rate can be a sign of reduced cardiac reserve or fitness.`
}

**Why it matters:**
A lower peak heart rate during exercise testing is independently associated with higher cardiovascular risk, as it may indicate poor cardiac fitness or impaired heart function.

**How to improve:**
• Regular aerobic exercise (walking, cycling, swimming) progressively improves cardiac fitness
• Quitting smoking significantly improves heart rate response
• Treating anaemia or thyroid conditions if present${CONSULT}`

    case 'chest_pain':
      return `**Chest Pain Type**
Your classification: **${cpLabel}**

**The 4 types used in this dataset:**

🔴 **Typical Angina** — Classic chest pain triggered by exertion, relieved by rest. Strong indicator of coronary artery disease.

🟡 **Atypical Angina** — Chest discomfort that doesn't follow the typical pattern. Still relevant but less specific.

🟡 **Non-Anginal Pain** — Chest pain not likely related to the heart (e.g., musculoskeletal or gastrointestinal). Lower cardiac risk.

⚠️ **Asymptomatic** — *No* chest pain despite possible underlying disease. Paradoxically associated with higher risk in this dataset because patients who have already been diagnosed may have "silent" ischaemia.

**Your type (${cpLabel}):**
${
  ctx.isAsymptomatic
    ? `Your "asymptomatic" classification is an important finding. In the UCI dataset, patients presenting without typical chest pain symptoms can still have significant underlying coronary artery disease — sometimes called "silent ischaemia". This is why your other clinical values are so important.`
    : cpLabel === 'typical angina'
    ? `Typical angina is the most classic symptom of reduced blood flow to the heart. If you're experiencing these symptoms in real life, a cardiologist evaluation is important.`
    : `Your chest pain type is noted in your clinical profile. Combined with your other values, this contributes to the overall risk picture.`
}${CONSULT}`

    case 'st_depression':
      return `**ST Depression (Oldpeak)**
Your ST depression: **${oldpeak}**

**What is ST depression?**
The ST segment on an ECG (electrocardiogram) represents the period between ventricular contraction and relaxation. Depression of the ST segment during exercise testing suggests that some part of the heart muscle is not receiving enough oxygen (ischaemia).

**Interpretation:**
• 0.0 – 0.5: Minimal — usually not clinically significant
• 0.5 – 1.5: Mild — may warrant further investigation
• 1.5 – 2.5: Moderate — ${stDepressed ? '(your range)' : ''} significant indicator of possible ischaemia
• 2.5+: Severe — strong indicator requiring urgent evaluation

**Your value (${oldpeak}):** ${
  oldpeak < 0.5 ? '✅ Minimal ST depression — reassuring finding.' :
  oldpeak < 1.5 ? '🟡 Mild ST depression — worth monitoring.' :
  oldpeak < 2.5 ? '⚠️ Moderate ST depression — this is clinically relevant and contributed to your risk assessment.' :
                  '🔴 Significant ST depression — this is a major cardiac risk indicator.'
}${CONSULT}`

    case 'thalassemia':
      return `**Thalassemia Type**
Your classification: **${thalLabel}**

**What is thalassemia in this context?**
In the UCI Heart Disease dataset, "thal" refers to results of a thallium-201 myocardial perfusion scan — a nuclear imaging test that shows blood flow through the heart muscle.

**The 4 categories:**
• ✅ **Normal** — Uniform blood flow throughout the heart
• 🟡 **Fixed Defect** — Permanent reduced blood flow area (scar tissue from past heart attack)
• 🔴 **Reversible Defect** — Reduced flow during stress that improves at rest (active ischaemia — highest risk)
• ❓ **Unknown** — Inconclusive scan

**Your classification (${thalLabel}):** ${
  ctx.thalBad
    ? `⚠️ A reversible defect is the most concerning finding — it indicates that part of your heart muscle is receiving inadequate blood flow during stress, which is a direct indicator of coronary artery disease.`
    : Number(ctx.thal) === 1
    ? `A fixed defect suggests there may be scar tissue from a previous cardiac event. This is an important finding for a cardiologist to evaluate.`
    : `✅ A normal result is reassuring — it suggests uniform blood flow to the heart muscle.`
}${CONSULT}`

    case 'vessels':
      return `**Major Vessels (Fluoroscopy) — CA**
Your value: **${vessels} vessel${vessels !== 1 ? 's' : ''}**

**What does this measure?**
This value (0–4) represents the number of major coronary blood vessels that showed significant narrowing or calcification during coronary fluoroscopy (X-ray imaging of the arteries).

**Interpretation:**
• **0 vessels** — No significant arterial narrowing detected ✅
• **1 vessel** — Single-vessel disease — manageable with medication or intervention 🟡
• **2 vessels** — Two-vessel disease — more significant, warrants intervention discussion ⚠️
• **3–4 vessels** — Multi-vessel disease — often requires more aggressive treatment 🔴

**Your value (${vessels}):** ${
  vessels === 0 ? '✅ No major vessel narrowing detected — a protective finding.' :
  vessels === 1 ? '🟡 Single vessel involvement — this contributed to your risk score.' :
                  `🔴 ${vessels} vessels involved — this is a significant finding that would require cardiology evaluation.`
}${CONSULT}`

    case 'ecg':
      return `**Resting ECG (Electrocardiogram)**
Your result: **${ecgLabel}**

**The 3 categories in this dataset:**
• ✅ **Normal** — No significant abnormalities detected at rest
• 🟡 **ST-T Wave Abnormality** — Subtle changes in repolarisation patterns; can indicate ischaemia or ventricular strain
• ⚠️ **Left Ventricular Hypertrophy (LVH)** — Thickening of the heart's main pumping chamber, typically from long-standing high blood pressure

**Your result (${ecgLabel}):** ${
  !ctx.ecgAbnormal
    ? '✅ Normal resting ECG — a reassuring finding.'
    : ecgLabel === 'st-t wave abnormality'
    ? '🟡 ST-T wave changes at rest can indicate cardiac stress, electrolyte imbalances, or medication effects.'
    : '⚠️ Left ventricular hypertrophy suggests the heart has been under sustained pressure, often from uncontrolled hypertension. This increases the risk of heart failure, arrhythmias, and heart attack.'
}${CONSULT}`

    case 'blood_sugar':
      return `**Fasting Blood Sugar**
Your result: **${fbsLabel}**

**Threshold used:** >120 mg/dl is considered elevated.

**Your value:** ${fbsHigh
  ? `🔴 Elevated fasting blood sugar (>120 mg/dl)\n\nElevated fasting glucose can indicate pre-diabetes or diabetes, both of which significantly increase cardiovascular risk by:\n• Damaging blood vessel walls over time\n• Accelerating atherosclerosis (artery hardening)\n• Increasing inflammation throughout the body\n• Raising blood pressure and cholesterol indirectly`
  : `✅ Normal fasting blood sugar (≤120 mg/dl) — this is a protective factor.`
}

**Managing blood sugar for heart health:**
• Limit refined carbohydrates and added sugars
• Exercise regularly (improves insulin sensitivity)
• Maintain a healthy weight
• Eat more fibre (slows glucose absorption)
• Get tested regularly if you have a family history of diabetes${CONSULT}`

    // ── Risk reduction ─────────────────────────────────────────────────────

    case 'reduce_risk':
      return `**How to Reduce Your Cardiovascular Risk**
${riskLevel !== 'Low' ? `Your current risk is **${riskWord}** (${probability}%). Here are targeted actions based on your profile:\n` : `Even with a low risk, maintaining heart health is important:\n`}

**🩺 Medical steps (first priority):**
• Schedule a consultation with a cardiologist, especially given your ${riskLevel.toLowerCase()} risk
• Have your BP${bpHigh ? ` (currently ${bp} mm Hg — elevated)` : ''} monitored regularly
• Get a full lipid panel${cholHigh ? ` (your cholesterol of ${chol} mg/dl needs attention)` : ''}
${fbsHigh ? `• Have your blood sugar evaluated by a doctor\n` : ''}

**🥗 Dietary changes:**
• Adopt a Mediterranean or DASH diet
• Reduce sodium (less than 2,300 mg/day)
• Increase omega-3 fatty acids (fish, walnuts, flaxseed)
• Eat more fibre, fruits, and vegetables
• Limit saturated fats, processed foods, and added sugars

**🏃 Physical activity:**
• 150 minutes of moderate aerobic exercise per week (brisk walking, cycling, swimming)
• Start slowly if currently sedentary — even 10-minute walks help
• Include 2 strength training sessions per week

**🚭 Lifestyle:**
• Quit smoking (single most impactful cardiovascular change)
• Limit alcohol to ≤1–2 drinks/day
• Achieve and maintain a healthy BMI (18.5–24.9)
• Manage stress with meditation, yoga, or breathing exercises
• Get 7–9 hours of quality sleep per night${CONSULT}`

    case 'diet':
      return `**Heart-Healthy Diet Guide**

**🫒 Mediterranean Diet** (strongest evidence for heart disease prevention):
• **Base every meal on:** vegetables, legumes, whole grains, fruits
• **Healthy fats:** olive oil as primary cooking fat, avocados, nuts
• **Protein:** fatty fish (salmon, sardines, mackerel) 2–3x/week, legumes daily, limited red meat
• **Limit:** processed foods, refined carbs, added sugars, full-fat dairy

**🧂 Reduce sodium:**
Your BP is ${bp} mm Hg — ${bpHigh ? 'elevated, so sodium reduction is particularly important for you.' : 'in range, but keeping sodium low protects future health.'}
• Aim for <2,300 mg sodium/day
• Avoid processed/packaged foods, fast food, canned soups

**🐟 Increase omega-3 fatty acids:**
These reduce inflammation, triglycerides, and blood pressure.
• Fatty fish (salmon, tuna, mackerel), walnuts, flaxseeds, chia seeds

**🌾 Increase dietary fibre:**
Soluble fibre reduces LDL cholesterol directly.
${cholHigh ? `Your cholesterol (${chol} mg/dl) would benefit from this:` : '• Target 25–35g total fibre per day'}
• Oats, barley, beans, lentils, apples, oranges, psyllium

**❌ Foods to limit:**
• Saturated fats (butter, full-fat dairy, fatty red meat, coconut oil)
• Trans fats (partially hydrogenated oils — found in many packaged snacks)
• Added sugars and refined carbohydrates${CONSULT}`

    case 'exercise':
      return `**Heart-Healthy Exercise Guide**

**The goal:** 150 minutes of moderate-intensity aerobic exercise per week (or 75 minutes of vigorous activity).

**Best exercises for heart health:**

🚶 **Brisk walking** — The most accessible cardiac exercise. Start with 15–20 minutes daily and build up. Aim for a pace where you can talk but not sing.

🚴 **Cycling** — Low-impact, excellent for cardiovascular fitness. Stationary bike is fine.

🏊 **Swimming** — Full-body, zero impact — ideal if joints are a concern.

🏃 **Jogging/Running** — Highly effective but check with your doctor first, especially given your ${riskWord} risk.

🧘 **Yoga** — Reduces stress, lowers BP, improves flexibility. Excellent complement to aerobic exercise.

💪 **Strength training** — 2x per week improves insulin sensitivity, metabolic health, and body composition.

**For your profile:**
${hrLow
  ? `Your peak heart rate of ${maxHR} bpm suggests your current fitness level may be lower than ideal. Start with low-intensity walking and build gradually. Getting medical clearance before starting an exercise programme is especially important for you.`
  : `Your peak heart rate of ${maxHR} bpm is encouraging. You can likely handle moderate aerobic exercise, but always progress gradually.`
}

**⚠️ Important:** If you experience chest pain, shortness of breath, dizziness, or palpitations during exercise — stop immediately and seek medical attention.${CONSULT}`

    case 'smoking':
      return `**Smoking & Heart Health**

Smoking is **the single most preventable cause of cardiovascular disease**.

**How smoking damages the heart:**
• Reduces oxygen in the blood, forcing the heart to work harder
• Damages the inner lining of blood vessels, accelerating atherosclerosis
• Makes blood more likely to clot (increasing heart attack risk)
• Reduces HDL ("good") cholesterol
• Raises blood pressure and heart rate

**The good news — quitting works fast:**
• After 20 minutes: BP and heart rate drop
• After 12 hours: Carbon monoxide levels normalise
• After 1 year: Heart disease risk is cut by 50%
• After 5 years: Stroke risk approaches that of a non-smoker
• After 15 years: Heart disease risk is similar to someone who never smoked

**Quitting strategies:**
• Nicotine Replacement Therapy (patches, gum, lozenges) — proven effective
• Prescription medications (varenicline, bupropion) — ask your doctor
• Behavioural counselling — significantly improves success rates
• Support groups and apps (e.g., Smoke Free, QuitNow!)

${DISCLAIMER_SHORT}`

    case 'alcohol':
      return `**Alcohol & Heart Health**

**The relationship is nuanced:**
• **Heavy drinking** (more than 14 units/week for men, 7 for women) clearly raises BP, causes cardiomyopathy (weakened heart muscle), and increases heart attack/stroke risk.
• **Moderate alcohol** — evidence is mixed. While some studies showed mild cardiovascular benefit from moderate red wine, more recent research suggests no level of alcohol is risk-free.

**Practical guidance:**
• If you don't drink, don't start for heart health reasons
• If you do drink, the recommended limit is **no more than 1–2 standard drinks per day** with alcohol-free days
• Beer, wine, and spirits all carry similar cardiovascular risks in equivalent amounts

**Alcohol raises:**
• Blood pressure (your BP is ${bp} mm Hg${bpHigh ? ' — already elevated, so reducing alcohol is important' : ''})
• Triglycerides
• Risk of atrial fibrillation ("holiday heart syndrome")
• Calories, contributing to weight gain

${DISCLAIMER_SHORT}`

    case 'stress':
      return `**Stress, Sleep & Heart Health**

**How chronic stress harms the heart:**
• Triggers release of cortisol and adrenaline, raising heart rate and BP
• Promotes inflammation in blood vessels
• Encourages unhealthy coping behaviours (overeating, smoking, alcohol)
• Disrupts sleep, which independently raises cardiovascular risk

**Evidence-based stress management:**

🧘 **Meditation & mindfulness** — Even 10 minutes/day reduces cortisol levels and lowers BP over time. Apps like Headspace, Calm, or Insight Timer are good starting points.

🌬️ **Breathing exercises** — The 4-7-8 technique (inhale 4 sec, hold 7, exhale 8) activates the parasympathetic nervous system and lowers HR.

🚶 **Exercise** — One of the most powerful natural anti-depressants and stress relievers — also directly benefits your heart.

😴 **Sleep quality:**
• Target 7–9 hours of quality sleep per night
• Poor sleep raises BP, increases inflammation, and disrupts blood sugar regulation
• Tips: consistent sleep schedule, dark/cool room, no screens 1 hour before bed

🤝 **Social connection** — Strong social ties are independently associated with lower cardiovascular mortality.

${DISCLAIMER_SHORT}`

    case 'weight':
      return `**Body Weight & Heart Health**

**Why weight matters:**
Excess body fat — particularly abdominal (visceral) fat — is directly linked to:
• High blood pressure (your BP: ${bp} mm Hg)
• High cholesterol (your level: ${chol} mg/dl)
• Elevated blood sugar
• Inflammation
• Sleep apnoea (which raises BP and cardiac risk independently)

**BMI guide:**
• Underweight: <18.5
• Normal weight: 18.5–24.9
• Overweight: 25–29.9
• Obese: ≥30

Even a **5–10% reduction in body weight** can meaningfully lower BP, cholesterol, and blood sugar.

**Sustainable weight management:**
• Focus on a Mediterranean or DASH dietary pattern — not crash dieting
• 150+ minutes of aerobic exercise per week
• Prioritise sleep — poor sleep disrupts hunger hormones (ghrelin/leptin)
• Reduce ultra-processed foods, sugary drinks, and alcohol
• Set realistic goals: 0.5–1 kg per week is safe and sustainable

${DISCLAIMER_SHORT}`

    case 'medication':
      return `**Heart Medications — Educational Overview**

⚠️ I cannot recommend, prescribe, or advise on specific medications. Only a doctor can do that. This is purely educational context.

**Common medication classes for heart disease risk factors:**

💊 **Statins** (e.g., atorvastatin, rosuvastatin)
→ Lower LDL cholesterol; among the most evidence-backed cardiac medicines. ${cholHigh ? `Given your cholesterol of ${chol} mg/dl, a doctor may discuss this.` : ''}

💊 **ACE inhibitors / ARBs** (e.g., lisinopril, ramipril)
→ Lower blood pressure, protect kidneys in diabetics. ${bpHigh ? `Relevant given your BP of ${bp} mm Hg.` : ''}

💊 **Beta-blockers** (e.g., metoprolol, atenolol)
→ Slow the heart rate, reduce BP, used after heart attacks.

💊 **Aspirin** (low-dose)
→ Reduces blood clotting; used for secondary prevention (after a cardiac event) but *not* routinely for primary prevention due to bleeding risk.

💊 **Antihypertensives** (e.g., calcium channel blockers, diuretics)
→ Various agents to control blood pressure.

**Next step:** A cardiologist will decide which, if any, medications are appropriate based on a comprehensive examination — not just these 13 parameters.${CONSULT}`

    // ── Model / dataset ───────────────────────────────────────────────────

    case 'about_model':
      return `**How the HeartGuard AI Model Works**

**Model type:** Deep Neural Network (DNN)
**Framework:** TensorFlow / Keras
**Task:** Binary classification — Heart Disease vs. No Disease

**Architecture:**
\`\`\`
Input (13 features)
  ↓
Dense(128) → Batch Normalisation → ReLU → Dropout(30%)
  ↓
Dense(64)  → Batch Normalisation → ReLU → Dropout(30%)
  ↓
Dense(32)  → Batch Normalisation → ReLU → Dropout(20%)
  ↓
Dense(1)   → Sigmoid → Probability [0, 1]
\`\`\`

**Key concepts:**
• **Forward propagation** — Your 13 values flow through each layer, and the model multiplies them by learned weights at each node.
• **ReLU activation** — Introduces non-linearity so the model can capture complex patterns.
• **Dropout** — Randomly disables neurons during training to prevent overfitting.
• **Sigmoid output** — Converts the final number to a probability between 0 and 1.
• **Backpropagation** — During training, the model adjusted its ~12,000 weights by computing gradients of the loss function using the chain rule.

**Performance on test data:**
• Accuracy: ~82% | Precision: ~84% | Recall: ~76% | F1: ~80% | ROC-AUC: ~0.91

**Limitation:** Trained on only 303 samples from 1988 Cleveland data. Results are educational, not clinical.`

    case 'about_dataset':
      return `**Dataset Information — UCI Heart Disease (Cleveland)**

**Source:** UCI Machine Learning Repository (Heart Disease dataset, 1988)
**Patients:** 303 total (Cleveland Clinic Foundation)
**Features:** 13 clinical and demographic features + 1 binary target

**Dataset split:**
• Training: 70% (~207 samples)
• Validation: 15% (~45 samples)
• Test: 15% (~45 samples)

**Class distribution:**
• No heart disease: ~54%
• Heart disease present: ~46%

**Preprocessing applied:**
• Missing values imputed (median for numerical, mode for categorical)
• StandardScaler fitted on training data only
• Binary target: 0 = No Disease, 1 = Disease (original 0–4 scale binarised)

**Limitations to be aware of:**
• Small dataset (303 samples) — limited generalisability
• From 1988 — clinical definitions and population may differ from today
• Only Cleveland subset used (UCI dataset has 4 clinical sites)
• No information on family history, physical activity, BMI, or medications

*This is an academic project demonstrating DNN concepts — not a clinical tool.*`

    case 'doctor':
      return `**When to See a Doctor**

Given your **${riskWord}** risk prediction, here is guidance on seeking medical advice:

${riskLevel === 'High'
  ? `**🔴 Your risk is HIGH — you should schedule a cardiology appointment soon.**\n\nDo not wait for symptoms. Many serious cardiac events occur without prior warning. A cardiologist can:\n• Perform a proper clinical examination\n• Order advanced imaging (echocardiogram, coronary CT, stress test)\n• Review your medications and optimise treatment\n• Provide personalised prevention strategies`
  : riskLevel === 'Moderate'
  ? `**🟡 Your risk is MODERATE — a check-up with your GP or a cardiologist is advisable.**\n\nThis level of risk benefits significantly from:\n• Professional assessment of your individual risk factors\n• Lifestyle counselling\n• Blood tests (full lipid panel, HbA1c, kidney function)\n• Discussion of whether preventive medications are appropriate`
  : `**✅ Your risk is LOW — continue regular health check-ups.**\n\nEven with low risk:\n• Annual GP visits are recommended, especially after age 40\n• Regular BP, cholesterol, and blood sugar checks\n• Discuss family history with your doctor`
}

**Go to A&E/Emergency immediately if you experience:**
• Chest pain, pressure, or tightness lasting more than 15 minutes
• Sudden shortness of breath at rest
• Pain radiating to the left arm, jaw, or back
• Sudden dizziness, fainting, or cold sweats
• Irregular heartbeat with associated symptoms

${DISCLAIMER_SHORT}`

    case 'thanks':
      return `You're welcome! 😊 I'm glad I could help.

Remember — this is educational information to help you understand your result and heart health. Your next important step is discussing these findings with a qualified healthcare professional.

Is there anything else you'd like to know about your heart health?`

    default:
      return `I'm not sure I understood that specific question, but I can help with:

• **Your result** — "Why is my risk ${riskLevel.toLowerCase()}?" or "Explain my probability score"
• **Clinical values** — "Explain my blood pressure", "What does my cholesterol mean?"
• **Lifestyle** — "How can I reduce my risk?", "What diet should I follow?"
• **Exercise & stress** — "What exercise is safe?", "How does stress affect the heart?"
• **The model** — "How does the AI work?"
• **Next steps** — "When should I see a doctor?"

Try one of the suggested questions below, or ask in your own words!`
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function getSuggestedQuestions(ctx, messageCount) {
  // First message chips — tailored by risk level
  if (messageCount === 0) {
    if (ctx.riskLevel === 'High') return [
      `Why is my risk high?`,
      `How can I reduce my risk?`,
      `What does ${ctx.probability}% mean?`,
      `What diet should I follow?`,
    ]
    if (ctx.riskLevel === 'Moderate') return [
      `Why is my risk moderate?`,
      `How can I improve my heart health?`,
      `Explain my blood pressure`,
      `What exercise is recommended?`,
    ]
    return [
      `What does my low risk mean?`,
      `How can I maintain heart health?`,
      `Explain my result`,
      `What diet is heart-healthy?`,
    ]
  }

  // Rotating chips after first message
  const pools = [
    [`How can I reduce my risk?`, `What diet should I follow?`, `Explain my cholesterol`],
    [`What exercises are safe?`, `How does stress affect the heart?`, `Explain my heart rate`],
    [`When should I see a doctor?`, `How does the AI model work?`, `What is ST depression?`],
    [`How does smoking affect my heart?`, `What is thalassemia?`, `Explain the blood vessels`],
    [`What is a healthy blood pressure?`, `How does weight affect heart risk?`, `What medications exist?`],
  ]
  return pools[messageCount % pools.length]
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

function renderMessage(text) {
  return text.split('\n').map((line, i) => {
    // Convert **text** → <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>
      }
      // Convert *text* → <em>
      const italics = part.split(/(\*[^*]+\*)/g).map((p, k) => {
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) {
          return <em key={k} className="text-slate-500 not-italic text-xs">{p.slice(1, -1)}</em>
        }
        return p
      })
      return italics
    })
    return (
      <span key={i} className="block leading-relaxed">
        {parts}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    )
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

export default function HealthChatbot({ result, patientData }) {
  const ctx = buildContext(result, patientData)

  // ── State ──────────────────────────────────────────────────────────────────
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [typing,   setTyping]   = useState(false)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const msgCount   = messages.filter(m => m.role === 'user').length

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // ── Focus input when chat opens ────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      // Greet on first open
      if (messages.length === 0) {
        const greeting = buildResponse('greeting', ctx)
        setMessages([{ role: 'assistant', text: greeting, id: Date.now() }])
      }
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Append user message
    const userMsg = { role: 'user', text: trimmed, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    // Simulate a natural typing delay (400–900 ms based on response length)
    const intent   = detectIntent(trimmed, ctx)
    const response = buildResponse(intent, ctx)
    const delay    = Math.min(900, Math.max(400, response.length * 0.6))

    await new Promise(r => setTimeout(r, delay))

    setTyping(false)
    setMessages(prev => [
      ...prev,
      { role: 'assistant', text: response, id: Date.now() + 1 },
    ])
  }, [ctx])

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ── Chip click ────────────────────────────────────────────────────────────
  function handleChip(question) {
    sendMessage(question)
  }

  // ── Risk-level colour for the chat header ─────────────────────────────────
  const headerColor = ctx.riskLevel === 'High'
    ? 'from-red-600 to-red-500'
    : ctx.riskLevel === 'Moderate'
    ? 'from-amber-500 to-amber-400'
    : 'from-emerald-600 to-emerald-500'

  const chips = getSuggestedQuestions(ctx, msgCount)

  // ─────────────────────────────────────────────────────────────────────────

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="mt-2">
      {/* ── Toggle button — shown when chat is closed ── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`w-full flex items-center justify-between gap-3 px-5 py-4
                      rounded-2xl border-2 border-dashed border-slate-200
                      bg-white hover:bg-slate-50 hover:border-slate-300
                      transition-all duration-200 group`}
          aria-label="Open Heart Health AI Assistant"
        >
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${headerColor}
                              flex items-center justify-center text-white text-lg
                              shadow-sm flex-shrink-0`}>
              💬
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                Heart Health AI Assistant
              </p>
              <p className="text-xs text-slate-400">
                Ask about your result, risk factors, diet, exercise &amp; more
              </p>
            </div>
          </div>
          <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* ── Chat panel ── */}
      {open && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg
                        overflow-hidden flex flex-col"
             style={{ maxHeight: '680px' }}>

          
          <div className={`bg-gradient-to-r ${headerColor} px-5 py-4
                           flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 bg-white/20 rounded-xl flex items-center
                               justify-center text-lg flex-shrink-0">🤖</span>
              <div>
                <p className="text-sm font-bold text-white leading-tight">
                  Heart Health AI Assistant
                </p>
                <p className="text-xs text-white/75 leading-tight mt-0.5">
                  Context-aware  ·  {ctx.riskLevel} Risk  ·  {ctx.probability}%
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg
                         hover:bg-white/10"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          
          <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-start gap-2">
            <span className="text-amber-500 text-xs mt-0.5 flex-shrink-0">⚕️</span>
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">Educational use only.</span> This assistant provides
              general health information — not medical advice, diagnosis, or prescriptions.
              Always consult a qualified doctor for personal medical decisions.
            </p>
          </div>

          
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
               style={{ minHeight: '280px', maxHeight: '380px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                                 text-xs font-bold flex-shrink-0 mt-0.5
                                 ${msg.role === 'assistant'
                                   ? `bg-gradient-to-br ${headerColor} text-white`
                                   : 'bg-slate-200 text-slate-600'}`}>
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed
                                 ${msg.role === 'user'
                                   ? 'bg-slate-800 text-white rounded-tr-sm'
                                   : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-sm'}`}>
                  {msg.role === 'assistant'
                    ? renderMessage(msg.text)
                    : msg.text
                  }
                </div>
              </div>
            ))}

            
            {typing && (
              <div className="flex gap-2.5">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${headerColor}
                                 flex items-center justify-center text-xs flex-shrink-0 mt-0.5`}>
                  🤖
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm
                                px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          
          {!typing && (
            <div className="px-4 py-2 border-t border-slate-100 flex flex-wrap gap-2">
              {chips.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleChip(chip)}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200
                             text-slate-600 hover:text-slate-800 rounded-full
                             transition-colors duration-150 whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50
                          flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your result, diet, exercise, risk factors…"
              rows={1}
              disabled={typing}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-3 py-2.5
                         text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-400
                         focus:border-transparent transition placeholder-slate-400
                         disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
              aria-label="Type your health question"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className={`w-10 h-10 rounded-xl flex items-center justify-center
                          flex-shrink-0 transition-all duration-200
                          ${input.trim() && !typing
                            ? `bg-gradient-to-br ${headerColor} text-white shadow-sm hover:shadow-md hover:scale-105`
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              aria-label="Send message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
