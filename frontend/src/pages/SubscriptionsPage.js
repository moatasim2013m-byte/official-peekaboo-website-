import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Star, Check, Loader2 } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentCardIcons } from '../components/PaymentCardIcons';

export default function SubscriptionsPage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/subscriptions/plans');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const response = await api.get('/profile/children');
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to fetch children:', error);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('الرجاء تسجيل الدخول للشراء');
      navigate('/login');
      return;
    }

    if (!selectedPlan || !selectedChild) {
      toast.error('الرجاء اختيار باقة وطفل');
      return;
    }

    setLoading(true);
    try {
      const amount = selectedPlan.price;
      
      if (paymentMethod === 'card') {
        // Stripe checkout flow
        const response = await api.post('/payments/create-checkout', {
          type: 'subscription',
          reference_id: selectedPlan.id,
          child_id: selectedChild,
          origin_url: window.location.origin
        });
        window.location.href = response.data.url;
      } else {
        // Cash or CliQ - create subscription directly
        const response = await api.post('/subscriptions/purchase/offline', {
          plan_id: selectedPlan.id,
          child_id: selectedChild,
          payment_method: paymentMethod
        });
        
        // Get child name for confirmation
        const childObj = children.find(c => c.id === selectedChild);
        
        // Navigate to confirmation page with booking details
        const confirmationData = {
          bookingId: response.data.subscription?.id,
          bookingCode: `PK-SUB-${response.data.subscription?.id?.slice(-6).toUpperCase() || 'XXXXXX'}`,
          bookingType: 'subscription',
          childName: childObj?.name,
          amount,
          paymentMethod
        };
        
        // Store in localStorage for refresh persistence
        localStorage.setItem('pk_last_confirmation', JSON.stringify(confirmationData));
        
        navigate('/booking-confirmation', { state: confirmationData });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشل بدء عملية الشراء');
      setLoading(false);
    }
  };

  const planFeatures = {
    basic: ['مثالية للزيارات المنتظمة', 'صلاحية 30 يوم', 'دخول كامل للملعب'],
    standard: ['قيمة رائعة للزوار الدائمين', 'صلاحية 30 يوم', 'دخول كامل للملعب', 'أولوية الحجز'],
    premium: ['الأفضل للزوار المتكررين', 'صلاحية 30 يوم', 'دخول كامل للملعب', 'أولوية الحجز', 'معاملة VIP']
  };

  const getPlanTier = (index) => {
    if (index === 0) return 'basic';
    if (index === 1) return 'standard';
    return 'premium';
  };

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="subscriptions-title">
            <Star className="inline-block h-10 w-10 text-secondary ml-2" />
            باقات الاشتراك
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            وفّر أكثر مع باقات الزيارات. كل باقة صالحة لمدة 30 يومًا ويمكن استخدامها لأي طفل.
          </p>
        </div>

        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
              {plans.map((plan, index) => {
                const tier = getPlanTier(index);
                const isPopular = index === 1;
                
                return (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`pk-card cursor-pointer transition-all relative ${
                      selectedPlan?.id === plan.id 
                        ? 'ring-4 ring-[#FFD93B]/30 shadow-lg' 
                        : 'hover:shadow-lg'
                    } ${isPopular ? 'md:-mt-6 md:mb-6 shadow-xl' : ''}`}
                    data-testid={`plan-${plan.id}`}
                  >
                    <div className={`pk-card-accent ${isPopular ? 'accent-rainbow' : tier === 'basic' ? 'accent-green' : tier === 'standard' ? 'accent-yellow' : 'accent-orange'}`} />
                    {isPopular && (
                      <div className="absolute top-2 left-0 right-0 bg-gradient-to-r from-[#FFD93B] to-[#FF924C] text-white text-center py-2 text-sm font-bold rounded-t-[20px]">
                        ⭐ الأكثر شعبية
                      </div>
                    )}
                    <CardHeader className={`text-center pb-4 ${isPopular ? 'pt-14' : 'pt-8'}`}>
                      <CardTitle className="pk-card-title text-2xl">
                        {plan.name_ar || t(plan.name) || plan.name}
                      </CardTitle>
                      <CardDescription className="text-slate-500">
                        {plan.description_ar || t(plan.description) || plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-6">
                        <span className="text-4xl md:text-5xl font-heading font-bold text-slate-800">{plan.price}</span>
                        <span className="text-lg text-slate-500 mr-1">JD</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#FFD93B]/20 to-[#FF924C]/20 rounded-2xl p-4 mb-6">
                        <span className="text-3xl font-heading font-bold text-[#FF924C]">{plan.visits}</span>
                        <span className="text-slate-600 mr-2">زيارة</span>
                      </div>

                      {/* Validity Days Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-center">
                        <p className="text-sm font-bold text-blue-700">صالحة من الأحد إلى الخميس فقط</p>
                        <p className="text-xs text-blue-600 mt-1">لا تشمل الجمعة والسبت</p>
                      </div>

                      <ul className="space-y-3 text-right" dir="rtl">
                        {planFeatures[tier]?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-[#8AC926] flex-shrink-0" />
                            <span className="text-sm text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                        className={`w-full rounded-full mt-6 h-12 text-base font-semibold ${
                          selectedPlan?.id === plan.id 
                            ? 'bg-[#FFD93B] hover:bg-[#FFD93B]/90 text-slate-800' 
                            : 'border-2 hover:border-[#FFD93B] hover:bg-[#FFD93B]/10'
                        }`}
                      >
                        اختر الباقة
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Purchase Section */}
            {isAuthenticated ? (
              <Card className="border-2 rounded-3xl max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading">أكمل عملية الشراء</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر الطفل</label>
                    {children.length === 0 ? (
                      <div className="text-muted-foreground">
                        <p className="mb-2">لم يتم إضافة أطفال بعد</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/profile')}
                          className="rounded-full"
                        >
                          إضافة طفل
                        </Button>
                      </div>
                    ) : (
                      <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger className="rounded-xl" data-testid="subscription-child-select">
                          <SelectValue placeholder="اختر طفلاً" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="pt-4 border-t">
                    <PaymentMethodSelector 
                      value={paymentMethod} 
                      onChange={setPaymentMethod} 
                    />
                  </div>

                  {/* Summary & Purchase */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t">
                    {selectedPlan && (
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground">الباقة المختارة</p>
                        <p className="font-bold text-xl">{selectedPlan.name_ar || selectedPlan.name}</p>
                        <p className="font-bold text-2xl text-secondary">{selectedPlan.price} دينار</p>
                        <p className="text-sm">طريقة الدفع: {paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'بطاقة' : 'CliQ'}</p>
                      </div>
                    )}
                    <Button
                      onClick={handlePurchase}
                      disabled={!selectedPlan || !selectedChild || loading}
                      className="w-full md:w-auto px-8 rounded-full h-12 btn-playful bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      data-testid="purchase-btn"
                      aria-label="اشترِ الآن - يقبل بطاقات فيزا وماستركارد"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <PaymentCardIcons />
                          <span>اشترِ الآن</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 rounded-3xl max-w-2xl mx-auto bg-secondary/5">
                <CardContent className="py-8 text-center">
                  <p className="text-lg mb-4">الرجاء تسجيل الدخول أو إنشاء حساب لإتمام الشراء</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                      تسجيل الدخول
                    </Button>
                    <Button onClick={() => navigate('/register')} className="rounded-full btn-playful bg-secondary text-secondary-foreground">
                      إنشاء حساب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
