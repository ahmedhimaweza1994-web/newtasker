/**
 * Arabic Date Formatting Utilities
 * Formats dates in Arabic Gregorian (ميلادي) format
 */

const arabicMonths = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const arabicDays = [
  'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
];

const arabicNumerals: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

/**
 * Convert English numerals to Arabic numerals
 */
export function toArabicNumerals(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => arabicNumerals[digit]);
}

/**
 * Format date as "1 يناير 2025" (Arabic Gregorian)
 */
export function formatArabicDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const month = arabicMonths[d.getMonth()];
  const year = d.getFullYear();
  
  return `${toArabicNumerals(day)} ${month} ${toArabicNumerals(year)}`;
}

/**
 * Format date with day name: "الأحد، 1 يناير 2025"
 */
export function formatArabicDateWithDay(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const dayName = arabicDays[d.getDay()];
  const dateStr = formatArabicDate(d);
  
  return `${dayName}، ${dateStr}`;
}

/**
 * Format date and time: "1 يناير 2025 - 3:30 مساءً"
 */
export function formatArabicDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatArabicDate(d);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
  const displayHours = hours % 12 || 12;
  
  const timeStr = `${toArabicNumerals(displayHours)}:${toArabicNumerals(String(minutes).padStart(2, '0'))} ${ampm}`;
  
  return `${dateStr} - ${timeStr}`;
}

/**
 * Format relative time in Arabic: "منذ 5 دقائق", "منذ 3 ساعات", etc.
 */
export function formatArabicRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'الآن';
  if (diffMinutes < 60) return `منذ ${toArabicNumerals(diffMinutes)} ${diffMinutes === 1 ? 'دقيقة' : 'دقائق'}`;
  if (diffHours < 24) return `منذ ${toArabicNumerals(diffHours)} ${diffHours === 1 ? 'ساعة' : 'ساعات'}`;
  if (diffDays < 7) return `منذ ${toArabicNumerals(diffDays)} ${diffDays === 1 ? 'يوم' : 'أيام'}`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `منذ ${toArabicNumerals(weeks)} ${weeks === 1 ? 'أسبوع' : 'أسابيع'}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `منذ ${toArabicNumerals(months)} ${months === 1 ? 'شهر' : 'أشهر'}`;
  }
  const years = Math.floor(diffDays / 365);
  return `منذ ${toArabicNumerals(years)} ${years === 1 ? 'سنة' : 'سنوات'}`;
}

/**
 * Format date range: "من 1 يناير إلى 5 يناير 2025"
 */
export function formatArabicDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
  
  const startStr = formatArabicDate(start);
  const endStr = formatArabicDate(end);
  
  return `من ${startStr} إلى ${endStr}`;
}
