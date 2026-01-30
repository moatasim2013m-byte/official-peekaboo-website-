export default function TermsPage() {
  return (
    <div className="min-h-screen bg-hero-gradient py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-8">الشروط والأحكام</h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1. القبول بالشروط</h2>
            <p>باستخدامك لخدمات بيكابو، فإنك توافق على الالتزام بهذه الشروط والأحكام.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2. الحجوزات والدفع</h2>
            <p>جميع الحجوزات تخضع للتوفر. يجب إتمام الدفع عند الحجز. لا يمكن استرداد المبالغ المدفوعة بعد تأكيد الحجز.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3. قواعد السلامة</h2>
            <p>يجب على جميع الأطفال الالتزام بقواعد السلامة داخل الملعب. الإشراف الأبوي مطلوب للأطفال دون سن 4 سنوات.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4. الاشتراكات</h2>
            <p>صلاحية الاشتراكات 30 يوماً من تاريخ أول استخدام. الزيارات غير المستخدمة لا تُرحّل للشهر التالي.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5. حفلات أعياد الميلاد</h2>
            <p>يجب الحجز قبل 3 أيام على الأقل. الطلبات المخصصة تخضع للموافقة والتسعير من قبل الإدارة.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6. التواصل</h2>
            <p>للاستفسارات، يرجى التواصل معنا على الرقم: 07 7777 5652</p>
          </section>
        </div>
      </div>
    </div>
  );
}
