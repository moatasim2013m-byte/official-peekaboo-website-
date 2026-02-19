import './PeekabooHappyThemePage.css';

const featureCards = [
  { icon: '🛡️', title: 'أمان مدروس', text: 'رقابة مستمرة ومساحات لعب آمنة لكل الأعمار.' },
  { icon: '🧼', title: 'نظافة يومية', text: 'تعقيم مستمر للألعاب والمناطق على مدار اليوم.' },
  { icon: '🎉', title: 'حفلات مبهجة', text: 'تنظيم احترافي لحفلات عيد الميلاد مع تفاصيل مميزة.' },
  { icon: '👩‍🏫', title: 'فريق متخصص', text: 'طاقم ودود ومدرب على التعامل مع الأطفال بلطف.' },
  { icon: '📍', title: 'موقع مناسب', text: 'في الأردن بخدمات حجز سهلة وتجربة عائلية مريحة.' }
];

const galleryTiles = ['فقاعات المرح', 'مدينة القفز', 'زاوية الرسم', 'مسار المغامرة', 'ركن الرضع', 'ركن الأنشطة'];

const uiComponents = [
  { title: 'Sky Layer', subtitle: 'غيم + شمس + كونفيتي' },
  { title: 'Leaf Layer', subtitle: 'زوايا أوراق ناعمة' },
  { title: 'Wave Divider', subtitle: 'فاصل مائي مرن' },
  { title: 'Cloud Divider', subtitle: 'فاصل سحابي لطيف' },
  { title: 'Icon Badge', subtitle: 'شارة دائرية للأيقونات' },
  { title: 'Premium Card', subtitle: 'بطاقات بزوايا دائرية' }
];

const colorPalette = [
  '#FFD93B',
  '#FF595E',
  '#FF924C',
  '#8AC926',
  '#00BBF9'
];

export default function PeekabooHappyThemePage() {
  return (
    <section className="peekaboo-theme-page" dir="rtl">
      <div className="pk-shell">
        <header className="pk-intro-card">
          <p className="pk-label">Peekaboo UI Direction</p>
          <h1>تصميم واجهة منزلية مرحة وPremium لملاهي Peekaboo</h1>
          <p>
            تصميم عربي بالكامل (RTL) يحافظ على البساطة الاحترافية مع طاقة طفولية مليئة بالألوان والود.
            المخرجات تتضمن إطار Desktop بعرض 1440px وإطار Mobile بعرض 390px مع مكتبة مكونات جاهزة.
          </p>
        </header>

        <section className="pk-components-card">
          <div className="pk-components-head">
            <h2>مكتبة المكونات</h2>
            <div className="pk-palette-row">
              {colorPalette.map((color) => (
                <span key={color} className="pk-color-dot" style={{ background: color }} aria-hidden="true" />
              ))}
            </div>
          </div>

          <div className="pk-component-grid">
            {uiComponents.map((item) => (
              <article key={item.title} className="pk-component-item">
                <span className="pk-badge-icon">✨</span>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </article>
            ))}
          </div>

          <div className="pk-button-row">
            <button className="pk-btn pk-btn-primary" type="button">🐣 احجز جلسة</button>
            <button className="pk-btn pk-btn-secondary" type="button">🎈 سجل مجاناً</button>
          </div>
        </section>

        <section className="pk-frames-grid">
          <article className="pk-frame desktop">
            <div className="pk-frame-title">
              <strong>Desktop Frame</strong>
              <span>1440px</span>
            </div>

            <div className="pk-home-preview">
              <section className="pk-section pk-sky-section">
                <span className="pk-sun" aria-hidden="true">😊</span>
                <div className="pk-hero-grid">
                  <div className="pk-hero-card">
                    <span className="pk-logo-pill">Peekaboo Jordan</span>
                    <h3>نحن نصنع السعادة</h3>
                    <p className="pk-headline">مساحة لعب داخلية آمنة ومبهجة لأطفالكم في الأردن</p>
                    <p className="pk-sub">أنشطة ممتعة، حفلات مميزة، وتجربة عائلية مريحة بطابع عربي حديث.</p>
                    <div className="pk-button-row">
                      <button className="pk-btn pk-btn-primary" type="button">🐥 احجز جلسة</button>
                      <button className="pk-btn pk-btn-secondary" type="button">🎀 سجل مجاناً</button>
                    </div>
                  </div>
                  <div className="pk-photo-panel">
                    <span>صورة البطل الرئيسية</span>
                  </div>
                </div>
                <div className="pk-cloud-divider" aria-hidden="true" />
              </section>

              <section className="pk-section pk-jungle-section">
                <div className="pk-single-box">
                  <h3>ماذا يميزنا؟</h3>
                  <div className="pk-features-grid">
                    {featureCards.map((feature) => (
                      <article className="pk-feature-card" key={feature.title}>
                        <span>{feature.icon}</span>
                        <strong>{feature.title}</strong>
                        <p>{feature.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="pk-leaf-divider" aria-hidden="true" />
              </section>

              <section className="pk-section pk-water-section">
                <h3>معرض Peekaboo</h3>
                <div className="pk-gallery-grid">
                  {galleryTiles.map((tile, index) => (
                    <div className="pk-gallery-tile" key={tile}>
                      <span>{index + 1}</span>
                      <p>{tile}</p>
                    </div>
                  ))}
                </div>
                <div className="pk-wave-divider" aria-hidden="true" />
              </section>

              <section className="pk-section pk-party-section">
                <div className="pk-party-card">
                  <h3>جاهزون لاحتفال لا يُنسى؟</h3>
                  <p>احجزوا حفلة Peekaboo الآن ودعوا أطفالكم يعيشون أجمل اللحظات.</p>
                  <button className="pk-btn pk-btn-primary" type="button">🎂 ابدأ الحجز الآن</button>
                </div>
              </section>
            </div>
          </article>

          <article className="pk-frame mobile">
            <div className="pk-frame-title">
              <strong>Mobile Frame</strong>
              <span>390px</span>
            </div>
            <div className="pk-mobile-preview">
              <div className="pk-mobile-block sky">Hero Sky</div>
              <div className="pk-mobile-block jungle">Jungle Features</div>
              <div className="pk-mobile-block water">Water Gallery</div>
              <div className="pk-mobile-block party">Party CTA</div>
            </div>
          </article>
        </section>
      </div>
    </section>
  );
}
