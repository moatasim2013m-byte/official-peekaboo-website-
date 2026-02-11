import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Clock, Cake, Star, ChevronLeft, Play, Users, Home, X, ZoomIn, Heart } from 'lucide-react';
import mascotImg from '../assets/mascot.png';

const HERO_FALLBACK = '/hero-fallback.jpg';

export default function HomePage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const [gallery, setGallery] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [heroImgSrc, setHeroImgSrc] = useState(HERO_FALLBACK);
  const [heroConfig, setHeroConfig] = useState({
    title: 'حيث يلعب الأطفال ويحتفلون 🎈',
    subtitle: 'أفضل تجربة ملعب داخلي! احجز جلسات اللعب، أقم حفلات أعياد ميلاد لا تُنسى، ووفّر مع باقات الاشتراك',
    ctaText: 'احجز جلسة',
    ctaRoute: '/tickets',
    image: ''
  });

  useEffect(() => {
    document.title = 'بيكابو | ملعب داخلي للأطفال - إربد';
  }, []);

  // Handle ESC key and body scroll
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    if (lightboxOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen]);

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
        // Set hero image src (prefer admin image, fallback if empty)
        if (s.hero_image) {
          setHeroImgSrc(s.hero_image);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    {
      icon: Clock,
      title: 'اللعب بالساعة',
      description: 'احجز جلسات لعب لأطفالك واختر الوقت المثالي!',
      link: '/tickets',
      buttonText: 'احجز الآن',
      badgeColor: 'badge-blue',
      accentColor: 'accent-blue'
    },
    {
      icon: Cake,
      title: 'حفلات أعياد الميلاد',
      description: 'احتفل مع ثيمات رائعة وحفلات مخصصة!',
      link: '/birthday',
      buttonText: 'خطط لحفلتك',
      badgeColor: 'badge-pink',
      accentColor: 'accent-pink'
    },
    {
      icon: Star,
      title: 'الاشتراكات',
      description: 'وفّر مع باقات الزيارات بصلاحية 30 يوم!',
      link: '/subscriptions',
      buttonText: 'اشترك الآن',
      badgeColor: 'badge-yellow',
      accentColor: 'accent-yellow'
    },
    {
      icon: Users,
      title: 'المدارس والمجموعات',
      description: 'رحلات مدرسية وبرامج لعب آمنة للمجموعات',
      link: '/groups',
      buttonText: 'تواصل معنا',
      badgeColor: 'badge-green',
      accentColor: 'accent-green'
    },
    {
      icon: Home,
      title: 'حفلتك في بيتك',
      description: 'نأتيكم للمنزل مع ديكور واحتفال كامل!',
      link: '/home-party',
      buttonText: 'احجز حفلتك',
      badgeColor: 'badge-orange',
      accentColor: 'accent-orange'
    },
    {
      icon: Heart,
      title: 'ذوي الهمم',
      description: 'برامج مخصصة لأصحاب الاحتياجات الخاصة',
      link: null,
      buttonText: 'قريباً',
      badgeColor: 'badge-purple',
      accentColor: 'accent-purple',
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero Section with Sky Background */}
      <section className="home-hero-sky py-12 md:py-20">
        {/* Decorative Sky Layer */}
        <div className="home-sky-layer" aria-hidden="true">
          {/* Sun */}
          <div className="sky-sun"></div>
          {/* Rainbow Arc */}
          <div className="sky-rainbow"></div>
          {/* Clouds */}
          <div className="sky-cloud cloud-1"></div>
          <div className="sky-cloud cloud-2"></div>
          <div className="sky-cloud cloud-3"></div>
          <div className="sky-cloud cloud-4"></div>
          <div className="sky-cloud cloud-5"></div>
          {/* Balloons */}
          <div className="sky-balloon balloon-1"></div>
          <div className="sky-balloon balloon-2"></div>
          {/* Sparkles */}
          <div className="sky-sparkle sparkle-1"></div>
          <div className="sky-sparkle sparkle-2"></div>
          <div className="sky-sparkle sparkle-3"></div>
          <div className="sky-sparkle sparkle-4"></div>
          <div className="sky-sparkle sparkle-5"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 text-center lg:text-right">
              <div className="hero-text-panel">
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight" data-testid="hero-title">
                  بيكابو يصنع السعادة
                </h1>
                <div className="hero-title-underline mx-auto lg:mx-0"></div>
                <p className="text-base sm:text-lg text-muted-foreground mt-6 leading-relaxed max-w-[520px] mx-auto lg:mx-0 opacity-85">
                  {heroConfig.subtitle}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to={heroConfig.ctaRoute}>
                  <Button size="lg" className="rounded-full btn-playful text-base sm:text-lg px-8 py-6 w-full sm:w-auto" data-testid="hero-book-btn">
                    {heroConfig.ctaText}
                    <ChevronLeft className="mr-2 h-5 w-5" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/register">
                    <Button size="lg" variant="outline" className="rounded-full text-base sm:text-lg px-8 py-6 border-2 w-full sm:w-auto" data-testid="hero-signup-btn">
                      سجّل مجاناً
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative order-1 lg:order-2">
              <div 
                className="relative cursor-pointer group"
                onClick={() => setLightboxOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
                data-testid="hero-image-clickable"
              >
                <div className="rounded-3xl overflow-hidden bg-white shadow-xl">
                  <img 
                    src={heroImgSrc}
                    alt="أطفال يلعبون في بيكابو"
                    className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setHeroImgSrc(HERO_FALLBACK)}
                    data-testid="hero-image"
                  />
                </div>
                {/* Zoom hint */}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-4 w-4" />
                  <span>اضغط للتكبير</span>
                </div>
              </div>
              
              {/* Mascot */}
              <img 
                src={mascotImg}
                alt="تميمة بيكابو"
                className="absolute -bottom-4 -left-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-lg object-cover z-10"
              />
              
              {/* Hours Badge */}
              <div className="absolute -bottom-2 right-4 sm:right-8 bg-[var(--pk-yellow)] text-[var(--text-primary)] px-4 sm:px-6 py-2 sm:py-3 rounded-full font-heading font-bold shadow-lg text-sm sm:text-base">
                مفتوح يومياً 10:00 ص - 12:00 ص
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="lightbox-overlay"
          onClick={() => setLightboxOpen(false)}
          data-testid="lightbox-overlay"
        >
          <button 
            className="lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label="إغلاق"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={heroImgSrc}
            alt="أطفال يلعبون في بيكابو - عرض كامل"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
            data-testid="lightbox-image"
          />
        </div>
      )}

      {/* Features Section */}
      <section className="section-container section-yellow mx-4 md:mx-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="features-title">
              ماذا نقدم
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              كل ما تحتاجه ليوم لعب مثالي!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`pk-card ${feature.disabled ? 'opacity-70' : ''}`}
                data-testid={`feature-card-${index}`}
              >
                <div className={`pk-card-accent ${feature.accentColor}`} />
                {feature.disabled && (
                  <div className="absolute top-3 left-3 bg-[var(--pk-purple)] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    قريباً
                  </div>
                )}
                <CardContent className="p-5 pt-9 text-center">
                  <div className={`pk-icon-badge ${feature.badgeColor} ${feature.disabled ? 'grayscale' : ''}`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="pk-card-title text-base">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs mb-5 leading-relaxed">{feature.description}</p>
                  {feature.disabled ? (
                    <Button disabled className="rounded-full w-full opacity-50 cursor-not-allowed" data-testid={`feature-btn-${index}`}>
                      {feature.buttonText}
                    </Button>
                  ) : (
                    <Link to={feature.link}>
                      <Button className="rounded-full btn-playful w-full text-sm" data-testid={`feature-btn-${index}`}>
                        {feature.buttonText}
                        <ChevronLeft className="mr-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="section-container section-green mx-4 md:mx-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="gallery-title">
              لحظات ممتعة في بيكابو
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              شاهد ما يجعلنا مميزين!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {gallery.length > 0 ? (
              gallery.slice(0, 6).map((item, index) => (
                <div 
                  key={item.id} 
                  className={`relative rounded-2xl overflow-hidden shadow-md ${index === 0 ? 'col-span-2 row-span-2' : ''}`}
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
                      className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              ))
            ) : (
              // Placeholder gallery items
              <>
                <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="https://images.pexels.com/photos/19875328/pexels-photo-19875328.jpeg"
                    alt="أطفال يلعبون"
                    className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="https://images.pexels.com/photos/6148511/pexels-photo-6148511.jpeg"
                    alt="حفلة عيد ميلاد"
                    className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="https://images.pexels.com/photos/3951099/pexels-photo-3951099.png"
                    alt="متعة عائلية"
                    className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 md:py-20 mx-4 md:mx-8">
          <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 bg-[var(--pk-red)] rounded-[var(--radius-2xl)] shadow-xl text-center">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6" data-testid="cta-title">
              هل أنت مستعد للمتعة؟
            </h2>
            <p className="text-white/90 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              أنشئ حسابك المجاني لحجز الجلسات، تتبع نقاط الولاء، والحصول على عروض حصرية!
            </p>
            <Link to="/register">
              <Button 
                size="lg" 
                className="rounded-full text-base sm:text-lg px-10 py-6 bg-white text-[var(--pk-red)] hover:bg-gray-100 font-bold shadow-lg"
                data-testid="cta-signup-btn"
              >
                سجّل الآن
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
