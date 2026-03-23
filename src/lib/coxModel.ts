// Cox proportional hazards model - embedded from scikit-survival trained model

// Non-zero coefficients from the CoxNet model
export interface FeatureSpec {
  name: string;           // internal model feature name
  coef: number;
  dataMin: number;
  dataMax: number;
  // For one-hot groups, groupName is the frontend label
  groupName?: string;
  groupValue?: string;
}

export const FEATURES: FeatureSpec[] = [
  { name: "Adjuvant therapy using biological drugs", coef: -1.5815487341336372, dataMin: 0, dataMax: 1 },
  { name: "Radiotherapy (RT) performed", coef: -1.039167469957913, dataMin: 0, dataMax: 1 },
  { name: "Radiotherapy on chest wall", coef: 0.1128213630056463, dataMin: 0, dataMax: 1 },
  { name: "Radiotherapy on supraclavicular area", coef: 0.7337084242863485, dataMin: 0, dataMax: 1 },
  { name: "Endocrine therapy performed", coef: 1.8050827767983126, dataMin: 0, dataMax: 1 },
  { name: "Treatment in association with chemotherapy", coef: 0.22947768026136928, dataMin: 0, dataMax: 1 },
  { name: "Side location of the lesion", coef: -0.3230347741431687, dataMin: 0, dataMax: 1 },
  { name: "Source of referral", coef: 0.0023331279462614363, dataMin: 0, dataMax: 1 },
  { name: "Progesterone receptor status at CB", coef: -0.5385034096944739, dataMin: 0, dataMax: 1 },
  { name: "Grade at CB", coef: 0.35148751854909843, dataMin: 1, dataMax: 3 },
  // One-hot: Oestrogen receptor status at CB
  { name: "Oestrogen receptor status at CB_0.0", coef: 0.45416697771253944, dataMin: 0, dataMax: 1, groupName: "Oestrogen receptor status at CB", groupValue: "Negative (0)" },
  { name: "Oestrogen receptor status at CB_1.0", coef: -1.7416290607063496, dataMin: 0, dataMax: 1, groupName: "Oestrogen receptor status at CB", groupValue: "Positive (1)" },
  // One-hot: Her2 overexpression
  { name: "Her2 overexpression (with immunohystochemistry) at CB_1.0", coef: 1.3354749693098917, dataMin: 0, dataMax: 1, groupName: "Her2 overexpression at CB", groupValue: "1+" },
  // One-hot: Isotype at CB
  { name: "Isotype at CB_1.0", coef: -1.2115008620183843, dataMin: 0, dataMax: 1, groupName: "Isotype at CB", groupValue: "Ductal (1)" },
];

// Model offset (mean linear predictor from training)
export const MODEL_OFFSET = -2.1088827284842893;

// Baseline cumulative hazard sampled every 5 days from 0 to 1825
// Times in days
export const BASELINE_TIMES = [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100,105,110,115,120,125,130,135,140,145,150,155,160,165,170,175,180,185,190,195,200,205,210,215,220,225,230,235,240,245,250,255,260,265,270,275,280,285,290,295,300,305,310,315,320,325,330,335,340,345,350,355,360,365,370,375,380,385,390,395,400,405,410,415,420,425,430,435,440,445,450,455,460,465,470,475,480,485,490,495,500,505,510,515,520,525,530,535,540,545,550,555,560,565,570,575,580,585,590,595,600,605,610,615,620,625,630,635,640,645,650,655,660,665,670,675,680,685,690,695,700,705,710,715,720,725,730,735,740,745,750,755,760,765,770,775,780,785,790,795,800,805,810,815,820,825,830,835,840,845,850,855,860,865,870,875,880,885,890,895,900,905,910,915,920,925,930,935,940,945,950,955,960,965,970,975,980,985,990,995,1000,1005,1010,1015,1020,1025,1030,1035,1040,1045,1050,1055,1060,1065,1070,1075,1080,1085,1090,1095,1100,1105,1110,1115,1120,1125,1130,1135,1140,1145,1150,1155,1160,1165,1170,1175,1180,1185,1190,1195,1200,1205,1210,1215,1220,1225,1230,1235,1240,1245,1250,1255,1260,1265,1270,1275,1280,1285,1290,1295,1300,1305,1310,1315,1320,1325,1330,1335,1340,1345,1350,1355,1360,1365,1370,1375,1380,1385,1390,1395,1400,1405,1410,1415,1420,1425,1430,1435,1440,1445,1450,1455,1460,1465,1470,1475,1480,1485,1490,1495,1500,1505,1510,1515,1520,1525,1530,1535,1540,1545,1550,1555,1560,1565,1570,1575,1580,1585,1590,1595,1600,1605,1610,1615,1620,1625,1630,1635,1640,1645,1650,1655,1660,1665,1670,1675,1680,1685,1690,1695,1700,1705,1710,1715,1720,1725,1730,1735,1740,1745,1750,1755,1760,1765,1770,1775,1780,1785,1790,1795,1800,1805,1810,1815,1820,1825];

