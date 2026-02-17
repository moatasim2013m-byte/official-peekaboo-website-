import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import SkyBackground from '../components/theme/SkyBackground';
import SmilingSun from '../components/theme/SmilingSun';
import MascotVariant from '../components/theme/MascotVariant';
import mascotImg from '../assets/mascot.png';
import logoImg from '../assets/logo.png';
import playHourIcon from '../assets/cartoon-icons/play-clock.svg';
import birthdayCakeIcon from '../assets/cartoon-icons/party-cake.svg';
import crownIcon from '../assets/cartoon-icons/crown.svg';
import schoolBusIcon from '../assets/cartoon-icons/bus.svg';
import homePartyIcon from '../assets/cartoon-icons/house-party.svg';
import careHeartIcon from '../assets/cartoon-icons/heart-care.svg';
import birthdayAccessory from '../assets/mascot-variants/birthday-party.svg';
import playAccessory from '../assets/mascot-variants/play-session.svg';
import subscriptionAccessory from '../assets/mascot-variants/subscription-crown.svg';
import closeIcon from '../assets/cartoon-icons/close.svg';

const RAW_BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim();
const BACKEND_ORIGIN =
  !RAW_BACKEND_URL || RAW_BACKEND_URL === 'undefined' || RAW_BACKEND_URL === 'null'
    ? ''
    : RAW_BACKEND_URL.replace(/\/+$/, '').replace(/\/api$/i, '');

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
  const [showDeferredSections, setShowDeferredSections] = useState(false);
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

  useEffect(() => {
    let timeoutId;
    let idleId;

    const markReady = () => setShowDeferredSections(true);

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(markReady, { timeout: 600 });
    } else {
      timeoutId = window.setTimeout(markReady, 250);
    }

    return () => {
      if (typeof window !== 'undefined' && typeof window.cancelIdleCallback === 'function' && idleId) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
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
    let isActive = true;

    const fetchSettings = async () => {
      try {
        const settingsResult = await api.get('/settings');
        const s = settingsResult?.data?.settings || {};
        if (!isActive) return;

        setHeroConfig((prev) => ({
          title: s.hero_title || prev.title,
          subtitle: s.hero_subtitle || prev.subtitle,
          ctaText: s.hero_cta_text || prev.ctaText,
          ctaRoute: s.hero_cta_route || prev.ctaRoute,
          image: s.hero_image || ''
        }));
        setHeroImgSrc(s.hero_image ? resolveMediaUrl(s.hero_image) : '');
        setHeroImageError(false);
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to fetch settings:', error);
        setHeroImgSrc('');
        setHeroImageError(false);
      } finally {
        if (isActive) {
          // Keep first paint responsive and do not block hero rendering on gallery API latency
          setHeroImageReady(true);
        }
      }
    };

    fetchSettings();

    return () => {
      isActive = false;
    };
  }, [api]);

  useEffect(() => {
    if (!showDeferredSections) return;

    let isActive = true;

    const fetchGallery = async () => {
      try {
        const galleryResult = await api.get('/gallery');
        if (isActive) {
          setGallery(galleryResult?.data?.media || []);
        }
      } catch (error) {
        if (isActive) {
          console.error('Failed to fetch gallery:', error);
        }
      }
    };

    fetchGallery();

    return () => {
      isActive = false;
    };
  }, [api, showDeferredSections]);

  const features = [
    {
      id: 'hourly',
      icon: playHourIcon,
      title: 'اللعب بالساعة',
      description: 'احجز جلسات لعب لأطفالك واختر الوقت المثالي!',
      link: '/tickets',
      buttonText: 'احجز الآن',
      badgeColor: 'badge-blue',
      accentColor: 'accent-blue',
      buttonVariant: 'btn-sunrise'
    },
    {
      id: 'birthdays',
      icon: birthdayCakeIcon,
      title: 'حفلات أعياد الميلاد',
      description: 'احتفل مع ثيمات رائعة وحفلات مخصصة!',
      link: '/birthday',
      buttonText: 'خطط لحفلتك',
      badgeColor: 'badge-pink',
      accentColor: 'accent-pink',
      buttonVariant: 'btn-cotton-candy'
    },
    {
      id: 'subscriptions',
      icon: crownIcon,
      title: 'الاشتراكات',
      description: 'وفّر مع باقات الزيارات بصلاحية 30 يوم!',
      link: '/subscriptions',
      buttonText: 'اشترك الآن',
      badgeColor: 'badge-yellow',
      accentColor: 'accent-yellow',
      buttonVariant: 'btn-sunshine'
    },
    {
      id: 'schools',
      icon: schoolBusIcon,
      title: 'المدارس والمجموعات',
      description: 'رحلات مدرسية وبرامج لعب آمنة للمجموعات',
      link: '/groups',
      buttonText: 'تواصل معنا',
      badgeColor: 'badge-green',
      accentColor: 'accent-green',
      buttonVariant: 'btn-ocean'
    },
    {
      icon: homePartyIcon,
      title: 'حفلتك في بيتك',
      description: 'نأتيكم للمنزل مع ديكور واحتفال كامل!',
      link: '/home-party',
      buttonText: 'احجز حفلتك',
      badgeColor: 'badge-orange',
      accentColor: 'accent-orange',
      buttonVariant: 'btn-sunrise'
    },
    {
      icon: careHeartIcon,
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
  const shroomiPoseClasses = ['shroomi-icon--wave', 'shroomi-icon--point', 'shroomi-icon--cheer'];

  const renderShroomiIcon = (index) => (
    <img
      src={mascotImg}
      alt=""
      aria-hidden="true"
      className={`shroomi-icon ${shroomiPoseClasses[index % shroomiPoseClasses.length]}`}
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <div className="home-page" dir="rtl">
      <SkyBackground className="home-sky-layer" />

      <section id="home" className="home-hero-sky pb-hero pb-section py-14 md:py-24">
        <SmilingSun className="home-sun-corner" />
        <div className="page-shell home-hero-shell px-2 sm:px-4 lg:px-6 relative z-10">
          <div className="hero-content-stack">
            <div className="hero-image-section">
              <div className="hero-text-card text-right" dir="rtl">
                <div className="hero-brand-row mr-0">
                  <img src={logoImg} alt="شعار بيكابو" className="hero-brand-logo" />
                </div>
                <p className="hero-brand-slogan">We bring happiness</p>
                <h1 className="hero-main-title font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight" data-testid="hero-title">
                  {heroConfig.title}
                </h1>
                <div className="hero-title-underline mr-0"></div>
                <p className="hero-description text-base sm:text-lg text-muted-foreground mt-6 leading-relaxed max-w-[520px] mr-0 opacity-85">
                  {heroConfig.subtitle}
                </p>

                <ul className="hero-trust-badges" aria-label="مزايا بيكابو">
                  <li>✔ آمن ومعقم يومياً</li>
                  <li>✔ للأعمار 1–10 سنوات</li>
                  <li>✔ موقعنا: إربد – وحشة سنتر</li>
                </ul>

                <div className="hero-cta-row flex flex-col sm:flex-row gap-4 justify-start">
                  <Link to={heroConfig.ctaRoute}>
                    <Button size="lg" className="rounded-full btn-playful pb-btn primary-btn hero-primary-btn text-base sm:text-lg px-8 py-6 w-full sm:w-auto" data-testid="hero-book-btn">
                      <span className="cta-label-with-shroomi">
                        <span>احجز جلسة</span>
                        {renderShroomiIcon(0)}
                      </span>
                      <span className="mr-2 font-bold" aria-hidden="true">←</span>
                    </Button>
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/register">
                      <Button size="lg" variant="outline" className="rounded-full hero-secondary-btn text-base sm:text-lg px-8 py-6 border-2 w-full sm:w-auto" data-testid="hero-signup-btn">
                        <span className="cta-label-with-shroomi">
                          <span>سجل مجاناً</span>
                          {renderShroomiIcon(1)}
                        </span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              <div
                className={`hero-image-panel group ${canOpenLightbox ? 'is-clickable' : ''}`}
                onClick={() => canOpenLightbox && setLightboxOpen(true)}
                role={canOpenLightbox ? 'button' : undefined}
                tabIndex={canOpenLightbox ? 0 : -1}
                onKeyDown={(e) => canOpenLightbox && e.key === 'Enter' && setLightboxOpen(true)}
                data-testid="hero-image-clickable"
                aria-label="عرض صورة الأطفال بحجم أكبر"
              >
                <span className="sr-only" data-testid="hero-image">أطفال يلعبون في بيكابو</span>
                {!showHeroImage && (
                  <div className={`hero-media-placeholder ${!heroImageReady ? 'is-loading' : ''}`} aria-hidden="true">
                    <div className="hero-media-placeholder__label">Peekaboo</div>
                  </div>
                )}
                {showHeroImage && (
                  <img
                    src={heroImgSrc}
                    alt="أطفال يلعبون في بيكابو"
                    className="hero-photo"
                    loading="eager"
                    decoding="async"
                    fetchPriority="auto"
                    onError={() => setHeroImageError(true)}
                  />
                )}

                {/* Zoom hint */}
                {canOpenLightbox && (
                  <div className="absolute bottom-4 left-4 bg-[var(--pk-blue)]/90 backdrop-blur-sm text-white px-3 py-2 rounded-full text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <span className="font-bold">🔍</span>
                    <span>اضغط للتكبير</span>
                  </div>
                )}
              </div>

              <div className="hero-text-card text-center lg:text-right">
                <div className="hero-brand-row mx-auto lg:mx-0">
                  <img src={logoImg} alt="شعار بيكابو" className="hero-brand-logo" />
                </div>
                <p className="hero-brand-slogan">We bring happiness</p>
                <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight" data-testid="hero-title">
                  {heroConfig.title}
                </h1>
                <div className="hero-title-underline mx-auto lg:mx-0"></div>
                <p className="text-base sm:text-lg text-muted-foreground mt-6 leading-relaxed max-w-[520px] mx-auto lg:mx-0 opacity-85">
                  {heroConfig.subtitle}
                </p>
                <div className="hero-trust-badges" aria-label="مزايا بيكابو">
                  <span className="hero-trust-badge">✔ آمن ومعقم يومياً</span>
                  <span className="hero-trust-badge">✔ للأعمار 1–10 سنوات</span>
                  <span className="hero-trust-badge">✔ موقعنا: إربد – وحشة سنتر</span>
                </div>
              </div>
            </div>

            <div className="hero-cta-row flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={heroConfig.ctaRoute}>
                <Button size="lg" className="rounded-full btn-playful pb-btn primary-btn text-base sm:text-lg px-8 py-6 w-full sm:w-auto" data-testid="hero-book-btn">
                  <span className="cta-label-with-shroomi">
                    <span>{heroConfig.ctaText}</span>
                    {renderShroomiIcon(0)}
                  </span>
                  <span className="mr-2 font-bold" aria-hidden="true">←</span>
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/register">
                  <Button size="lg" variant="outline" className="rounded-full text-base sm:text-lg px-8 py-6 border-2 w-full sm:w-auto" data-testid="hero-signup-btn">
                    <span className="cta-label-with-shroomi">
                      <span>سجل مجاناً</span>
                      {renderShroomiIcon(1)}
                    </span>
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
            <img src={closeIcon} alt="" className="h-6 w-6" />
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

      {showDeferredSections && (
        <>
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

          <div className="rounded-2xl border border-border/70 bg-white/90 p-2 sm:p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-1.5 sm:gap-2">
              {whyPeekabooFeatures.map((feature, index) => (
                <div key={index} className="rounded-lg border border-border/50 bg-background/60 p-2 text-center">
                  <div className={`mx-auto mb-1.5 pk-icon-badge ${feature.badgeColor}`} aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm leading-tight mb-1">{feature.title}</h3>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
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
                id={feature.id}
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
                  <div className={`pk-icon-badge ${feature.disabled ? 'grayscale' : ''}`}>
                    <img src={feature.icon} alt="" className="feature-icon-svg" />
                  </div>
                  <h3 className="pk-card-title text-base feature-title">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed feature-description">{feature.description}</p>
                  {feature.disabled ? (
                    <Button disabled className={`playful-btn primary-btn ${feature.buttonVariant} w-full opacity-50 cursor-not-allowed feature-cta`} data-testid={`feature-btn-${index}`}>
                      <span className="cta-label-with-shroomi">
                        <span>{feature.buttonText}</span>
                        {renderShroomiIcon(index + 2)}
                      </span>
                    </Button>
                  ) : (
                    <Link to={feature.link} className="feature-cta-link">
                      <Button className={`playful-btn primary-btn ${feature.buttonVariant} w-full text-sm feature-cta`} data-testid={`feature-btn-${index}`}>
                        <span className="cta-label-with-shroomi">
                        <span>{feature.buttonText}</span>
                        {feature.id === 'birthdays' && <MascotVariant accessory={birthdayAccessory} alt="" />}
                        {feature.id === 'hourly' && <MascotVariant accessory={playAccessory} alt="" />}
                        {feature.id === 'subscriptions' && <MascotVariant accessory={subscriptionAccessory} alt="" />}
                        {renderShroomiIcon(index + 2)}
                      </span>
                        <span className="mr-2 font-bold" aria-hidden="true">←</span>
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
            <div className="mt-4 inline-flex items-center bg-[var(--pk-red)] text-white px-4 sm:px-6 py-2 rounded-full font-heading font-bold shadow-sm text-sm sm:text-base">
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
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        preload="none"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-5xl" aria-hidden="true">▶️</span>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.url} 
                      alt={item.title || 'صورة من المعرض'} 
                      className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                </div>
              ))
            ) : (
              // Placeholder gallery items
              <>
                <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="/hero-fallback.jpg"
                    alt="أطفال يلعبون"
                    className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="/hero-fallback.jpg"
                    alt="حفلة عيد ميلاد"
                    className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-md">
                  <img 
                    src="/hero-fallback.jpg"
                    alt="متعة عائلية"
                    className="w-full object-cover aspect-square hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
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
                <span className="cta-label-with-shroomi">
                  <span>سجّل الآن</span>
                  {renderShroomiIcon(1)}
                </span>
                <span className="mr-2 font-bold" aria-hidden="true">←</span>
              </Button>
            </Link>
          </div>
        </section>
      )}
        </>
      )}
    </div>
  );
}
