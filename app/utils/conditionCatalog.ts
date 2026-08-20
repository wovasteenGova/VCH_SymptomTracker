import { conditionImageAssets, getConditionImage } from './conditionImages'
import { conditionKeyFromLabel, formatConditionKeyLabel } from './subscription'

export type HomeVisitTipLink = {
  label: string
  url: string
}

export type ConditionCatalogEntry = {
  title: string
  category: string
  description: string
  searchAliases?: readonly string[]
  vaFocus: readonly string[]
  tip: string
  tipLinks?: readonly HomeVisitTipLink[]
}

export const FILING_WHEN_READY_TIP = {
  title: 'Don\'t wait to file',
  text: 'Don\'t let logging hold you back from filing. If you\'re near a deadline or effective date, submit with what you have now—symptom logs and evidence can be added later.'
} as const

export const VA_MENTAL_HEALTH_COMBINED_TIP =
  'The VA evaluates mental health as one combined rating. Log any mental health symptoms you have, even if you do not think they belong to your diagnosis. Anxiety, depression, panic, nightmares, and sleep issues all count.'

export const VA_MENTAL_HEALTH_SEVERITY_TIP =
  'Severity is about impact, not toughness. Log what happened under episode type or symptoms noticed. Your 0-10 score should reflect how the day actually went: work, sleep, relationships, and safety. You are not picking a diagnosis. You are building an honest timeline.'

export const VA_MENTAL_HEALTH_WORST_DAY_TIP =
  'Worst days often look like this: could not or would not leave the house, being forced out by friends or family, panic most of the day, no sleep, or thoughts of not wanting to be here. Remember those days too—if it happened, log it. Many veterans minimize symptoms that raters still treat as significant.'

export const VA_MENTAL_HEALTH_CRISIS_TIP =
  'In crisis right now? Call 988 and press 1, text 838255, or visit veteranscrisisline.net. This tracker is for your records, not an emergency line. Passive or brief suicidal thoughts are still worth logging when you are safe.'

export const VA_CRISIS_LINE_SHORT =
  'In crisis? Call 988 and press 1, text 838255, or visit veteranscrisisline.net.'

export const HOME_HONESTY_TIP = {
  title: 'Honestly is a virtue',
  text: 'Log what actually happened—not what you think you should report. Honest entries help you see your real patterns and give raters a timeline they can trust. This is your record, not a performance.'
} as const

export const DONT_DOWNPLAY_SYMPTOMS_TIP = {
  title: 'Don\'t downplay it',
  text: 'There are people depending on you not to downplay your symptoms. Log the hard days and the real impact—your family, your care team, and your future self need an honest record.'
} as const

export const LOG_HISTORY_LENGTH_TIP = {
  title: 'How much to log',
  text: 'There is no hard rule, but about three months of steady entries—roughly 30 to 40 logs—gives you a useful pattern for exams and reviews. Consistency beats volume.'
} as const

export type HomeVisitTip = {
  title: string
  text: string
  links?: readonly HomeVisitTipLink[]
}

const mentalHealthFocus = [
  'How often symptoms happen and how severe they are',
  'Work, relationship, and daily-life impact',
  'Nightmares, flashbacks, panic, avoidance, or irritability when they apply'
] as const

const mentalHealthTip = (title: string) => {
  if (title === 'PTSD') {
    return 'Don\'t feel bad about asking loved ones to help document what they see. Family members often notice changes we overlook ourselves, and most want to help you heal, not see you struggle alone.'
  }

  if (title === 'Panic attacks') {
    return 'Log episodes as soon as you can while the physical symptoms are fresh: racing heart, shortness of breath, fear, and how long it took to recover.'
  }

  if (title === 'Mental Health') {
    return VA_MENTAL_HEALTH_COMBINED_TIP
  }

  return 'Write down what happened, how long it lasted, and what you could not do afterward. Patterns over time matter more than one perfect entry.'
}

const neurologicalFocus = [
  'Episode frequency, duration, and severity',
  'Prostrating attacks or needing to stop activity',
  'Nausea, light sensitivity, vertigo, or missed work when they apply'
] as const

const neurologicalTip = (title: string) => {
  if (title === 'Migraine') {
    return 'Try logging symptoms as soon as possible after an episode. Small details like nausea, needing a dark room, or missing work are easy to forget.'
  }

  if (title === 'Seizures') {
    return 'Note what happened before and after the episode, any injury, witnesses, and how long recovery took. Those details are easy to lose if you wait.'
  }

  return 'Capture the episode while it is still fresh—duration, triggers, and whether you had to lie down or miss plans.'
}

const musculoskeletalFocus = [
  'Pain severity and flare frequency',
  'Limits on sitting, standing, walking, bending, or lifting',
  'Missed work, sleep loss, or canceled plans because of pain'
] as const

const musculoskeletalTip =
  'Describe what you could not do—not just how much it hurt. The VA weighs functional loss heavily for joint and back claims.'

