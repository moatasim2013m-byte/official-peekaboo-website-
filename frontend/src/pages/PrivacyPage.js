import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'سياسة الخصوصية | بيكابو';
  }, []);

  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pk-green)] mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">سياسة الخصوصية</h1>
          <p className="text-muted-foreground">نحترم خصوصيتك ونلتزم بحماية بياناتك</p>
        </div>
        
        <div className="booking-card p-6 sm:p-8 space-y-5 text-muted-foreground leading-relaxed">
          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-green)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">1) المعلومات التي نجمعها</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>الاسم ورقم الهاتف والبريد الإلكتروني</li>
              <li>بيانات الأطفال (الاسم/العمر)</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">2) كيفية استخدام المعلومات</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>إنشاء وإدارة الحساب والحجوزات</li>
              <li>إرسال إشعارات وتأكيدات</li>
              <li>تحسين خدماتنا ودعم العملاء</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">3) حماية البيانات</h2>
            <p className="text-sm">نستخدم إجراءات تنظيمية وتقنية لحماية البيانات من الوصول غير المصرح به.</p>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">4) مشاركة المعلومات</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>لا نقوم ببيع بياناتك</li>
              <li>قد نشارك البيانات فقط عند وجود متطلب قانوني</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-[var(--pk-bg-light-green)]">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">5) حقوق المستخدم</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>طلب تعديل بياناتك</li>
              <li>طلب حذف الحساب أو بعض البيانات</li>
            </ul>
          </section>

          <section className="p-4 rounded-xl bg-muted">
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">التواصل</h2>
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
