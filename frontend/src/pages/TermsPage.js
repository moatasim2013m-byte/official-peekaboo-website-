export default function TermsPage() {
  return (
    <div className="min-h-screen bg-hero-gradient py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-8">الشروط والأحكام</h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg font-semibold text-foreground">الشروط والأحكام – بيكابو للألعاب الداخلية</p>
          <p>باستخدامك لموقع بيكابو أو إنشاء حساب أو إجراء أي حجز، فإنك توافق على هذه الشروط والأحكام بالكامل.</p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1) إنشاء الحساب</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يجب إدخال معلومات صحيحة وحديثة.</li>
              <li>المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول، وأي استخدام يتم عبر الحساب يعتبر مسؤولية صاحب الحساب.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2) الخدمات والحجوزات</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>تشمل خدماتنا: اللعب بالساعة، الاشتراكات، حفلات أعياد الميلاد، وأي عروض يتم الإعلان عنها داخل الموقع.</li>
              <li>يعتبر الحجز مؤكداً بعد إتمام الدفع بنجاح واستلام رسالة تأكيد داخل النظام أو عبر وسائل التواصل المعتمدة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3) الدفع</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يتم الدفع حالياً عبر بطاقات Visa وMastercard.</li>
              <li>في حال فشل عملية الدفع أو عدم اكتمالها، لا يعتبر الحجز مؤكداً.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4) الحضور والدخول</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يجب الالتزام بموعد الحجز قدر الإمكان.</li>
              <li>قد يؤدي التأخر الكبير إلى تقليل الوقت المتاح دون تعويض (حسب الازدحام والجدول).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5) سلامة الأطفال والمسؤولية</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يلتزم المركز بتوفير بيئة آمنة قدر الإمكان وفق الإجراءات المعتمدة.</li>
              <li>ولي الأمر مسؤول عن الإفصاح عن أي حالة صحية/حساسية/احتياج خاص لدى الطفل قبل الدخول.</li>
              <li>يجب الالتزام بتعليمات السلامة واللوحات الإرشادية وتعليمات الموظفين داخل المركز.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6) السلوك داخل المركز</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يمنع أي سلوك مؤذٍ أو غير لائق (عنف، تخريب، ألفاظ غير مناسبة، إزعاج متكرر).</li>
              <li>يحق للإدارة إيقاف الجلسة وإخراج الطفل/الزائر عند مخالفة التعليمات دون تعويض.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7) إيقاف أو تعليق الحساب</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يحق للإدارة تعليق أو إلغاء الحساب عند إساءة الاستخدام، أو تقديم معلومات غير صحيحة، أو مخالفة الشروط والسياسات.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">8) الملكية الفكرية</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>جميع محتويات الموقع (نصوص/تصاميم/شعارات/صور) هي ملك لبيكابو ولا يجوز استخدامها دون إذن.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">9) التعديلات</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>تحتفظ الإدارة بحق تعديل الشروط والأحكام في أي وقت. استمرار الاستخدام بعد التعديل يعني الموافقة على النسخة المحدثة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">10) التواصل</h2>
            <p>الهاتف: 0777775652</p>
            <p>البريد الإلكتروني: support2peekaboojor.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
