import { Link } from 'react-router-dom';
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import logoImg from '../assets/logo.png';
import mascotImg from '../assets/mascot.png';
import { PaymentCardIcons } from './PaymentCardIcons';

export const Footer = () => {
  return (
    <footer className="footer-section mt-auto" dir="rtl">
      {/* Wave Divider */}
      <div className="footer-wave"></div>
      
      {/* Footer Card Container */}
      <div className="footer-card">
        <div className="footer-gradient-border"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          {/* Decorative Mascot */}
          <img 
            src={mascotImg} 
            alt="بيكابو" 
            className="footer-mascot"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            
            {/* Column 1: Contact Info */}
            <div>
              <Link to="/" className="inline-block mb-5">
                <img src={logoImg} alt="بيكابو" className="h-14" />
              </Link>
              <h4 className="footer-heading footer-heading-blue">معلومات التواصل</h4>
              
              {/* Address */}
              <div className="mb-5">
                <span className="footer-address-label">
                  <MapPin className="h-4 w-4" />
                  العنوان
                </span>
                <p className="text-[var(--text-secondary)] mt-2 leading-relaxed">
                  ابو راشد مجمع السيف التجاري,<br />
                  Wasfi At-Tal St., Irbid 11225
                </p>
              </div>
              
              {/* Phone & WhatsApp - Big buttons */}
              <div className="flex flex-col gap-3">
                <a href="tel:0777775652" className="footer-btn-new footer-btn-phone-new">
                  <Phone className="h-5 w-5" />
                  <span className="ltr-text" dir="ltr">0777775652</span>
                </a>
                <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer" className="footer-btn-new footer-btn-whatsapp-new">
                  <MessageCircle className="h-5 w-5" />
                  <span>واتساب</span>
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="footer-heading footer-heading-red">روابط سريعة</h4>
              <ul className="space-y-3">
                <li><Link to="/tickets" className="footer-link-new">تذاكر بالساعة</Link></li>
                <li><Link to="/birthday" className="footer-link-new">حفلات أعياد الميلاد</Link></li>
                <li><Link to="/subscriptions" className="footer-link-new">الاشتراكات</Link></li>
                <li><Link to="/terms" className="footer-link-new">الشروط والأحكام</Link></li>
              </ul>
            </div>

            {/* Column 3: Hours */}
            <div>
              <h4 className="footer-heading footer-heading-green">ساعات العمل</h4>
              <div className="footer-hours-new">
                <Clock className="h-7 w-7 text-[var(--pk-green)]" />
                <div>
                  <p className="font-bold text-[var(--text-primary)]">مفتوح يومياً</p>
                  <p className="text-lg font-heading text-[var(--pk-blue)] ltr-text" dir="ltr">10:00 AM - 12:00 AM</p>
                </div>
              </div>
              
              <Link to="/staff/login" className="text-sm text-[var(--text-muted)] hover:text-[var(--pk-blue)] mt-6 inline-block">
                تسجيل دخول الإدارة
              </Link>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-[var(--border-light)] mt-10 pt-8 text-center">
            <p className="text-[var(--text-secondary)]">&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
            <p className="font-heading text-lg text-[var(--pk-orange)] mt-2">بيكابو يصنع السعادة ✨</p>
            
            {/* Trust Badge - Payment Methods */}
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-white/80 px-4 py-2 rounded-full shadow-sm">
                <PaymentCardIcons className="order-1 rtl:order-2 [&_svg]:h-6 [&_svg]:w-auto" />
                <span className="order-2 rtl:order-1 font-medium">نقبل فيزا وماستركارد</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