const nerveFocus = [
  'Side affected and type of nerve symptoms',
  'Numbness, tingling, burning, weakness, or falls',
  'How symptoms limit sitting, walking, or daily tasks'
] as const

const nerveTip =
  'Be specific about left vs. right and whether symptoms radiate down an arm or leg. That detail helps tie logs to your diagnosis.'

const digestiveFocus = [
  'Bowel urgency, diarrhea, constipation, abdominal pain, or nausea',
  'Food, medication, or bathroom-urgency triggers when you know them',
  'Sleep interruption, missed meals, avoided travel, or interrupted activities'
] as const

const digestiveTip =
  'Bowel and stomach flares are easy to forget once the urgency passes. A quick log after eating, waking up, or needing the bathroom helps a lot.'

const urinaryFocus = [
  'How often you urinate during the day or at night',
  'Urgency, leaks, or trouble making it to the bathroom in time',
  'Sleep interruption, travel limits, work breaks, or activity limits'
] as const

const urinaryTip =
  'Frequent urination is a urinary/bladder issue—not the same as bowel or IBS. Log trips, night wake-ups, urgency, and what you had to stop doing.'

const gerdFocus = [
  'Heartburn, reflux, regurgitation, chest or throat burning, nausea, or trouble swallowing',
  'Food, medication, stress, position, or sleep triggers when you know them',
  'Sleep interruption, missed meals, avoided foods, or activity limits'
] as const

const gerdTip =
  'Reflux symptoms can feel routine until they disrupt sleep, eating, or work. Log timing, triggers, medication used, and what you had to avoid.'

const sleepFocus = [
  'Hours slept and how often you woke up',
  'Nightmares, pain, breathing issues, or panic that broke sleep',
  'Next-day fatigue, focus problems, or missed activity'
] as const

const sleepTip =
  'Log the next morning while you still remember wake-ups, nightmares, and how useless the sleep felt.'

const respiratoryFocus = [
  'Shortness of breath, wheezing, cough, or congestion',
  'Rescue inhaler, CPAP/BiPAP, or other treatment used',
  'Triggers such as exercise, weather, sleep, or stairs'
] as const

const respiratoryTip =
  'Note when you needed rescue treatment and what you had to stop doing. Frequency and functional impact matter.'

const skinFocus = [
  'Itching, burning, open areas, or flare severity',
  'Body areas affected and how much skin is involved',
  'Sleep loss, treatment used, and activity limits'
] as const

const skinTip =
  'Itching that steals sleep is worth mentioning every time. That functional impact is something raters look for.'

const chronicPainFocus = [
  'Pain, fatigue, brain fog, and flare severity',
  'Useful function that day—work, chores, driving, self-care',
  'What worsened symptoms such as sleep, stress, or overdoing it'
] as const

const chronicPainTip =
  'On low-function days, write what you had to skip—not only how bad you felt. That shows real-world impact.'

const hearingFocus = [
  'Which ear or ears and how often symptoms happen',
  'Missed conversations, louder TV, or asking people to repeat themselves',
  'Sleep, concentration, and work impact from ringing or hearing trouble'
] as const

const dutyMosNoiseLinks = [
  {
    label: 'Duty MOS Noise Exposure Listing',
    url: 'https://vesservices.com/Secure/va/training/dutymosnoise.pdf'
  },
  {
    label: 'Fast Letter 10-35',
    url: 'https://www.valor4vet.com/wp-content/uploads/2025/02/Fast-Letter-10-35-Duty-MOS-Noise-Exposure-Levels.pdf'
  }
] as const

const tinnitusTip =
  'Intermittent tinnitus still counts—log every episode, even the ones that come and go. The VA rates tinnitus at a maximum of 10% (Diagnostic Code 6260) and has proposed removing the standalone rating, so a steady log matters even more. When arguing noise exposure, it is best to stay within your Duty MOS: the VA\'s Duty MOS Noise Exposure Listing (Fast Letter 10-35) concedes hazardous noise based on your military job.'

const hearingLossTip =
  'The VA rates hearing loss from audiometric testing, but your log still matters. Write down the real-world impact: missed conversations, turning the TV up, or asking people to repeat themselves. Arguing noise exposure within your Duty MOS—using the VA\'s Duty MOS Noise Exposure Listing (Fast Letter 10-35)—supports service connection.'

