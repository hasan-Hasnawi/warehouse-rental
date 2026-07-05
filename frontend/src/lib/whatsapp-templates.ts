export interface Template {
  id: string
  label: string
  text: string
}

export interface Category {
  id: string
  label: string
  templates: Template[]
}

export const categories: Category[] = [
  {
    id: 'payments',
    label: 'المدفوعات',
    templates: [
      { id: 'payment_reminder', label: 'تذكير بدفع مستحقات', text: 'مرحباً {name}، لديك دفعة مستحقة بقيمة {amount} دينار للعقد {contractNo}. يرجى التسديد في أقرب وقت.' },
      { id: 'payment_received', label: 'تأكيد استلام دفعة', text: 'تم استلام دفعة {amount} دينار للعقد {contractNo}. شكراً لك.' },
      { id: 'payment_overdue', label: 'دفعة متأخرة', text: 'نذكركم بأن لديك دفعة متأخرة بقيمة {amount} دينار للعقد {contractNo}. يرجى التسديد فوراً لتجنب الغرامات.' },
    ],
  },
  {
    id: 'contracts',
    label: 'العقود',
    templates: [
      { id: 'contract_expiring_soon', label: 'تذكير باقتراب انتهاء العقد', text: 'مرحباً {name}، نذكرك بأن عقدك {contractNo} لمخزن {warehouse} سينتهي في {date}. يرجى التواصل معنا للتجديد.' },
      { id: 'contract_expired', label: 'انتهاء العقد', text: 'عقدك {contractNo} لمخزن {warehouse} قد انتهى في {date}. نأمل تجديده قريباً. تواصل معنا.' },
      { id: 'contract_terminated', label: 'إنهاء العقد', text: 'تم إنهاء العقد {contractNo} لمخزن {warehouse}. يمكنك مراجعة التفاصيل في حسابك.' },
    ],
  },
  {
    id: 'bookings',
    label: 'الحجوزات',
    templates: [
      { id: 'booking_approved', label: 'قبول الحجز', text: 'مرحباً {name}، تم قبول حجزك في مخزن {warehouse}. سيتم إعداد العقد قريباً.' },
      { id: 'booking_rejected', label: 'رفض الحجز', text: 'مرحباً {name}، نأسف لرفض حجزك في مخزن {warehouse}. يمكنك التواصل معنا لمعرفة السبب.' },
      { id: 'booking_pending', label: 'حجز قيد المراجعة', text: 'مرحباً {name}، حجزك لمخزن {warehouse} قيد المراجعة. سنبلغك عند صدور القرار.' },
    ],
  },
  {
    id: 'guards',
    label: 'مهام الحراس',
    templates: [
      { id: 'guard_new_task', label: 'مهمة جديدة', text: 'مرحباً {name}، تم تعيين مهمة جديدة لك: {task}' },
      { id: 'guard_task_urgent', label: 'مهمة عاجلة', text: 'مرحباً {name}، مهمة عاجلة: {task}. يرجى التوجه فوراً.' },
    ],
  },
  {
    id: 'alerts',
    label: 'تنبيهات',
    templates: [
      { id: 'alert_contracts_expiring_week', label: 'عقود تنتهي خلال أسبوع', text: 'تذكير: العقود التالية ستنتهي خلال أسبوع:\n{contractsList}' },
      { id: 'alert_contracts_expired', label: 'عقود منتهية', text: 'التنبيه: العقود التالية قد انتهت:\n{contractsList}' },
    ],
  },
]

export function fillTemplate(text: string, fields: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(fields)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}

export function encodeWhatsAppMessage(text: string): string {
  return encodeURIComponent(text)
}

export function getWhatsAppLink(phone: string, text: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  const country = cleaned.startsWith('964') || cleaned.startsWith('0') ? '' : '964'
  const full = cleaned.startsWith('0') ? '964' + cleaned.slice(1) : cleaned.startsWith('964') ? cleaned : country + cleaned
  return `https://wa.me/${full}?text=${encodeWhatsAppMessage(text)}`
}
