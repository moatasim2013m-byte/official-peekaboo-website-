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

export default function SubscriptionsPage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'باقات الاشتراك | بيكابو';
  }, []);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3" data-testid="subscriptions-title">
            <Star className="inline-block h-9 w-9 text-secondary ml-2" />
            باقات الاشتراك
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            وفّر أكثر مع باقات الزيارات. صالحة لمدة 30 يومًا.
          </p>
        </div>

        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-10">
              {plans.map((plan, index) => {
                const tier = getPlanTier(index);
                const isPopular = index === 1;
                
                return (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`pk-card cursor-pointer transition-all relative ${
                      selectedPlan?.id === plan.id ? 'ring-2 ring-[#FFD93B] shadow-lg' : 'hover:shadow-lg'
                    } ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
                    data-testid={`plan-${plan.id}`}
                  >
                    <div className={`pk-card-accent ${isPopular ? 'accent-rainbow' : tier === 'basic' ? 'accent-green' : 'accent-orange'}`} />
                    {isPopular && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#FFD93B] to-[#FF924C] text-white text-center py-1.5 text-xs font-bold rounded-t-[22px]">
                        ⭐ الأكثر شعبية
                      </div>
                    )}
                    <CardHeader className={`text-center pb-3 ${isPopular ? 'pt-10' : 'pt-6'}`}>
                      <CardTitle className="font-heading text-xl font-bold">
                        {plan.name_ar || t(plan.name) || plan.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {plan.description_ar || t(plan.description) || plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-6">
                      <div className="mb-4">
                        <span className="text-4xl font-heading font-bold text-slate-800">{plan.price}</span>
                        <span className="text-sm text-slate-500 mr-1">دينار</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-[#FFD93B]/20 to-[#FF924C]/20 rounded-xl p-3 mb-4">
                        <span className="text-2xl font-heading font-bold text-[#FF924C]">{plan.visits}</span>
                        <span className="text-slate-600 mr-1 text-sm">زيارة</span>
                      </div>

                      {/* Validity Days Notice */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-4 text-center">
                        <p className="text-xs font-bold text-blue-700">صالحة من الأحد إلى الخميس</p>
                      </div>

                      <ul className="space-y-2 text-right mb-4" dir="rtl">
                        {planFeatures[tier]?.slice(0, 3).map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs">
                            <Check className="h-4 w-4 text-[#8AC926] flex-shrink-0" />
                            <span className="text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                        className={`w-full rounded-full h-10 text-sm font-semibold ${
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
              <Card className="booking-card max-w-xl mx-auto">
                <CardHeader className="booking-card-header">
                  <CardTitle className="booking-card-title">أكمل عملية الشراء</CardTitle>
                </CardHeader>
                <CardContent className="py-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">اختر الطفل</label>
                    {children.length === 0 ? (
                      <div className="text-muted-foreground text-sm">
                        <p className="mb-2">لم يتم إضافة أطفال بعد</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="rounded-full">
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
                            <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    {selectedPlan && (
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">الباقة المختارة</p>
                        <p className="font-bold">{selectedPlan.name_ar || selectedPlan.name}</p>
                        <p className="font-bold text-xl text-secondary">{selectedPlan.price} د</p>
                      </div>
                    )}
                    <Button
                      onClick={handlePurchase}
                      disabled={!selectedPlan || !selectedChild || loading}
                      className="w-full sm:w-auto px-8 rounded-full h-11 btn-playful bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                      data-testid="purchase-btn"
                    >
                      {loading ? (
                        <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري المعالجة...</>
                      ) : (
                        <span>اشترِ الآن</span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="booking-card max-w-xl mx-auto bg-secondary/5">
                <CardContent className="py-8 text-center">
                  <p className="text-base mb-4">سجّل الدخول أو أنشئ حساب لإتمام الشراء</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">تسجيل الدخول</Button>
                    <Button onClick={() => navigate('/register')} className="rounded-full btn-playful bg-secondary text-secondary-foreground">إنشاء حساب</Button>
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
