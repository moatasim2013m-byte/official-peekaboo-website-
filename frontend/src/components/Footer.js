import { Link } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import logoImg from '../assets/logo.png';

export const Footer = () => {
  return (
    <footer className="bg-cream border-t-2 border-border mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <img src={logoImg} alt="بيكابو" className="h-16" />
            </Link>
            <p className="footer-text max-w-md mb-5">
              أفضل ملعب داخلي للأطفال! احجز جلسات اللعب بالساعة، احتفل بأعياد الميلاد، 
              ووفّر مع باقات الاشتراك.
            </p>
            {/* Contact Info - Structured */}
            <div className="space-y-3">
              <div>
                <p className="font-bold text-foreground mb-1">العنوان</p>
                <p className="footer-text">ابو راشد مجمع السيف التجاري, Wasfi At-Tal St., Irbid 11225</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href="tel:0777775652" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-border hover:border-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="font-bold ltr-text" dir="ltr">0777775652</span>
                </a>
                <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25D366] text-white hover:bg-[#20BD5A] transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-bold">واتساب</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-heading font-heading">روابط سريعة</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/tickets" className="footer-link">
                  تذاكر بالساعة
                </Link>
              </li>
              <li>
                <Link to="/birthday" className="footer-link">
                  حفلات أعياد الميلاد
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="footer-link">
                  الاشتراكات
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Hours & Admin */}
          <div>
            <h4 className="footer-heading font-heading">ساعات العمل</h4>
            <p className="footer-text mb-5">
              مفتوح يومياً<br />
              10:00 صباحاً - 12:00 منتصف الليل
            </p>
            <Link to="/staff/login" className="footer-link text-sm">
              تسجيل دخول الإدارة
            </Link>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-8 text-center footer-text">
          <p>&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
