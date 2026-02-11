import { Home, Phone, MessageCircle, Sparkles, Gift, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import PublicPageShell, { WonderSection, WonderSectionTitle, WonderCard } from '../components/PublicPageShell';

export default function HomePartyPage() {
  const features = [
    { icon: Sparkles, title: 'ديكور كامل', desc: 'زينة وبالونات حسب الثيم', color: 'pink' },
    { icon: Gift, title: 'هدايا وألعاب', desc: 'أنشطة ومسابقات للأطفال', color: 'yellow' },
    { icon: Music, title: 'أجواء مميزة', desc: 'موسيقى وإضاءة احتفالية', color: 'blue' },
  ];

  return (
    <PublicPageShell
      title="حفلتك في بيتك"
      subtitle="نأتيكم للمنزل مع ديكور واحتفال كامل لطفلك"
      icon={Home}
      iconBg="bg-[var(--pk-orange)]"
      maxWidth="max-w-3xl"
    >
      <WonderSection className="text-center">
        <div className="inline-block px-4 py-2 rounded-full bg-[var(--pk-bg-light-yellow)] text-[var(--pk-orange)] font-bold text-lg mb-4">
          قريباً
        </div>
        <p className="text-muted-foreground mb-6">
          نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://wa.me/962777775652" target="_blank" rel="noreferrer">
            <Button className="rounded-full w-full h-12 text-base bg-[#25D366] hover:bg-[#20BD5A]" data-testid="home-party-whatsapp-btn">
              <MessageCircle className="h-5 w-5 ml-2" />
              واتساب
            </Button>
          </a>
          <a href="tel:0777775652">
            <Button variant="outline" className="rounded-full w-full h-12 text-base border-2" data-testid="home-party-phone-btn">
              <Phone className="h-5 w-5 ml-2" />
              <span dir="ltr">0777775652</span>
            </Button>
          </a>
        </div>
      </WonderSection>

      <WonderSection>
        <WonderSectionTitle icon={Sparkles} iconColor="orange">ماذا نقدم؟</WonderSectionTitle>
        <div className="wonder-card-grid grid-3">
          {features.map((item, index) => (
            <WonderCard key={index} color={item.color}>
              <item.icon className={`h-8 w-8 text-[var(--pk-${item.color === 'pink' ? 'red' : item.color})] mb-2`} />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </WonderCard>
          ))}
        </div>
      </WonderSection>
    </PublicPageShell>
  );
}
