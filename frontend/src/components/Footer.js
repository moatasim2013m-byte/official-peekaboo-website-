import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export const Footer = () => {
  return (
    <footer className="bg-cream border-t border-border mt-auto" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logoImg} alt="Peekaboo" className="h-10" />
            </div>
            <p className="text-muted-foreground max-w-md">
              أفضل ملعب داخلي للأطفال! احجز جلسات اللعب بالساعة، احتفل بأعياد الميلاد، 
              ووفّر مع باقات الاشتراك.
            </p>
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
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">ساعات العمل</h4>
            <p className="text-muted-foreground">
              مفتوح يومياً<br />
              10:00 صباحاً - 12:00 منتصف الليل
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} بيكابو. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
};
