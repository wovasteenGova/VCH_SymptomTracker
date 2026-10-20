import type { EntryTemplateKey } from './vaConditionFields'

export type EntryFieldPreset = {
  label: string
  value: string
  fromLastEntry?: boolean
}

const ENTRY_FIELD_KEY_ALIASES: Record<string, string> = {
  'Possible Factors (optional)': 'medication_or_food_trigger'
}

export function entryFieldLabelToKey(label: string) {
  if (ENTRY_FIELD_KEY_ALIASES[label]) {
    return ENTRY_FIELD_KEY_ALIASES[label]
  }

  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

export function isAppendPresetField(fieldLabel: string) {
  return fieldLabel === 'Medications for this entry'
}

export const durationPresets: EntryFieldPreset[] = [
  { label: '15 min', value: '15 minutes' },
  { label: '30 min', value: '30 minutes' },
  { label: '1 hour', value: '1 hour' },
  { label: '2 hours', value: '2 hours' },
  { label: '4 hours', value: '4 hours' },
  { label: 'All day', value: 'All day' }
]

export const stopActivityPresets: EntryFieldPreset[] = [
  { label: 'Annoying', value: 'Annoying' },
  { label: 'Irritating', value: 'Irritating' },
  { label: 'Disruptive', value: 'Disruptive' },
  { label: 'No impact', value: 'No major impact on activity or sleep' },
  { label: 'Slowed down', value: 'Slowed down but continued' },
  { label: 'Had to rest', value: 'Yes - had to rest or lie down' },
  { label: 'Stopped work', value: 'Yes - left work or stopped activity' },
  { label: 'Lost sleep', value: 'Yes - lost sleep or hard to rest' },
  { label: 'Cancelled plans', value: 'Yes - cancelled plans or errands' }
]

export const symptomsManagedPresets: EntryFieldPreset[] = [
  { label: 'Yes', value: 'Yes - symptoms improved' },
  { label: 'Partial', value: 'Partial relief' },
  { label: 'No', value: 'No relief' },
  { label: 'Not applicable', value: 'Not applicable / no meds taken' }
]

export const genericMedicationPresets: EntryFieldPreset[] = [
  { label: 'PPI/antacid', value: 'Omeprazole 40mg' },
  { label: 'Rescue inhaler', value: 'Albuterol inhaler PRN' },
  { label: 'Pain med', value: 'Ibuprofen 800mg' },
  { label: 'Sleep aid', value: 'Trazodone 50mg at bedtime' }
]

export const medicationPresetsByTemplate: Record<EntryTemplateKey, EntryFieldPreset[]> = {
  '__generic__': genericMedicationPresets,
  'PTSD / Mental Health': [
    { label: 'SSRI', value: 'Sertraline 100mg daily' },
    { label: 'Sleep aid', value: 'Trazodone 50mg at bedtime' },
    { label: 'Prazosin', value: 'Prazosin 1mg at bedtime' },
    { label: 'Anxiety PRN', value: 'Lorazepam 0.5mg PRN' },
    { label: 'Mood stabilizer', value: 'Lamotrigine 100mg daily' }
  ],
  'Back or Joint Pain': [
    { label: 'NSAID', value: 'Ibuprofen 800mg' },
    { label: 'Acetaminophen', value: 'Acetaminophen 1000mg' },
    { label: 'Muscle relaxer', value: 'Cyclobenzaprine 10mg' },
    { label: 'Topical', value: 'Diclofenac gel' },
    { label: 'Gabapentin', value: 'Gabapentin 300mg' }
  ],
  'Nerve / Radiculopathy': [
    { label: 'Gabapentin', value: 'Gabapentin 300mg TID' },
    { label: 'Pregabalin', value: 'Pregabalin 75mg BID' },
    { label: 'NSAID', value: 'Ibuprofen 800mg' },
    { label: 'Muscle relaxer', value: 'Cyclobenzaprine 10mg' },
    { label: 'Topical', value: 'Lidocaine patch' }
  ],
  'Migraine / Headache': [
    { label: 'Triptan', value: 'Sumatriptan 100mg PRN' },
    { label: 'NSAID', value: 'Ibuprofen 800mg' },
    { label: 'Preventive', value: 'Topiramate 50mg daily' },
    { label: 'Anti-nausea', value: 'Ondansetron 4mg PRN' },
    { label: 'Caffeine combo', value: 'Excedrin Migraine PRN' }
  ],
  'IBS / Bowel Symptoms': [
    { label: 'PPI', value: 'Omeprazole 40mg daily' },
    { label: 'H2 blocker', value: 'Famotidine 20mg BID' },
    { label: 'Antacid', value: 'Calcium carbonate antacid PRN' },
    { label: 'Anti-diarrheal', value: 'Loperamide 2mg PRN' },
    { label: 'Laxative', value: 'Polyethylene glycol daily' }
  ],
  'Sleep Issues': [
    { label: 'CPAP nightly', value: 'CPAP nightly' },
    { label: 'Skipped CPAP', value: 'Skipped CPAP/BiPAP' },
    { label: 'BiPAP', value: 'BiPAP nightly' },
    { label: 'Sleep aid', value: 'Trazodone 50mg at bedtime' },
    { label: 'Melatonin', value: 'Melatonin 3mg at bedtime' }
  ],
  'Urinary frequency': [
    { label: 'Oxybutynin', value: 'Oxybutynin 5mg BID' },
    { label: 'Myrbetriq', value: 'Mirabegron 25mg daily' },
    { label: 'Tamsulosin', value: 'Tamsulosin 0.4mg at bedtime' },
    { label: 'Finasteride', value: 'Finasteride 5mg daily' },
    { label: 'Desmopressin', value: 'Desmopressin 0.2mg at bedtime' },
    { label: 'No med taken', value: 'No medication taken' }
  ],
  Respiratory: [
    { label: 'Rescue inhaler', value: 'Albuterol inhaler PRN' },
    { label: 'Daily inhaler', value: 'Fluticasone/salmeterol daily' },
    { label: 'Nebulizer', value: 'Albuterol nebulizer PRN' },
    { label: 'Steroids', value: 'Prednisone taper' },
    { label: 'CPAP/BiPAP', value: 'CPAP nightly' }
  ],
  'Skin Conditions': [
    { label: 'Topical steroid', value: 'Triamcinolone cream BID' },
    { label: 'Antihistamine', value: 'Cetirizine 10mg daily' },
    { label: 'Moisturizer', value: 'Fragrance-free moisturizer BID' },
    { label: 'Hydrocortisone', value: 'Hydrocortisone 1% cream PRN' },
    { label: 'Immunosuppressant', value: 'Tacrolimus ointment BID' }
  ],
  Hearing: [
    { label: 'No med taken', value: 'No medication taken' },
    { label: 'Sleep aid', value: 'Trazodone 50mg at bedtime' },
    { label: 'Anxiety PRN', value: 'Lorazepam 0.5mg PRN' },
    { label: 'Anti-inflammatory', value: 'Ibuprofen 800mg PRN' }
  ],
  'Chronic Pain / Fatigue': [
    { label: 'NSAID', value: 'Ibuprofen 800mg' },
    { label: 'Acetaminophen', value: 'Acetaminophen 1000mg' },
    { label: 'Gabapentin', value: 'Gabapentin 300mg TID' },
    { label: 'Muscle relaxer', value: 'Cyclobenzaprine 10mg' },
    { label: 'Sleep aid', value: 'Trazodone 50mg at bedtime' }
  ]
}

export const sleepLimitPresets: EntryFieldPreset[] = [
  { label: 'Slept OK', value: 'Sleep was mostly OK' },
  { label: 'Wake-ups', value: 'Woke up several times' },
  { label: 'Hard to fall asleep', value: 'Hard to fall asleep' },
  { label: 'Barely slept', value: 'Barely slept' },
  { label: 'No useful rest', value: 'No useful rest' }
]

export const episodeTypePresets: EntryFieldPreset[] = [
  { label: 'Panic', value: 'Panic' },
  { label: 'Nightmare', value: 'Nightmare' },
  { label: 'Flashback', value: 'Flashback' },
  { label: 'Isolation', value: 'Isolation' },
  { label: 'Irritability', value: 'Irritability' },
  { label: 'Suicidal thoughts', value: 'Suicidal thoughts' }
]

export const mentalHealthSymptomPresets: EntryFieldPreset[] = [
  { label: 'Nightmares', value: 'Nightmares' },
  { label: 'Flashbacks', value: 'Flashbacks' },
  { label: 'Hypervigilance', value: 'Hypervigilance' },
  { label: 'Avoidance', value: 'Avoidance' },
  { label: 'Panic', value: 'Panic' },
  { label: 'Depression', value: 'Depression' },
  { label: 'Anxiety', value: 'Anxiety' },
  { label: 'Irritability', value: 'Irritability' },
  { label: 'Isolation', value: 'Isolation' },
  { label: 'Poor sleep', value: 'Poor sleep' },
  { label: 'Suicidal thoughts', value: 'Suicidal thoughts' }
]

export const backJointSymptomPresets: EntryFieldPreset[] = [
  { label: 'Stiffness', value: 'Stiffness' },
  { label: 'Swelling', value: 'Swelling' },
  { label: 'Sharp pain', value: 'Sharp pain' },
  { label: 'Limited ROM', value: 'Limited range of motion' },
  { label: 'Instability', value: 'Joint instability' },
  { label: 'Radiating pain', value: 'Radiating pain' },
  { label: 'Flare-up', value: 'Flare-up' }
]

export const movementLimitPresets: EntryFieldPreset[] = [
  { label: 'Sitting', value: 'Limited sitting' },
  { label: 'Standing', value: 'Limited standing' },
  { label: 'Walking', value: 'Limited walking' },
  { label: 'Lifting', value: 'Limited lifting' },
  { label: 'Bending', value: 'Limited bending' },
  { label: 'Stairs', value: 'Limited stairs' },
  { label: 'Driving', value: 'Limited driving' }
]

export const flareUpTriggerPresets: EntryFieldPreset[] = [
  { label: 'Driving', value: 'Driving' },
  { label: 'Stairs', value: 'Stairs' },
  { label: 'Lifting', value: 'Lifting groceries or objects' },
  { label: 'Weather', value: 'Weather change' },
  { label: 'Overdoing it', value: 'Overdoing it' },
  { label: 'Prolonged sitting', value: 'Prolonged sitting' },
  { label: 'Standing', value: 'Prolonged standing' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const sideAffectedPresets: EntryFieldPreset[] = [
  { label: 'Left', value: 'Left side' },
  { label: 'Right', value: 'Right side' },
  { label: 'Both', value: 'Both sides' },
  { label: 'Left arm', value: 'Left arm' },
  { label: 'Right arm', value: 'Right arm' },
  { label: 'Left leg', value: 'Left leg' },
  { label: 'Right leg', value: 'Right leg' },
  { label: 'Foot', value: 'Foot' }
]

export const nerveSymptomPresets: EntryFieldPreset[] = [
  { label: 'Numbness', value: 'Numbness' },
  { label: 'Tingling', value: 'Tingling' },
  { label: 'Burning', value: 'Burning pain' },
  { label: 'Weakness', value: 'Weakness' },
  { label: 'Falls', value: 'Near fall or fall' },
  { label: 'Radiating pain', value: 'Radiating pain' }
]

export const migraineSymptomPresets: EntryFieldPreset[] = [
  { label: 'Prostrating', value: 'Prostrating attack' },
  { label: 'Light sensitivity', value: 'Light sensitivity' },
  { label: 'Sound sensitivity', value: 'Sound sensitivity' },
  { label: 'Nausea', value: 'Nausea or vomiting' },
  { label: 'Aura', value: 'Aura' },
  { label: 'Vertigo', value: 'Vertigo or dizziness' },
  { label: 'One-sided', value: 'One-sided headache' }
]

export const digestiveSymptomPresets: EntryFieldPreset[] = [
  { label: 'Heartburn', value: 'Heartburn' },
  { label: 'Regurgitation', value: 'Regurgitation' },
  { label: 'Abdominal pain', value: 'Abdominal pain' },
  { label: 'Urgency', value: 'Bowel urgency' },
  { label: 'Trouble swallowing', value: 'Trouble swallowing' },
  { label: 'Pain swallowing', value: 'Pain when swallowing' },
  { label: 'Vomiting', value: 'Vomiting' },
  { label: 'Nausea', value: 'Nausea' },
  { label: 'Diarrhea', value: 'Diarrhea' },
  { label: 'Constipation', value: 'Constipation' }
]

export const digestiveNightSymptomPresets: EntryFieldPreset[] = [
  { label: 'Slept propped up', value: 'Slept propped up' },
  { label: 'Woke up choking', value: 'Woke up choking or aspirating' },
  { label: 'Reflux lying down', value: 'Reflux after lying down' },
  { label: 'Bathroom trips', value: 'Multiple bathroom trips' },
  { label: 'No night issues', value: 'No major night symptoms' }
]

export const digestiveTriggerPresets: EntryFieldPreset[] = [
  { label: 'Late meal', value: 'Late meal or snacking' },
  { label: 'Spicy/acidic food', value: 'Spicy or acidic food' },
  { label: 'Dairy', value: 'Dairy' },
  { label: 'Alcohol', value: 'Alcohol' },
  { label: 'Stress', value: 'Stress' },
  { label: 'Lying down', value: 'Lying down after eating' },
  { label: 'Took antacid/PPI', value: 'Used antacid or PPI' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const hoursSleptPresets: EntryFieldPreset[] = [
  { label: '2 hrs', value: '2' },
  { label: '3 hrs', value: '3' },
  { label: '4 hrs', value: '4' },
  { label: '5 hrs', value: '5' },
  { label: '6 hrs', value: '6' },
  { label: '7+ hrs', value: '7' }
]

export const sleepInterruptionPresets: EntryFieldPreset[] = [
  { label: 'Wake-ups', value: 'Multiple wake-ups' },
  { label: 'Nightmares', value: 'Nightmares' },
  { label: 'Snoring/apnea', value: 'Snoring or stopped breathing' },
  { label: 'CPAP issues', value: 'CPAP mask leak or pressure issues' },
  { label: 'Skipped CPAP', value: 'Skipped CPAP/BiPAP' },
  { label: 'Pain', value: 'Pain interrupted sleep' },
  { label: 'Reflux', value: 'Reflux or choking' },
  { label: 'Panic', value: 'Panic or anxiety' },
  { label: 'Breathing issues', value: 'Breathing issues' }
]

export const sleepDayEffectPresets: EntryFieldPreset[] = [
  { label: 'Heavy fatigue', value: 'Heavy daytime fatigue' },
  { label: 'Needed naps', value: 'Needed naps' },
  { label: 'Trouble focusing', value: 'Trouble focusing' },
  { label: 'Used CPAP', value: 'Used CPAP/BiPAP' },
  { label: 'Skipped CPAP', value: 'Skipped CPAP/BiPAP' },
  { label: 'Morning headache', value: 'Morning headache' },
  { label: 'Missed activity', value: 'Missed work or activity' }
]

export const urinarySymptomPresets: EntryFieldPreset[] = [
  { label: 'Urgency', value: 'Urgency' },
  { label: 'Frequency', value: 'Frequent urination' },
  { label: 'Nocturia', value: 'Nighttime urination' },
  { label: 'Leaks', value: 'Leaks or incontinence' },
  { label: 'Incomplete emptying', value: 'Incomplete emptying' },
  { label: 'Burning', value: 'Burning or pain' },
  { label: 'Hesitancy', value: 'Hesitancy or weak stream' }
]

export const urinaryNightPresets: EntryFieldPreset[] = [
  { label: '1–2 times', value: 'Got up 1–2 times' },
  { label: '3+ times', value: 'Got up 3 or more times' },
  { label: 'Rushed to bathroom', value: 'Rushed to bathroom' },
  { label: 'Leaks in bed', value: 'Leaks or wetting' },
  { label: 'Lost sleep', value: 'Lost sleep from bathroom trips' },
  { label: 'No night issues', value: 'No major night symptoms' }
]

export const urinaryTriggerPresets: EntryFieldPreset[] = [
  { label: 'Caffeine', value: 'Caffeine' },
  { label: 'Fluids before bed', value: 'Fluids before bed' },
  { label: 'Diuretic', value: 'Diuretic medication' },
  { label: 'Alcohol', value: 'Alcohol' },
  { label: 'Travel/outing', value: 'Travel or limited bathroom access' },
  { label: 'Work breaks', value: 'Needed extra work breaks' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const bathroomTripPresets: EntryFieldPreset[] = [
  { label: 'Every hour', value: 'About every hour' },
  { label: 'Every 30 min', value: 'About every 30 minutes' },
  { label: '8+ daytime', value: '8+ daytime trips' },
  { label: '2 night trips', value: '2 nighttime trips' },
  { label: '3+ night trips', value: '3+ nighttime trips' },
  { label: 'Constant urge', value: 'Constant urge all day' }
]

export const respiratorySymptomPresets: EntryFieldPreset[] = [
  { label: 'Short of breath', value: 'Shortness of breath' },
  { label: 'Wheezing', value: 'Wheezing' },
  { label: 'Chest tightness', value: 'Chest tightness' },
  { label: 'Cough', value: 'Cough' },
  { label: 'Congestion', value: 'Congestion' },
  { label: 'Stopped breathing', value: 'Stopped breathing during sleep' },
  { label: 'Snoring', value: 'Snoring' }
]

export const respiratoryTreatmentPresets: EntryFieldPreset[] = [
  { label: 'Rescue inhaler', value: 'Rescue inhaler' },
  { label: 'Nebulizer', value: 'Nebulizer' },
  { label: 'CPAP/BiPAP', value: 'CPAP/BiPAP' },
  { label: 'Skipped CPAP', value: 'Skipped CPAP/BiPAP' },
  { label: 'Steroids', value: 'Steroids' },
  { label: 'None', value: 'No rescue treatment' }
]

export const respiratoryTriggerPresets: EntryFieldPreset[] = [
  { label: 'Exercise', value: 'Exercise' },
  { label: 'Weather', value: 'Weather or humidity' },
  { label: 'Smoke', value: 'Smoke or fumes' },
  { label: 'Sleep', value: 'Poor sleep' },
  { label: 'Stairs', value: 'Stairs or exertion' },
  { label: 'Work', value: 'Work exposure' },
  { label: 'Allergens', value: 'Allergens or pollen' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const hearingSymptomPresets: EntryFieldPreset[] = [
  { label: 'Ringing', value: 'Ringing' },
  { label: 'Buzzing', value: 'Buzzing' },
  { label: 'Hissing', value: 'Hissing' },
  { label: 'Pulsing', value: 'Pulsing' },
  { label: 'Muffled hearing', value: 'Muffled hearing' },
  { label: 'One ear', value: 'One ear' },
  { label: 'Both ears', value: 'Both ears' },
  { label: 'Constant', value: 'Constant' },
  { label: 'Intermittent', value: 'Intermittent' },
  { label: 'Recurrent', value: 'Recurrent episodes' }
]

export const hearingTriggerPresets: EntryFieldPreset[] = [
  { label: 'Loud noise', value: 'Loud noise' },
  { label: 'Quiet room', value: 'Quiet room or silence' },
  { label: 'Stress', value: 'Stress' },
  { label: 'Poor sleep', value: 'Poor sleep' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const hearingImpactPresets: EntryFieldPreset[] = [
  { label: 'Trouble sleeping', value: 'Trouble sleeping' },
  { label: 'Hard to concentrate', value: 'Hard to concentrate' },
  { label: 'Missed conversation', value: 'Missed conversation' },
  { label: 'Needed quiet room', value: 'Needed quiet room' },
  { label: 'TV/radio louder', value: 'Turned TV or radio louder' },
  { label: 'Asked to repeat', value: 'Asked people to repeat themselves' }
]

export const skinSymptomPresets: EntryFieldPreset[] = [
  { label: 'Itching', value: 'Itching' },
  { label: 'Burning', value: 'Burning' },
  { label: 'Flare-up', value: 'Flare-up' },
  { label: 'Open sores', value: 'Open sores or cracking' },
  { label: 'Sleep loss', value: 'Sleep loss from itching' },
  { label: 'Redness', value: 'Redness' }
]

export const skinAreaPresets: EntryFieldPreset[] = [
  { label: 'Hands', value: 'Hands' },
  { label: 'Arms', value: 'Arms' },
  { label: 'Legs', value: 'Legs' },
  { label: 'Scalp', value: 'Scalp' },
  { label: 'Face', value: 'Face' },
  { label: 'Widespread', value: 'Widespread' }
]

export const skinTreatmentPresets: EntryFieldPreset[] = [
  { label: 'Topical cream', value: 'Topical cream' },
  { label: 'Steroid cream', value: 'Steroid cream' },
  { label: 'Antihistamine', value: 'Antihistamine' },
  { label: 'Moisturizer', value: 'Moisturizer' },
  { label: 'Bath/soak', value: 'Bath or soak' },
  { label: 'None', value: 'No treatment used' }
]

export const chronicPainSymptomPresets: EntryFieldPreset[] = [
  { label: 'Widespread pain', value: 'Widespread pain' },
  { label: 'Fatigue', value: 'Fatigue' },
  { label: 'Brain fog', value: 'Brain fog' },
  { label: 'Tender areas', value: 'Tender areas' },
  { label: 'Post-exertion crash', value: 'Post-exertion crash' }
]

export const usefulFunctionPresets: EntryFieldPreset[] = [
  { label: 'Could not work', value: 'Could not work' },
  { label: 'Partial work day', value: 'Partial work day only' },
  { label: 'Could not cook', value: 'Could not cook meals' },
  { label: 'Could not drive', value: 'Could not drive' },
  { label: 'Limited socializing', value: 'Limited socializing' },
  { label: 'Needed help', value: 'Needed help with self-care' }
]

export const chronicPainWorsePresets: EntryFieldPreset[] = [
  { label: 'Poor sleep', value: 'Poor sleep' },
  { label: 'Stress', value: 'Stress' },
  { label: 'Weather', value: 'Weather change' },
  { label: 'Overdoing it', value: 'Overdoing it' },
  { label: 'Standing', value: 'Prolonged standing' },
  { label: 'Unknown', value: 'Unknown trigger' }
]

export const dailyImpactPresets: EntryFieldPreset[] = [
  { label: 'Missed work', value: 'Missed work' },
  { label: 'Left early', value: 'Left work early' },
  { label: 'Called out', value: 'Called out of work' },
  { label: 'Poor sleep', value: 'Poor sleep' },
  { label: 'Cancelled plans', value: 'Cancelled plans' },
  { label: 'Could not drive', value: 'Could not drive' },
  { label: 'Stayed home', value: 'Could not leave home' },
  { label: 'Skipped chores', value: 'Skipped chores or self-care' },
  { label: 'Avoided people', value: 'Avoided people or social plans' },
  { label: 'Hard to focus', value: 'Hard to focus or finish tasks' }
]

const multiSelectPresetFields = new Set([
  'Episode type',
  'Daily impact',
  'Functional impact',
  'Had to stop activity?',
  'Had to stop and rest?',
  'Symptoms noticed',
  'Joint symptoms',
  'Pain and fatigue symptoms',
  'Headache symptoms',
  'Digestive symptoms',
  'Night symptoms',
  'Possible Factors (optional)',
  'Nerve symptoms',
  'Daytime effect',
  'Breathing symptoms',
  'Rescue treatment used',
  'Skin symptoms',
  'Ear symptoms',
  'What triggered it',
  'Hearing impact',
  'Movement limit',
  'Flare-up trigger',
  'Side affected',
  'Sleep interruption',
  'Trigger or limit',
  'Bathroom trips',
  'Urinary symptoms',
  'Night wake-ups',
  'Areas affected',
  'Treatment used',
  'Useful function today',
  'What made it worse'
])

function splitPresetValues(value: string) {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

function splitMedicationTokens(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function splitFieldValueTokens(value: string, fieldLabel: string) {
  if (isAppendPresetField(fieldLabel)) {
    return splitMedicationTokens(value)
  }

  if (isMultiSelectPresetField(fieldLabel)) {
    return splitPresetValues(value)
  }

  const trimmed = value.trim()
  return trimmed ? [trimmed] : []
}

type LastEntryPresetSource = {
  details?: Record<string, unknown> | null
  updated_at?: string | null
  created_at?: string | null
  occurred_at?: string | null
}

function lastEntryTimestamp(entry: LastEntryPresetSource) {
  return new Date(entry.updated_at || entry.created_at || entry.occurred_at || 0).getTime()
}

export function getValuesFromLastEntry(
  entries: LastEntryPresetSource[],
  fieldLabel: string
) {
  const latestEntry = [...entries].sort(
    (left, right) => lastEntryTimestamp(right) - lastEntryTimestamp(left)
  )[0]

  const raw = latestEntry?.details?.[entryFieldLabelToKey(fieldLabel)]
  if (typeof raw !== 'string' || !raw.trim()) {
    return []
  }

  return splitFieldValueTokens(raw, fieldLabel)
}

export function mergeEntryFieldPresets(
  catalogPresets: EntryFieldPreset[],
  lastEntryValues: string[]
) {
  const merged: EntryFieldPreset[] = []
  const seen = new Set<string>()

  const addPreset = (preset: EntryFieldPreset) => {
    const normalized = preset.value.trim().toLowerCase()
    if (seen.has(normalized)) {
      return
    }

    seen.add(normalized)
    merged.push(preset)
  }

  lastEntryValues.forEach((value) => {
    const trimmed = value.trim()
    if (!trimmed) {
      return
    }

    addPreset({
      label: trimmed.length > 32 ? `${trimmed.slice(0, 29)}...` : trimmed,
      value: trimmed,
      fromLastEntry: true
    })
  })

  catalogPresets.forEach((preset) => addPreset(preset))

  return merged
}

export function isMultiSelectPresetField(fieldLabel: string) {
  return multiSelectPresetFields.has(fieldLabel)
}

export function entryPresetIsSelected(
  currentValue: string | undefined,
  presetValue: string,
  fieldLabel?: string
) {
  if (!currentValue?.trim()) {
    return false
  }

  const normalizedPreset = presetValue.trim().toLowerCase()

  if (fieldLabel && isAppendPresetField(fieldLabel)) {
    return splitMedicationTokens(currentValue).some((part) => part.toLowerCase() === normalizedPreset)
  }

  return splitPresetValues(currentValue).some((part) => part.toLowerCase() === normalizedPreset)
}

export function toggleEntryFieldPresetValue(currentValue: string | undefined, presetValue: string) {
  const parts = splitPresetValues(currentValue || '')
  const normalizedPreset = presetValue.trim().toLowerCase()
  const existingIndex = parts.findIndex((part) => part.toLowerCase() === normalizedPreset)

  if (existingIndex >= 0) {
    parts.splice(existingIndex, 1)
  } else {
    parts.push(presetValue.trim())
  }

  return parts.join(', ')
}

function medicationPresetsForTemplate(templateKey: EntryTemplateKey = '__generic__') {
  return medicationPresetsByTemplate[templateKey] || genericMedicationPresets
}

export function getEntryFieldPresets(
  fieldLabel: string,
  templateKey: EntryTemplateKey = '__generic__'
): EntryFieldPreset[] {
  switch (fieldLabel) {
    case 'Duration':
    case 'Episode duration':
      return durationPresets
    case 'Functional impact':
    case 'Had to stop activity?':
    case 'Had to stop and rest?':
      return stopActivityPresets
    case 'Symptoms managed by medication?':
      return symptomsManagedPresets
    case 'Medications for this entry':
      return medicationPresetsForTemplate(templateKey)
    case 'Kept you from sleeping?':
      return sleepLimitPresets
    case 'Episode type':
      return episodeTypePresets
    case 'Daily impact':
      return dailyImpactPresets
    case 'Symptoms noticed':
      return mentalHealthSymptomPresets
    case 'Joint symptoms':
      return backJointSymptomPresets
    case 'Movement limit':
      return movementLimitPresets
    case 'Flare-up trigger':
      return flareUpTriggerPresets
    case 'Side affected':
      return sideAffectedPresets
    case 'Pain and fatigue symptoms':
      return chronicPainSymptomPresets
    case 'Useful function today':
      return usefulFunctionPresets
    case 'What made it worse':
      return chronicPainWorsePresets
    case 'Headache symptoms':
      return migraineSymptomPresets
    case 'Digestive symptoms':
      return digestiveSymptomPresets
    case 'Night symptoms':
      return digestiveNightSymptomPresets
    case 'Possible Factors (optional)':
      return digestiveTriggerPresets
    case 'Nerve symptoms':
      return nerveSymptomPresets
    case 'Hours slept':
      return hoursSleptPresets
    case 'Sleep interruption':
      return sleepInterruptionPresets
    case 'Daytime effect':
      return sleepDayEffectPresets
    case 'Bathroom trips':
      return bathroomTripPresets
    case 'Urinary symptoms':
      return urinarySymptomPresets
    case 'Night wake-ups':
      return urinaryNightPresets
    case 'Breathing symptoms':
      return respiratorySymptomPresets
    case 'Rescue treatment used':
      return respiratoryTreatmentPresets
    case 'Trigger or limit':
      return templateKey === 'Urinary frequency'
        ? urinaryTriggerPresets
        : respiratoryTriggerPresets
    case 'Skin symptoms':
      return skinSymptomPresets
    case 'Areas affected':
      return skinAreaPresets
    case 'Treatment used':
      return skinTreatmentPresets
    case 'Ear symptoms':
      return hearingSymptomPresets
    case 'What triggered it':
      return hearingTriggerPresets
    case 'Hearing impact':
      return hearingImpactPresets
    default:
      return []
  }
}
