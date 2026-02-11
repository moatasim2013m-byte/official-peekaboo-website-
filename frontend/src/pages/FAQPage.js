import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeft, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      q: 'ما هي ساعات العمل؟',
      a: 'نحن مفتوحون يومياً من الساعة 10 صباحاً حتى 12 منتصف الليل.',
      color: 'bg-[var(--pk-bg-light-blue)]'
    },
    {
      q: 'ما هي الأعمار المسموحة؟',
      a: 'نستقبل الأطفال من عمر سنة واحدة حتى 12 سنة.',
      color: 'bg-[var(--pk-bg-light-yellow)]'
    },
    {
      q: 'هل يجب على الأهل البقاء؟',
      a: 'نعم، يجب أن يبقى أحد الوالدين أو مرافق بالغ مع الطفل داخل المركز.',
      color: 'bg-[var(--pk-bg-light-pink)]'
    },
    {
      q: 'هل يوجد كافتيريا؟',
      a: 'نعم، لدينا كافتيريا تقدم وجبات خفيفة ومشروبات.',
      color: 'bg-[var(--pk-bg-light-green)]'
    },
    {
      q: 'كيف أحجز حفلة عيد ميلاد؟',
      a: 'يمكنك الحجز عبر الموقع من صفحة "حفلات أعياد الميلاد" أو التواصل معنا مباشرة.',
      color: 'bg-[var(--pk-bg-light-blue)]'
    },
    {
      q: 'هل الجوارب مطلوبة؟',
      a: 'نعم، يجب ارتداء جوارب نظيفة داخل منطقة اللعب للحفاظ على النظافة والسلامة.',
      color: 'bg-[var(--pk-bg-light-yellow)]'
    },
    {
      q: 'هل يمكن إلغاء الحجز؟',
      a: 'يرجى مراجعة سياسة الاسترجاع. بشكل عام، يمكن إعادة جدولة حفلات أعياد الميلاد قبل 48 ساعة.',
      color: 'bg-[var(--pk-bg-light-pink)]'
    },
    {
      q: 'ما طرق الدفع المتاحة؟',
      a: 'نقبل الدفع نقداً، بطاقات Visa وMastercard، وCliQ.',
      color: 'bg-[var(--pk-bg-light-green)]'
    }
  ];

  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pk-blue)] mb-4 shadow-lg">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">الأسئلة الشائعة</h1>
          <p className="text-muted-foreground">إجابات على أكثر الأسئلة شيوعاً</p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="booking-card">
              <CardContent className={`p-5 ${faq.color} rounded-xl`}>
                <h3 className="font-heading font-bold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        <Card className="booking-card mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-2">لم تجد إجابة سؤالك؟</p>
            <p className="font-bold">تواصل معنا: <span dir="ltr">0777775652</span></p>
          </CardContent>
        </Card>

        <div className="pt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ChevronLeft className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
