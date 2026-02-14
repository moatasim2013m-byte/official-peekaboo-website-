import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useT';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { format, addDays, startOfDay } from 'date-fns';
import { Cake, Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';

export default function BirthdayPage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = 'حفلات أعياد الميلاد | بيكابو';
  }, []);
  
  const getBirthdayMinLeadDays = () => (new Date().getHours() < 18 ? 1 : 2);
  const [date, setDate] = useState(addDays(startOfDay(new Date()), getBirthdayMinLeadDays()));
  const [slots, setSlots] = useState([]);
  const [themes, setThemes] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [guestCount, setGuestCount] = useState(10);
  const [specialNotes, setSpecialNotes] = useState('');
  const [customRequest, setCustomRequest] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGeneratedThemeUrl, setAiGeneratedThemeUrl] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');

  useEffect(() => {
    fetchThemes();
    if (isAuthenticated) {
      fetchChildren();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const fetchChildren = async () => {
    try {
      const response = await api.get('/profile/children');
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Failed to fetch children:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const response = await api.get('/themes');
      setThemes(response.data.themes || []);
    } catch (error) {
      console.error('Failed to fetch themes:', error);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/slots/available?date=${dateStr}&slot_type=birthday`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Filter birthday slots - must end by 23:00 (2 hour parties)
  const getFilteredBirthdaySlots = () => {
    return slots.filter(slot => {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + 120; // 2 hour party
      // Must end by 23:00 (1380 minutes)
      return endMinutes <= 1380;
    });
  };

  // Calculate end time for birthday party (always 2 hours)
  const getPartyEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + 120;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleStandardBooking = async () => {
    if (!isAuthenticated) {
      toast.error('الرجاء تسجيل الدخول للحجز');
      navigate('/login');
      return;
    }

    if (!selectedSlot || !selectedTheme || !selectedChild) {
      toast.error('الرجاء اختيار الموعد والثيم والطفل');
      return;
    }

    setLoading(true);
    try {
      if (!selectedTheme.id) {
        toast.error('يرجى اختيار ثيم جاهز لإتمام الحجز حالياً');
        setLoading(false);
        return;
      }

      const amount = selectedTheme.price;
      
      if (paymentMethod === 'card') {
        // Stripe checkout flow
        const response = await api.post('/payments/create-checkout', {
          type: 'birthday',
          reference_id: selectedSlot.id,
          theme_id: selectedTheme.id,
          child_id: selectedChild,
          origin_url: window.location.origin
        });
        window.location.href = response.data.url;
      } else {
        // Cash or CliQ - create booking directly
        const response = await api.post('/bookings/birthday/offline', {
          slot_id: selectedSlot.id,
          child_id: selectedChild,
          theme_id: selectedTheme.id,
          guest_count: guestCount,
          special_notes: specialNotes,
          payment_method: paymentMethod,
          amount
        });
        
        // Get child name for confirmation
        const childObj = children.find(c => c.id === selectedChild);
        
        // Navigate to confirmation page with booking details
        const confirmationData = {
          bookingId: response.data.booking?.id,
          bookingCode: response.data.booking?.booking_code,
          bookingType: 'birthday',
          childName: childObj?.name,
          date: selectedSlot.date,
          time: selectedSlot.start_time,
          duration: 2,
          amount,
          paymentMethod
        };
        
        // Store in localStorage for refresh persistence
        localStorage.setItem('pk_last_confirmation', JSON.stringify(confirmationData));
        
        navigate('/booking-confirmation', { state: confirmationData });
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'فشل إنشاء الحجز');
      setLoading(false);
    }
  };

  const handleCustomRequest = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to submit request');
      navigate('/login');
      return;
    }

    if (!selectedSlot || !selectedChild || !customRequest) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings/birthday/custom', {
        slot_id: selectedSlot.id,
        child_id: selectedChild,
        custom_request: customRequest,
        guest_count: guestCount,
        special_notes: specialNotes
      });

      toast.success('Custom party request submitted! Our team will contact you soon.');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiTheme = async () => {
    const trimmedPrompt = aiPrompt.trim();
    if (trimmedPrompt.length < 10 || trimmedPrompt.length > 300) {
      toast.error('يرجى كتابة وصف بين 10 و 300 حرف');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await api.post('/themes/ai-generate', {
        prompt: trimmedPrompt,
        aspectRatio: '1:1'
      });

      const imageUrl = response.data?.imageUrl;
      if (!imageUrl) {
        throw new Error('Missing imageUrl');
      }

      setAiGeneratedThemeUrl(imageUrl);
      toast.success('تم إنشاء الثيم بنجاح');
    } catch (error) {
      const statusCode = error.response?.status;
      const apiMessage = error.response?.data?.error;

      if (statusCode === 503) {
        toast.error(apiMessage || 'خدمة إنشاء الثيم غير مفعّلة حالياً');
      } else if (statusCode === 429) {
        toast.error(apiMessage || 'محاولات كثيرة جداً، الرجاء المحاولة بعد قليل');
      } else if (apiMessage) {
        toast.error(apiMessage);
      } else {
        toast.error('حدث خطأ أثناء إنشاء الثيم');
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseAiTheme = () => {
    if (!aiGeneratedThemeUrl) {
      return;
    }

    setSelectedTheme({
      id: null,
      name: 'AI Generated Theme',
      name_ar: 'ثيم مولد بالذكاء الاصطناعي',
      image_url: aiGeneratedThemeUrl,
      price: 0,
      isAiGenerated: true
    });
    toast.success('تم اختيار الثيم المولد بالذكاء الاصطناعي');
  };

  const minDate = addDays(startOfDay(new Date()), getBirthdayMinLeadDays());
  const maxDate = addDays(startOfDay(new Date()), 90);
  const canBookTomorrow = getBirthdayMinLeadDays() === 1;

  const BirthdaySlotsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="calendar-skeleton p-4">
          <div className="h-4 bg-muted/70 rounded w-20 mx-auto mb-2"></div>
          <div className="h-4 bg-muted/70 rounded w-16 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="birthday-page min-h-screen py-8 md:py-12" dir="rtl">
      <div className="page-shell max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="birthday-page-decoration" aria-hidden="true">
          <span className="birthday-confetti birthday-confetti--pink" />
          <span className="birthday-confetti birthday-confetti--blue" />
          <span className="birthday-confetti birthday-confetti--yellow" />
          <span className="birthday-confetti birthday-confetti--green" />
        </div>

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="birthday-page-title font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3" data-testid="birthday-title">
            <Cake className="inline-block h-9 w-9 text-accent ml-2" />
            حفلات أعياد الميلاد
          </h1>
          <p className="birthday-page-subtitle text-base md:text-lg max-w-xl mx-auto">
            اجعل عيد ميلاد طفلك لا يُنسى!
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="birthday-tabs-list grid w-full max-w-sm mx-auto grid-cols-2 rounded-full p-1 h-12">
            <TabsTrigger value="standard" className="rounded-full text-sm font-semibold" data-testid="tab-standard">
              الثيمات الجاهزة
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-full text-sm font-semibold" data-testid="tab-custom">
              طلب مخصص
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="booking-card">
              <CardHeader className="booking-card-header">
                <CardTitle className="booking-card-title">
                  <span className="step-badge">1</span>
                  اختر التاريخ
                </CardTitle>
                <CardDescription className="text-xs mr-10">
                  {canBookTomorrow
                    ? 'يمكن الحجز لليوم التالي قبل 6:00 مساءً'
                    : 'انتهى وقت حجز اليوم التالي (بعد 6:00 مساءً)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d < minDate || d > maxDate}
                  className="rounded-xl"
                  data-testid="birthday-calendar"
                />
              </CardContent>
            </Card>

            {/* Time Slots */}
            <Card className="booking-card lg:col-span-2">
              <CardHeader className="booking-card-header">
                <CardTitle className="booking-card-title">
                  <span className={`step-badge ${selectedSlot ? 'step-badge-complete' : ''}`}>2</span>
                  أوقات الحفلات
                </CardTitle>
                <CardDescription className="text-xs mr-10">
                  {format(date, 'MMM d')} • كل حفلة ساعتان
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                {loadingSlots ? (
                  <div className="soft-loading-state py-6">
                    <div className="flex justify-center mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                    <BirthdaySlotsSkeleton />
                  </div>
                ) : getFilteredBirthdaySlots().length === 0 ? (
                  <div className="soft-loading-state text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">لا توجد أوقات متاحة</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {getFilteredBirthdaySlots().map((slot) => {
                      const endTime = getPartyEndTime(slot.start_time);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => slot.is_available && setSelectedSlot(slot)}
                          disabled={!slot.is_available}
                          className={`slot-btn ${selectedSlot?.id === slot.id ? 'selected-pink' : ''} ${!slot.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          data-testid={`party-slot-${slot.start_time}`}
                        >
                          <div className="font-heading font-semibold text-sm">
                            {slot.start_time} → {endTime}
                          </div>
                          {!slot.is_available && <div className="text-xs text-destructive mt-1">محجوز</div>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <TabsContent value="standard" className="space-y-6">
            {/* Themes Grid */}
            <div>
              <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                <span className={`step-badge ${selectedTheme ? 'step-badge-complete' : ''}`}>3</span>
                اختر الثيم
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {themes.map((theme, index) => (
                  <Card
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`pk-card cursor-pointer transition-all ${selectedTheme?.id === theme.id ? 'ring-2 ring-accent shadow-lg' : 'hover:shadow-md'}`}
                    data-testid={`theme-${theme.id}`}
                  >
                    <div className={`pk-card-accent accent-${['pink', 'blue', 'yellow', 'green', 'orange'][index % 5]}`} />
                    <CardContent className="p-3 pt-4 text-center">
                      {theme.image_url && (
                        <img src={theme.image_url} alt={theme.name_ar || theme.name} className="w-full h-20 object-cover rounded-lg mb-2" />
                      )}
                      <h3 className="font-heading font-bold text-sm">{theme.name_ar || theme.name}</h3>
                      <p className="text-accent font-bold text-sm mt-1">{theme.price} د</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="booking-card mt-5">
                <CardContent className="py-5 space-y-4">
                  <p className="text-sm font-medium">
                    ما لقيت الثيم المناسب؟ اكتب وصفك وسننشئ لك ثيم بالذكاء الاصطناعي
                  </p>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="مثال: بالونات زرقاء و صفراء مع سبايدرمان و كيك كبير و خلفية احتفالية"
                    className="rounded-xl min-h-[100px]"
                    dir="rtl"
                    data-testid="ai-theme-prompt"
                  />
                  <Button
                    onClick={handleGenerateAiTheme}
                    disabled={aiGenerating}
                    className="rounded-full h-11 btn-playful bg-accent hover:bg-accent/90"
                    data-testid="generate-ai-theme-btn"
                  >
                    {aiGenerating ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري إنشاء الثيم...</> : 'إنشاء بالذكاء الاصطناعي'}
                  </Button>

                  {aiGeneratedThemeUrl && (
                    <div className="space-y-3">
                      <img
                        src={aiGeneratedThemeUrl}
                        alt="AI generated birthday theme"
                        className="w-full max-w-xs h-auto rounded-xl border"
                      />
                      <Button
                        onClick={handleUseAiTheme}
                        variant="outline"
                        className="rounded-full"
                        data-testid="use-ai-theme-btn"
                      >
                        استخدام هذا الثيم
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            {isAuthenticated && (
              <Card className="booking-card">
                <CardHeader className="booking-card-header">
                  <CardTitle className="booking-card-title">أكمل حجزك</CardTitle>
                </CardHeader>
                <CardContent className="py-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm">طفل عيد الميلاد</Label>
                      <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger className="rounded-xl mt-1.5" data-testid="birthday-child-select">
                          <SelectValue placeholder="اختر الطفل" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">عدد الضيوف</Label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value))}
                        className="rounded-xl mt-1.5"
                        data-testid="guest-count"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">الثيم المختار</Label>
                      <div className="p-2.5 rounded-xl bg-muted mt-1.5 text-sm">
                        {selectedTheme ? (
                          <span className="font-semibold">{selectedTheme.name_ar || selectedTheme.name} - {selectedTheme.price} د</span>
                        ) : (
                          <span className="text-muted-foreground">لم يتم اختيار ثيم</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                    {selectedTheme && (
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-muted-foreground">الإجمالي</p>
                        <p className="font-bold text-2xl text-accent">{selectedTheme.price} د</p>
                      </div>
                    )}
                    <Button
                      onClick={handleStandardBooking}
                      disabled={!selectedSlot || !selectedTheme || !selectedChild || loading}
                      className="w-full sm:w-auto px-8 rounded-full h-12 btn-playful bg-accent hover:bg-accent/90"
                      data-testid="book-party-btn"
                    >
                      {loading ? (
                        <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري المعالجة...</>
                      ) : (
                        <span>احجز وادفع</span>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-6">
            <Card className="booking-card">
              <CardHeader className="booking-card-header">
                <CardTitle className="booking-card-title">
                  <Sparkles className="h-5 w-5 text-accent" />
                  طلب ثيم مخصص
                </CardTitle>
                <CardDescription className="text-sm mr-6">
                  لديك فكرة فريدة؟ أخبرنا عنها وسنتواصل معك.
                </CardDescription>
              </CardHeader>
              <CardContent className="py-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">طفل عيد الميلاد</Label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                      <SelectTrigger className="rounded-xl mt-1.5">
                        <SelectValue placeholder="اختر الطفل" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>{child.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm">عدد الضيوف المتوقع</Label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value))}
                      className="rounded-xl mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">صِف الثيم المخصص *</Label>
                  <Textarea
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    placeholder="أخبرنا عن ثيم حفلة أحلامك..."
                    className="rounded-xl mt-1.5 min-h-[100px]"
                    data-testid="custom-request"
                  />
                </div>

                <div>
                  <Label className="text-sm">ملاحظات (اختياري)</Label>
                  <Textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="أي متطلبات خاصة..."
                    className="rounded-xl mt-1.5"
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleCustomRequest}
                  disabled={!selectedSlot || !selectedChild || !customRequest || loading}
                  className="rounded-full h-11 btn-playful bg-accent hover:bg-accent/90"
                  data-testid="submit-custom-btn"
                >
                  {loading ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري الإرسال...</> : 'إرسال الطلب'}
                </Button>
                <p className="text-xs text-muted-foreground">سيتواصل فريقنا معك بالأسعار.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isAuthenticated && (
          <Card className="booking-card bg-accent/5 mt-6">
            <CardContent className="py-8 text-center">
              <p className="text-base mb-4">سجّل الدخول أو أنشئ حساب لحجز حفلة</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">تسجيل الدخول</Button>
                <Button onClick={() => navigate('/register')} className="rounded-full btn-playful bg-accent">إنشاء حساب</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
