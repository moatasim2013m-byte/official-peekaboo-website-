import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Clock, Cake, Star, ChevronRight, Play } from 'lucide-react';
import mascotImg from '../assets/mascot.png';

export default function HomePage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const [gallery, setGallery] = useState([]);
  const [heroConfig, setHeroConfig] = useState({
    title: 'حيث يلعب الأطفال ويحتفلون 🎈',
    subtitle: 'أفضل تجربة ملعب داخلي! احجز جلسات اللعب، أقم حفلات أعياد ميلاد لا تُنسى، ووفّر مع باقات الاشتراك',
    ctaText: 'احجز جلسة',
    ctaRoute: '/tickets',
    image: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [galleryRes, settingsRes] = await Promise.all([
          api.get('/gallery'),
          api.get('/settings')
        ]);
        setGallery(galleryRes.data.media || []);
        
        // Load hero config from settings
        const s = settingsRes.data.settings || {};
        setHeroConfig({
          title: s.hero_title || heroConfig.title,
          subtitle: s.hero_subtitle || heroConfig.subtitle,
          ctaText: s.hero_cta_text || heroConfig.ctaText,
          ctaRoute: s.hero_cta_route || heroConfig.ctaRoute,
          image: s.hero_image || ''
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const features = [
    {
      icon: Clock,
      title: 'اللعب بالساعة',
      description: 'احجز جلسات لعب لأطفالك. اختر الوقت المثالي!',
      link: '/tickets',
      color: 'bg-primary',
      buttonText: 'احجز الآن'
    },
    {
      icon: Cake,
      title: 'حفلات أعياد الميلاد',
      description: 'احتفل مع 10 ثيمات رائعة! حفلات مخصصة متاحة أيضاً.',
      link: '/birthday',
      color: 'bg-accent',
      buttonText: 'خطط لحفلتك'
    },
    {
      icon: Star,
      title: 'الاشتراكات',
      description: 'وفّر مع باقات الزيارات. صلاحية 30 يوم، متعة بلا حدود!',
      link: '/subscriptions',
      color: 'bg-secondary',
      buttonText: 'اشترك الآن'
    }
  ];

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero Section */}
      <section className="bg-hero-gradient py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground mb-6" data-testid="hero-title">
                حيث يلعب الأطفال ويحتفلون <span className="text-primary">🎈</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                أفضل تجربة ملعب داخلي! احجز جلسات اللعب، أقم حفلات أعياد ميلاد لا تُنسى، ووفّر مع باقات الاشتراك
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/tickets">
                  <Button size="lg" className="rounded-full btn-playful text-lg px-8" data-testid="hero-book-btn">
                    احجز جلسة
                    <ChevronRight className="mr-2 h-5 w-5 rotate-180" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="rounded-full text-lg px-8" data-testid="hero-signup-btn">
                      سجّل مجاناً
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative order-1 md:order-2">
              <img 
                src="https://images.pexels.com/photos/19875328/pexels-photo-19875328.jpeg"
                alt="أطفال يلعبون في بيكابو"
                className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                data-testid="hero-image"
              />
              {/* Mascot peeking */}
              <img 
                src={mascotImg}
                alt="تميمة بيكابو"
                className="absolute -bottom-6 -left-4 w-28 h-28 rounded-full border-4 border-white shadow-lg object-cover"
              />
              <div className="absolute -bottom-4 -right-4 bg-[var(--peekaboo-yellow)] text-foreground px-6 py-3 rounded-full font-heading font-bold shadow-lg">
                مفتوح يومياً 10:00 ص - 12:00 ص
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4" data-testid="features-title">
              ماذا نقدم
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              كل ما تحتاجه ليوم لعب مثالي!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="border-2 rounded-3xl card-interactive overflow-hidden"
                data-testid={`feature-card-${index}`}
              >
                <CardContent className="p-8 text-center">
                  <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-heading text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <Link to={feature.link}>
                    <Button className="rounded-full btn-playful w-full" data-testid={`feature-btn-${index}`}>
                      {feature.buttonText}
                      <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-4" data-testid="gallery-title">
              لحظات ممتعة في بيكابو
            </h2>
            <p className="text-muted-foreground text-lg">
              شاهد ما يجعلنا مميزين!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {gallery.length > 0 ? (
              gallery.slice(0, 6).map((item, index) => (
                <div 
                  key={item.id} 
                  className={`relative rounded-2xl overflow-hidden ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
                  data-testid={`gallery-item-${index}`}
                >
                  {item.type === 'video' ? (
                    <div className="relative aspect-square bg-muted">
                      <video src={item.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.title || 'صورة من المعرض'} 
                      className={`w-full object-cover ${index === 0 ? 'aspect-square' : 'aspect-square'}`}
                    />
                  )}
                </div>
              ))
            ) : (
              // Placeholder gallery items
              <>
                <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/19875328/pexels-photo-19875328.jpeg"
                    alt="أطفال يلعبون"
                    className="w-full h-full object-cover aspect-square"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/6148511/pexels-photo-6148511.jpeg"
                    alt="حفلة عيد ميلاد"
                    className="w-full object-cover aspect-square"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img 
                    src="https://images.pexels.com/photos/3951099/pexels-photo-3951099.png"
                    alt="متعة عائلية"
                    className="w-full object-cover aspect-square"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 md:py-24 bg-primary">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6" data-testid="cta-title">
              هل أنت مستعد للمتعة؟
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              أنشئ حسابك المجاني لحجز الجلسات، تتبع نقاط الولاء، والحصول على عروض حصرية!
            </p>
            <Link to="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="rounded-full text-lg px-10 btn-playful"
                data-testid="cta-signup-btn"
              >
                سجّل الآن
                <ChevronRight className="mr-2 h-5 w-5 rotate-180" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
