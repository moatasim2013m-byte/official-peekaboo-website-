import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export const Footer = () => {
  return (
    <footer className="bg-cream border-t border-border mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <img src={logoImg} alt="بيكابو" className="h-12" />
            </Link>
            <p className="text-muted-foreground max-w-md mb-4">
              أفضل ملعب داخلي للأطفال! احجز جلسات اللعب بالساعة، احتفل بأعياد الميلاد، 
              ووفّر مع باقات الاشتراك.
            </p>
            {/* Contact Info */}
            <div className="space-y-2 text-muted-foreground">
              <p>ابو راشد مجمع السيف التجاري, Wasfi At-Tal St., Irbid 11225</p>
              <p>
                <a href="tel:0777775652" className="hover:text-primary transition-colors ltr-text">
                  07 7777 5652
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/tickets" className="text-muted-foreground hover:text-primary transition-colors">
                  تذاكر بالساعة
                </Link>
              </li>
              <li>
                <Link to="/birthday" className="text-muted-foreground hover:text-primary transition-colors">
                  حفلات أعياد الميلاد
                </Link>
              </li>
              <li>
                <Link to="/subscriptions" className="text-muted-foreground hover:text-primary transition-colors">
                  الاشتراكات
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>

          {/* Hours & Admin */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">ساعات العمل</h4>
            <p className="text-muted-foreground mb-4">
              مفتوح يومياً<br />
              10:00 صباحاً - 12:00 منتصف الليل
            </p>
            <Link to="/staff/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              تسجيل دخول الإدارة
            </Link>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
