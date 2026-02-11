import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ChevronLeft, MapPin, Phone, Clock, MessageCircle, Mail } from 'lucide-react';

export default function ContactPage() {
  useEffect(() => {
    document.title = 'تواصل معنا | بيكابو';
  }, []);

  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">تواصل معنا</h1>
          <p className="text-muted-foreground">نسعد بتواصلكم معنا</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Card className="booking-card">
            <CardContent className="p-6 sm:p-8 space-y-5">
              <h2 className="font-heading text-xl font-bold text-foreground">معلومات التواصل</h2>
              
              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)] flex items-start gap-3">
                <MapPin className="h-6 w-6 text-[var(--pk-blue)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">العنوان</h3>
                  <p className="text-sm text-muted-foreground">ابو راشد مجمع السيف التجاري، إربد</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)] flex items-start gap-3">
                <Phone className="h-6 w-6 text-[var(--pk-yellow)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">الهاتف</h3>
                  <p className="text-sm text-muted-foreground" dir="ltr">0777775652</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-green)] flex items-start gap-3">
                <Clock className="h-6 w-6 text-[var(--pk-green)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">ساعات العمل</h3>
                  <p className="text-sm text-muted-foreground">يومياً من 10 صباحاً حتى 12 منتصف الليل</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)] flex items-start gap-3">
                <Mail className="h-6 w-6 text-[var(--pk-red)] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-foreground mb-1">البريد الإلكتروني</h3>
                  <p className="text-sm text-muted-foreground">support@peekaboojor.com</p>
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <a href="https://wa.me/962777775652" target="_blank" rel="noopener noreferrer">
                  <Button className="rounded-full w-full bg-[#25D366] hover:bg-[#20BD5A]">
                    <MessageCircle className="h-4 w-4 ml-2" />
                    واتساب
                  </Button>
                </a>
                <a href="tel:0777775652">
                  <Button variant="outline" className="rounded-full w-full border-2">
                    <Phone className="h-4 w-4 ml-2" />
                    اتصل بنا
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="booking-card">
            <CardContent className="p-6 sm:p-8">
              <h2 className="font-heading text-xl font-bold text-foreground mb-5">أرسل رسالة</h2>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">الاسم</label>
                  <Input placeholder="اسمك الكريم" className="rounded-xl" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">رقم الهاتف</label>
                  <Input type="tel" placeholder="07xxxxxxxx" className="rounded-xl" dir="ltr" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1.5">الرسالة</label>
                  <Textarea placeholder="كيف يمكننا مساعدتك؟" className="rounded-xl min-h-[120px]" />
                </div>
                
                <Button type="button" className="rounded-full w-full btn-playful">
                  إرسال الرسالة
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  سنرد عليك في أقرب وقت ممكن
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="pt-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
            <ChevronLeft className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
