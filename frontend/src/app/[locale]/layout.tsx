import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/lib/auth-context';

const directionMap: Record<string, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  ku: 'rtl',
  en: 'ltr',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = directionMap[locale] || 'ltr';

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <div dir={dir} className="min-h-screen">
          {children}
        </div>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
