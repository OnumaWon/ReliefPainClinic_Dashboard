
import { PatientRecord } from '../types';

/**
 * Extracts numeric score from strings like "SCORE : 10 (2025-06-04 ,14:12:55)"
 * Matches both "SCORE : X" format and direct numbers.
 */
const parsePainScore = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim().toLowerCase();
  
  // "ไม่พบข้อมูล" (No Info) should return null to be excluded from calculation
  // We exclude markers that indicate data is missing.
  if (
    str.includes('ไม่พบข้อมูล') || 
    str.includes('n/a') || 
    str.includes('no info') || 
    str === '-' || 
    str === 'unknown'
  ) {
    return null;
  }
  
  // "No Pain" explicitly means a score of 0
  if (str.includes('no pain') || str === 'none') {
    return 0;
  }
  
  // Regex to find "SCORE : X"
  const match = str.match(/score\s*:\s*(\d+)/i);
  if (match) {
    const score = parseInt(match[1], 10);
    return isNaN(score) ? null : score;
  }
  
  // Fallback for direct numbers or numbers at start of string
  const directNumMatch = str.match(/^(\d+)/);
  if (directNumMatch) {
    return parseInt(directNumMatch[1], 10);
  }

  return null;
};

export const processRawData = (data: any[]): PatientRecord[] => {
  return data.map((row) => {
    return {
      visitDate: String(row['VISIT_DATE'] || ''),
      visitTime: String(row['VISIT_TIME'] || ''),
      hn: String(row['HN'] || ''),
      en: String(row['EN'] || ''),
      patientName: String(row['PATIENT_NAME'] || ''),
      doctor: String(row['DOCTOR'] || ''),
      icd10: String(row['ICD10'] || ''),
      icd9: String(row['ICD9'] || ''),
      initialPainScore: parsePainScore(row['PAIN_SCORE_(แรกรับ)']),
      dischargePainScore: parsePainScore(row['PAIN_SCORE_(ก่อนจำหน่าย)']),
      revenue: parseFloat(row['REVENUES']) || 0,
    };
  }).filter(r => r.hn !== ''); // Filter out empty rows
};
