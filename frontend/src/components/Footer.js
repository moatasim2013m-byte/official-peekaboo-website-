import { Link } from 'react-router-dom';
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Footer = () => {
  return (
    <footer className="footer-wrapper mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Column 1: Contact Info */}
          <div>
            <Link to="/" className="inline-block mb-5">
              <img src={logoImg} alt="بيكابو" className="h-14" />
            </Link>
            <h4 className="footer-heading">معلومات التواصل</h4>
            
            {/* Address */}
            <div className="mb-5">
              <p className="footer-label">
                <MapPin className="h-4 w-4 inline-block ml-1" />
                العنوان
              </p>
              <p className="footer-text">
                ابو راشد مجمع السيف التجاري,<br />
                Wasfi At-Tal St., Irbid 11225
              </p>
            </div>
            
            {/* Phone & WhatsApp */}
            <div className="flex flex-col gap-3">
              <a href="tel:0777775652" className="footer-btn footer-btn-phone">
                <Phone className="h-5 w-5" />
                <span className="ltr-text" dir="ltr">0777775652</span>
              </a>
              <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer" className="footer-btn footer-btn-whatsapp">
                <MessageCircle className="h-5 w-5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="footer-heading">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/tickets" className="footer-link">تذاكر بالساعة</Link>
              </li>
              <li>
                <Link to="/birthday" className="footer-link">حفلات أعياد الميلاد</Link>
              </li>
              <li>
                <Link to="/subscriptions" className="footer-link">الاشتراكات</Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">الشروط والأحكام</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Hours */}
          <div>
            <h4 className="footer-heading">ساعات العمل</h4>
            <div className="footer-hours-card">
              <Clock className="h-6 w-6 text-[var(--brand-orange)]" />
              <div>
                <p className="font-bold text-[var(--text-primary)]">مفتوح يومياً</p>
                <p className="text-lg ltr-text" dir="ltr">10:00 AM - 12:00 AM</p>
              </div>
            </div>
            <Link to="/staff/login" className="footer-link text-sm mt-6 inline-block opacity-60 hover:opacity-100">
              تسجيل دخول الإدارة
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--border-light)] mt-10 pt-8 text-center">
          <p className="footer-text">&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
