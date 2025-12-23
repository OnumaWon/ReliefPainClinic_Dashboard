
export interface PatientRecord {
  visitDate: string;
  visitTime: string;
  hn: string;
  en: string;
  patientName: string;
  doctor: string;
  icd10: string;
  icd9: string;
  initialPainScore: number | null;
  dischargePainScore: number | null;
  revenue: number;
}

export interface DashboardMetrics {
  totalPatients: number;
  avgInitialPain: number;
  avgDischargePain: number;
  painReductionPercent: number;
  totalRevenue: number;
  topDoctor: string;
  topICD10: string;
}

export interface AIInsight {
  summary: string;
  clinicalObservations: string[];
  recommendations: string[];
}

export interface DateRange {
  start: string;
  end: string;
}
