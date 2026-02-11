import { FileText, Phone, Mail } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';

export default function TermsPage() {
  const sections = [
    { num: '1', title: 'إنشاء الحساب', color: 'blue', items: ['يجب إدخال معلومات صحيحة وحديثة.', 'المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول.'] },
    { num: '2', title: 'الخدمات والحجوزات', color: 'yellow', items: ['تشمل خدماتنا: اللعب بالساعة، الاشتراكات، حفلات أعياد الميلاد.', 'يعتبر الحجز مؤكداً بعد إتمام الدفع بنجاح.'] },
    { num: '3', title: 'الدفع', color: 'green', items: ['يتم الدفع عبر بطاقات Visa وMastercard.', 'في حال فشل عملية الدفع، لا يعتبر الحجز مؤكداً.'] },
    { num: '4', title: 'الحضور والدخول', color: 'pink', items: ['يجب الالتزام بموعد الحجز قدر الإمكان.', 'قد يؤدي التأخر الكبير إلى تقليل الوقت المتاح.'] },
    { num: '5', title: 'سلامة الأطفال', color: 'blue', items: ['يلتزم المركز بتوفير بيئة آمنة.', 'ولي الأمر مسؤول عن الإفصاح عن أي حالة صحية خاصة.', 'يجب الالتزام بتعليمات السلامة.'] },
    { num: '6', title: 'السلوك داخل المركز', color: 'yellow', items: ['يمنع أي سلوك مؤذٍ أو غير لائق.', 'يحق للإدارة إيقاف الجلسة عند مخالفة التعليمات.'] },
  ];

  return (
    <PublicPageShell
      title="الشروط والأحكام"
      subtitle="بيكابو للألعاب الداخلية"
      icon={FileText}
      iconBg="bg-[var(--pk-blue)]"
    >
      <WonderSection>
        <p className="text-sm text-muted-foreground mb-4">
          باستخدامك لموقع بيكابو أو إنشاء حساب أو إجراء أي حجز، فإنك توافق على هذه الشروط والأحكام بالكامل.
        </p>
        
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.num} className={`wonder-card wonder-card-${section.color}`}>
              <h3 className="font-heading font-bold text-foreground mb-2">{section.num}) {section.title}</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {section.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </WonderSection>

      <WonderSection className="text-center">
        <WonderSectionTitle icon={Phone} iconColor="green">التواصل</WonderSectionTitle>
        <p className="text-muted-foreground mb-1">
          <Phone className="inline h-4 w-4 ml-1" />
          <span dir="ltr" className="font-bold">0777775652</span>
        </p>
        <p className="text-muted-foreground">
          <Mail className="inline h-4 w-4 ml-1" />
          support@peekaboojor.com
        </p>
      </WonderSection>
    </PublicPageShell>
  );
}
