export const conditionImageAssets = {
  mentalHealth: '/image/ptsd-mental-health.png',
  backJointPain: '/image/back-joint-pain.png',
  neckPain: '/image/neck-pain.png',
  kneePain: '/image/knee-pain.png',
  shoulderArthritis: '/image/shoulder-arthritis.png',
  arthritis: '/image/arthritis.png',
  footAnkleConditions: '/image/foot-ankle-conditions.png',
  hipConditions: '/image/hip-conditions.png',
  elbowConditions: '/image/elbow-conditions.png',
  tmjJawPain: '/image/tmj-jaw-pain.png',
  nerveRadiculopathy: '/image/nerve-radiculopathy.png',
  migraineHeadache: '/image/migraine-headache.png',
  ibsBowelSymptoms: '/image/ibs-bowel-symptoms.png',
  gerdAcidReflux: '/image/gerd-acid-reflux.png',
  sleepIssues: '/image/sleep-issues.png',
  urinaryFrequency: '/image/urinary-frequency.png',
  asthma: '/image/asthma.png',
  sleepApnea: '/image/sleep-apnea.png',
  sinusitis: '/image/sinusitis.png',
  rhinitis: '/image/rhinitis.png',
  tinnitus: '/image/tinnitus.png',
  eczema: '/image/eczema.png',
  psoriasis: '/image/psoriasis.png',
  dermatitis: '/image/dermatitis.png',
  chronicPain: '/image/chronic-pain.png',
  fibromyalgia: '/image/fibromyalgia.png',
  chronicFatigue: '/image/chronic-fatigue.png',
  chronicFatigueCloseup: '/image/chronic-fatigue-closeup.png',
  chronicFatigueAlternate: '/image/chronic-fatigue-alternate.png',
  /** Dedicated art for user-added custom conditions (not category fallbacks). */
  customCondition: '/image/custom-condition.png'
} as const

const categoryImageMap: Record<string, string> = {
  'Mental Health': conditionImageAssets.mentalHealth,
  Neurological: conditionImageAssets.migraineHeadache,
  Sleep: conditionImageAssets.sleepIssues,
  'Back, Neck, and Joint': conditionImageAssets.backJointPain,
  Nerve: conditionImageAssets.nerveRadiculopathy,
  Digestive: conditionImageAssets.ibsBowelSymptoms,
  Urinary: conditionImageAssets.urinaryFrequency,
  Respiratory: conditionImageAssets.asthma,
  Hearing: conditionImageAssets.tinnitus,
  Skin: conditionImageAssets.eczema,
  'Chronic Pain / Fatigue': conditionImageAssets.chronicPain,
  Custom: conditionImageAssets.customCondition
}

/** Best fallback for custom conditions that do not match a category yet */
const defaultConditionImage = conditionImageAssets.mentalHealth

const conditionTitleImageOverrides: Record<string, string> = {
  Asthma: conditionImageAssets.asthma,
  'Neck pain': conditionImageAssets.neckPain,
  'Knee conditions': conditionImageAssets.kneePain,
  'Shoulder conditions': conditionImageAssets.shoulderArthritis,
  'Joint Pain & Arthritis': conditionImageAssets.arthritis,
  'Hip conditions': conditionImageAssets.hipConditions,
  'Foot & Ankle conditions': conditionImageAssets.footAnkleConditions,
  'Elbow conditions': conditionImageAssets.elbowConditions,
  'Wrist conditions': conditionImageAssets.arthritis,
  'Hand & finger conditions': conditionImageAssets.arthritis,
  'TMJ / Jaw pain': conditionImageAssets.tmjJawPain,
  'IBS / Bowel Symptoms': conditionImageAssets.ibsBowelSymptoms,
  'GERD / Acid Reflux': conditionImageAssets.gerdAcidReflux,
  'Sleep apnea': conditionImageAssets.sleepApnea,
  Sinusitis: conditionImageAssets.sinusitis,
  Rhinitis: conditionImageAssets.rhinitis,
  Eczema: conditionImageAssets.eczema,
  Psoriasis: conditionImageAssets.psoriasis,
  Dermatitis: conditionImageAssets.dermatitis,
  Fibromyalgia: conditionImageAssets.fibromyalgia,
  'Chronic fatigue': conditionImageAssets.chronicFatigue,
  'Urinary frequency': conditionImageAssets.urinaryFrequency
}

