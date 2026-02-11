import { FileText } from 'lucide-react';
import PublicPageShell, { ContentCard, InfoBlock } from '../components/PublicPageShell';

export default function TermsPage() {
  return (
    <PublicPageShell
      title="الشروط والأحكام"
      subtitle="بيكابو للألعاب الداخلية"
      icon={FileText}
      iconBg="bg-[var(--pk-blue)]"
    >
      <ContentCard className="space-y-5 text-muted-foreground leading-relaxed">
        <p className="text-sm">باستخدامك لموقع بيكابو أو إنشاء حساب أو إجراء أي حجز، فإنك توافق على هذه الشروط والأحكام بالكامل.</p>

        <InfoBlock title="1) إنشاء الحساب" color="blue">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يجب إدخال معلومات صحيحة وحديثة.</li>
            <li>المستخدم مسؤول عن الحفاظ على سرية بيانات الدخول.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="2) الخدمات والحجوزات" color="yellow">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>تشمل خدماتنا: اللعب بالساعة، الاشتراكات، حفلات أعياد الميلاد.</li>
            <li>يعتبر الحجز مؤكداً بعد إتمام الدفع بنجاح.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="3) الدفع" color="green">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يتم الدفع عبر بطاقات Visa وMastercard.</li>
            <li>في حال فشل عملية الدفع، لا يعتبر الحجز مؤكداً.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="4) الحضور والدخول" color="pink">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يجب الالتزام بموعد الحجز قدر الإمكان.</li>
            <li>قد يؤدي التأخر الكبير إلى تقليل الوقت المتاح.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="5) سلامة الأطفال" color="blue">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يلتزم المركز بتوفير بيئة آمنة.</li>
            <li>ولي الأمر مسؤول عن الإفصاح عن أي حالة صحية خاصة.</li>
            <li>يجب الالتزام بتعليمات السلامة.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="6) السلوك داخل المركز" color="yellow">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>يمنع أي سلوك مؤذٍ أو غير لائق.</li>
            <li>يحق للإدارة إيقاف الجلسة عند مخالفة التعليمات.</li>
          </ul>
        </InfoBlock>

        <InfoBlock title="10) التواصل" color="muted">
          <p className="text-sm">الهاتف: <span dir="ltr" className="font-bold">0777775652</span></p>
          <p className="text-sm">البريد: support@peekaboojor.com</p>
        </InfoBlock>
      </ContentCard>
    </PublicPageShell>
  );
}
