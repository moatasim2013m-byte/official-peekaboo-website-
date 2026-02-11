import { MapPin, Phone, Clock, MessageCircle, Mail, Map } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import PublicPageShell, { ContentCard, InfoBlock } from '../components/PublicPageShell';

export default function ContactPage() {
  return (
    <PublicPageShell
      title="تواصل معنا"
      subtitle="نسعد بتواصلكم معنا"
      maxWidth="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <ContentCard className="space-y-5">
          <h2 className="font-heading text-xl font-bold text-foreground">معلومات التواصل</h2>
          
          <InfoBlock color="blue">
            <div className="flex items-start gap-3">
              <MapPin className="h-6 w-6 text-[var(--pk-blue)] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">العنوان</h3>
                <p className="text-sm text-muted-foreground">ابو راشد مجمع السيف التجاري، إربد</p>
              </div>
            </div>
          </InfoBlock>

          <InfoBlock color="yellow">
            <div className="flex items-start gap-3">
              <Phone className="h-6 w-6 text-[var(--pk-yellow)] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">الهاتف</h3>
                <p className="text-sm text-muted-foreground" dir="ltr">0777775652</p>
              </div>
            </div>
          </InfoBlock>

          <InfoBlock color="green">
            <div className="flex items-start gap-3">
              <Clock className="h-6 w-6 text-[var(--pk-green)] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">ساعات العمل</h3>
                <p className="text-sm text-muted-foreground">يومياً من 10 صباحاً حتى 12 منتصف الليل</p>
              </div>
            </div>
          </InfoBlock>

          <InfoBlock color="pink">
            <div className="flex items-start gap-3">
              <Mail className="h-6 w-6 text-[var(--pk-red)] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-foreground mb-1">البريد الإلكتروني</h3>
                <p className="text-sm text-muted-foreground">support@peekaboojor.com</p>
              </div>
            </div>
          </InfoBlock>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a href="https://wa.me/962777775652" target="_blank" rel="noreferrer">
              <Button className="rounded-full w-full bg-[#25D366] hover:bg-[#20BD5A]">
                <MessageCircle className="h-4 w-4 ml-2" />
                واتساب
              </Button>
            </a>
            <a href="tel:0777775652">
              <Button variant="outline" className="rounded-full w-full border-2">
                <Phone className="h-4 w-4 ml-2" />
                اتصل بنا
              </Button>
            </a>
          </div>

          {/* Map Link */}
          <a href="https://share.google/30qIenCYvngQpVUqJ" target="_blank" rel="noreferrer" className="block">
            <Button variant="outline" className="rounded-full w-full border-2 border-[var(--pk-blue)] text-[var(--pk-blue)] hover:bg-[var(--pk-bg-light-blue)]">
              <Map className="h-4 w-4 ml-2" />
              الموقع على الخريطة
            </Button>
          </a>

          {/* Social Links */}
          <div className="pt-3 border-t border-[var(--border-light)]">
            <h3 className="font-bold text-foreground mb-3 text-sm">تابعنا</h3>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/peekaboo_playtime?igsh=cDc1eDQxZmVsZHM%3D&utm_source=qr" target="_blank" rel="noreferrer" className="footer-social-link">
                Instagram
              </a>
              <a href="https://www.facebook.com/profile.php?id=61573636087726" target="_blank" rel="noreferrer" className="footer-social-link">
                Facebook
              </a>
            </div>
          </div>
        </ContentCard>

        {/* Contact Form */}
        <ContentCard>
          <h2 className="font-heading text-xl font-bold text-foreground mb-5">أرسل رسالة</h2>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">الاسم</label>
              <Input placeholder="اسمك الكريم" className="rounded-xl" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
              <Input type="tel" placeholder="07xxxxxxxx" className="rounded-xl" dir="ltr" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5">الرسالة</label>
              <Textarea placeholder="كيف يمكننا مساعدتك؟" className="rounded-xl min-h-[120px]" />
            </div>
            
            <Button type="button" className="rounded-full w-full btn-playful">
              إرسال الرسالة
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              سنرد عليك في أقرب وقت ممكن
            </p>
          </form>
        </ContentCard>
      </div>
    </PublicPageShell>
  );
}
