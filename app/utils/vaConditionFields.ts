export type EntryFieldDef = {
  label: string
  type: string
  placeholder: string
  stepRole?: 'duration' | 'followUp' | 'medications'
  helper?: string
}

type ConditionEpisodeConfig = {
  duration: Omit<EntryFieldDef, 'stepRole'>
  followUp?: Omit<EntryFieldDef, 'stepRole'>
}

export const defaultEntryFields: EntryFieldDef[] = [
  {
    label: 'Date and time',
    type: 'datetime',
    placeholder: ''
  },
  {
    label: 'How bad was it?',
    type: 'slider',
    placeholder: ''
  },
  {
    label: 'What happened?',
    type: 'textarea',
    placeholder: 'Short note about the symptom, episode, or flare-up.'
  },
  {
    label: 'Daily impact',
    type: 'textarea',
    placeholder: 'Missed work, family activity, sleep, errands, walking, lifting, or other limits.'
  }
]

const durationField: EntryFieldDef = {
  label: 'Duration',
  type: 'text',
  placeholder: 'Example: 30 minutes, 4 hours, all day'
}

const functionalImpactField: EntryFieldDef = {
  label: 'Functional impact',
  type: 'text',
  placeholder: 'Annoying, irritating, disruptive: or had to rest, stop work, cancel plans, or lose sleep?',
  helper: 'Tap one or more chips. VA raters look for work, social, and sleep disruption from this episode.'
}

const episodeDurationField: EntryFieldDef = {
  label: 'Episode duration',
  type: 'text',
  placeholder: 'Example: 20 minutes, 2 hours, most of the day'
}

const episodeTypeField: EntryFieldDef = {
  label: 'Episode type',
  type: 'text',
  placeholder: 'Panic, nightmare, flashback, suicidal thoughts, isolation...'
}

const medicationsForEntryField: EntryFieldDef = {
  label: 'Medications for this entry',
  type: 'textarea',
  stepRole: 'medications',
  placeholder: 'Example: Omeprazole 40mg AM, Sumatriptan 100mg PRN, Ibuprofen 800mg.',
  helper: 'Tap a chip from your last entry or our examples, or type your own.'
}

const symptomsManagedField: EntryFieldDef = {
  label: 'Symptoms managed by medication?',
  type: 'text',
  stepRole: 'medications',
  placeholder: 'Yes, partial relief, no relief, or not applicable.'
}

const conditionEpisodeConfig: Record<string, ConditionEpisodeConfig> = {
  'Migraine / Headache': {
    duration: durationField,
    followUp: functionalImpactField
  },
  'PTSD / Mental Health': {
    duration: episodeDurationField,
    followUp: episodeTypeField
  },
  'Back or Joint Pain': {
    duration: durationField,
    followUp: functionalImpactField
  },
  'Nerve / Radiculopathy': {
    duration: durationField,
    followUp: functionalImpactField
  },
  'IBS / Bowel Symptoms': {
    duration: durationField,
    followUp: functionalImpactField
  },
  'Sleep Issues': {
    duration: durationField,
    followUp: functionalImpactField
  },
  'Urinary frequency': {
    duration: durationField,
    followUp: functionalImpactField
  },
  Respiratory: {
    duration: durationField,
    followUp: functionalImpactField
  },
  'Skin Conditions': {
    duration: durationField,
    followUp: functionalImpactField
  },
  Hearing: {
    duration: durationField,
    followUp: functionalImpactField
  },
  'Chronic Pain / Fatigue': {
    duration: durationField,
    followUp: functionalImpactField
  }
}

function buildEntryFields(conditionTitle: string, extraFields: EntryFieldDef[] = []) {
  const fields: EntryFieldDef[] = [
    defaultEntryFields[0]!,
    defaultEntryFields[1]!
  ]

  const episodeConfig = conditionEpisodeConfig[conditionTitle]
  if (episodeConfig) {
    fields.push({ ...episodeConfig.duration, stepRole: 'duration' })
    if (episodeConfig.followUp) {
      fields.push({ ...episodeConfig.followUp, stepRole: 'followUp' })
    }
  }

  fields.push(
    medicationsForEntryField,
    symptomsManagedField,
    defaultEntryFields[2]!,
    defaultEntryFields[3]!,
    ...extraFields
  )

  return fields
}

export function isEpisodeDurationField(field: { stepRole?: string }) {
  return field.stepRole === 'duration'
}

export function isEpisodeFollowUpField(field: { stepRole?: string }) {
  return field.stepRole === 'followUp'
}

export function isMedicationsStepField(field: { stepRole?: string }) {
  return field.stepRole === 'medications'
}

