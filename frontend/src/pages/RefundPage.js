import { RotateCcw } from 'lucide-react';
import PublicPageShell, { ContentCard, InfoBlock } from '../components/PublicPageShell';

export default function RefundPage() {
  return (
    <PublicPageShell
      title="سياسة الاسترجاع"
      subtitle="قواعد الإلغاء وإعادة الجدولة والاسترداد"
      icon={RotateCcw}
      iconBg="bg-[var(--pk-orange)]"
    >
      <ContentCard className="space-y-5 text-muted-foreground leading-relaxed">
        <InfoBlock title="1) تذاكر اللعب بالساعة" color="blue">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>لا يتم استرداد قيمة التذكرة بعد بدء الاستخدام</li>
            <li>في حالات استثنائية قد يتم تعويض بجلسة بديلة</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="2) الاشتراكات" color="yellow">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>الاشتراكات غير قابلة للاسترداد بعد التفعيل</li>
            <li>يمكن معالجة حالات استثنائية عند وجود خطأ تقني</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="3) حفلات أعياد الميلاد" color="pink">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يمكن إعادة الجدولة قبل 48 ساعة من الموعد</li>
            <li>الإلغاء المتأخر أو عدم الحضور - لا يتم الاسترداد</li>
            <li>العربون لتثبيت الحجز وقد لا يكون قابلاً للاسترداد</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="4) عدم الحضور (No-Show)" color="green">
          <p className="text-sm">عدم الحضور دون إشعار مسبق = لا يوجد استرداد</p>
        </InfoBlock>

        <InfoBlock title="5) تقديم طلب" color="muted">
          <p className="text-sm">الهاتف: <span dir="ltr" className="font-bold">0777775652</span></p>
          <p className="text-sm">البريد: support@peekaboojor.com</p>
        </InfoBlock>
      </ContentCard>
    </PublicPageShell>
  );
}
