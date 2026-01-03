/**
 * حساب عدد الأيام بين تاريخين (شامل)
 * @param {string} startDate - تاريخ البدء (YYYY-MM-DD)
 * @param {string} endDate - تاريخ الانتهاء (YYYY-MM-DD)
 * @returns {number} عدد الأيام
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 1;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // تعيين الوقت لمنتصف النهار لتجنب مشاكل التوقيت
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);
  
  const diffTime = end - start;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.max(diffDays, 1); // على الأقل يوم واحد
};

/**
 * التحقق من أن التاريخ ليس في الماضي
 * @param {string} date - التاريخ للفحص (YYYY-MM-DD)
 * @returns {boolean} true إذا كان التاريخ صالحاً
 */
export const isDateValid = (date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);
  
  return inputDate >= today;
};

/**
 * التحقق من تداخل إجازتين
 * @param {string} start1 - بداية الإجازة الأولى
 * @param {string} end1 - نهاية الإجازة الأولى
 * @param {string} start2 - بداية الإجازة الثانية
 * @param {string} end2 - نهاية الإجازة الثانية
 * @returns {boolean} true إذا كان هناك تداخل
 */
export const isOverlapping = (start1, end1, start2, end2) => {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  return s1 <= e2 && s2 <= e1;
};

/**
 * تحويل الأرقام إلى العربية
 * @param {string|number} str - النص المراد تحويله
 * @returns {string} النص بأرقام عربية
 */
export const toArabicNumerals = (str) => {
  if (!str && str !== 0) return str;
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  // التحقق من صيغة التاريخ (YYYY-MM-DD)
  if (str.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
    const parts = str.toString().split('-');
    str = `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  
  return str.toString().replace(/[0-9]/g, (digit) => arabicNumerals[digit]);
};

/**
 * تنسيق التاريخ للعرض
 * @param {string} date - التاريخ (YYYY-MM-DD)
 * @returns {string} التاريخ المنسق
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
