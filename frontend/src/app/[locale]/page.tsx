import { Link } from '@/i18n/navigation';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">منصة تأجير المخازن</h1>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              تسجيل الدخول
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              إنشاء حساب
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-24 text-center">
            <h2 className="text-4xl font-bold mb-4">حل متكامل لإدارة تأجير المخازن</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              نظام رقمي متكامل يربط المدير، المستأجر، والحارس في منصة واحدة لإدارة عمليات التأجير بكفاءة وشفافية
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50"
              >
                ابدأ الآن
              </Link>
              <Link
                href="/auth/login"
                className="border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10"
              >
                تسجيل الدخول
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">لماذا منصتنا؟</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'إدارة ذكية', desc: 'لوحة تحكم متكاملة مع مؤشرات أداء فورية للمدير' },
                { title: 'بوابة المستأجر', desc: 'كتالوج تفاعلي للمخازن، حجوزات، ومدفوعات إلكترونية' },
                { title: 'نظام أمني', desc: 'QR Code للتحقق من الهوية، وتسجيل دخول وخروج الشحنات' },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-xl bg-gray-50 border text-center">
                  <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 text-center">
        <p>© 2026 جميع الحقوق محفوظة. منصة تأجير المخازن</p>
      </footer>
    </div>
  );
}
