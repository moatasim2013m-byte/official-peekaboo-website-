import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import PublicPageShell, { ContentCard } from '../components/PublicPageShell';

export default function RulesPage() {
  const mustDo = [
    'ارتداء جوارب نظيفة داخل منطقة اللعب',
    'بقاء أحد الوالدين أو مرافق بالغ مع الطفل',
    'الالتزام بموعد الحجز',
    'الإفصاح عن أي حالة صحية خاصة للطفل',
    'متابعة الأطفال والإشراف عليهم',
    'الالتزام بتعليمات السلامة والموظفين'
  ];

  const mustNot = [
    'إدخال طعام أو شراب من الخارج',
    'التدخين داخل المركز',
    'السلوك العنيف أو الألفاظ غير اللائقة',
    'إتلاف الألعاب أو الممتلكات',
    'ترك الأطفال دون مرافق',
    'إزعاج الزوار الآخرين'
  ];

  return (
    <PublicPageShell
      title="قواعد المركز"
      subtitle="لسلامة الجميع ومتعتهم"
      icon={AlertTriangle}
      iconBg="bg-[var(--pk-yellow)]"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Must Do */}
        <ContentCard>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-[var(--pk-green)]" />
            <h2 className="font-heading text-xl font-bold text-foreground">يجب عليك</h2>
          </div>
          <ul className="space-y-3">
            {mustDo.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 p-3 rounded-xl bg-[var(--pk-bg-light-green)]">
                <CheckCircle className="h-5 w-5 text-[var(--pk-green)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </ContentCard>

        {/* Must Not */}
        <ContentCard>
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-6 w-6 text-[var(--pk-red)]" />
            <h2 className="font-heading text-xl font-bold text-foreground">يُمنع</h2>
          </div>
          <ul className="space-y-3">
            {mustNot.map((rule, index) => (
              <li key={index} className="flex items-start gap-2 p-3 rounded-xl bg-[var(--pk-bg-light-pink)]">
                <XCircle className="h-5 w-5 text-[var(--pk-red)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </ContentCard>
      </div>

      {/* Safety Note */}
      <ContentCard className="bg-[var(--pk-bg-light-yellow)] text-center">
        <AlertTriangle className="h-8 w-8 text-[var(--pk-yellow)] mx-auto mb-2" />
        <p className="font-heading font-bold text-foreground mb-1">ملاحظة مهمة</p>
        <p className="text-sm text-muted-foreground">
          يحق للإدارة إيقاف الجلسة وإخراج الزائر عند مخالفة التعليمات دون تعويض
        </p>
      </ContentCard>
    </PublicPageShell>
  );
}