// Will be populated from the extracted data
export const BASELINE_CUM_HAZARDS: number[] = [];

// This will be loaded asynchronously - for now embed directly
// Extracted from the model's Breslow estimator
const _rawCumHazards = [0,0,0,0,0,0,0,0,0,0,0,0,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0001308740,0.0002638796,0.0002638796,0.0002638796,0.0002638796,0.0002638796,0.0003988998,0.0003988998,0.0003988998,0.0003988998,0.0003988998,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0005295470,0.0006623174,0.0006623174,0.0006623174,0.0006623174,0.0006623174,0.0006623174,0.0006623174,0.0006623174,0.0007974521,0.0007974521,0.0007974521,0.0007974521,0.0007974521,0.0007974521,0.0007974521,0.0009350406,0.0009350406,0.0009350406,0.0009350406,0.0009350406,0.0010753771,0.0010753771,0.0010753771,0.0010753771,0.0010753771,0.0010753771,0.0012186310,0.0012186310,0.0012186310,0.0012186310,0.0013649961,0.0013649961,0.0013649961,0.0013649961,0.0015147764,0.0015147764,0.0015147764,0.0015147764,0.0015147764,0.0015147764,0.0016684041,0.0016684041,0.0016684041,0.0016684041,0.0016684041,0.0018260792,0.0018260792,0.0018260792,0.0018260792,0.0018260792,0.0019882163,0.0019882163,0.0019882163,0.0019882163,0.0021553082,0.0021553082,0.0021553082,0.0021553082,0.0021553082,0.0023279327,0.0023279327,0.0023279327,0.0023279327,0.0023279327,0.0023279327,0.0023279327,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0025066660,0.0026924207,0.0026924207,0.0026924207,0.0026924207,0.0026924207,0.0026924207,0.0028860073,0.0028860073,0.0028860073,0.0028860073,0.0028860073,0.0028860073,0.0028860073,0.0030885826,0.0030885826,0.0030885826,0.0032019843,0.0032019843,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0033178001,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0034363478,0.0035579989,0.0035579989,0.0035579989,0.0036832785,0.0036832785,0.0036832785,0.0036832785,0.0036832785,0.0036832785,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0038127082,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0039466698,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0040857544,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0042305478,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0043816773,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0045398662,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624,0.0047718624];
BASELINE_CUM_HAZARDS.push(..._rawCumHazards);

// Report time points (years)
export const REPORT_YEARS = [1, 2, 3, 4, 5];
export const REPORT_DAYS = [365, 730, 1095, 1460, 1825];

// Binary input variables for the form
export const BINARY_VARIABLES = [
  { key: "endocrine_therapy", label: "Endocrine therapy performed" },
  { key: "biological_drugs", label: "Adjuvant therapy using biological drugs" },
  { key: "radiotherapy", label: "Radiotherapy (RT) performed" },
  { key: "rt_chest_wall", label: "Radiotherapy on chest wall" },
  { key: "rt_supraclavicular", label: "Radiotherapy on supraclavicular area" },
  { key: "chemo_association", label: "Treatment in association with chemotherapy" },
  { key: "side_location", label: "Side location of the lesion" },
  { key: "source_referral", label: "Source of referral" },
  { key: "progesterone_status", label: "Progesterone receptor status at CB" },
] as const;

// Categorical (one-hot) variables
export const CATEGORICAL_VARIABLES = [
  {
    key: "oestrogen_status",
    label: "Oestrogen receptor status at CB",
    options: [
      { label: "Unknown", value: "unknown" },
      { label: "Negative (0)", value: "0" },
      { label: "Positive (1)", value: "1" },
    ],
  },
  {
    key: "her2_status",
    label: "Her2 overexpression at CB",
    options: [
      { label: "Unknown", value: "unknown" },
      { label: "1+", value: "1" },
      { label: "2+", value: "2" },
      { label: "3+", value: "3" },
    ],
  },
  {
    key: "isotype",
    label: "Isotype at CB",
    options: [
      { label: "Unknown", value: "unknown" },
      { label: "Ductal (1)", value: "1" },
      { label: "Lobular (2)", value: "2" },
      { label: "Mixed (3)", value: "3" },
      { label: "Other (4)", value: "4" },
    ],
  },
] as const;

// Grade variable (ordinal)
export const GRADE_OPTIONS = [
  { label: "Grade 1", value: 1 },
  { label: "Grade 2", value: 2 },
  { label: "Grade 3", value: 3 },
];