/** VA-informed extra prompts grouped by condition template */
export const entryFieldsByCondition: Record<string, EntryFieldDef[]> = {
  'PTSD / Mental Health': buildEntryFields('PTSD / Mental Health', [
    {
      label: 'Symptoms noticed',
      type: 'text',
      placeholder: 'Nightmares, flashbacks, hypervigilance, avoidance, panic, irritability, suicidal thoughts...',
      helper: 'Tracks common mental health symptoms raters review over time.'
    },
    {
      label: 'Safety note',
      type: 'textarea',
      placeholder: 'Optional: anything important to remember or discuss with your care team.'
    }
  ]),
  'Back or Joint Pain': buildEntryFields('Back or Joint Pain', [
    {
      label: 'Joint symptoms',
      type: 'text',
      placeholder: 'Stiffness, swelling, limited motion, instability, radiating pain...'
    },
    {
      label: 'Movement limit',
      type: 'text',
      placeholder: 'Sitting, standing, walking, lifting, bending...'
    },
    {
      label: 'Flare-up trigger',
      type: 'text',
      placeholder: 'Driving, stairs, lifting groceries, weather, unknown...'
    }
  ]),
  'Nerve / Radiculopathy': buildEntryFields('Nerve / Radiculopathy', [
    {
      label: 'Side affected',
      type: 'text',
      placeholder: 'Left, right, both, arm, leg, foot...'
    },
    {
      label: 'Nerve symptoms',
      type: 'textarea',
      placeholder: 'Numbness, tingling, burning, weakness, falls, radiating pain.'
    }
  ]),
  'Migraine / Headache': buildEntryFields('Migraine / Headache', [
    {
      label: 'Headache symptoms',
      type: 'text',
      placeholder: 'Prostrating attack, aura, light sensitivity, nausea, vertigo...'
    }
  ]),
  'IBS / Bowel Symptoms': buildEntryFields('IBS / Bowel Symptoms', [
    {
      label: 'Digestive symptoms',
      type: 'text',
      placeholder: 'Abdominal pain, urgency, diarrhea, constipation, reflux, nausea, vomiting...',
      helper: 'Use this one digestive template for bowel and stomach symptoms.'
    },
    {
      label: 'Possible Factors (optional)',
      type: 'text',
      placeholder: 'Meal trigger, dairy, spicy food, antacid/PPI, stress, position, or unknown.',
      helper: 'Food, medication, or other triggers when you know them: common for GERD and digestive logs.'
    },
    {
      label: 'Night symptoms',
      type: 'text',
      placeholder: 'Woke with reflux, slept propped up, bathroom trips, or no night issues.',
      helper: 'Separate from step 3 functional impact: GERD/nocturnal symptoms matter for raters.'
    }
  ]),
  'Sleep Issues': buildEntryFields('Sleep Issues', [
    {
      label: 'Hours slept',
      type: 'number',
      placeholder: 'Example: 4'
    },
    {
      label: 'Sleep interruption',
      type: 'textarea',
      placeholder: 'Nightmares, wake-ups, pain, reflux, panic, breathing issues, fatigue.'
    },
    {
      label: 'Daytime effect',
      type: 'text',
      placeholder: 'Fatigue, naps, trouble focusing, CPAP use, missed activity...'
    }
  ]),
  'Urinary frequency': buildEntryFields('Urinary frequency', [
    {
      label: 'Bathroom trips',
      type: 'text',
      placeholder: 'Example: 10 daytime trips, 3 at night, or every 30–60 minutes.'
    },
    {
      label: 'Urinary symptoms',
      type: 'text',
      placeholder: 'Urgency, frequency, leaks, incomplete emptying, burning, or pain.'
    },
    {
      label: 'Night wake-ups',
      type: 'text',
      placeholder: 'Got up to urinate, rushed to bathroom, leaks, or lost sleep.'
    },
    {
      label: 'Trigger or limit',
      type: 'text',
      placeholder: 'Caffeine, fluids before bed, diuretics, travel, work breaks, or activity limits.'
    }
  ]),
  Respiratory: buildEntryFields('Respiratory', [
    {
      label: 'Breathing symptoms',
      type: 'text',
      placeholder: 'Shortness of breath, wheezing, chest tightness, cough, congestion...'
    },
    {
      label: 'Rescue treatment used',
      type: 'text',
      placeholder: 'Rescue inhaler, nebulizer, CPAP/BiPAP, steroids, or none.'
    },
    {
      label: 'Trigger or limit',
      type: 'text',
      placeholder: 'Exercise, weather, smoke, sleep, stairs, work, or unknown.'
    }
  ]),
  'Skin Conditions': buildEntryFields('Skin Conditions', [
    {
      label: 'Skin symptoms',
      type: 'text',
      placeholder: 'Itching, burning, flare-up, open sores, sleep loss from itching...'
    },
    {
      label: 'Areas affected',
      type: 'text',
      placeholder: 'Hands, arms, legs, scalp, face, widespread...'
    },
    {
      label: 'Treatment used',
      type: 'text',
      placeholder: 'Topical cream, steroids, antihistamine, bath/soak, or none.'
    }
  ]),
  Hearing: buildEntryFields('Hearing', [
    {
      label: 'Ear symptoms',
      type: 'text',
      placeholder: 'Ringing, buzzing, hissing, pulsing, muffled hearing, one or both ears...'
    },
    {
      label: 'What triggered it',
      type: 'text',
      placeholder: 'Loud noise, quiet room, stress, poor sleep, or unknown.'
    },
    {
      label: 'Hearing impact',
      type: 'text',
      placeholder: 'Missed conversation, TV louder, trouble sleeping, hard to concentrate...'
    }
  ]),
  'Chronic Pain / Fatigue': buildEntryFields('Chronic Pain / Fatigue', [
    {
      label: 'Pain and fatigue symptoms',
      type: 'text',
      placeholder: 'Widespread pain, fatigue, brain fog, tender areas, post-exertion crash...'
    },
    {
      label: 'Useful function today',
      type: 'text',
      placeholder: 'Hours you could work, cook, drive, socialize, or care for yourself.'
    },
    {
      label: 'What made it worse',
      type: 'text',
      placeholder: 'Poor sleep, stress, weather, overdoing it, standing, unknown...'
    }
  ])
}

