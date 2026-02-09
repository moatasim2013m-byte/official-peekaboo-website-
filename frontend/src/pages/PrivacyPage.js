export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hero-gradient py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-foreground mb-8">سياسة الخصوصية</h1>
        
        <div className="bg-white rounded-3xl p-8 shadow-sm space-y-6 text-muted-foreground leading-relaxed">
          <p className="text-lg font-semibold text-foreground">سياسة الخصوصية – بيكابو</p>
          <p>نحترم خصوصيتك ونلتزم بحماية بياناتك. توضح هذه السياسة كيفية جمع واستخدام وحماية المعلومات عند استخدام موقع بيكابو وإنشاء حساب وإجراء حجوزات.</p>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">1) المعلومات التي نجمعها</h2>
            <p className="mb-2">قد نقوم بجمع المعلومات التالية:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>الاسم</li>
              <li>رقم الهاتف</li>
              <li>البريد الإلكتروني</li>
              <li>بيانات الأطفال التي يضيفها ولي الأمر (مثل الاسم/العمر وأي ملاحظات ضرورية للحجز)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">2) كيفية استخدام المعلومات</h2>
            <p className="mb-2">نستخدم المعلومات للأغراض التالية:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>إنشاء وإدارة الحساب</li>
              <li>إدارة الحجوزات (بالساعة/اشتراك/عيد ميلاد)</li>
              <li>إرسال إشعارات وتأكيدات متعلقة بالحجز</li>
              <li>تحسين خدماتنا وتجربة المستخدم</li>
              <li>دعم العملاء والرد على الاستفسارات</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">3) حماية البيانات</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>نستخدم إجراءات تنظيمية وتقنية معقولة لحماية البيانات من الوصول غير المصرح به أو الاستخدام أو التعديل أو الإفصاح.</li>
              <li>رغم ذلك، لا يمكن ضمان أمان 100% لأي نظام عبر الإنترنت.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">4) مشاركة المعلومات</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>لا نقوم ببيع بياناتك.</li>
              <li>قد نشارك البيانات فقط في الحالات التالية:
                <ul className="list-disc list-inside mr-6 mt-1 space-y-1">
                  <li>عند وجود متطلب قانوني أو أمر رسمي من جهة مختصة</li>
                  <li>مع مزودي خدمات تقنيين يساعدوننا في تشغيل المنصة (ضمن الحدود اللازمة للتشغيل وبما يحقق حماية البيانات)</li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">5) ملفات تعريف الارتباط (Cookies)</h2>
            <p>قد نستخدم ملفات تعريف الارتباط لتحسين التجربة وتحليل الاستخدام. يمكنك التحكم بالكوكيز من إعدادات المتصفح.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">6) مدة الاحتفاظ بالبيانات</h2>
            <p>نحتفظ بالبيانات للمدة اللازمة لتقديم الخدمة أو للامتثال للمتطلبات القانونية والتنظيمية.</p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">7) حقوق المستخدم</h2>
            <p className="mb-2">يحق لك:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>طلب تعديل بياناتك</li>
              <li>طلب حذف الحساب أو بعض البيانات (قدر الإمكان حسب المتطلبات القانونية والتشغيلية)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">8) التواصل</h2>
            <p>الهاتف: 0777775652</p>
            <p>البريد الإلكتروني: support2peekaboojor.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
