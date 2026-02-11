import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeft, Heart, Shield, Sparkles, Users } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function AboutPage() {
  return (
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-10">
          <img src={logoImg} alt="بيكابو" className="h-20 mx-auto mb-4" />
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">من نحن</h1>
          <p className="text-muted-foreground text-lg">بيكابو يصنع السعادة</p>
        </div>

        {/* Main Content */}
        <Card className="booking-card mb-6">
          <CardContent className="p-6 sm:p-8">
            <p className="text-lg leading-relaxed text-muted-foreground mb-6">
              بيكابو هو ملعب داخلي مخصص للأطفال في إربد، حيث نوفر بيئة آمنة وممتعة للعب والاستكشاف. 
              نؤمن بأن اللعب هو أساس نمو الطفل وتطوره، ونسعى لتقديم تجربة فريدة لكل عائلة تزورنا.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-blue)]">
                <Shield className="h-8 w-8 text-[var(--pk-blue)] mb-2" />
                <h3 className="font-heading font-bold text-foreground mb-1">السلامة أولاً</h3>
                <p className="text-sm text-muted-foreground">بيئة آمنة ومعدات مطابقة للمعايير</p>
              </div>
              
              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-yellow)]">
                <Sparkles className="h-8 w-8 text-[var(--pk-yellow)] mb-2" />
                <h3 className="font-heading font-bold text-foreground mb-1">متعة بلا حدود</h3>
                <p className="text-sm text-muted-foreground">ألعاب متنوعة وأنشطة ممتعة</p>
              </div>
              
              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-pink)]">
                <Heart className="h-8 w-8 text-[var(--pk-red)] mb-2" />
                <h3 className="font-heading font-bold text-foreground mb-1">حفلات مميزة</h3>
                <p className="text-sm text-muted-foreground">أعياد ميلاد وحفلات لا تُنسى</p>
              </div>
              
              <div className="p-4 rounded-xl bg-[var(--pk-bg-light-green)]">
                <Users className="h-8 w-8 text-[var(--pk-green)] mb-2" />
                <h3 className="font-heading font-bold text-foreground mb-1">فريق متخصص</h3>
                <p className="text-sm text-muted-foreground">طاقم مدرب للإشراف والرعاية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card className="booking-card">
          <CardContent className="p-6 sm:p-8 text-center">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4">موقعنا</h2>
            <p className="text-muted-foreground mb-2">ابو راشد مجمع السيف التجاري، إربد</p>
            <p className="text-muted-foreground mb-4">مفتوح يومياً من 10 صباحاً حتى 12 منتصف الليل</p>
            <p className="font-bold" dir="ltr">0777775652</p>
          </CardContent>
        </Card>

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
