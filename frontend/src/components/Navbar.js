import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { User, LogOut, Settings, LayoutDashboard, Menu, X, Users } from 'lucide-react';
import { useState } from 'react';
import logoImg from '../assets/logo.png';
import mascotImg from '../assets/mascot.png';

export const Navbar = () => {
  const { user, logout, isAdmin, isStaff, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Single source of truth for navigation items (same order for desktop & mobile)
  const navItems = [
    { path: '/tickets', label: 'تذاكر بالساعة', pill: 'pill-blue', testId: 'nav-tickets' },
    { path: '/birthday', label: 'حفلات أعياد الميلاد', pill: 'pill-pink', testId: 'nav-birthday' },
    { path: '/subscriptions', label: 'الاشتراكات', pill: 'pill-yellow', testId: 'nav-subscriptions' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Determine if this is customer navbar (not admin/staff)
  const isCustomerNav = !isAdmin && !isStaff;

  return (
    <nav className={`sticky top-0 z-50 ${isCustomerNav ? 'navbar-customer' : 'bg-white border-b border-border shadow-sm'}`} dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 py-3">
          {/* Logo with Pill Container */}
          <Link to="/" className="brand-logo-pill" data-testid="nav-logo">
            <img src={logoImg} alt="بيكابو" className="brand-logo-lg" />
          </Link>

          {/* Desktop Navigation - Show only for non-admin users */}
          {!isAdmin && (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/tickets" className={`nav-pill pill-blue ${isActive('/tickets') ? 'active' : ''}`} data-testid="nav-tickets">
                تذاكر بالساعة
              </Link>
              <Link to="/birthday" className={`nav-pill pill-pink ${isActive('/birthday') ? 'active' : ''}`} data-testid="nav-birthday">
                حفلات أعياد الميلاد
              </Link>
              <Link to="/subscriptions" className={`nav-pill pill-yellow ${isActive('/subscriptions') ? 'active' : ''}`} data-testid="nav-subscriptions">
                الاشتراكات
              </Link>
            </div>
          )}

          {/* Admin/Staff Role Badge - Only for staff */}
          {isAuthenticated && (isAdmin || isStaff) && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--peekaboo-green)]/10 border border-[var(--peekaboo-green)]">
              <img src={mascotImg} alt="" className="h-6 w-6 rounded-full" />
              <span className="text-xs font-medium text-[#2d6a4f]">{isAdmin ? 'Admin' : 'Staff'}</span>
            </div>
          )}

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && isAdmin && (
              <Link to="/admin">
                <Button variant="default" className="rounded-full gap-2 bg-primary" data-testid="nav-admin-btn">
                  <LayoutDashboard className="h-4 w-4" />
                  لوحة التحكم
                </Button>
              </Link>
            )}
            {isAuthenticated && (isStaff || isAdmin) && (
              <>
                <Link to="/reception">
                  <Button variant="outline" className="rounded-full gap-2">
                    الاستقبال
                  </Button>
                </Link>
                {isStaff && !isAdmin && (
                  <Link to="/staff">
                    <Button variant="default" className="rounded-full gap-2 bg-secondary text-secondary-foreground" data-testid="nav-staff-btn">
                      <Users className="h-4 w-4" />
                      لوحة الموظفين
                    </Button>
                  </Link>
                )}
              </>
            )}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-2" data-testid="user-menu-trigger">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {!isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                      <User className="h-4 w-4 ml-2" />
                      الملف الشخصي
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                      <LayoutDashboard className="h-4 w-4 ml-2" />
                      لوحة التحكم
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="rounded-full" data-testid="nav-login">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-full btn-playful" data-testid="nav-register">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            {/* Staff Badge - Mobile */}
            {isAuthenticated && (isAdmin || isStaff) && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded bg-[var(--peekaboo-green)]/10 border border-[var(--peekaboo-green)]">
                <img src={mascotImg} alt="" className="h-6 w-6 rounded-full" />
                <span className="text-xs font-medium text-[#2d6a4f]">{isAdmin ? 'وضع المدير' : 'وضع الموظف'}</span>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {/* Parent navigation - hide for admin */}
              {!isAdmin && (
                <div className="flex flex-wrap gap-2">
                  <Link to="/tickets" className={`nav-pill pill-blue ${isActive('/tickets') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    تذاكر بالساعة
                  </Link>
                  <Link to="/birthday" className={`nav-pill pill-pink ${isActive('/birthday') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    حفلات أعياد الميلاد
                  </Link>
                  <Link to="/subscriptions" className={`nav-pill pill-yellow ${isActive('/subscriptions') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                    الاشتراكات
                  </Link>
                </div>
              )}
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    {!isAdmin && (
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-full">الملف الشخصي</Button>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-full">لوحة التحكم</Button>
                      </Link>
                    )}
                    <Button onClick={handleLogout} variant="destructive" className="w-full rounded-full">
                      تسجيل الخروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">تسجيل الدخول</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-full">إنشاء حساب</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
