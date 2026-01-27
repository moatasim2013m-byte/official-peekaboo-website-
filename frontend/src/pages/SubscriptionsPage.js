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

export default function SubscriptionsPage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
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
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    if (!selectedPlan || !selectedChild) {
      toast.error('Please select a plan and child');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/payments/create-checkout', {
        type: 'subscription',
        reference_id: selectedPlan.id,
        child_id: selectedChild,
        origin_url: window.location.origin
      });

      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate purchase');
      setLoading(false);
    }
  };

  const planFeatures = {
    basic: [t('Perfect for regular visits'), t('day validity'), t('Full playground access')],
    standard: [t('Great value for frequent players'), t('day validity'), t('Full playground access'), t('Priority booking')],
    premium: [t('Best for frequent visitors'), t('day validity'), t('Full playground access'), t('Priority booking'), t('VIP treatment')]
  };

  const getPlanTier = (index) => {
    if (index === 0) return 'basic';
    if (index === 1) return 'standard';
    return 'premium';
  };

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="subscriptions-title">
            <Star className="inline-block h-10 w-10 text-secondary mr-2" />
            Subscription Packages
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Save big with our visit-based packages! Each subscription is valid for 30 days and can be used for any child.
          </p>
        </div>

        {loadingPlans ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan, index) => {
                const tier = getPlanTier(index);
                const isPopular = index === 1;
                
                return (
                  <Card
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`border-2 rounded-3xl cursor-pointer transition-all card-interactive relative ${
                      selectedPlan?.id === plan.id 
                        ? 'border-secondary ring-2 ring-secondary/20' 
                        : ''
                    } ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
                    data-testid={`plan-${plan.id}`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground rounded-full px-4">
                        {t('Most Popular')}
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="font-heading text-2xl">
                        {plan.name_ar || t(plan.name) || plan.name}
                      </CardTitle>
                      <CardDescription>
                        {plan.description_ar || t(plan.description) || plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="mb-6">
                        <span className="text-5xl font-heading font-bold text-foreground">${plan.price}</span>
                      </div>
                      
                      <div className="bg-secondary/10 rounded-2xl p-4 mb-6">
                        <span className="text-3xl font-heading font-bold text-secondary">{plan.visits}</span>
                        <span className="text-muted-foreground ml-2">{t('visits')}</span>
                      </div>

                      <ul className="space-y-3 text-left">
                        {planFeatures[tier]?.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={selectedPlan?.id === plan.id ? 'default' : 'outline'}
                        className={`w-full rounded-full mt-6 ${
                          selectedPlan?.id === plan.id ? 'bg-secondary hover:bg-secondary/90' : ''
                        }`}
                      >
                        {t('Select Plan')}
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
                  <CardTitle className="font-heading">Complete Your Purchase</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Child</label>
                      {children.length === 0 ? (
                        <div className="text-muted-foreground">
                          <p className="mb-2">No children added yet</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate('/profile')}
                            className="rounded-full"
                          >
                            Add Child
                          </Button>
                        </div>
                      ) : (
                        <Select value={selectedChild} onValueChange={setSelectedChild}>
                          <SelectTrigger className="rounded-xl" data-testid="subscription-child-select">
                            <SelectValue placeholder="Choose a child" />
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

                    <div className="flex items-end">
                      <Button
                        onClick={handlePurchase}
                        disabled={!selectedPlan || !selectedChild || loading}
                        className="w-full rounded-full h-12 btn-playful bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        data-testid="purchase-btn"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : selectedPlan ? (
                          `Purchase ${selectedPlan.name} - $${selectedPlan.price}`
                        ) : (
                          'Select a Plan'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 rounded-3xl max-w-2xl mx-auto bg-secondary/5">
                <CardContent className="py-8 text-center">
                  <p className="text-lg mb-4">Please login or create an account to purchase</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                      Login
                    </Button>
                    <Button onClick={() => navigate('/register')} className="rounded-full btn-playful bg-secondary text-secondary-foreground">
                      Sign Up
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
