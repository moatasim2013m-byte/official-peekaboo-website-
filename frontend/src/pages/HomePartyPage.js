import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Home, Phone, MessageCircle, ChevronRight } from 'lucide-react';

export default function HomePartyPage() {
  return (
    <div className="min-h-screen py-16" dir="rtl">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="rounded-3xl border-2 overflow-hidden">
          <CardContent className="p-8 text-center">
            <div className="bg-[var(--peekaboo-pink)] w-24 h-24 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
              <Home className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="font-heading text-4xl font-bold mb-4" data-testid="home-party-title">
              حفلتك في بيتك
            </h1>
            
            <p className="text-muted-foreground text-lg mb-6">
              نأتيكم للمنزل مع ديكور، شخصيات كرتونية، واحتفال كامل لطفلك
            </p>
            
            <div className="bg-[var(--bg-cream)] rounded-2xl p-6 mb-8">
              <p className="text-2xl font-bold text-primary mb-2">قريباً</p>
              <p className="text-muted-foreground mb-4">
                نعمل على تجهيز هذه الخدمة. تواصل معنا للحجز المسبق!
              </p>
              <p className="text-xl font-bold ltr-text" dir="ltr">0777775652</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer">
                <Button className="rounded-full gap-2 w-full sm:w-auto h-12 px-8 text-lg bg-[#25D366] hover:bg-[#20BD5A]" data-testid="home-party-whatsapp-btn">
                  <MessageCircle className="h-5 w-5" />
                  واتساب
                </Button>
              </a>
              <a href="tel:0777775652">
                <Button variant="outline" className="rounded-full gap-2 w-full sm:w-auto h-12 px-8 text-lg border-2" data-testid="home-party-phone-btn">
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
