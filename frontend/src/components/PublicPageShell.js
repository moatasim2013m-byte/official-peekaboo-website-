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
 * @param {string} variant - Visual variant: 'sky' (default) or 'plain'
 */
export default function PublicPageShell({ 
  title, 
  subtitle, 
  pageTitle,
  icon: Icon,
  iconBg = 'bg-[var(--pk-blue)]',
  children,
  maxWidth = 'max-w-4xl',
  showBackLink = true,
  variant = 'sky'
}) {
  useEffect(() => {
    document.title = pageTitle || `${title} | بيكابو`;
  }, [title, pageTitle]);

  const isSkyStyling = variant === 'sky';

  return (
    <div className={`min-h-screen ${isSkyStyling ? 'wonder-sky-bg' : ''}`} dir="rtl">
      {/* Decorative cloud strip at top */}
      {isSkyStyling && <div className="cloud-strip" aria-hidden="true" />}
      
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10`}>
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
          <div className="pt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium bg-white/80 px-4 py-2 rounded-full shadow-sm">
              <ChevronLeft className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </div>
        )}
      </div>

      {/* Decorative wave divider at bottom */}
      {isSkyStyling && <div className="wave-divider" aria-hidden="true" />}
    </div>
  );
}

/**
 * WonderSection - Styled section wrapper
 */
export function WonderSection({ children, className = '' }) {
  return (
    <div className={`wonder-section ${className}`}>
      {children}
    </div>
  );
}

/**
 * WonderSectionTitle - Section title with icon badge
 */
export function WonderSectionTitle({ icon: Icon, iconColor = 'blue', children }) {
  return (
    <h2 className="wonder-section-title">
      {Icon && (
        <span className={`icon-badge icon-badge-${iconColor}`}>
          <Icon />
        </span>
      )}
      {children}
    </h2>
  );
}

/**
 * WonderCard - Styled card component
 */
export function WonderCard({ children, className = '', color = '' }) {
  const colorClass = color ? `wonder-card-${color}` : '';
  return (
    <div className={`wonder-card ${colorClass} ${className}`}>
      {children}
    </div>
  );
}

/**
 * ContentCard - Styled card wrapper for content sections (legacy support)
 */
export function ContentCard({ children, className = '' }) {
  return (
    <div className={`wonder-section ${className}`}>
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
