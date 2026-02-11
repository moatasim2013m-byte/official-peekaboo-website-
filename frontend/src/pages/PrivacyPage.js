import { Shield, Phone, Mail } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';

export default function PrivacyPage() {
  const sections = [
    { num: '1', title: 'المعلومات التي نجمعها', color: 'green', items: ['الاسم ورقم الهاتف والبريد الإلكتروني', 'بيانات الأطفال (الاسم/العمر)'] },
    { num: '2', title: 'كيفية استخدام المعلومات', color: 'blue', items: ['إنشاء وإدارة الحساب والحجوزات', 'إرسال إشعارات وتأكيدات', 'تحسين خدماتنا ودعم العملاء'] },
    { num: '3', title: 'حماية البيانات', color: 'yellow', text: 'نستخدم إجراءات تنظيمية وتقنية لحماية البيانات من الوصول غير المصرح به.' },
    { num: '4', title: 'مشاركة المعلومات', color: 'pink', items: ['لا نقوم ببيع بياناتك', 'قد نشارك البيانات فقط عند وجود متطلب قانوني'] },
    { num: '5', title: 'حقوق المستخدم', color: 'green', items: ['طلب تعديل بياناتك', 'طلب حذف الحساب أو بعض البيانات'] },
  ];

  return (
    <PublicPageShell
      title="سياسة الخصوصية"
      subtitle="نحترم خصوصيتك ونلتزم بحماية بياناتك"
      icon={Shield}
      iconBg="bg-[var(--pk-green)]"
    >
      <WonderSection>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.num} className={`wonder-card wonder-card-${section.color}`}>
              <h3 className="font-heading font-bold text-foreground mb-2">{section.num}) {section.title}</h3>
              {section.items ? (
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {section.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{section.text}</p>
              )}
            </div>
          ))}
        </div>
      </WonderSection>

      <WonderSection className="text-center">
        <WonderSectionTitle icon={Phone} iconColor="blue">التواصل</WonderSectionTitle>
        <p className="text-muted-foreground mb-1">
          <Phone className="inline h-4 w-4 ml-1" />
          <span dir="ltr" className="font-bold">0777775652</span>
        </p>
        <p className="text-muted-foreground">
          <Mail className="inline h-4 w-4 ml-1" />
          support@peekaboojor.com
        </p>
      </WonderSection>
    </PublicPageShell>
  );
}
