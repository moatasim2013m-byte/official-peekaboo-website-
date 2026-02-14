import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Play, X, ZoomIn } from 'lucide-react';
import mascotImg from '../assets/mascot.png';
import logoImg from '../assets/logo.png';
import { ReactComponent as PlayHourIcon } from '../assets/icons/play-hour.svg';
import { ReactComponent as BirthdayCakeIcon } from '../assets/icons/birthday-cake.svg';
import { ReactComponent as CrownIcon } from '../assets/icons/crown.svg';
import { ReactComponent as SchoolBusIcon } from '../assets/icons/school-bus.svg';
import { ReactComponent as HomePartyIcon } from '../assets/icons/home-party.svg';
import { ReactComponent as CareHeartIcon } from '../assets/icons/care-heart.svg';

const RAW_BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim();
const BACKEND_ORIGIN =
  !RAW_BACKEND_URL || RAW_BACKEND_URL === 'undefined' || RAW_BACKEND_URL === 'null'
    ? ''
    : RAW_BACKEND_URL.replace(/\/+$/, '');

const resolveMediaUrl = (url) => {
  if (!url) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function HomePage() {
  const { isAuthenticated, api } = useAuth();
  const [gallery, setGallery] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [heroImgSrc, setHeroImgSrc] = useState('');
  const [heroImageReady, setHeroImageReady] = useState(false);
  const [heroImageError, setHeroImageError] = useState(false);
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
        // Set hero image src only after settings load to avoid initial image flicker.
        setHeroImgSrc(s.hero_image ? resolveMediaUrl(s.hero_image) : '');
        setHeroImageError(false);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setHeroImgSrc('');
        setHeroImageError(false);
      } finally {
        setHeroImageReady(true);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const features = [
    {
      icon: PlayHourIcon,
      title: 'اللعب بالساعة',
      description: 'احجز جلسات لعب لأطفالك واختر الوقت المثالي!',
      link: '/tickets',
      buttonText: 'احجز الآن',
      badgeColor: 'badge-blue',
      accentColor: 'accent-blue',
      buttonVariant: 'btn-sunrise'
    },
    {
      icon: BirthdayCakeIcon,
      title: 'حفلات أعياد الميلاد',
      description: 'احتفل مع ثيمات رائعة وحفلات مخصصة!',
      link: '/birthday',
      buttonText: 'خطط لحفلتك',
      badgeColor: 'badge-pink',
      accentColor: 'accent-pink',
      buttonVariant: 'btn-cotton-candy'
    },
    {
      icon: CrownIcon,
      title: 'الاشتراكات',
      description: 'وفّر مع باقات الزيارات بصلاحية 30 يوم!',
      link: '/subscriptions',
      buttonText: 'اشترك الآن',
      badgeColor: 'badge-yellow',
      accentColor: 'accent-yellow',
      buttonVariant: 'btn-sunshine'
    },
    {
      icon: SchoolBusIcon,
      title: 'المدارس والمجموعات',
      description: 'رحلات مدرسية وبرامج لعب آمنة للمجموعات',
      link: '/groups',
      buttonText: 'تواصل معنا',
      badgeColor: 'badge-green',
      accentColor: 'accent-green',
      buttonVariant: 'btn-ocean'
    },
    {
      icon: HomePartyIcon,
      title: 'حفلتك في بيتك',
      description: 'نأتيكم للمنزل مع ديكور واحتفال كامل!',
      link: '/home-party',
      buttonText: 'احجز حفلتك',
      badgeColor: 'badge-orange',
      accentColor: 'accent-orange',
      buttonVariant: 'btn-sunrise'
    },
    {
      icon: CareHeartIcon,
      title: 'ذوي الهمم',
      description: 'برامج مخصصة لأصحاب الاحتياجات الخاصة',
      link: null,
      buttonText: 'قريباً',
      badgeColor: 'badge-purple',
      accentColor: 'accent-purple',
      buttonVariant: 'btn-cotton-candy',
      disabled: true
    }
  ];

  const whyPeekabooFeatures = [
    {
      icon: '⭐',
      badgeColor: 'badge-red',
      title: 'عناية واهتمام بكل طفل',
      description: 'نراعي احتياجات كل طفل ونمنحه تجربة مريحة وممتعة.'
    },
    {
      icon: '🧼',
      badgeColor: 'badge-orange',
      title: 'نظافة وتعقيم مستمر',
      description: 'تعقيم مستمر للألعاب والمناطق طوال اليوم.'
    },
    {
      icon: '🧩',
      badgeColor: 'badge-yellow',
      title: 'اللعب للتعلّم وتنمية المهارات',
      description: 'أنشطة تفاعلية تطوّر التفكير والتعاون والثقة.'
    },
    {
      icon: '🛡️',
      badgeColor: 'badge-blue',
      title: 'بيئة آمنة ومراقبة',
      description: 'مساحات لعب آمنة مع متابعة دائمة من الفريق.'
    },
    {
      icon: '🎁',
      badgeColor: 'badge-green',
      title: 'فعاليات وهدايا وتجارب ممتعة',
      description: 'مفاجآت وأنشطة موسمية تجعل كل زيارة مختلفة.'
    }
  ];

  const showHeroImage = heroImageReady && !!heroImgSrc && !heroImageError;
  const canOpenLightbox = showHeroImage;

  return (
    <div className="home-page" dir="rtl">
      {/* Decorative Sky Layer (applies to whole page) */}
      <div className="home-sky-layer cloud-layer" aria-hidden="true">
        {/* Sun */}
        <div className="sky-sun"></div>
        {/* Rainbow Arc */}
        <div className="sky-rainbow"></div>
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

      <section className="home-hero-sky pb-hero pb-section py-14 md:py-24">
        <div className="hero-cloud-layer" aria-hidden="true">
          <div className="sky-cloud cloud-1"></div>
          <div className="sky-cloud cloud-2"></div>
          <div className="sky-cloud cloud-3"></div>
          <div className="sky-cloud cloud-4"></div>
          <div className="sky-cloud cloud-5"></div>
        </div>

        <div className="page-shell px-2 sm:px-4 lg:px-6 relative z-10">
          <div className="hero-content-stack">
            <div className="hero-image-section">
              <div
                className={`hero-image-panel group ${canOpenLightbox ? 'is-clickable' : ''}`}
                onClick={() => canOpenLightbox && setLightboxOpen(true)}
                role={canOpenLightbox ? 'button' : undefined}
                tabIndex={canOpenLightbox ? 0 : -1}
                onKeyDown={(e) => canOpenLightbox && e.key === 'Enter' && setLightboxOpen(true)}
                data-testid="hero-image-clickable"
              >
                <span className="sr-only" data-testid="hero-image">أطفال يلعبون في بيكابو</span>
                {!heroImageReady && <div className="hero-image-placeholder" aria-hidden="true" />}
                {showHeroImage && (
                  <img
                    src={heroImgSrc}
                    alt="أطفال يلعبون في بيكابو"
                    className="hero-photo"
                    onError={() => setHeroImageError(true)}
                  />
                )}
                {heroImageReady && !showHeroImage && <div className="hero-image-fallback" aria-hidden="true" />}

                {/* Zoom hint */}
                {canOpenLightbox && (
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <ZoomIn className="h-4 w-4" />
                    <span>اضغط للتكبير</span>
                  </div>
                )}
              </div>

              <div className="hero-text-card text-center lg:text-right">
                <div className="hero-brand-row mx-auto lg:mx-0">
                  <img src={logoImg} alt="شعار بيكابو" className="hero-brand-logo" />
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight" data-testid="hero-title">
                  بيكابو يصنع السعادة
                </h1>
                <div className="hero-title-underline mx-auto lg:mx-0"></div>
                <p className="text-base sm:text-lg text-muted-foreground mt-6 leading-relaxed max-w-[520px] mx-auto lg:mx-0 opacity-85">
                  {heroConfig.subtitle}
                </p>
              </div>
            </div>

            <div className="hero-cta-row flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={heroConfig.ctaRoute}>
                <Button size="lg" className="rounded-full btn-playful pb-btn primary-btn text-base sm:text-lg px-8 py-6 w-full sm:w-auto" data-testid="hero-book-btn">
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

            {/* Mascot */}
            <img
              src={mascotImg}
              alt="تميمة بيكابو"
              className="hero-mascot"
            />
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
      <section className="section-container home-page-section pb-section page-shell page-section-gap">
        <div className="max-w-7xl mx-auto why-peekaboo-cloud">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              لماذا بيكابو مميّز؟
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              لأننا نهتم بالتفاصيل التي تصنع تجربة آمنة وممتعة لطفلك.
            </p>
          </div>

          <div className="why-peekaboo-grid">
            {whyPeekabooFeatures.map((feature, index) => (
              <Card key={index} className="pk-card pb-card why-feature-card">
                <CardContent className="feature-card-content text-center why-feature-card-content">
                  <div className={`pk-icon-badge ${feature.badgeColor}`} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="pk-card-title text-base feature-title">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed feature-description">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-container home-page-section pb-section page-shell page-section-gap">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="features-title">
              ماذا نقدم
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">
              كل ما تحتاجه ليوم لعب مثالي!
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className={`pk-card pb-card feature-card ${feature.disabled ? 'opacity-70' : ''}`}
                data-testid={`feature-card-${index}`}
              >
                <div className={`pk-card-accent ${feature.accentColor}`} />
                {feature.disabled && (
                  <div className="absolute top-3 left-3 bg-[var(--pk-purple)] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    قريباً
                  </div>
                )}
                <CardContent className="feature-card-content text-center">
                  <div className={`pk-icon-badge ${feature.badgeColor} ${feature.disabled ? 'grayscale' : ''}`}>
                    <feature.icon className="feature-icon-svg text-white" />
                  </div>
                  <h3 className="pk-card-title text-base feature-title">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed feature-description">{feature.description}</p>
                  {feature.disabled ? (
                    <Button disabled className={`playful-btn primary-btn ${feature.buttonVariant} w-full opacity-50 cursor-not-allowed feature-cta`} data-testid={`feature-btn-${index}`}>
                      {feature.buttonText}
                    </Button>
                  ) : (
                    <Link to={feature.link} className="feature-cta-link">
                      <Button className={`playful-btn primary-btn ${feature.buttonVariant} w-full text-sm feature-cta`} data-testid={`feature-btn-${index}`}>
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
      <section className="section-container home-page-section pb-section page-shell page-section-gap">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="gallery-title">
              لحظات ممتعة في بيكابو
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg">
              شاهد ما يجعلنا مميزين!
            </p>
            <div className="mt-4 inline-flex items-center bg-red-500 text-white px-4 sm:px-6 py-2 rounded-full font-heading font-bold shadow-sm text-sm sm:text-base">
              مفتوح يومياً من 10 صباحاً حتى 12 منتصف الليل
            </div>
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
        <section className="pb-section py-16 md:py-20 page-shell page-section-gap">
          <div className="relative overflow-hidden max-w-4xl mx-auto px-6 py-12 md:py-16 home-cta-panel rounded-[var(--radius-2xl)] shadow-xl text-center">
            <div className="cta-cloud-layer" aria-hidden="true">
              <div className="cta-cloud cta-cloud-1"></div>
              <div className="cta-cloud cta-cloud-2"></div>
              <div className="cta-cloud cta-cloud-3"></div>
            </div>
            <div className="flex justify-center mb-4">
              <img src={logoImg} alt="شعار بيكابو" className="h-16 sm:h-20 drop-shadow-lg" />
            </div>
            <img src={mascotImg} alt="تميمة بيكابو" className="hidden sm:block absolute bottom-3 left-4 w-20 h-20 lg:w-24 lg:h-24 object-contain drop-shadow-lg" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-6" data-testid="cta-title">
              هل أنت مستعد للمتعة؟
            </h2>
            <p className="text-[var(--text-secondary)] text-base sm:text-lg mb-8 max-w-xl mx-auto">
              أنشئ حسابك المجاني لحجز الجلسات، تتبع نقاط الولاء، والحصول على عروض حصرية!
            </p>
            <Link to="/register">
              <Button 
                size="lg" 
                className="rounded-full pb-btn home-cta home-cta-signup-btn primary-btn text-base sm:text-lg px-10 py-6 font-bold shadow-lg"
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