export interface PatientInput {
  // Binary variables (0 or 1)
  endocrine_therapy: number;
  biological_drugs: number;
  radiotherapy: number;
  rt_chest_wall: number;
  rt_supraclavicular: number;
  chemo_association: number;
  side_location: number;
  source_referral: number;
  progesterone_status: number;
  // Grade (1-3)
  grade: number;
  // Categorical (one-hot)
  oestrogen_status: string; // "unknown", "0", "1"
  her2_status: string;      // "unknown", "1", "2", "3"
  isotype: string;          // "unknown", "1", "2", "3", "4"
}

export const DEFAULT_INPUT: PatientInput = {
  endocrine_therapy: 0,
  biological_drugs: 0,
  radiotherapy: 0,
  rt_chest_wall: 0,
  rt_supraclavicular: 0,
  chemo_association: 0,
  side_location: 0,
  source_referral: 0,
  progesterone_status: 0,
  grade: 1,
  oestrogen_status: "unknown",
  her2_status: "unknown",
  isotype: "unknown",
};

function scaleFeature(value: number, dataMin: number, dataMax: number): number {
  const range = dataMax - dataMin;
  if (range === 0) return 0;
  return (value - dataMin) / range;
}

export interface FeatureContribution {
  name: string;
  coefficient: number;
  scaledValue: number;
  contribution: number; // coef * scaled_value
}

export function computeRisk(input: PatientInput): {
  survivalCurve: { time: number; survival: number; risk: number }[];
  yearlyRisk: { year: number; survival: number; risk: number }[];
  contributions: FeatureContribution[];
  linearPredictor: number;
} {
  // Build raw feature vector for non-zero coefficient features
  const featureValues: { spec: FeatureSpec; rawValue: number }[] = [];

  // Binary
  featureValues.push({ spec: FEATURES[0], rawValue: input.biological_drugs });
  featureValues.push({ spec: FEATURES[1], rawValue: input.radiotherapy });
  featureValues.push({ spec: FEATURES[2], rawValue: input.rt_chest_wall });
  featureValues.push({ spec: FEATURES[3], rawValue: input.rt_supraclavicular });
  featureValues.push({ spec: FEATURES[4], rawValue: input.endocrine_therapy });
  featureValues.push({ spec: FEATURES[5], rawValue: input.chemo_association });
  featureValues.push({ spec: FEATURES[6], rawValue: input.side_location });
  featureValues.push({ spec: FEATURES[7], rawValue: input.source_referral });
  featureValues.push({ spec: FEATURES[8], rawValue: input.progesterone_status });

  // Grade
  featureValues.push({ spec: FEATURES[9], rawValue: input.grade });

  // Oestrogen receptor one-hot
  featureValues.push({ spec: FEATURES[10], rawValue: input.oestrogen_status === "0" ? 1 : 0 });
  featureValues.push({ spec: FEATURES[11], rawValue: input.oestrogen_status === "1" ? 1 : 0 });

  // Her2 one-hot (only _1.0 has non-zero coef)
  featureValues.push({ spec: FEATURES[12], rawValue: input.her2_status === "1" ? 1 : 0 });

  // Isotype one-hot (only _1.0 has non-zero coef)
  featureValues.push({ spec: FEATURES[13], rawValue: input.isotype === "1" ? 1 : 0 });

  // Scale and compute linear predictor
  const contributions: FeatureContribution[] = [];
  let linearPredictor = 0;

  for (const { spec, rawValue } of featureValues) {
    const scaled = scaleFeature(rawValue, spec.dataMin, spec.dataMax);
    const contribution = spec.coef * scaled;
    linearPredictor += contribution;

    const displayName = spec.groupName || spec.name;
    // Merge one-hot contributions under group name
    const existing = contributions.find((c) => c.name === displayName);
    if (existing) {
      existing.contribution += contribution;
      existing.scaledValue = Math.max(existing.scaledValue, scaled);
    } else {
      contributions.push({
        name: displayName,
        coefficient: spec.coef,
        scaledValue: scaled,
        contribution,
      });
    }
  }

  // Sort by absolute contribution
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Compute survival curve: S(t|X) = exp(-H0(t) * exp(lp - offset))
  const expFactor = Math.exp(linearPredictor - MODEL_OFFSET);

  const survivalCurve = BASELINE_TIMES.map((t, i) => {
    const H0 = BASELINE_CUM_HAZARDS[i];
    const survival = Math.exp(-H0 * expFactor);
    return { time: t, survival, risk: 1 - survival };
  });

  // Yearly risk
  const yearlyRisk = REPORT_DAYS.map((days, i) => {
    const idx = Math.min(Math.floor(days / 5), BASELINE_TIMES.length - 1);
    const H0 = BASELINE_CUM_HAZARDS[idx];
    const survival = Math.exp(-H0 * expFactor);
    return { year: REPORT_YEARS[i], survival, risk: 1 - survival };
  });

  return { survivalCurve, contributions, yearlyRisk, linearPredictor };
}
