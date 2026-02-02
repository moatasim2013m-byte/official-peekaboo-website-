import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Users, Phone, MessageCircle, ChevronRight } from 'lucide-react';

export default function GroupsPage() {
  return (
    <div className="min-h-screen py-16" dir="rtl">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="rounded-3xl border-2 overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="bg-[var(--peekaboo-green)] w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Users className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="font-heading text-3xl font-bold mb-4" data-testid="groups-title">
              المدارس والمجموعات
            </h1>
            
            <p className="text-muted-foreground text-lg mb-6">
              رحلات مدرسية ومجموعات منظمة ببرامج لعب آمنة ومشرفين متخصصين
            </p>
            
            <div className="bg-[var(--bg-cream)] rounded-2xl p-6 mb-8">
              <p className="text-2xl font-bold text-primary mb-2">قريباً</p>
              <p className="text-muted-foreground">
                نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/962791234567" target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full gap-2 w-full sm:w-auto" data-testid="groups-whatsapp-btn">
                  <MessageCircle className="h-5 w-5" />
                  واتساب
                </Button>
              </a>
              <a href="tel:+962791234567">
                <Button variant="outline" className="rounded-full gap-2 w-full sm:w-auto" data-testid="groups-phone-btn">
                  <Phone className="h-5 w-5" />
                  اتصل بنا
                </Button>
              </a>
            </div>
            
            <div className="mt-8 pt-6 border-t">
              <Link to="/">
                <Button variant="ghost" className="rounded-full gap-2">
                  <ChevronRight className="h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
