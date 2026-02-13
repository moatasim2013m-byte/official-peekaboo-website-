import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { ChevronLeft, Play, X, ZoomIn } from 'lucide-react';
import mascotImg from '../assets/mascot.png';
import logoImg from '../assets/logo.png';

const HERO_FALLBACK = '/hero-fallback.jpg';
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

function PlayfulClockIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <circle cx="32" cy="34" r="19" fill="#FFFFFF" />
      <circle cx="32" cy="34" r="13" stroke="#60A5FA" strokeWidth="3" />
      <path d="M32 34V26" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 34L38 38" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 18L14 13" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
      <path d="M44 18L50 13" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PlayfulCakeIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="16" y="31" width="32" height="17" rx="8" fill="#FFFFFF" />
      <path d="M16 37C20 33 24 41 28 37C32 33 36 41 40 37C44 33 48 41 48 37" stroke="#F472B6" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 21V31" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
      <path d="M29.5 22.5C29.5 20.2 31.5 18.5 32 16C32.5 18.5 34.5 20.2 34.5 22.5C34.5 24 33.4 25.2 32 25.2C30.6 25.2 29.5 24 29.5 22.5Z" fill="#FB923C" />
      <circle cx="24" cy="41" r="2" fill="#60A5FA" />
      <circle cx="32" cy="42" r="2" fill="#34D399" />
      <circle cx="40" cy="41" r="2" fill="#FACC15" />
    </svg>
  );
}

function PlayfulCrownIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M16 43L19 23L30 33L32 19L34 33L45 23L48 43H16Z" fill="#FFFFFF" />
      <path d="M16 43H48" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      <circle cx="19" cy="22" r="3" fill="#60A5FA" />
      <circle cx="32" cy="18" r="3" fill="#F472B6" />
      <circle cx="45" cy="22" r="3" fill="#34D399" />
      <path d="M23 37H41" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function PlayfulBusIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="14" y="20" width="36" height="26" rx="8" fill="#FFFFFF" />
      <rect x="19" y="25" width="10" height="8" rx="2" fill="#60A5FA" />
      <rect x="33" y="25" width="12" height="8" rx="2" fill="#34D399" />
      <circle cx="22" cy="47" r="4" fill="#1F2937" />
      <circle cx="42" cy="47" r="4" fill="#1F2937" />
      <path d="M50 30H54" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="17" cy="35" r="2" fill="#F97316" />
    </svg>
  );
}

function PlayfulHomePartyIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M15 31L32 17L49 31" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="30" width="24" height="19" rx="4" fill="#FFFFFF" />
      <rect x="29" y="38" width="6" height="11" rx="2" fill="#F59E0B" />
      <ellipse cx="50" cy="20" rx="5" ry="7" fill="#F472B6" />
      <ellipse cx="42" cy="17" rx="5" ry="7" fill="#60A5FA" />
      <path d="M46 27V34" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlayfulHeartHandsIcon({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <path d="M32 32L27 27C24 24 24 20.5 27 18.5C29.2 17 31.7 17.6 32.9 19.5C34.1 17.6 36.7 17 38.9 18.5C41.9 20.5 41.9 24 38.9 27L32 32Z" fill="#F472B6" />
      <path d="M18 39C18 36.8 19.8 35 22 35H30C31.7 35 33 36.3 33 38C33 39.7 31.7 41 30 41H25" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 39C46 36.8 44.2 35 42 35H34C32.3 35 31 36.3 31 38C31 39.7 32.3 41 34 41H39" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M19 46H28" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 46H45" stroke="#FDE047" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

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
          setHeroImgSrc(resolveMediaUrl(s.hero_image));
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
      icon: PlayfulClockIcon,
      title: 'اللعب بالساعة',
      description: 'احجز جلسات لعب لأطفالك واختر الوقت المثالي!',
      link: '/tickets',
      buttonText: 'احجز الآن',
      badgeColor: 'badge-blue',
      accentColor: 'accent-blue',
      buttonVariant: 'btn-sunrise'
    },
    {
      icon: PlayfulCakeIcon,
      title: 'حفلات أعياد الميلاد',
      description: 'احتفل مع ثيمات رائعة وحفلات مخصصة!',
      link: '/birthday',
      buttonText: 'خطط لحفلتك',
      badgeColor: 'badge-pink',
      accentColor: 'accent-pink',
      buttonVariant: 'btn-cotton-candy'
    },
    {
      icon: PlayfulCrownIcon,
      title: 'الاشتراكات',
      description: 'وفّر مع باقات الزيارات بصلاحية 30 يوم!',
      link: '/subscriptions',
      buttonText: 'اشترك الآن',
      badgeColor: 'badge-yellow',
      accentColor: 'accent-yellow',
      buttonVariant: 'btn-sunshine'
    },
    {
      icon: PlayfulBusIcon,
      title: 'المدارس والمجموعات',
      description: 'رحلات مدرسية وبرامج لعب آمنة للمجموعات',
      link: '/groups',
      buttonText: 'تواصل معنا',
      badgeColor: 'badge-green',
      accentColor: 'accent-green',
      buttonVariant: 'btn-ocean'
    },
    {
      icon: PlayfulHomePartyIcon,
      title: 'حفلتك في بيتك',
      description: 'نأتيكم للمنزل مع ديكور واحتفال كامل!',
      link: '/home-party',
      buttonText: 'احجز حفلتك',
      badgeColor: 'badge-orange',
      accentColor: 'accent-orange',
      buttonVariant: 'btn-sunrise'
    },
    {
      icon: PlayfulHeartHandsIcon,
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
      icon: '💖',
      badgeColor: 'badge-red',
      title: 'رعاية خاصة',
      description: 'فريقنا يتعامل مع الأطفال باهتمام وصبر.'
    },
    {
      icon: '🧼',
      badgeColor: 'badge-orange',
      title: 'نظافة وتعقيم مستمر',
      description: 'تعقيم يومي للألعاب والمناطق لضمان بيئة آمنة.'
    },
    {
      icon: '🎲',
      badgeColor: 'badge-yellow',
      title: 'لعب وتعليم',
      description: 'نتعلم من خلال اللعب وتنمية المهارات الاجتماعية.'
    },
    {
      icon: '🛡️',
      badgeColor: 'badge-blue',
      title: 'مناطق آمنة ومناسبة للعمر',
      description: 'تقسيمات واضحة تناسب أعمار مختلفة.'
    },
    {
      icon: '👨‍👩‍👧‍👦',
      badgeColor: 'badge-green',
      title: 'متابعة وراحة للأهل',
      description: 'جلسات مريحة للأهل ومتابعة للأطفال داخل اللعب.'
    }
  ];

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
                  <Button size="lg" className="rounded-full btn-playful pb-btn text-base sm:text-lg px-8 py-6 w-full sm:w-auto" data-testid="hero-book-btn">
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
                مفتوح يومياً
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
      <section className="section-container home-page-section pb-section page-shell page-section-gap">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              لماذا بيكابو مميز؟
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              لأننا نهتم بالتفاصيل التي تصنع تجربة آمنة وممتعة لطفلك.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {whyPeekabooFeatures.map((feature, index) => (
              <Card key={index} className="pk-card pb-card feature-card">
                <CardContent className="feature-card-content text-center">
                  <div className={`pk-icon-badge ${feature.badgeColor} text-2xl`} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="pk-card-title text-base feature-title">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed feature-description">{feature.description}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
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
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="pk-card-title text-base feature-title">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed feature-description">{feature.description}</p>
                  {feature.disabled ? (
                    <Button disabled className={`playful-btn ${feature.buttonVariant} w-full opacity-50 cursor-not-allowed feature-cta`} data-testid={`feature-btn-${index}`}>
                      {feature.buttonText}
                    </Button>
                  ) : (
                    <Link to={feature.link} className="feature-cta-link">
                      <Button className={`playful-btn ${feature.buttonVariant} w-full text-sm feature-cta`} data-testid={`feature-btn-${index}`}>
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
            <div className="flex justify-center mb-4">
              <img src={logoImg} alt="شعار بيكابو" className="h-16 sm:h-20 drop-shadow-lg" />
            </div>
            <img src={mascotImg} alt="تميمة بيكابو" className="hidden sm:block absolute bottom-3 left-4 w-20 h-20 lg:w-24 lg:h-24 object-contain drop-shadow-lg" />
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6" data-testid="cta-title">
              هل أنت مستعد للمتعة؟
            </h2>
            <p className="text-white/90 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              أنشئ حسابك المجاني لحجز الجلسات، تتبع نقاط الولاء، والحصول على عروض حصرية!
            </p>
            <Link to="/register">
              <Button 
                size="lg" 
                className="rounded-full pb-btn home-cta-signup-btn text-base sm:text-lg px-10 py-6 font-bold shadow-lg"
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
