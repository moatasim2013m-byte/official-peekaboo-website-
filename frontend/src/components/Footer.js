import { Link } from 'react-router-dom';
import { MessageCircle, Phone, MapPin, Clock } from 'lucide-react';
import logoImg from '../assets/logo.png';
import mascotImg from '../assets/mascot.png';

export const Footer = () => {
  return (
    <footer className="footer-wrapper mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Column 1: Contact Info */}
          <div className="md:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <img src={logoImg} alt="بيكابو" className="h-16 brightness-0 invert" />
            </Link>
            <h4 className="footer-heading text-xl mb-4">معلومات التواصل</h4>
            
            {/* Address */}
            <div className="mb-6">
              <p className="footer-label flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                العنوان
              </p>
              <p className="footer-text text-lg">
                ابو راشد مجمع السيف التجاري,<br />
                Wasfi At-Tal St., Irbid 11225
              </p>
            </div>
            
            {/* Phone & WhatsApp - Big buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="tel:0777775652" className="footer-btn footer-btn-phone">
                <Phone className="h-5 w-5" />
                <span className="ltr-text" dir="ltr">0777775652</span>
              </a>
              <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer" className="footer-btn footer-btn-whatsapp">
                <MessageCircle className="h-6 w-6" />
                <span>واتساب</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="footer-heading text-xl mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              <li><Link to="/tickets" className="footer-link text-lg">تذاكر بالساعة</Link></li>
              <li><Link to="/birthday" className="footer-link text-lg">حفلات أعياد الميلاد</Link></li>
              <li><Link to="/subscriptions" className="footer-link text-lg">الاشتراكات</Link></li>
              <li><Link to="/terms" className="footer-link text-lg">الشروط والأحكام</Link></li>
            </ul>
          </div>

          {/* Column 3: Hours + Mascot */}
          <div className="relative">
            <h4 className="footer-heading text-xl mb-4">ساعات العمل</h4>
            <div className="footer-hours-card">
              <Clock className="h-8 w-8 text-[var(--pk-yellow)]" />
              <div>
                <p className="font-bold text-lg">مفتوح يومياً</p>
                <p className="text-xl font-heading ltr-text" dir="ltr">10:00 AM - 12:00 AM</p>
              </div>
            </div>
            
            {/* Mascot waving */}
            <img 
              src={mascotImg} 
              alt="بيكابو" 
              className="hidden md:block absolute -bottom-8 left-0 w-28 h-28 transform -rotate-12 drop-shadow-lg"
            />
            
            <Link to="/staff/login" className="footer-link text-sm mt-6 inline-block opacity-60 hover:opacity-100">
              تسجيل دخول الإدارة
            </Link>
          </div>
        </div>

        <div className="border-t border-white/20 mt-12 pt-8 text-center">
          <p className="footer-text text-lg">&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
          <p className="text-[var(--pk-yellow)] font-heading text-xl mt-2">بيكابو يصنع السعادة ✨</p>
        </div>
      </div>
    </footer>
  );
};
