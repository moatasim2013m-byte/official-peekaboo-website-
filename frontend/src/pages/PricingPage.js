import { Link } from 'react-router-dom';
import { Clock, Cake, Star, Sun, Moon, ChevronLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import PublicPageShell, { ContentCard } from '../components/PublicPageShell';

export default function PricingPage() {
  return (
    <PublicPageShell
      title="الأسعار"
      subtitle="أسعار شفافة ومناسبة للجميع"
      maxWidth="max-w-5xl"
    >
      {/* Hourly Play */}
      <ContentCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--pk-blue)] flex items-center justify-center">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">اللعب بالساعة</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Morning */}
          <div className="p-5 rounded-xl bg-[var(--pk-bg-light-yellow)] border-2 border-[var(--pk-yellow)]">
            <div className="flex items-center gap-2 mb-3">
              <Sun className="h-6 w-6 text-[var(--pk-yellow)]" />
              <span className="font-heading font-bold text-lg">صباحي (Happy Hour)</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">10 صباحاً - 2 ظهراً</p>
            <p className="text-3xl font-bold text-[var(--pk-yellow)]">3.5 <span className="text-base">دينار/ساعة</span></p>
          </div>

          {/* Afternoon */}
          <div className="p-5 rounded-xl bg-[var(--pk-bg-light-blue)] border-2 border-[var(--pk-blue)]">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-6 w-6 text-[var(--pk-blue)]" />
              <span className="font-heading font-bold text-lg">مسائي</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">2 ظهراً - 12 منتصف الليل</p>
            <p className="text-3xl font-bold text-[var(--pk-blue)]">7-13 <span className="text-base">دينار</span></p>
          </div>
        </div>

        <Link to="/tickets">
          <Button className="rounded-full btn-playful">
            احجز الآن
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Button>
        </Link>
      </ContentCard>

      {/* Birthday */}
      <ContentCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--pk-red)] flex items-center justify-center">
            <Cake className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">حفلات أعياد الميلاد</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)] text-center">
            <p className="font-heading font-bold text-lg mb-1">باقة برونزية</p>
            <p className="text-2xl font-bold text-[var(--pk-red)]">80 د</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)] text-center border-2 border-[var(--pk-yellow)]">
            <p className="font-heading font-bold text-lg mb-1">باقة فضية</p>
            <p className="text-2xl font-bold text-[var(--pk-yellow)]">120 د</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)] text-center">
            <p className="font-heading font-bold text-lg mb-1">باقة ذهبية</p>
            <p className="text-2xl font-bold text-[var(--pk-blue)]">160 د</p>
          </div>
        </div>

        <Link to="/birthday">
          <Button className="rounded-full btn-playful bg-[var(--pk-red)] hover:bg-[var(--pk-red)]/90">
            احجز حفلة
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Button>
        </Link>
      </ContentCard>

      {/* Subscriptions */}
      <ContentCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--pk-green)] flex items-center justify-center">
            <Star className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">الاشتراكات</h2>
        </div>

        <p className="text-muted-foreground mb-4">باقات زيارات بأسعار مخفضة - صالحة لمدة 30 يوم</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-green)] text-center">
            <p className="font-heading font-bold text-lg mb-1">5 زيارات</p>
            <p className="text-2xl font-bold text-[var(--pk-green)]">30 د</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)] text-center border-2 border-[var(--pk-yellow)]">
            <p className="font-heading font-bold text-lg mb-1">10 زيارات</p>
            <p className="text-2xl font-bold text-[var(--pk-yellow)]">55 د</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)] text-center">
            <p className="font-heading font-bold text-lg mb-1">20 زيارة</p>
            <p className="text-2xl font-bold text-[var(--pk-blue)]">100 د</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4">* صالحة من الأحد إلى الخميس فقط</p>

        <Link to="/subscriptions">
          <Button className="rounded-full btn-playful bg-[var(--pk-green)] hover:bg-[var(--pk-green)]/90">
            اشترك الآن
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Button>
        </Link>
      </ContentCard>
    </PublicPageShell>
  );
}
