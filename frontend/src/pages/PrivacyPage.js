import { Shield } from 'lucide-react';
import PublicPageShell, { ContentCard, InfoBlock } from '../components/PublicPageShell';

export default function PrivacyPage() {
  return (
    <PublicPageShell
      title="سياسة الخصوصية"
      subtitle="نحترم خصوصيتك ونلتزم بحماية بياناتك"
      icon={Shield}
      iconBg="bg-[var(--pk-green)]"
    >
      <ContentCard className="space-y-5 text-muted-foreground leading-relaxed">
        <InfoBlock title="1) المعلومات التي نجمعها" color="green">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>الاسم ورقم الهاتف والبريد الإلكتروني</li>
            <li>بيانات الأطفال (الاسم/العمر)</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="2) كيفية استخدام المعلومات" color="blue">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>إنشاء وإدارة الحساب والحجوزات</li>
            <li>إرسال إشعارات وتأكيدات</li>
            <li>تحسين خدماتنا ودعم العملاء</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="3) حماية البيانات" color="yellow">
          <p className="text-sm">نستخدم إجراءات تنظيمية وتقنية لحماية البيانات من الوصول غير المصرح به.</p>
        </InfoBlock>

        <InfoBlock title="4) مشاركة المعلومات" color="pink">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>لا نقوم ببيع بياناتك</li>
            <li>قد نشارك البيانات فقط عند وجود متطلب قانوني</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="5) حقوق المستخدم" color="green">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>طلب تعديل بياناتك</li>
            <li>طلب حذف الحساب أو بعض البيانات</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="التواصل" color="muted">
          <p className="text-sm">الهاتف: <span dir="ltr" className="font-bold">0777775652</span></p>
          <p className="text-sm">البريد: support@peekaboojor.com</p>
        </InfoBlock>
      </ContentCard>
    </PublicPageShell>
  );
}