export const conditionCatalogDefinitions: ConditionCatalogEntry[] = [
  {
    title: 'Lower back pain',
    category: 'Back, Neck, and Joint',
    description: 'Pain level, flare-ups, limits sitting, standing, walking, and lifting.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Mental Health',
    category: 'Mental Health',
    description: 'All mental health symptoms: anxiety, depression, panic, nightmares, and daily impact in one log.',
    vaFocus: mentalHealthFocus,
    tip: mentalHealthTip('Mental Health')
  },
  {
    title: 'PTSD',
    category: 'Mental Health',
    description: 'Nightmares, flashbacks, panic, isolation, irritability, and missed work.',
    vaFocus: mentalHealthFocus,
    tip: mentalHealthTip('PTSD')
  },
  {
    title: 'Migraine',
    category: 'Neurological',
    description: 'Frequency, duration, severity, triggers, and daily impact.',
    vaFocus: neurologicalFocus,
    tip: neurologicalTip('Migraine')
  },
  {
    title: 'Tension headaches',
    category: 'Neurological',
    description: 'Headache pattern, pain level, work impact, and medication use.',
    vaFocus: neurologicalFocus,
    tip: neurologicalTip('Tension headaches')
  },
  {
    title: 'Anxiety',
    category: 'Mental Health',
    description: 'Triggers, panic symptoms, avoidance, sleep, and social impact.',
    vaFocus: mentalHealthFocus,
    tip: mentalHealthTip('Anxiety')
  },
  {
    title: 'Neck pain',
    category: 'Back, Neck, and Joint',
    description: 'Range of motion, flare-ups, pain level, and activity limits.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Depression',
    category: 'Mental Health',
    description: 'Mood, motivation, hygiene, isolation, sleep, and daily functioning.',
    vaFocus: mentalHealthFocus,
    tip: mentalHealthTip('Depression')
  },
  {
    title: 'Knee conditions',
    category: 'Back, Neck, and Joint',
    description: 'Pain, swelling, instability, walking limits, stairs, and missed activity.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Panic attacks',
    category: 'Mental Health',
    description: 'Immediate episode logs for panic symptoms, duration, and recovery.',
    vaFocus: mentalHealthFocus,
    tip: mentalHealthTip('Panic attacks')
  },
  {
    title: 'Vertigo / Dizziness',
    category: 'Neurological',
    description: 'Dizzy spells, falls, nausea, balance issues, and missed activity.',
    vaFocus: neurologicalFocus,
    tip: neurologicalTip('Vertigo / Dizziness')
  },
  {
    title: 'Seizures',
    category: 'Neurological',
    description: 'Episode timing, recovery, injuries, witnesses, and daily impact.',
    vaFocus: neurologicalFocus,
    tip: neurologicalTip('Seizures')
  },
  {
    title: 'Insomnia / Sleep disturbances',
    category: 'Sleep',
    description: 'Hours slept, wake-ups, nightmares, fatigue, and next-day effects.',
    vaFocus: sleepFocus,
    tip: sleepTip
  },
  {
    title: 'Shoulder conditions',
    category: 'Back, Neck, and Joint',
    description: 'Pain, range of motion, lifting limits, sleep interruption, and flare-ups.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Joint Pain & Arthritis',
    category: 'Back, Neck, and Joint',
    description: 'Joint pain, stiffness, swelling, flare-ups, movement limits, and medication use.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Hip conditions',
    category: 'Back, Neck, and Joint',
    description: 'Hip pain, stiffness, limping, stairs, sitting limits, and flare-ups.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Foot & Ankle conditions',
    category: 'Back, Neck, and Joint',
    description: 'Foot or ankle pain, sprains, instability, heel or arch pain, swelling, and walking limits.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Elbow conditions',
    category: 'Back, Neck, and Joint',
    description: 'Elbow pain, lifting limits, grip impact, numbness, and flare-ups.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Wrist conditions',
    category: 'Back, Neck, and Joint',
    description: 'Wrist pain, weakness, lifting limits, numbness, and typing or tool use impact.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Hand & finger conditions',
    category: 'Back, Neck, and Joint',
    description: 'Hand or finger pain, stiffness, grip weakness, swelling, and daily task limits.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'TMJ / Jaw pain',
    category: 'Back, Neck, and Joint',
    description: 'Jaw pain, chewing limits, clicking, locking, headaches, and facial pain.',
    vaFocus: musculoskeletalFocus,
    tip: musculoskeletalTip
  },
  {
    title: 'Radiculopathy',
    category: 'Nerve',
    description: 'Left/right symptoms, numbness, tingling, burning, weakness, and falls.',
    vaFocus: nerveFocus,
    tip: nerveTip
  },
  {
    title: 'Sciatica',
    category: 'Nerve',
    description: 'Radiating pain, leg weakness, numbness, sitting limits, and flare-ups.',
    vaFocus: nerveFocus,
    tip: nerveTip
  },
  {
    title: 'Peripheral neuropathy',
    category: 'Nerve',
    description: 'Numbness, tingling, burning, weakness, walking issues, and falls.',
    vaFocus: nerveFocus,
    tip: nerveTip
  },
  {
    title: 'IBS / Bowel Symptoms',
    category: 'Digestive',
    description: 'Bowel and stomach symptoms: abdominal pain, urgency, diarrhea, constipation, medication, and triggers.',
    searchAliases: ['IBS', 'bowel symptoms', 'irritable bowel syndrome', 'diarrhea', 'constipation', 'stomach cramps', 'abdominal pain'],
    vaFocus: digestiveFocus,
    tip: digestiveTip
  },
  {
    title: 'Urinary frequency',
    category: 'Urinary',
    description: 'Frequent urination, urgency, night trips, leaks, and daily impact.',
    searchAliases: [
      'frequent peeing',
      'peeing a lot',
      'urination',
      'urinary frequency',
      'overactive bladder',
      'OAB',
      'nocturia',
      'night urination',
      'bladder',
      'urge to pee',
      'incontinence',
      'bathroom trips'
    ],
    vaFocus: urinaryFocus,
    tip: urinaryTip
  },
  {
    title: 'GERD / Acid Reflux',
    category: 'Digestive',
    description: 'Reflux, heartburn, regurgitation, throat burning, swallowing trouble, medication use, and food or sleep triggers.',
    searchAliases: ['GERD', 'acid reflux', 'heartburn', 'reflux', 'regurgitation', 'esophagus', 'esophageal reflux', 'throat burning', 'difficulty swallowing'],
    vaFocus: gerdFocus,
    tip: gerdTip
  },
  {
    title: 'Asthma',
    category: 'Respiratory',
    description: 'Shortness of breath, rescue inhaler use, attacks, and triggers.',
    vaFocus: respiratoryFocus,
    tip: respiratoryTip
  },
  {
    title: 'Sleep apnea',
    category: 'Respiratory',
    description: 'Sleep problems, fatigue, CPAP use, headaches, and daytime impact.',
    vaFocus: [...respiratoryFocus.slice(0, 2), 'Daytime fatigue, headaches, and CPAP or BiPAP compliance'],
    tip: 'If CPAP helps—or you skipped it and felt worse—note that. Compliance and daytime function both matter for sleep apnea claims.'
  },
  {
    title: 'Sinusitis',
    category: 'Respiratory',
    description: 'Congestion, headaches, flare-ups, infections, medication, and missed activity.',
    vaFocus: respiratoryFocus,
    tip: respiratoryTip
  },
  {
    title: 'Rhinitis',
    category: 'Respiratory',
    description: 'Congestion, runny nose, sneezing, breathing issues, and triggers.',
    vaFocus: respiratoryFocus,
    tip: respiratoryTip
  },
  {
    title: 'Tinnitus',
    category: 'Hearing',
    description: 'Ringing, buzzing, or hissing episodes, one or both ears, and sleep or focus impact.',
    vaFocus: hearingFocus,
    tip: tinnitusTip,
    tipLinks: dutyMosNoiseLinks
  },
  {
    title: 'Hearing loss',
    category: 'Hearing',
    description: 'Missed conversations, TV volume, asking people to repeat themselves, and daily impact.',
    vaFocus: hearingFocus,
    tip: hearingLossTip,
    tipLinks: dutyMosNoiseLinks
  },
  {
    title: 'Eczema',
    category: 'Skin',
    description: 'Area affected, itching, flare-ups, treatment, and photos later.',
    vaFocus: skinFocus,
    tip: skinTip
  },
  {
    title: 'Psoriasis',
    category: 'Skin',
    description: 'Area affected, plaques, itching, flare-ups, treatment, and photos later.',
    vaFocus: skinFocus,
    tip: skinTip
  },
  {
    title: 'Dermatitis',
    category: 'Skin',
    description: 'Rash location, itching, triggers, flare-ups, treatment, and photos later.',
    vaFocus: skinFocus,
    tip: skinTip
  },
  {
    title: 'Fibromyalgia',
    category: 'Chronic Pain / Fatigue',
    description: 'Pain, fatigue, brain fog, flare-ups, and days unable to function normally.',
    vaFocus: chronicPainFocus,
    tip: chronicPainTip
  },
  {
    title: 'Chronic fatigue',
    category: 'Chronic Pain / Fatigue',
    description: 'Fatigue level, brain fog, rest needs, and functional limitations.',
    vaFocus: chronicPainFocus,
    tip: chronicPainTip
  }
]

