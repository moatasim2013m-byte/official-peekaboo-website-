import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pk-blue)] mb-4 shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">الشروط والأحكام</h1>
          <p className="text-muted-foreground">بيكابو للألعاب الداخلية</p>
        </div>
        
        <div className="booking-card p-6 sm:p-8 space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-sm">باستخدامك لموقع بيكابو أو إنشاء حساب أو إجراء أي حجز، فإنك توافق على هذه الشروط والأحكام بالكامل.</p>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">1) إنشاء الحساب</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يجب إدخال معلومات صحيحة وحديثة.</li>
              <li>المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">2) الخدمات والحجوزات</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>تشمل خدماتنا: اللعب بالساعة، الاشتراكات، حفلات أعياد الميلاد.</li>
              <li>يعتبر الحجز مؤكداً بعد إتمام الدفع بنجاح.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-green)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">3) الدفع</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يتم الدفع عبر بطاقات Visa وMastercard.</li>
              <li>في حال فشل عملية الدفع، لا يعتبر الحجز مؤكداً.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">4) الحضور والدخول</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يجب الالتزام بموعد الحجز قدر الإمكان.</li>
              <li>قد يؤدي التأخر الكبير إلى تقليل الوقت المتاح.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">5) سلامة الأطفال</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يلتزم المركز بتوفير بيئة آمنة.</li>
              <li>ولي الأمر مسؤول عن الإفصاح عن أي حالة صحية خاصة.</li>
              <li>يجب الالتزام بتعليمات السلامة.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">6) السلوك داخل المركز</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>يمنع أي سلوك مؤذٍ أو غير لائق.</li>
              <li>يحق للإدارة إيقاف الجلسة عند مخالفة التعليمات.</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-muted">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">10) التواصل</h2>
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
