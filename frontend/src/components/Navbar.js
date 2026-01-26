import { Link, useNavigate } from 'react-router-dom';
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

export const Navbar = () => {
  const { user, logout, isAdmin, isStaff, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
            <span className="text-3xl">🎪</span>
            <span className="font-heading text-2xl font-bold text-primary">Peekaboo</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/tickets" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="nav-tickets">
              Hourly Tickets
            </Link>
            <Link to="/birthday" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="nav-birthday">
              Birthday Parties
            </Link>
            <Link to="/subscriptions" className="text-foreground hover:text-primary transition-colors font-medium" data-testid="nav-subscriptions">
              Subscriptions
            </Link>
          </div>

          {/* Debug Info - TEMPORARY */}
          {isAuthenticated && (
            <div className="hidden md:block text-xs bg-yellow-100 text-yellow-900 px-3 py-1 rounded-full border border-yellow-300">
              DEBUG: {user?.email} | role: {user?.role}
            </div>
          )}

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && isAdmin && (
              <Link to="/admin">
                <Button variant="default" className="rounded-full gap-2 bg-primary" data-testid="nav-admin-btn">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('Admin Dashboard')}
                </Button>
              </Link>
            )}
            {isAuthenticated && isStaff && !isAdmin && (
              <Link to="/staff">
                <Button variant="default" className="rounded-full gap-2 bg-secondary text-secondary-foreground" data-testid="nav-staff-btn">
                  <Users className="h-4 w-4" />
                  {t('Staff Panel')}
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full gap-2" data-testid="user-menu-trigger">
                    <User className="h-4 w-4" />
                    <span>{user?.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="menu-profile">
                    <User className="h-4 w-4 mr-2" />
                    {t('Profile')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      {t('Admin Dashboard')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('Logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="rounded-full" data-testid="nav-login">
                    {t('Login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="rounded-full btn-playful" data-testid="nav-register">
                    {t('Sign Up')}
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
            {/* Debug Info - TEMPORARY */}
            {isAuthenticated && (
              <div className="mb-4 text-xs bg-yellow-100 text-yellow-900 px-3 py-2 rounded border border-yellow-300">
                DEBUG: {user?.email} | role: {user?.role}
              </div>
            )}
            <div className="flex flex-col gap-4">
              <Link to="/tickets" className="text-foreground hover:text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
                Hourly Tickets
              </Link>
              <Link to="/birthday" className="text-foreground hover:text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
                Birthday Parties
              </Link>
              <Link to="/subscriptions" className="text-foreground hover:text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
                Subscriptions
              </Link>
              <div className="border-t border-border pt-4 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">My Profile</Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full rounded-full">Admin Panel</Button>
                      </Link>
                    )}
                    <Button onClick={handleLogout} variant="destructive" className="w-full rounded-full">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">Login</Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full rounded-full">Sign Up</Button>
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
