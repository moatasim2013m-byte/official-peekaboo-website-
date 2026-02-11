import { Users, Phone, MessageCircle, Calendar, Shield, Smile } from 'lucide-react';
import { Button } from '../components/ui/button';
import PublicPageShell, { WonderSection, WonderSectionTitle, WonderCard } from '../components/PublicPageShell';

export default function GroupsPage() {
  const features = [
    { icon: Shield, title: 'بيئة آمنة', desc: 'إشراف كامل وتعليمات سلامة', color: 'blue' },
    { icon: Smile, title: 'متعة للجميع', desc: 'أنشطة متنوعة تناسب كل الأعمار', color: 'yellow' },
    { icon: Calendar, title: 'حجز مرن', desc: 'مواعيد تناسب جدول المدرسة', color: 'green' },
  ];

  return (
    <PublicPageShell
      title="المدارس والمجموعات"
      subtitle="رحلات مدرسية وبرامج لعب آمنة للمجموعات"
      icon={Users}
      iconBg="bg-[var(--pk-green)]"
      maxWidth="max-w-3xl"
    >
      <WonderSection className="text-center">
        <div className="inline-block px-4 py-2 rounded-full bg-[var(--pk-bg-light-green)] text-[var(--pk-green)] font-bold text-lg mb-4">
          قريباً
        </div>
        <p className="text-muted-foreground mb-6">
          نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://wa.me/962777775652" target="_blank" rel="noreferrer">
            <Button className="rounded-full w-full h-12 text-base bg-[#25D366] hover:bg-[#20BD5A]" data-testid="groups-whatsapp-btn">
              <MessageCircle className="h-5 w-5 ml-2" />
              واتساب
            </Button>
          </a>
          <a href="tel:0777775652">
            <Button variant="outline" className="rounded-full w-full h-12 text-base border-2" data-testid="groups-phone-btn">
              <Phone className="h-5 w-5 ml-2" />
              <span dir="ltr">0777775652</span>
            </Button>
          </a>
        </div>
      </WonderSection>

      <WonderSection>
        <WonderSectionTitle icon={Users} iconColor="green">مميزات الخدمة</WonderSectionTitle>
        <div className="wonder-card-grid grid-3">
          {features.map((item, index) => (
            <WonderCard key={index} color={item.color}>
              <item.icon className={`h-8 w-8 text-[var(--pk-${item.color})] mb-2`} />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </WonderCard>
          ))}
        </div>
      </WonderSection>
    </PublicPageShell>
  );
}
