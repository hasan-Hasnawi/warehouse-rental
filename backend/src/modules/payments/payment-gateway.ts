const methods: Record<string, { name: string; logo: string }> = {
  ki_card: { name: 'كي كارد', logo: '💳' },
  zaincash: { name: 'زينكاش', logo: '📱' },
  cash: { name: 'نقدي', logo: '💵' },
  bank: { name: 'تحويل بنكي', logo: '🏦' },
};

function generateRef(): string {
  return `MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function simulateProcessing(method: string): { success: boolean; message: string } {
  const info = methods[method] || { name: method };
  if (method === 'ki_card') {
    return Math.random() > 0.1
      ? { success: true, message: `تم الدفع عبر ${info.name} بنجاح` }
      : { success: false, message: `فشلت المعاملة عبر ${info.name} - رصيد غير كافٍ` };
  }
  if (method === 'zaincash') {
    return Math.random() > 0.05
      ? { success: true, message: `تم الدفع عبر ${info.name} بنجاح` }
      : { success: false, message: `فشلت المعاملة عبر ${info.name} - خطأ في الاتصال` };
  }
  return { success: true, message: `تم تسجيل الدفع (${info.name})` };
}

export async function processPayment(params: {
  amount: number;
  method: string;
  currency?: string;
  description?: string;
}): Promise<{ success: boolean; referenceNo: string; message: string }> {
  const ref = generateRef();
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
  const result = simulateProcessing(params.method);
  return { ...result, referenceNo: result.success ? ref : '' };
}

export function getPaymentMethods() {
  return Object.entries(methods).map(([id, info]) => ({
    id,
    name: info.name,
    logo: info.logo,
  }));
}