export const carouselConditions = [
  {
    title: 'PTSD / Mental Health',
    image: conditionImageAssets.mentalHealth
  },
  {
    title: 'Back or Joint Pain',
    image: conditionImageAssets.backJointPain
  },
  {
    title: 'Nerve / Radiculopathy',
    image: conditionImageAssets.nerveRadiculopathy
  },
  {
    title: 'Migraine / Headache',
    image: conditionImageAssets.migraineHeadache
  },
  {
    title: 'IBS / Bowel Symptoms',
    image: conditionImageAssets.ibsBowelSymptoms
  },
  {
    title: 'Sleep Issues',
    image: conditionImageAssets.sleepIssues
  }
] as const

export function getConditionImage(title: string, category: string) {
  return conditionTitleImageOverrides[title]
    ?? categoryImageMap[category]
    ?? defaultConditionImage
}

export function hasDedicatedCategoryImage(category: string) {
  return Boolean(categoryImageMap[category])
}

export const conditionsWithoutDedicatedImages = [] as const

export const conditionImageCatalog = [
  { file: 'ptsd-mental-health.png', usedFor: ['Mental Health', 'PTSD', 'Anxiety', 'Depression', 'Panic attacks'] },
  { file: 'back-joint-pain.png', usedFor: ['Back, Neck, and Joint fallback', 'Lower back pain'] },
  { file: 'neck-pain.png', usedFor: ['Neck pain'] },
  { file: 'knee-pain.png', usedFor: ['Knee conditions'] },
  { file: 'shoulder-arthritis.png', usedFor: ['Shoulder conditions'] },
  { file: 'foot-ankle-conditions.png', usedFor: ['Foot & Ankle conditions'] },
  { file: 'hip-conditions.png', usedFor: ['Hip conditions'] },
  { file: 'elbow-conditions.png', usedFor: ['Elbow conditions'] },
  { file: 'tmj-jaw-pain.png', usedFor: ['TMJ / Jaw pain'] },
  { file: 'arthritis.png', usedFor: ['Joint Pain & Arthritis', 'Arthritis'] },
  { file: 'nerve-radiculopathy.png', usedFor: ['Nerve', 'Radiculopathy', 'Sciatica', 'Peripheral neuropathy'] },
  { file: 'migraine-headache.png', usedFor: ['Neurological', 'Migraine', 'Tension headaches', 'Vertigo / Dizziness', 'Seizures'] },
  { file: 'ibs-bowel-symptoms.png', usedFor: ['Digestive fallback', 'IBS / Bowel Symptoms'] },
  { file: 'gerd-acid-reflux.png', usedFor: ['GERD / Acid Reflux', 'GERD', 'Acid reflux', 'Heartburn'] },
  { file: 'sleep-issues.png', usedFor: ['Sleep', 'Insomnia / Sleep disturbances'] },
  { file: 'asthma.png', usedFor: ['Asthma', 'Respiratory fallback'] },
  { file: 'sleep-apnea.png', usedFor: ['Sleep apnea'] },
  { file: 'sinusitis.png', usedFor: ['Sinusitis'] },
  { file: 'rhinitis.png', usedFor: ['Rhinitis'] },
  { file: 'tinnitus.png', usedFor: ['Hearing fallback', 'Tinnitus', 'Hearing loss'] },
  { file: 'eczema.png', usedFor: ['Eczema', 'Skin fallback'] },
  { file: 'psoriasis.png', usedFor: ['Psoriasis'] },
  { file: 'dermatitis.png', usedFor: ['Dermatitis'] },
  { file: 'chronic-pain.png', usedFor: ['Chronic Pain / Fatigue fallback'] },
  { file: 'fibromyalgia.png', usedFor: ['Fibromyalgia'] },
  { file: 'chronic-fatigue.png', usedFor: ['Chronic fatigue'] },
  { file: 'chronic-fatigue-closeup.png', usedFor: ['Available chronic fatigue close-up variant, not currently assigned'] },
  { file: 'chronic-fatigue-alternate.png', usedFor: ['Available chronic fatigue alternate illustration, not currently assigned'] }
] as const