export type ConditionCatalogItem = ConditionCatalogEntry & {
  key: string
  image: string
}

const conditionSearchAliasMap: Record<string, readonly string[]> = {
  'Mental Health': [
    'mental health', 'mood', 'stress', 'trauma', 'anger', 'irritability', 'isolation', 'avoidance',
    'social withdrawal', 'concentration', 'memory', 'motivation', 'hygiene', 'suicidal thoughts',
    'panic', 'anxiety', 'depression', 'nightmares', 'flashbacks'
  ],
  'Lower back pain': [
    'back pain', 'low back', 'lower back', 'lumbar', 'spine', 'spinal pain', 'back flare',
    'bending', 'lifting', 'sitting pain', 'standing pain', 'walking pain', 'back stiffness'
  ],
  PTSD: [
    'post traumatic stress', 'post-traumatic stress', 'trauma', 'combat stress', 'military trauma',
    'nightmares', 'flashbacks', 'hypervigilance', 'startle response', 'avoidance', 'anger',
    'irritability', 'panic', 'isolation', 'crowds'
  ],
  Migraine: [
    'migraines', 'head pain', 'severe headache', 'prostrating', 'aura', 'light sensitivity',
    'sound sensitivity', 'nausea', 'vomiting', 'dark room', 'missed work'
  ],
  'Tension headaches': [
    'headache', 'headaches', 'tension headache', 'head pressure', 'forehead pain', 'temple pain',
    'neck headache', 'stress headache', 'band headache'
  ],
  Anxiety: [
    'worry', 'anxious', 'nerves', 'fear', 'panic', 'racing thoughts', 'avoidance',
    'social anxiety', 'restlessness', 'chest tightness', 'shortness of breath'
  ],
  'Neck pain': [
    'cervical', 'neck stiffness', 'neck flare', 'range of motion', 'turning head',
    'shoulder blade pain', 'radiating arm pain', 'neck spasm'
  ],
  Depression: [
    'depressed', 'sadness', 'low mood', 'motivation', 'no energy', 'fatigue', 'hopeless',
    'hygiene', 'isolation', 'sleep too much', 'not eating', 'loss of interest'
  ],
  'Knee conditions': [
    'knee', 'knees', 'knee pain', 'meniscus', 'meniscus tear', 'torn meniscus',
    'patellofemoral', 'patellofemoral pain', 'patellofemoral pain syndrome', 'PFPS',
    'knee strain', 'MCL', 'ACL', 'instability', 'gave out', 'knee gave out', 'buckling',
    'limited range of motion', 'ROM', 'swelling', 'stairs', 'standing', 'walking',
    'squatting', 'kneeling', 'brace', 'knee brace'
  ],
  'Panic attacks': [
    'panic attack', 'panic', 'racing heart', 'heart pounding', 'shortness of breath',
    'fear', 'sweating', 'shaking', 'dizzy', 'chest tightness', 'impending doom'
  ],
  'Vertigo / Dizziness': [
    'vertigo', 'dizzy', 'dizziness', 'spinning', 'balance', 'falls', 'nausea',
    'lightheaded', 'room spinning', 'unsteady'
  ],
  Seizures: [
    'seizure', 'convulsion', 'blackout', 'loss of consciousness', 'aura', 'staring spells',
    'postictal', 'confusion', 'witness', 'injury'
  ],
  'Insomnia / Sleep disturbances': [
    'insomnia', 'sleep', 'can’t sleep', 'cannot sleep', 'waking up', 'wake ups',
    'nightmares', 'restless', 'tired', 'fatigue', 'daytime sleepiness', 'poor sleep'
  ],
  'Shoulder conditions': [
    'shoulder', 'shoulders', 'shoulder pain', 'rotator cuff', 'rotator cuff tear',
    'tendinitis', 'tendonitis', 'impingement', 'shoulder impingement', 'frozen shoulder',
    'adhesive capsulitis', 'arm lift', 'overhead', 'range of motion', 'limited range of motion',
    'lifting', 'sleep on shoulder', 'shoulder stiffness'
  ],
  'Joint Pain & Arthritis': [
    'arthritis', 'arth', 'joint pain', 'joint stiffness', 'degenerative arthritis', 'osteoarthritis',
    'rheumatoid', 'swelling', 'flare ups', 'limited motion', 'painful motion', 'joints'
  ],
  'Hip conditions': [
    'hip', 'hips', 'hip pain', 'hip strain', 'groin pain', 'labral', 'labral tear',
    'hip labrum', 'bursitis', 'hip bursitis', 'trochanteric bursitis', 'arthritis',
    'hip arthritis', 'limping', 'stairs', 'sitting pain', 'instability'
  ],
  'Foot & Ankle conditions': [
    'foot', 'feet', 'ankle', 'ankles', 'foot pain', 'ankle pain', 'sprain', 'sprained ankle',
    'chronic sprain', 'rolled ankle', 'instability', 'ankle instability', 'giving way', 'swelling',
    'plantar fasciitis', 'plantar', 'heel pain', 'heel spur', 'flat feet', 'pes planus',
    'fallen arches', 'hallux valgus', 'bunion', 'bunions', 'metatarsalgia', 'forefoot pain',
    'ball of foot', 'arch pain', 'arthritis', 'ankle arthritis', 'tendinitis', 'tendonitis',
    'peroneal', 'brace', 'toe pain'
  ],
  'Elbow conditions': [
    'elbow', 'elbows', 'elbow pain', 'tennis elbow', 'lateral epicondylitis',
    'golfers elbow', 'golfer\'s elbow', 'medial epicondylitis', 'arthritis',
    'cubital tunnel', 'ulnar nerve', 'numbness fingers', 'tingling fingers', 'lifting pain'
  ],
  'Wrist conditions': [
    'wrist', 'wrists', 'wrist pain', 'arthritis', 'tendinitis', 'tendonitis',
    'ganglion', 'ganglion cyst', 'TFCC', 'TFCC injury', 'triangular fibrocartilage',
    'typing pain', 'weak grip', 'lifting pain', 'numbness', 'tingling'
  ],
  'Hand & finger conditions': [
    'hand', 'hands', 'finger', 'fingers', 'hand pain', 'finger pain', 'arthritis',
    'trigger finger', 'trigger thumb', 'stiff fingers', 'grip strength', 'weak grip',
    'limited grip', 'swelling', 'knuckle pain', 'finger injury', 'thumb pain'
  ],
  'TMJ / Jaw pain': [
    'TMJ', 'TMD', 'jaw', 'jaw pain', 'temporomandibular', 'chewing pain', 'pain chewing',
    'jaw locking', 'locked jaw', 'clicking jaw', 'jaw clicking', 'jaw popping',
    'facial pain', 'headache', 'headaches from jaw', 'grinding teeth', 'bruxism'
  ],
  Radiculopathy: [
    'nerve pain', 'pinched nerve', 'radiating pain', 'shooting pain', 'numbness',
    'tingling', 'burning', 'weakness', 'sciatic', 'arm numbness', 'leg numbness'
  ],
  Sciatica: [
    'sciatic pain', 'sciatic nerve', 'leg pain', 'buttock pain', 'shooting leg pain',
    'radiating down leg', 'numb leg', 'tingling leg', 'sitting pain'
  ],
  'Peripheral neuropathy': [
    'neuropathy', 'feet numb', 'hands numb', 'numbness', 'tingling', 'burning feet',
    'burning hands', 'pins and needles', 'balance', 'falls'
  ],
  'IBS / Bowel Symptoms': [
    'IBS', 'bowel symptoms', 'irritable bowel syndrome', 'diarrhea', 'constipation',
    'stomach cramps', 'abdominal pain', 'bathroom urgency', 'loose stool', 'bloating',
    'gas', 'cramping', 'bowel movement'
  ],
  'Urinary frequency': [
    'frequent peeing', 'peeing a lot', 'urination', 'urinary frequency', 'overactive bladder',
    'OAB', 'nocturia', 'night urination', 'bladder', 'urge to pee', 'incontinence',
    'bathroom trips', 'leaks', 'urgency', 'prostate', 'BPH', 'interstitial cystitis'
  ],
  'GERD / Acid Reflux': [
    'GERD', 'acid reflux', 'heartburn', 'reflux', 'regurgitation', 'esophagus',
    'esophageal reflux', 'throat burning', 'difficulty swallowing', 'swallowing trouble',
    'acid', 'stomach acid', 'burning chest', 'sour taste'
  ],
  Asthma: [
    'asthma attack', 'wheezing', 'shortness of breath', 'inhaler', 'rescue inhaler',
    'breathing', 'cough', 'chest tightness', 'exercise trigger'
  ],
  'Sleep apnea': [
    'sleep apnea', 'CPAP', 'BiPAP', 'snoring', 'stopped breathing', 'daytime fatigue',
    'morning headache', 'mask', 'sleep study', 'apnea'
  ],
  Sinusitis: [
    'sinus', 'sinus infection', 'congestion', 'facial pain', 'facial pressure',
    'headache', 'drainage', 'antibiotics', 'nasal discharge'
  ],
  Rhinitis: [
    'runny nose', 'stuffy nose', 'nasal congestion', 'sneezing', 'allergies',
    'post nasal drip', 'itchy nose', 'watery eyes'
  ],
  Tinnitus: [
    'ringing ears', 'ear ringing', 'ringing in ears', 'buzzing', 'hissing', 'pulsing',
    'ear noise', 'high pitched', 'acoustic trauma', 'noise exposure', 'MOS noise',
    'duty MOS', 'both ears', 'one ear'
  ],
  'Hearing loss': [
    'hearing', 'deaf', 'deafness', 'hard of hearing', 'hearing aids', 'can\'t hear',
    'cannot hear', 'muffled hearing', 'audiogram', 'audiometric', 'hearing test',
    'noise exposure', 'acoustic trauma', 'MOS noise', 'repeat themselves', 'TV volume'
  ],
  Eczema: [
    'rash', 'itching', 'itchy skin', 'dry skin', 'skin flare', 'red skin',
    'cracked skin', 'bleeding skin', 'cream', 'ointment'
  ],
  Psoriasis: [
    'plaques', 'scales', 'scaly skin', 'rash', 'itching', 'skin patches',
    'elbow rash', 'knee rash', 'flare'
  ],
  Dermatitis: [
    'rash', 'contact dermatitis', 'skin irritation', 'itching', 'redness',
    'burning skin', 'allergic skin', 'flare'
  ],
  Fibromyalgia: [
    'fibro', 'widespread pain', 'body pain', 'tender points', 'fatigue',
    'brain fog', 'flare', 'aches', 'chronic pain'
  ],
  'Chronic fatigue': [
    'fatigue', 'exhaustion', 'tired', 'brain fog', 'post exertional malaise',
    'PEM', 'crash', 'rest', 'low energy', 'chronic fatigue syndrome'
  ]
} as const

