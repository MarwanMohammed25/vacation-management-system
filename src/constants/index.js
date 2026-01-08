// Application Constants

export const VACATION_TYPES = {
  REGULAR: 'اعتيادي',
  CASUAL: 'عارضة',
  MISSION: 'مأمورية',
  SICK: 'مرضية',
  PERMISSION: 'إذن'
};

export const DEFAULT_VACATION_DAYS = {
  REGULAR: 15,
  CASUAL: 6,
  MISSION: Infinity,
  SICK: Infinity,
  PERMISSION: Infinity
};

export const VACATION_ICONS = {
  [VACATION_TYPES.REGULAR]: '🏖️',
  [VACATION_TYPES.CASUAL]: '⚡',
  [VACATION_TYPES.MISSION]: '💼',
  [VACATION_TYPES.SICK]: '🏥',
  [VACATION_TYPES.PERMISSION]: '📋'
};

export const MESSAGES = {
  SUCCESS: {
    VACATION_SUBMITTED: 'تم تقديم طلب الإجازة بنجاح',
    VACATION_DELETED: 'تم حذف الإجازة وإعادة الرصيد',
    EMPLOYEE_ADDED: 'تم إضافة الموظف بنجاح',
    EMPLOYEE_UPDATED: 'تم تحديث بيانات الموظف بنجاح',
    EMPLOYEE_DELETED: 'تم حذف الموظف بنجاح'
  },
  ERROR: {
    SELECT_EMPLOYEE: 'الرجاء اختيار موظف',
    INSUFFICIENT_BALANCE: 'الرصيد غير كافي! الرصيد المتاح:',
    INVALID_DATES: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء',
    PAST_DATE: 'لا يمكن تقديم إجازة في تاريخ ماضي',
    OVERLAPPING_VACATION: 'يوجد إجازة متداخلة في هذه الفترة',
    DELETE_EMPLOYEE_CONFIRM: 'هل أنت متأكد من حذف هذا الموظف وجميع إجازاته؟',
    DELETE_VACATION_CONFIRM: 'هل أنت متأكد من حذف هذه الإجازة؟',
    GENERIC_ERROR: 'حدث خطأ، الرجاء المحاولة مرة أخرى'
  },
  LOADING: {
    FETCHING_DATA: 'جاري تحميل البيانات...',
    SUBMITTING: 'جاري الإرسال...',
    DELETING: 'جاري الحذف...',
    UPDATING: 'جاري التحديث...'
  }
};
