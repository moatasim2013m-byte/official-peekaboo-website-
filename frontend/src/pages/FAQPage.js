import { HelpCircle, Phone } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';

export default function FAQPage() {
  const faqs = [
    { q: 'ما هي ساعات العمل؟', a: 'نحن مفتوحون يومياً من الساعة 10 صباحاً حتى 12 منتصف الليل.' },
    { q: 'ما هي الأعمار المسموحة؟', a: 'نستقبل الأطفال من عمر سنة واحدة حتى 12 سنة.' },
    { q: 'هل يجب على الأهل البقاء؟', a: 'نعم، يجب أن يبقى أحد الوالدين أو مرافق بالغ مع الطفل داخل المركز.' },
    { q: 'هل يوجد كافتيريا؟', a: 'نعم، لدينا كافتيريا تقدم وجبات خفيفة ومشروبات.' },
    { q: 'كيف أحجز حفلة عيد ميلاد؟', a: 'يمكنك الحجز عبر الموقع من صفحة "حفلات أعياد الميلاد" أو التواصل معنا مباشرة.' },
    { q: 'هل الجوارب مطلوبة؟', a: 'نعم، يجب ارتداء جوارب نظيفة داخل منطقة اللعب للحفاظ على النظافة والسلامة.' },
    { q: 'هل يمكن إلغاء الحجز؟', a: 'يرجى مراجعة سياسة الاسترجاع. بشكل عام، يمكن إعادة جدولة حفلات أعياد الميلاد قبل 48 ساعة.' },
    { q: 'ما طرق الدفع المتاحة؟', a: 'نقبل الدفع نقداً، بطاقات Visa وMastercard، وCliQ.' }
  ];

  return (
    <PublicPageShell
      title="الأسئلة الشائعة"
      subtitle="إجابات على أكثر الأسئلة شيوعاً"
      icon={HelpCircle}
      iconBg="bg-[var(--pk-blue)]"
    >
      {/* FAQ Grid */}
      <WonderSection>
        <div className="wonder-card-grid">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-card">
              <h3 className="faq-question">{faq.q}</h3>
              <p className="faq-answer">{faq.a}</p>
            </div>
          ))}
        </div>
      </WonderSection>

      {/* Contact CTA */}
      <WonderSection className="text-center">
        <WonderSectionTitle icon={Phone} iconColor="green">لم تجد إجابة سؤالك؟</WonderSectionTitle>
        <p className="text-muted-foreground mb-2">تواصل معنا مباشرة</p>
        <p className="font-bold text-lg">
          <span dir="ltr">0777775652</span>
        </p>
      </WonderSection>
    </PublicPageShell>
  );
}
