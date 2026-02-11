import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Users, Phone, MessageCircle, ChevronLeft } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-2xl mx-auto px-4">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--pk-green)] mb-4 shadow-lg">
            <Users className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="groups-title">
            المدارس والمجموعات
          </h1>
          <p className="text-muted-foreground">
            رحلات مدرسية وبرامج لعب آمنة للمجموعات
          </p>
        </div>

        <Card className="booking-card">
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="booking-summary mb-6">
              <p className="text-2xl font-bold text-[var(--pk-green)] mb-2">قريباً</p>
              <p className="text-muted-foreground text-sm">
                نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer">
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
            
            <div className="pt-4 border-t">
              <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                <ChevronLeft className="h-4 w-4" />
                العودة للرئيسية
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
