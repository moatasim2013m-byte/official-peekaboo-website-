import { MapPin, Phone, Clock, MessageCircle, Mail, Map } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import PublicPageShell, { WonderSection, WonderSectionTitle } from '../components/PublicPageShell';
import { FacebookLogoIcon, InstagramLogoIcon } from '../components/SocialBrandIcons';
import mascotImg from '../assets/mascot.png';

export default function ContactPage() {
  const contactInfo = [
    { icon: MapPin, title: 'العنوان', value: 'ابو راشد مجمع السيف التجاري، إربد', color: 'blue' },
    { icon: Phone, title: 'الهاتف', value: '0777775652', dir: 'ltr', color: 'yellow' },
    { icon: Clock, title: 'ساعات العمل', value: 'يومياً من 10 صباحاً حتى 12 منتصف الليل', color: 'green' },
    { icon: Mail, title: 'البريد الإلكتروني', value: 'support@peekaboojor.com', color: 'pink' },
  ];

  return (
    <PublicPageShell
      title="تواصل معنا"
      subtitle="نسعد بتواصلكم معنا"
      maxWidth="max-w-5xl"
    >
      <div className="shroomi-promo shroomi-promo--contact">
        <img src={mascotImg} alt="Shroomi with heart" className="shroomi-promo__img shroomi-promo__img--heart" />
        <span className="shroomi-promo__text">Get in Touch!</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Info */}
        <WonderSection>
          <WonderSectionTitle icon={Phone} iconColor="blue">معلومات التواصل</WonderSectionTitle>
          
          <div className="space-y-4 mb-6">
            {contactInfo.map((item, index) => (
              <div key={index} className="contact-info-card">
                <span className={`icon-badge icon-badge-${item.color}`}>
                  <item.icon />
                </span>
                <div>
                  <h3 className="font-bold text-foreground mb-0.5 text-sm">{item.title}</h3>
                  <p className="text-muted-foreground text-sm" dir={item.dir || 'rtl'}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
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
          <a href="https://share.google/30qIenCYvngQpVUqJ" target="_blank" rel="noreferrer" className="block mb-4">
            <Button variant="outline" className="rounded-full w-full border-2 border-[var(--pk-blue)] text-[var(--pk-blue)] hover:bg-[var(--pk-bg-light-blue)]">
              <Map className="h-4 w-4 ml-2" />
              الموقع على الخريطة
            </Button>
          </a>

          {/* Social Links */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-foreground mb-3 text-sm">تابعنا</h3>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/peekaboo_playtime?igsh=cDc1eDQxZmVsZHM%3D&utm_source=qr"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <InstagramLogoIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61573636087726"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <FacebookLogoIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </WonderSection>

        {/* Contact Form */}
        <WonderSection>
          <WonderSectionTitle icon={Mail} iconColor="red">أرسل رسالة</WonderSectionTitle>
          
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
        </WonderSection>
      </div>
    </PublicPageShell>
  );
}