export const conditionCatalog = conditionCatalogDefinitions.map((condition) => ({
  ...condition,
  searchAliases: [
    ...(conditionSearchAliasMap[condition.title] || []),
    ...(condition.searchAliases || []),
    ...condition.vaFocus
  ],
  key: conditionKeyFromLabel(condition.title),
  image: getConditionImage(condition.title, condition.category)
}))

export function getCatalogConditionByKey(key: string) {
  return conditionCatalog.find((condition) => condition.key === key) || null
}

export const MENTAL_HEALTH_CATEGORY = 'Mental Health'

export const MENTAL_HEALTH_ONE_CONDITION_MESSAGE =
  'The VA evaluates mental health as one combined rating. Pick one mental health condition on your home screen.'

export function isMentalHealthCategory(category: string) {
  return category === MENTAL_HEALTH_CATEGORY
}

export function isMentalHealthConditionKey(key: string) {
  const condition = getCatalogConditionByKey(key)
  return Boolean(condition && isMentalHealthCategory(condition.category))
}

export function listMentalHealthConditionKeys() {
  return conditionCatalog
    .filter((condition) => isMentalHealthCategory(condition.category))
    .map((condition) => condition.key)
}

const conditionKeyAliases: Record<string, string> = {
  [conditionKeyFromLabel('GERD')]: conditionKeyFromLabel('GERD / Acid Reflux'),
  [conditionKeyFromLabel('Acid reflux')]: conditionKeyFromLabel('GERD / Acid Reflux'),
  [conditionKeyFromLabel('Heartburn')]: conditionKeyFromLabel('GERD / Acid Reflux'),
  [conditionKeyFromLabel('Reflux')]: conditionKeyFromLabel('GERD / Acid Reflux'),
  [conditionKeyFromLabel('IBS')]: conditionKeyFromLabel('IBS / Bowel Symptoms'),
  [conditionKeyFromLabel('GERD / IBS')]: conditionKeyFromLabel('GERD / Acid Reflux'),
  [conditionKeyFromLabel('Chronic diarrhea')]: conditionKeyFromLabel('IBS / Bowel Symptoms'),
  [conditionKeyFromLabel('Constipation')]: conditionKeyFromLabel('IBS / Bowel Symptoms'),
  [conditionKeyFromLabel('Arthritis')]: conditionKeyFromLabel('Joint Pain & Arthritis'),
  arthritis: conditionKeyFromLabel('Joint Pain & Arthritis'),
  ankle_conditions: conditionKeyFromLabel('Foot & Ankle conditions'),
  foot_conditions: conditionKeyFromLabel('Foot & Ankle conditions')
}

