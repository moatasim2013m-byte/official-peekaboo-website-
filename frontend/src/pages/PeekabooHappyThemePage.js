import './PeekabooHappyThemePage.css';

const colors = [
  { name: 'الأحمر الأساسي', value: '#FF595E', className: '', style: { background: '#FF595E' } },
  { name: 'الأصفر المضيء', value: '#FFD93B', className: 'yellow', style: { background: '#FFD93B' } },
  { name: 'الأزرق المعلوماتي', value: '#00BBF9', className: '', style: { background: '#00BBF9' } },
  { name: 'الأخضر النجاح', value: '#8AC926', className: '', style: { background: '#8AC926' } },
  { name: 'خلفية السماء', value: '#F4FAFF', className: 'sky', style: { background: '#F4FAFF' } },
  { name: 'البطاقات البيضاء', value: '#FFFFFF', className: 'white', style: { background: '#FFFFFF' } }
];

const bookingSteps = ['📅 التاريخ', '🌤 الفترة', '⏱ المدة', '🎯 الأوقات'];

export default function PeekabooHappyThemePage() {
  return (
    <section className="peekaboo-theme-page" dir="rtl">
      <div className="ph-shell">
        <header className="ph-card">
          <p className="ph-chip">Peekaboo Happy Theme</p>
          <h1 className="ph-title">ثيم PEEKABOO السعيد</h1>
          <p className="ph-subtitle">مظهر مرح واحترافي مستوحى من البالونات والغيوم والاحتفالات مع تجربة عربية RTL واضحة.</p>
        </header>

        <article className="ph-card">
          <h2 className="ph-section-title">1) Design Tokens + Components</h2>
          <div className="ph-grid ph-grid-2">
            <div className="ph-grid">
              <h3>لوحة الألوان</h3>
              <div className="ph-grid ph-grid-2">
                {colors.map((color) => (
                  <div key={color.value} className={`ph-color-swatch ${color.className}`} style={color.style}>
                    <span>{color.name}</span>
                    <small>{color.value}</small>
                  </div>
                ))}
              </div>
            </div>

            <div className="ph-grid">
              <h3>الخطوط والإيقاع</h3>
              <p>الخط: Cairo / Tajawal / Noto Kufi Arabic</p>
              <div className="ph-row">
                <span className="ph-chip">Regular 400</span>
                <span className="ph-chip" style={{ fontWeight: 700 }}>Bold 700</span>
              </div>
              <div className="ph-row">
                <span className="ph-chip">Radius 16</span>
                <span className="ph-chip">Radius 20</span>
                <span className="ph-chip">Radius 24</span>
              </div>
              <div className="ph-row">
                <span className="ph-chip">8px Grid Spacing</span>
                <span className="ph-chip">Soft Shadows</span>
                <span className="ph-chip">Button Height: 52px</span>
              </div>
            </div>
          </div>

          <div className="ph-components" style={{ marginTop: 16 }}>
            <h3>مكوّنات الواجهة</h3>
            <div className="ph-row">
              <button className="ph-btn ph-btn-primary">احجز جلسة</button>
              <button className="ph-btn ph-btn-outline">سجل مجاناً</button>
            </div>
            <div className="ph-row">
              {bookingSteps.map((step, index) => (
                <span className="ph-pill" key={step}>{index + 1}. {step}</span>
              ))}
            </div>
            <div className="ph-row">
              <div className="ph-selection">بطاقة اختيار - افتراضي</div>
              <div className="ph-selection selected">بطاقة اختيار - محدد</div>
              <div className="ph-selection disabled">بطاقة اختيار - غير متاح</div>
            </div>
            <div className="ph-row">
              <span className="ph-pill">25 د.أ</span>
              <span className="ph-pill active">35 د.أ (محدد)</span>
            </div>
            <div className="ph-sticky-demo">
              <div>
                <strong>ملخص الحجز</strong>
                <p style={{ margin: 0, color: '#60758a' }}>اليوم • 4:00 م • طفلان</p>
              </div>
              <button className="ph-btn ph-btn-primary">متابعة</button>
            </div>
          </div>
        </article>

        <article className="ph-card">
          <h2 className="ph-section-title">2) Mockups (Mobile-first + Desktop)</h2>
          <div className="ph-mockup-grid">
            <section className="ph-frame">
              <div className="ph-frame-header"><span>A) صفحة الحجز بالساعة</span><span>390px + Desktop</span></div>
              <div className="ph-frame-body">
                <div className="ph-row">{bookingSteps.map((step) => <span className="ph-pill" key={step}>{step}</span>)}</div>
                <div className="ph-selection selected">فترة صباحية 10:00 - 14:00</div>
                <div className="ph-row"><span className="ph-pill active">1 ساعة</span><span className="ph-pill">2 ساعة</span></div>
                <div className="ph-feature-box">الأوقات المتاحة: 10:30 - 11:30 - 12:00</div>
                <div className="ph-sticky-demo"><span>الإجمالي: 14 د.أ</span><button className="ph-btn ph-btn-primary">التالي</button></div>
              </div>
            </section>

            <section className="ph-frame">
              <div className="ph-frame-header"><span>B) الصفحة الرئيسية</span><span>Hero + Sections</span></div>
              <div className="ph-frame-body">
                <div className="ph-hero">
                  <strong>مرح وفرح بانتظار أطفالكم 🎉</strong>
                  <p style={{ margin: '8px 0', color: '#60758a' }}>تجربة لعب آمنة، حفلات ممتعة، واشتراكات موفرة.</p>
                  <div className="ph-row"><button className="ph-btn ph-btn-primary">احجز جلسة</button><button className="ph-btn ph-btn-outline">سجل مجاناً</button></div>
                </div>
                <div className="ph-feature-box"><strong>ماذا يميزنا</strong><p style={{ margin: '6px 0 0' }}>نظافة عالية • طاقم مختص • ألعاب متنوعة • حجز سريع</p></div>
                <div className="ph-row"><div className="ph-package">التذاكر</div><div className="ph-package">أعياد الميلاد</div><div className="ph-package">الاشتراكات</div></div>
              </div>
            </section>

            <section className="ph-frame">
              <div className="ph-frame-header"><span>C) صفحة أعياد الميلاد</span><span>Cake + Balloons</span></div>
              <div className="ph-frame-body">
                <div className="ph-hero"><strong>🎂 حفلة عيد ميلاد لا تُنسى</strong><p style={{ margin: '8px 0', color: '#60758a' }}>كيك + زينة + فعاليات + طاقم تنظيم.</p></div>
                <div className="ph-grid">
                  {[1, 2, 3, 4].map((item) => (
                    <div className="ph-package" key={item}>
                      <strong>باقة {item}</strong>
                      <div className="ph-row" style={{ justifyContent: 'space-between' }}>
                        <span>🎁 مزايا الباقة</span>
                        <span className="ph-badge">{item * 55} د.أ</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="ph-btn ph-btn-primary">احجز عيد ميلاد</button>
              </div>
            </section>

            <section className="ph-frame">
              <div className="ph-frame-header"><span>D) صفحة الاشتراكات</span><span>Saving Plans</span></div>
              <div className="ph-frame-body">
                <div className="ph-grid">
                  {['شهري', '3 أشهر', '6 أشهر'].map((plan, index) => (
                    <div className="ph-package" key={plan}>
                      <div className="ph-row" style={{ justifyContent: 'space-between' }}>
                        <strong>{plan}</strong>
                        {index === 1 && <span className="ph-badge">الأكثر توفيراً</span>}
                      </div>
                      <p style={{ margin: '8px 0', color: '#60758a' }}>مقارنة مبسطة كمجموعة بطاقات بدلاً من جدول معقد.</p>
                      <span className="ph-pill active">من {45 + (index * 30)} د.أ</span>
                    </div>
                  ))}
                </div>
                <button className="ph-btn ph-btn-primary">اشترك الآن</button>
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  );
}
