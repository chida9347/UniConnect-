export const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Bioinformatics',
  'Aerospace Engineering',
  'Food Technology',
  'Business Administration',
  'Other',
];

export const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Postgraduate',
  'Research Scholar',
];

export const OPPORTUNITY_CATEGORIES = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'EVENT', label: 'University Event' },
  { value: 'OTHER', label: 'Other' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  OPPORTUNITY_CATEGORIES.map((category) => [category.value, category.label])
);

export const NOTE_ACCEPT =
  '.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.png,.jpg,.jpeg';

export const MAX_NOTE_SIZE = 20 * 1024 * 1024;