export function resolveCatalogConditionByStoredKey(storedKey: string): ConditionCatalogItem | null {
  const trimmedKey = storedKey?.trim()
  if (!trimmedKey) {
    return null
  }

  const directMatch = getCatalogConditionByKey(trimmedKey)
  if (directMatch) {
    return directMatch
  }

  const normalizedKey = conditionKeyFromLabel(trimmedKey)
  const aliasedKey = conditionKeyAliases[normalizedKey]
  if (aliasedKey) {
    const aliasMatch = getCatalogConditionByKey(aliasedKey)
    if (aliasMatch) {
      return aliasMatch
    }
  }

  const normalizedMatch = getCatalogConditionByKey(normalizedKey)
  if (normalizedMatch) {
    return normalizedMatch
  }

  return conditionCatalog.find((condition) => {
    return condition.title.toLowerCase() === trimmedKey.toLowerCase()
      || conditionKeyFromLabel(condition.title) === normalizedKey
  }) || null
}

export function normalizeTrackedConditionKeys(keys: string[]) {
  return [...new Set(keys
    .map((storedKey) => resolveTrackedConditionKey(storedKey))
    .filter(Boolean) as string[])]
}

export const CUSTOM_CONDITION_CATEGORY = 'Custom'

const customConditionFocus = [
  'Symptom frequency and severity',
  'Work, sleep, and daily-life impact'
] as const

