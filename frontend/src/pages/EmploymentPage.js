import { useState } from 'react';
import { Briefcase, Send, Loader2 } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function EmploymentPage() {
  const { api } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    position: '',
    availability: '',
    experience: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim() || !form.position.trim()) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/employment/apply', form);
      toast.success('تم إرسال طلبك بنجاح، سنتواصل معك قريباً');
      setForm({
        full_name: '',
        phone: '',
        email: '',
        position: '',
        availability: '',
        experience: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'تعذر إرسال الطلب حالياً');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicPageShell
      title="التوظيف"
      subtitle="انضم إلى فريق بيكابو"
      maxWidth="max-w-3xl"
    >
      <WonderSection>
        <WonderSectionTitle icon={Briefcase} iconColor="green">قدم للعمل معنا</WonderSectionTitle>
        <Card className="rounded-3xl border-2 border-dashed border-[var(--pk-green)]/30 bg-[var(--pk-bg-light-green)]/20 mb-6">
          <CardContent className="p-4 text-sm text-[var(--text-secondary)] leading-7">
            نبحث عن أشخاص ودودين يحبون العمل مع الأطفال. املأ النموذج التالي وسيتواصل معك فريقنا عند توفر فرصة مناسبة.
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
          <div>
            <label className="text-sm font-medium">الاسم الكامل *</label>
            <Input
              className="rounded-xl mt-1"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">رقم الهاتف *</label>
              <Input
                className="rounded-xl mt-1"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                className="rounded-xl mt-1"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">الوظيفة المطلوبة *</label>
              <Input
                className="rounded-xl mt-1"
                placeholder="مثال: مشرف ألعاب"
                value={form.position}
                onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">أوقات التفرغ</label>
              <Input
                className="rounded-xl mt-1"
                placeholder="صباحي / مسائي / كامل"
                value={form.availability}
                onChange={(e) => setForm((prev) => ({ ...prev, availability: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">الخبرات السابقة</label>
            <Textarea
              className="rounded-xl mt-1 min-h-[120px]"
              placeholder="اكتب نبذة عن خبرتك في العمل..."
              value={form.experience}
              onChange={(e) => setForm((prev) => ({ ...prev, experience: e.target.value }))}
            />
          </div>

          <Button type="submit" className="rounded-full w-full btn-playful" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
            إرسال الطلب
          </Button>
        </form>
      </WonderSection>
    </PublicPageShell>
  );
}
