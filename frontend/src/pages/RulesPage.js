import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';

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
        <WonderSection>
          <WonderSectionTitle icon={CheckCircle} iconColor="green">يجب عليك</WonderSectionTitle>
          <ul className="space-y-3">
            {mustDo.map((rule, index) => (
              <li key={index} className="rule-item rule-item-do">
                <CheckCircle className="h-5 w-5 text-[var(--pk-green)]" />
                <span className="text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </WonderSection>

        {/* Must Not */}
        <WonderSection>
          <WonderSectionTitle icon={XCircle} iconColor="red">يُمنع</WonderSectionTitle>
          <ul className="space-y-3">
            {mustNot.map((rule, index) => (
              <li key={index} className="rule-item rule-item-dont">
                <XCircle className="h-5 w-5 text-[var(--pk-red)]" />
                <span className="text-muted-foreground">{rule}</span>
              </li>
            ))}
          </ul>
        </WonderSection>
      </div>

      {/* Safety Note */}
      <WonderSection className="text-center bg-[var(--pk-bg-light-yellow)]">
        <AlertTriangle className="h-10 w-10 text-[var(--pk-yellow)] mx-auto mb-3" />
        <p className="font-heading font-bold text-foreground text-lg mb-1">ملاحظة مهمة</p>
        <p className="text-muted-foreground">
          يحق للإدارة إيقاف الجلسة وإخراج الزائر عند مخالفة التعليمات دون تعويض
        </p>
      </WonderSection>
    </PublicPageShell>
  );
}
