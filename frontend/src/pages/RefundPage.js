import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw } from 'lucide-react';

export default function RefundPage() {
  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pk-orange)] mb-4 shadow-lg">
            <RotateCcw className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">سياسة الاسترجاع</h1>
          <p className="text-muted-foreground">قواعد الإلغاء وإعادة الجدولة والاسترداد</p>
        </div>
        
        <div className="booking-card p-6 sm:p-8 space-y-5 text-muted-foreground leading-relaxed">
          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">1) تذاكر اللعب بالساعة</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>لا يتم استرداد قيمة التذكرة بعد بدء الاستخدام</li>
              <li>في حالات استثنائية قد يتم تعويض بجلسة بديلة</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">2) الاشتراكات</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>الاشتراكات غير قابلة للاسترداد بعد التفعيل</li>
              <li>يمكن معالجة حالات استثنائية عند وجود خطأ تقني</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">3) حفلات أعياد الميلاد</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يمكن إعادة الجدولة قبل 48 ساعة من الموعد</li>
              <li>الإلغاء المتأخر أو عدم الحضور - لا يتم الاسترداد</li>
              <li>العربون لتثبيت الحجز وقد لا يكون قابلاً للاسترداد</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-green)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">4) عدم الحضور (No-Show)</h2>
            <p className="text-sm">عدم الحضور دون إشعار مسبق = لا يوجد استرداد</p>
          </section>

          <section className="p-4 rounded-xl bg-muted">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">5) تقديم طلب</h2>
            <p className="text-sm">الهاتف: <span dir="ltr" className="font-bold">0777775652</span></p>
            <p className="text-sm">البريد: support@peekaboojor.com</p>
          </section>

          <div className="pt-4 border-t text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              <ChevronLeft className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
