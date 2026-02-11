import { Users, Phone, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import PublicPageShell, { ContentCard } from '../components/PublicPageShell';

export default function GroupsPage() {
  return (
    <PublicPageShell
      title="المدارس والمجموعات"
      subtitle="رحلات مدرسية وبرامج لعب آمنة للمجموعات"
      icon={Users}
      iconBg="bg-[var(--pk-green)]"
      maxWidth="max-w-2xl"
    >
      <ContentCard className="text-center">
        <div className="booking-summary mb-6">
          <p className="text-2xl font-bold text-[var(--pk-green)] mb-2">قريباً</p>
          <p className="text-muted-foreground text-sm">
            نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://wa.me/962777775652" target="_blank" rel="noreferrer">
            <Button className="rounded-full w-full h-11 text-base bg-[#25D366] hover:bg-[#20BD5A]" data-testid="groups-whatsapp-btn">
              <MessageCircle className="h-5 w-5 ml-2" />
              واتساب
            </Button>
          </a>
          <a href="tel:0777775652">
            <Button variant="outline" className="rounded-full w-full h-11 text-base border-2" data-testid="groups-phone-btn">
              <Phone className="h-5 w-5 ml-2" />
              <span dir="ltr">0777775652</span>
            </Button>
          </a>
        </div>
      </ContentCard>
    </PublicPageShell>
  );
}
