import { Heart, Shield, Sparkles, Users, MapPin, Clock, Phone } from 'lucide-react';
import PublicPageShell, { WonderSection, WonderSectionTitle, WonderCard } from '../components/PublicPageShell';
import logoImg from '../assets/logo.png';

export default function AboutPage() {
  const values = [
    { icon: Shield, title: 'السلامة أولاً', desc: 'بيئة آمنة ومعدات مطابقة للمعايير', color: 'blue' },
    { icon: Sparkles, title: 'متعة بلا حدود', desc: 'ألعاب متنوعة وأنشطة ممتعة', color: 'yellow' },
    { icon: Heart, title: 'حفلات مميزة', desc: 'أعياد ميلاد وحفلات لا تُنسى', color: 'pink' },
    { icon: Users, title: 'فريق متخصص', desc: 'طاقم مدرب للإشراف والرعاية', color: 'green' },
  ];

  return (
    <PublicPageShell
      title="من نحن"
      subtitle="بيكابو يصنع السعادة"
    >
      {/* Logo */}
      <div className="text-center mb-6">
        <img src={logoImg} alt="بيكابو" className="h-24 mx-auto drop-shadow-lg" />
      </div>

      {/* About Section */}
      <WonderSection>
        <p className="text-lg leading-relaxed text-muted-foreground text-center max-w-2xl mx-auto">
          بيكابو هو ملعب داخلي مخصص للأطفال في إربد، حيث نوفر بيئة آمنة وممتعة للعب والاستكشاف. 
          نؤمن بأن اللعب هو أساس نمو الطفل وتطوره، ونسعى لتقديم تجربة فريدة لكل عائلة تزورنا.
        </p>
      </WonderSection>

      {/* Values Grid */}
      <WonderSection>
        <WonderSectionTitle icon={Heart} iconColor="red">قيمنا</WonderSectionTitle>
        <div className="wonder-card-grid">
          {values.map((item, index) => (
            <WonderCard key={index} color={item.color}>
              <item.icon className={`h-8 w-8 text-[var(--pk-${item.color})] mb-3`} />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </WonderCard>
          ))}
        </div>
      </WonderSection>

      {/* Location */}
      <WonderSection className="text-center">
        <WonderSectionTitle icon={MapPin} iconColor="blue">موقعنا</WonderSectionTitle>
        <div className="space-y-3">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--pk-blue)]" />
            ابو راشد مجمع السيف التجاري، إربد
          </p>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-[var(--pk-green)]" />
            مفتوح يومياً من 10 صباحاً حتى 12 منتصف الليل
          </p>
          <p className="font-bold flex items-center justify-center gap-2">
            <Phone className="h-5 w-5 text-[var(--pk-yellow)]" />
            <span dir="ltr">0777775652</span>
          </p>
        </div>
      </WonderSection>
    </PublicPageShell>
  );
}
