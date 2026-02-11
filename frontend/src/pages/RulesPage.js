import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function RulesPage() {
  useEffect(() => {
    document.title = 'قواعد المركز | بيكابو';
  }, []);

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
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pk-yellow)] mb-4 shadow-lg">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">قواعد المركز</h1>
          <p className="text-muted-foreground">لسلامة الجميع ومتعتهم</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Must Do */}
          <Card className="booking-card">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>

          {/* Must Not */}
          <Card className="booking-card">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        </div>

        {/* Safety Note */}
        <Card className="booking-card mt-6">
          <CardContent className="p-6 bg-[var(--pk-bg-light-yellow)] rounded-xl text-center">
            <AlertTriangle className="h-8 w-8 text-[var(--pk-yellow)] mx-auto mb-2" />
            <p className="font-heading font-bold text-foreground mb-1">ملاحظة مهمة</p>
            <p className="text-sm text-muted-foreground">
              يحق للإدارة إيقاف الجلسة وإخراج الزائر عند مخالفة التعليمات دون تعويض
            </p>
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