const customConditionTip =
  'Log what actually happened—not what you think you should report. Patterns over time matter more than one perfect entry.'

export function isCustomTrackedConditionKey(key: string) {
  const trimmedKey = key?.trim()
  if (!trimmedKey) {
    return false
  }

  return !resolveCatalogConditionByStoredKey(trimmedKey)
}

export function resolveTrackedConditionKey(storedKey: string): string | null {
  const trimmedKey = storedKey?.trim()
  if (!trimmedKey) {
    return null
  }

  const catalogMatch = resolveCatalogConditionByStoredKey(trimmedKey)
  if (catalogMatch) {
    return catalogMatch.key
  }

  const slug = conditionKeyFromLabel(trimmedKey)
  return slug || null
}

export function buildCustomConditionItem(key: string, label?: string): ConditionCatalogItem {
  const title = label?.trim() || formatConditionKeyLabel(key)

  return {
    key,
    title,
    category: CUSTOM_CONDITION_CATEGORY,
    description: 'Your custom condition — log symptoms, severity, and how they affect your day.',
    vaFocus: customConditionFocus,
    tip: customConditionTip,
    image: conditionImageAssets.customCondition
  }
}

export function resolveTrackedConditionByStoredKey(
  storedKey: string,
  customLabels?: Record<string, string>
): ConditionCatalogItem | null {
  const catalogMatch = resolveCatalogConditionByStoredKey(storedKey)
  if (catalogMatch) {
    return catalogMatch
  }

  const key = resolveTrackedConditionKey(storedKey)
  if (!key || getCatalogConditionByKey(key)) {
    return null
  }

  return buildCustomConditionItem(key, customLabels?.[key])
}

