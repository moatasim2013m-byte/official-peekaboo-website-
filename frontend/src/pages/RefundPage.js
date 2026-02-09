export default function RefundPage() {
  return (
    <div className="min-h-screen bg-hero-gradient py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-8">سياسة الاسترجاع والاسترداد</h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg font-semibold text-foreground">سياسة الاسترجاع والاسترداد – بيكابو</p>
          <p>توضح هذه السياسة قواعد الإلغاء وإعادة الجدولة والاسترداد للحجوزات والمدفوعات داخل بيكابو.</p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1) تذاكر اللعب بالساعة</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>لا يتم استرداد قيمة التذكرة بعد بدء الاستخدام.</li>
              <li>في حالات استثنائية جداً (عطل تشغيلي من طرفنا) قد يتم تعويض العميل بجلسة بديلة أو رصيد حسب تقدير الإدارة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2) الاشتراكات</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>الاشتراكات غير قابلة للاسترداد بعد التفعيل/البدء باستخدامها.</li>
              <li>يمكن معالجة حالات استثنائية فقط عند وجود خطأ تقني واضح يمنع الاستفادة، وبعد التحقق من الإدارة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3) حفلات أعياد الميلاد</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>يمكن إعادة الجدولة قبل 48 ساعة على الأقل من موعد الحفل (حسب توفر المواعيد).</li>
              <li>عند الإلغاء المتأخر أو عدم الحضور لا يتم استرداد المبلغ.</li>
              <li>أي دفعات/عربون تعتبر لتثبيت الحجز وقد لا تكون قابلة للاسترداد حسب تفاصيل الباقة.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4) عدم الحضور (No-Show)</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>عدم الحضور في موعد الحجز دون إشعار مسبق ضمن المدة المحددة يعني عدم وجود استرداد.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5) طريقة تقديم الطلب</h2>
            <p className="mb-2">لتقديم طلب يتعلق بالاسترجاع/التعديل/الاستفسار:</p>
            <p>الهاتف: 0777775652</p>
            <p>البريد الإلكتروني: support2peekaboojor.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
