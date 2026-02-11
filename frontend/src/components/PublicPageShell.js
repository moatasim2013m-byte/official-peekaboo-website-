import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * PublicPageShell - Reusable wrapper for public informational pages
 * Provides consistent Wonderland-themed hero, container, and card styling
 * 
 * @param {string} title - Page title (Arabic)
 * @param {string} subtitle - Optional subtitle
 * @param {string} pageTitle - Document title for SEO (defaults to title + بيكابو)
 * @param {React.ReactNode} icon - Optional icon component to display in hero
 * @param {string} iconBg - Background color class for icon (e.g., 'bg-[var(--pk-blue)]')
 * @param {React.ReactNode} children - Page content
 * @param {string} maxWidth - Max width class (default: 'max-w-4xl')
 * @param {boolean} showBackLink - Show back to home link (default: true)
 */
export default function PublicPageShell({ 
  title, 
  subtitle, 
  pageTitle,
  icon: Icon,
  iconBg = 'bg-[var(--pk-blue)]',
  children,
  maxWidth = 'max-w-4xl',
  showBackLink = true
}) {
  useEffect(() => {
    document.title = pageTitle || `${title} | بيكابو`;
  }, [title, pageTitle]);

  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8`}>
        {/* Hero Header */}
        <div className="text-center mb-8">
          {Icon && (
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconBg} mb-4 shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
          )}
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground text-base sm:text-lg">{subtitle}</p>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Back Link */}
        {showBackLink && (
          <div className="pt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              <ChevronLeft className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ContentCard - Styled card wrapper for content sections
 */
export function ContentCard({ children, className = '' }) {
  return (
    <div className={`booking-card p-6 sm:p-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * InfoBlock - Colored info block for highlighting content
 */
export function InfoBlock({ title, children, color = 'blue' }) {
  const colorMap = {
    blue: 'bg-[var(--pk-bg-light-blue)]',
    yellow: 'bg-[var(--pk-bg-light-yellow)]',
    green: 'bg-[var(--pk-bg-light-green)]',
    pink: 'bg-[var(--pk-bg-light-pink)]',
    muted: 'bg-muted'
  };
  
  return (
    <section className={`p-4 rounded-xl ${colorMap[color] || colorMap.blue}`}>
      {title && (
        <h2 className="font-heading text-lg font-bold text-foreground mb-2">{title}</h2>
      )}
      {children}
    </section>
  );
}