export function buildCustomConditionLabelsFromEntries(
  entries: ReadonlyArray<{ condition_key?: string | null, condition_label?: string | null }>
) {
  const labels: Record<string, string> = {}

  for (const entry of entries) {
    const key = entry.condition_key?.trim()
    if (!key || resolveCatalogConditionByStoredKey(key)) {
      continue
    }

    const label = entry.condition_label?.trim()
    if (label) {
      labels[key] = label
    }
  }

  return labels
}

export function buildConditionPickerOptions(input: {
  catalog?: ConditionCatalogItem[]
  trackedKeys?: string[]
  extraKeys?: string[]
  customLabels?: Record<string, string>
}) {
  const catalog = input.catalog ?? conditionCatalog
  const catalogKeySet = new Set(catalog.map((condition) => condition.key))
  const keys = [...new Set([
    ...(input.trackedKeys ?? []),
    ...(input.extraKeys ?? [])
  ])]

  const customItems = keys
    .filter((key) => isCustomTrackedConditionKey(key))
    .map((key) => resolveTrackedConditionByStoredKey(key, input.customLabels))
    .filter((condition): condition is ConditionCatalogItem => Boolean(condition))
    .filter((condition) => !catalogKeySet.has(condition.key))

  return [...customItems, ...catalog]
}

export function normalizeConditionLabel(label: string | null | undefined) {
  const trimmedLabel = label?.trim()

  if (!trimmedLabel) {
    return 'Untitled condition'
  }

  const normalizedKey = conditionKeyFromLabel(trimmedLabel)
  const aliasedKey = conditionKeyAliases[normalizedKey]

  if (aliasedKey) {
    return getCatalogConditionByKey(aliasedKey)?.title || trimmedLabel
  }

  return trimmedLabel
}

function mapConditionTip(condition: ConditionCatalogItem): HomeVisitTip {
  return {
    title: `${condition.title} tip`,
    text: condition.tip,
    ...(condition.tipLinks?.length ? { links: condition.tipLinks } : {})
  }
}

export function buildHomeVisitTips(conditions: ConditionCatalogItem[]): HomeVisitTip[] {
  const mentalHealthConditions = conditions.filter((condition) => condition.category === 'Mental Health')
  const otherConditions = conditions.filter((condition) => condition.category !== 'Mental Health')

  const pool: HomeVisitTip[] = [
    {
      title: LOG_HISTORY_LENGTH_TIP.title,
      text: LOG_HISTORY_LENGTH_TIP.text
    },
    ...otherConditions.map(mapConditionTip),
    ...mentalHealthConditions.map(mapConditionTip),
    {
      title: 'Mental health tip',
      text: VA_MENTAL_HEALTH_COMBINED_TIP
    },
    {
      title: 'Severity tip',
      text: VA_MENTAL_HEALTH_SEVERITY_TIP
    },
    {
      title: 'Worst day tip',
      text: VA_MENTAL_HEALTH_WORST_DAY_TIP
    },
    {
      title: FILING_WHEN_READY_TIP.title,
      text: FILING_WHEN_READY_TIP.text
    },
    {
      title: HOME_HONESTY_TIP.title,
      text: HOME_HONESTY_TIP.text
    },
    {
      title: DONT_DOWNPLAY_SYMPTOMS_TIP.title,
      text: DONT_DOWNPLAY_SYMPTOMS_TIP.text
    },
    {
      title: 'Crisis support',
      text: VA_MENTAL_HEALTH_CRISIS_TIP
    }
  ]

  return pool
}

export function pickRandomHomeVisitTip(conditions: ConditionCatalogItem[]): HomeVisitTip | null {
  const pool = buildHomeVisitTips(conditions)

  if (!pool.length) {
    return null
  }

  return pool[Math.floor(Math.random() * pool.length)]!
}
