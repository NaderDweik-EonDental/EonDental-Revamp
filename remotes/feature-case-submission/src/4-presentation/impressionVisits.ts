export interface ImpressionVisit {
  id: string;
  patientName: string;
  createdAt: string;
  scans: string[] | null;
}

export const MOCK_IMPRESSION_VISITS: ImpressionVisit[] = [
  { id: 'visit-1', patientName: 'Hadeel Alrashdan', createdAt: '29/07/2026 10:58 AM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
  { id: 'visit-2', patientName: 'Maysaa Adnan', createdAt: '08/07/2026 10:30 AM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
  { id: 'visit-3', patientName: 'Raed Hamam', createdAt: '28/06/2026 04:19 PM', scans: null },
  { id: 'visit-4', patientName: 'Ayat Ahmad', createdAt: '25/06/2026 03:21 PM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
  { id: 'visit-5', patientName: 'Shahed Swaiss', createdAt: '25/06/2026 03:06 PM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
  { id: 'visit-6', patientName: 'Mayar Alem', createdAt: '25/06/2026 02:50 PM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
  { id: 'visit-7', patientName: 'Arwa Mustafa', createdAt: '25/06/2026 02:36 PM', scans: ['LowerScans.stl', 'UpperScans.stl'] },
];
