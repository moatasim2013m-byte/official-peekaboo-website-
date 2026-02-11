import { HelpCircle } from 'lucide-react';
import PublicPageShell, { ContentCard } from '../components/PublicPageShell';

export default function FAQPage() {
  const faqs = [
    { q: 'ما هي ساعات العمل؟', a: 'نحن مفتوحون يومياً من الساعة 10 صباحاً حتى 12 منتصف الليل.', color: 'bg-[var(--pk-bg-light-blue)]' },
    { q: 'ما هي الأعمار المسموحة؟', a: 'نستقبل الأطفال من عمر سنة واحدة حتى 12 سنة.', color: 'bg-[var(--pk-bg-light-yellow)]' },
    { q: 'هل يجب على الأهل البقاء؟', a: 'نعم، يجب أن يبقى أحد الوالدين أو مرافق بالغ مع الطفل داخل المركز.', color: 'bg-[var(--pk-bg-light-pink)]' },
    { q: 'هل يوجد كافتيريا؟', a: 'نعم، لدينا كافتيريا تقدم وجبات خفيفة ومشروبات.', color: 'bg-[var(--pk-bg-light-green)]' },
    { q: 'كيف أحجز حفلة عيد ميلاد؟', a: 'يمكنك الحجز عبر الموقع من صفحة "حفلات أعياد الميلاد" أو التواصل معنا مباشرة.', color: 'bg-[var(--pk-bg-light-blue)]' },
    { q: 'هل الجوارب مطلوبة؟', a: 'نعم، يجب ارتداء جوارب نظيفة داخل منطقة اللعب للحفاظ على النظافة والسلامة.', color: 'bg-[var(--pk-bg-light-yellow)]' },
    { q: 'هل يمكن إلغاء الحجز؟', a: 'يرجى مراجعة سياسة الاسترجاع. بشكل عام، يمكن إعادة جدولة حفلات أعياد الميلاد قبل 48 ساعة.', color: 'bg-[var(--pk-bg-light-pink)]' },
    { q: 'ما طرق الدفع المتاحة؟', a: 'نقبل الدفع نقداً، بطاقات Visa وMastercard، وCliQ.', color: 'bg-[var(--pk-bg-light-green)]' }
  ];

  return (
    <PublicPageShell
      title="الأسئلة الشائعة"
      subtitle="إجابات على أكثر الأسئلة شيوعاً"
      icon={HelpCircle}
      iconBg="bg-[var(--pk-blue)]"
    >
      {/* FAQ List */}
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <ContentCard key={index} className={`${faq.color} !p-5`}>
            <h3 className="font-heading font-bold text-foreground mb-2">{faq.q}</h3>
            <p className="text-muted-foreground text-sm">{faq.a}</p>
          </ContentCard>
        ))}
      </div>

      {/* Contact CTA */}
      <ContentCard className="text-center">
        <p className="text-muted-foreground mb-2">لم تجد إجابة سؤالك؟</p>
        <p className="font-bold">تواصل معنا: <span dir="ltr">0777775652</span></p>
      </ContentCard>
    </PublicPageShell>
  );
}