export type EntryTemplateKey = keyof typeof entryFieldsByCondition | '__generic__'

export function resolveEntryTemplateKeyForCondition(condition: { title: string, category: string }): EntryTemplateKey {
  const title = condition.title.toLowerCase()
  const category = condition.category.toLowerCase()

  if (category.includes('mental')) {
    return 'PTSD / Mental Health'
  }

  if (category.includes('back') || category.includes('neck') || category.includes('joint')
    || title.includes('arthritis') || title.includes('knee') || title.includes('shoulder')
    || title.includes('hip') || title.includes('ankle') || title.includes('foot')
    || title.includes('elbow') || title.includes('wrist') || title.includes('hand')
    || title.includes('finger') || title.includes('tmj') || title.includes('jaw')) {
    return 'Back or Joint Pain'
  }

  if (category.includes('nerve') || title.includes('sciatica') || title.includes('neuropathy') || title.includes('radiculopathy')) {
    return 'Nerve / Radiculopathy'
  }

  if (category.includes('neurological') || title.includes('migraine') || title.includes('headache') || title.includes('vertigo') || title.includes('seizure')) {
    return 'Migraine / Headache'
  }

  if (category.includes('digestive') || title.includes('gerd') || title.includes('ibs')
    || title.includes('bowel') || title.includes('diarrhea') || title.includes('constipation')) {
    return 'IBS / Bowel Symptoms'
  }

  if (category.includes('urinary') || title.includes('urin') || title.includes('bladder')
    || title.includes('incontinen') || title.includes('nocturia') || title.includes('overactive bladder')) {
    return 'Urinary frequency'
  }

  if (title.includes('apnea') || category.includes('sleep') || title.includes('insomnia')) {
    return 'Sleep Issues'
  }

  if (category.includes('respiratory') || title.includes('asthma')
    || title.includes('sinus') || title.includes('rhinitis')) {
    return 'Respiratory'
  }

  if (category.includes('hearing') || title.includes('tinnitus') || title.includes('hearing')) {
    return 'Hearing'
  }

  if (category.includes('skin') || title.includes('eczema') || title.includes('psoriasis') || title.includes('dermatitis')) {
    return 'Skin Conditions'
  }

  if (category.includes('chronic pain') || category.includes('fatigue')
    || title.includes('fibromyalgia') || title.includes('fatigue')) {
    return 'Chronic Pain / Fatigue'
  }

  return '__generic__'
}

export function getEntryFieldsForSearchCondition(condition: { title: string, category: string }) {
  const templateKey = resolveEntryTemplateKeyForCondition(condition)

  if (templateKey === '__generic__') {
    return buildDefaultEntryFields()
  }

  return entryFieldsByCondition[templateKey]!
}

export function buildDefaultEntryFields() {
  return buildEntryFields('__generic__', [])
}

export function resolveEntryTemplateKey(label: string) {
  if (label in entryFieldsByCondition) {
    return label
  }

  return null
}
