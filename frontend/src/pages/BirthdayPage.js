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
import { format, addDays } from 'date-fns';
import { Cake, Users, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentCardIcons } from '../components/PaymentCardIcons';

export default function BirthdayPage() {
  const { isAuthenticated, api } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [date, setDate] = useState(addDays(new Date(), 7));
  const [slots, setSlots] = useState([]);
  const [themes, setThemes] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [guestCount, setGuestCount] = useState(10);
  const [specialNotes, setSpecialNotes] = useState('');
  const [customRequest, setCustomRequest] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [activeTab, setActiveTab] = useState('standard');

  useEffect(() => {
    fetchThemes();
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSlots();
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

  const minDate = addDays(new Date(), 3);
  const maxDate = addDays(new Date(), 90);

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="birthday-title">
            <Cake className="inline-block h-10 w-10 text-accent ml-2" />
            حفلات أعياد الميلاد
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            اجعل عيد ميلاد طفلك لا يُنسى! اختر من ثيماتنا الرائعة أو اطلب حفلة مخصصة.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 rounded-full p-1 bg-muted">
            <TabsTrigger value="standard" className="rounded-full" data-testid="tab-standard">
              الثيمات الجاهزة
            </TabsTrigger>
            <TabsTrigger value="custom" className="rounded-full" data-testid="tab-custom">
              طلب مخصص
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">اختر التاريخ</CardTitle>
                <CardDescription>احجز قبل 3 أيام على الأقل</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
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
            <Card className="border-2 rounded-3xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="font-heading">
                  أوقات الحفلات - {format(date, 'MMMM d, yyyy')}
                  <div className="text-sm font-normal text-muted-foreground mt-1">
                    كل حفلة مدتها ساعتان
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : getFilteredBirthdaySlots().length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد أوقات متاحة للحفلات في هذا التاريخ</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {getFilteredBirthdaySlots().map((slot) => {
                      const endTime = getPartyEndTime(slot.start_time);
                      return (
                        <button
                          key={slot.id}
                          onClick={() => slot.is_available && setSelectedSlot(slot)}
                          disabled={!slot.is_available}
                          className={`p-4 rounded-2xl border-2 transition-all ${
                            selectedSlot?.id === slot.id
                              ? 'border-accent bg-accent/10'
                              : slot.is_available
                              ? 'border-border hover:border-accent/50 bg-white'
                              : 'border-border bg-muted opacity-50 cursor-not-allowed'
                          }`}
                          data-testid={`party-slot-${slot.start_time}`}
                        >
                          <div className="font-heading font-semibold text-lg">
                            {slot.start_time} → {endTime}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">ساعتان</div>
                          {!slot.is_available && (
                            <div className="text-xs text-destructive mt-1">محجوز</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <TabsContent value="standard" className="space-y-8">
            {/* Themes Grid */}
            <div>
              <h2 className="font-heading text-2xl font-bold mb-6">اختر الثيم</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {themes.map((theme, index) => (
                  <Card
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`pk-card cursor-pointer transition-all ${
                      selectedTheme?.id === theme.id ? 'ring-4 ring-accent/30 shadow-lg' : 'hover:shadow-lg'
                    }`}
                    data-testid={`theme-${theme.id}`}
                  >
                    <div className={`pk-card-accent accent-${['pink', 'blue', 'yellow', 'green', 'orange'][index % 5]}`} />
                    <CardContent className="p-4 pt-5 text-center">
                      {theme.image_url && (
                        <img 
                          src={theme.image_url} 
                          alt={theme.name_ar || theme.name}
                          className="w-full h-24 object-cover rounded-xl mb-3"
                        />
                      )}
                      <h3 className="pk-card-title text-base">{theme.name_ar || theme.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{theme.description_ar || theme.description}</p>
                      <p className="text-accent font-bold mt-2">{theme.price} دينار</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Booking Form */}
            {isAuthenticated && (
              <Card className="border-2 rounded-3xl">
                <CardHeader>
                  <CardTitle className="font-heading">أكمل حجزك</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pb-24">{/* Added pb-24 for sticky button space */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>طفل عيد الميلاد</Label>
                      <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger className="rounded-xl mt-2" data-testid="birthday-child-select">
                          <SelectValue placeholder="اختر الطفل" />
                        </SelectTrigger>
                        <SelectContent>
                          {children.map((child) => (
                            <SelectItem key={child.id} value={child.id}>
                              {child.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>عدد الضيوف</Label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={guestCount}
                        onChange={(e) => setGuestCount(parseInt(e.target.value))}
                        className="rounded-xl mt-2"
                        data-testid="guest-count"
                      />
                    </div>

                    <div>
                      <Label>الثيم المختار</Label>
                      <div className="p-3 rounded-xl bg-muted mt-2">
                        {selectedTheme ? (
                          <span className="font-semibold">{selectedTheme.name_ar || selectedTheme.name} - {selectedTheme.price} دينار</span>
                        ) : (
                          <span className="text-muted-foreground">لم يتم اختيار ثيم</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="pt-4 border-t">
                    <PaymentMethodSelector 
                      value={paymentMethod} 
                      onChange={setPaymentMethod} 
                    />
                  </div>

                  {/* Summary & Book Button */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t">
                    {selectedTheme && (
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground">الإجمالي</p>
                        <p className="font-bold text-2xl text-accent">{selectedTheme.price} دينار</p>
                        <p className="text-sm">طريقة الدفع: {paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'بطاقة' : 'CliQ'}</p>
                      </div>
                    )}
                    
                    {/* Sticky CTA Container */}
                    <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg p-4 -mx-6 -mb-6 mt-6 z-50">
                      <Button
                        onClick={handleStandardBooking}
                        disabled={!selectedSlot || !selectedTheme || !selectedChild || loading}
                        className="w-full px-8 rounded-full h-14 btn-playful bg-accent hover:bg-accent/90 text-lg"
                        data-testid="book-party-btn"
                        aria-label="احجز وادفع - يقبل بطاقات فيزا وماستركارد"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            جاري المعالجة...
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <PaymentCardIcons />
                            <span>احجز وادفع</span>
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-8">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-accent" />
                  طلب ثيم مخصص
                </CardTitle>
                <CardDescription>
                  لديك فكرة فريدة؟ أخبرنا عن حفلة أحلامك وسيتواصل فريقنا معك لمناقشة التفاصيل والأسعار.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>طفل عيد الميلاد</Label>
                    <Select value={selectedChild} onValueChange={setSelectedChild}>
                      <SelectTrigger className="rounded-xl mt-2">
                        <SelectValue placeholder="اختر الطفل" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            {child.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>عدد الضيوف المتوقع</Label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value))}
                      className="rounded-xl mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>صِف الثيم المخصص *</Label>
                  <Textarea
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    placeholder="أخبرنا عن ثيم حفلة أحلامك، الألوان، الشخصيات، الديكورات..."
                    className="rounded-xl mt-2 min-h-[120px]"
                    data-testid="custom-request"
                  />
                </div>

                <div>
                  <Label>ملاحظات خاصة (اختياري)</Label>
                  <Textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="أي حساسية، متطلبات خاصة، أو طلبات إضافية..."
                    className="rounded-xl mt-2"
                  />
                </div>

                <Button
                  onClick={handleCustomRequest}
                  disabled={!selectedSlot || !selectedChild || !customRequest || loading}
                  className="rounded-full h-12 btn-playful bg-accent hover:bg-accent/90"
                  data-testid="submit-custom-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال الطلب المخصص'
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  لا يلزم الدفع للطلبات المخصصة. سيتواصل فريقنا معك بالأسعار.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isAuthenticated && (
          <Card className="border-2 rounded-3xl mt-8 bg-accent/5">
            <CardContent className="py-8 text-center">
              <p className="text-lg mb-4">الرجاء تسجيل الدخول أو إنشاء حساب لحجز حفلة</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                  تسجيل الدخول
                </Button>
                <Button onClick={() => navigate('/register')} className="rounded-full btn-playful bg-accent">
                  إنشاء حساب
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
