import { RotateCcw, Phone, Mail } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';

export default function RefundPage() {
  const sections = [
    { num: '1', title: 'تذاكر اللعب بالساعة', color: 'blue', items: ['لا يتم استرداد قيمة التذكرة بعد بدء الاستخدام', 'في حالات استثنائية قد يتم تعويض بجلسة بديلة'] },
    { num: '2', title: 'الاشتراكات', color: 'yellow', items: ['الاشتراكات غير قابلة للاسترداد بعد التفعيل', 'يمكن معالجة حالات استثنائية عند وجود خطأ تقني'] },
    { num: '3', title: 'حفلات أعياد الميلاد', color: 'pink', items: ['يمكن إعادة الجدولة قبل 48 ساعة من الموعد', 'الإلغاء المتأخر أو عدم الحضور - لا يتم الاسترداد', 'العربون لتثبيت الحجز وقد لا يكون قابلاً للاسترداد'] },
    { num: '4', title: 'عدم الحضور (No-Show)', color: 'green', text: 'عدم الحضور دون إشعار مسبق = لا يوجد استرداد' },
  ];

  return (
    <PublicPageShell
      title="سياسة الاسترجاع"
      subtitle="قواعد الإلغاء وإعادة الجدولة والاسترداد"
      icon={RotateCcw}
      iconBg="bg-[var(--pk-orange)]"
    >
      <WonderSection>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.num} className={`wonder-card wonder-card-${section.color}`}>
              <h3 className="font-heading font-bold text-foreground mb-2">{section.num}) {section.title}</h3>
              {section.items ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {section.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{section.text}</p>
              )}
            </div>
          ))}
        </div>
      </WonderSection>

      <WonderSection className="text-center">
        <WonderSectionTitle icon={Phone} iconColor="orange">تقديم طلب</WonderSectionTitle>
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
