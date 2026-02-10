import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format, addDays, isToday } from 'date-fns';
import { Clock, Users, Loader2, AlertCircle, Star, Sun, Moon } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentCardIcons } from '../components/PaymentCardIcons';

// Morning pricing constant
const MORNING_PRICE_PER_HOUR = 3.5;

// Check if morning period has expired for a given date
const isMorningExpiredForDate = (selectedDate) => {
  if (!selectedDate) return false;
  
  // Check if selected date is today
  if (!isToday(selectedDate)) return false;
  
  // Get current hour in local timezone
  const now = new Date();
  const currentHour = now.getHours();
  
  // Morning ends at 14:00 (2 PM)
  return currentHour >= 14;
};

export default function TicketsPage() {
  const { isAuthenticated, api, user } = useAuth();
  const navigate = useNavigate();
  
  // Step 1: Time mode (morning/afternoon)
  const [timeMode, setTimeMode] = useState(null); // 'morning' or 'afternoon'
  // Step 2: Date
  const [date, setDate] = useState(null);
  // Step 3: Duration
  const [selectedDuration, setSelectedDuration] = useState(null);
  // Step 4: Slots (lazy loaded)
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const slotsCache = useRef(new Map());
  
  const [children, setChildren] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [customNotes, setCustomNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState([]);
  const [extraHourText, setExtraHourText] = useState('');

  // Fetch children on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchChildren();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Fetch pricing when timeMode changes
  useEffect(() => {
    if (timeMode) {
      fetchPricing(timeMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMode]);

  // Lazy fetch slots ONLY when all 3 selections are made
  useEffect(() => {
    if (!timeMode || !date || !selectedDuration) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const cacheKey = `${dateStr}-${selectedDuration}-${timeMode}`;
    
    // Check cache first
    if (slotsCache.current.has(cacheKey)) {
      setSlots(slotsCache.current.get(cacheKey));
      return;
    }
    
    // Fetch slots with timeMode and duration
    fetchSlots(dateStr, cacheKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeMode, date, selectedDuration]);

  // Reset selections when timeMode changes
  const handleTimeModeChange = (mode) => {
    if (mode !== timeMode) {
      setTimeMode(mode);
      setDate(null);
      setSelectedDuration(null);
      setSelectedSlot(null);
      setSlots([]);
      setPricing([]);
    }
  };

  const fetchPricing = async (mode) => {
    try {
      const response = await api.get(`/payments/hourly-pricing?timeMode=${mode}`);
      setPricing(response.data.pricing || []);
      setExtraHourText(response.data.extra_hour_text || '');
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      // Fallback pricing
      if (mode === 'morning') {
        setPricing([
          { hours: 1, price: 3.5, label_ar: 'ساعة واحدة' },
          { hours: 2, price: 7, label_ar: 'ساعتان' },
          { hours: 3, price: 10.5, label_ar: '3 ساعات' }
        ]);
        setExtraHourText('كل ساعة = 3.5 دينار فقط (عرض الصباح)');
      }
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

  const fetchSlots = async (dateStr, cacheKey) => {
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    try {
      const response = await api.get(
        `/slots/available?date=${dateStr}&slot_type=hourly&timeMode=${timeMode}&duration=${selectedDuration}`
      );
      const fetchedSlots = response.data.slots || [];
      // Cache the result
      slotsCache.current.set(cacheKey, fetchedSlots);
      setSlots(fetchedSlots);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      setSlotsError('فشل تحميل الأوقات المتاحة');
      toast.error('فشل تحميل الأوقات المتاحة');
    } finally {
      setSlotsLoading(false);
    }
  };

  // Calculate end time for a slot based on duration
  const getEndTime = (startTime, duration) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (duration * 60);
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('الرجاء تسجيل الدخول للحجز');
      navigate('/login');
      return;
    }

    if (!selectedSlot || selectedChildren.length === 0 || !selectedDuration) {
      toast.error('الرجاء اختيار الوقت والطفل والمدة');
      return;
    }

    // Check if enough capacity for all children
    if (selectedSlot.available_spots < selectedChildren.length) {
      toast.error(`عذراً، المتاح ${selectedSlot.available_spots} مكان فقط. اخترت ${selectedChildren.length} أطفال.`);
      return;
    }

    setLoading(true);
    try {
      const amount = getSelectedPrice();
      
      if (paymentMethod === 'card') {
        // Stripe checkout flow
        const response = await api.post('/payments/create-checkout', {
          type: 'hourly',
          reference_id: selectedSlot.id,
          child_ids: selectedChildren,
          duration_hours: selectedDuration,
          custom_notes: customNotes.trim(),
          origin_url: window.location.origin,
          timeMode: timeMode // Pass timeMode for server-side pricing
        });
        window.location.href = response.data.url;
      } else {
        // Cash or CliQ - create booking directly
        const response = await api.post('/bookings/hourly/offline', {
          slot_id: selectedSlot.id,
          child_ids: selectedChildren,
          duration_hours: selectedDuration,
          custom_notes: customNotes.trim(),
          payment_method: paymentMethod,
          amount,
          timeMode: timeMode
        });
        
        // Get child name(s) for confirmation
        const selectedChildNames = children
          .filter(c => selectedChildren.includes(c.id))
          .map(c => c.name)
          .join('، ');
        
        // Navigate to confirmation page with booking details
        const confirmationData = {
          bookingId: response.data.bookings?.[0]?.id,
          bookingCode: response.data.bookings?.[0]?.booking_code,
          bookingType: 'hourly',
          childName: selectedChildNames,
          date: selectedSlot.date,
          time: selectedSlot.start_time,
          duration: selectedDuration,
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

  const getSelectedPrice = () => {
    if (!selectedDuration) return 0;
    const selected = pricing.find(p => p.hours === selectedDuration);
    const basePrice = selected ? selected.price : 0;
    return basePrice * Math.max(1, selectedChildren.length);
  };

  const toggleChildSelection = (childId) => {
    setSelectedChildren(prev => 
      prev.includes(childId) 
        ? prev.filter(id => id !== childId)
        : [...prev, childId]
    );
  };

  const minDate = new Date();
  const maxDate = addDays(new Date(), 30);

  // Check if morning is expired for selected date
  const morningExpired = isMorningExpiredForDate(date);

  // Skeleton loader for slots
  const SlotsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 rounded-2xl border-2 border-border bg-muted/30 animate-pulse">
          <div className="h-5 bg-muted rounded w-24 mx-auto mb-2"></div>
          <div className="h-4 bg-muted rounded w-16 mx-auto"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            احجز وقت اللعب بالساعة
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            اختر التاريخ، الفترة، المدة، ثم الوقت المناسب
          </p>
        </div>

        {/* STEP 1: Date Selection */}
        <Card className="border-2 rounded-3xl mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              اختر التاريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
                  // If morning was selected but is now expired for new date, reset timeMode
                  if (timeMode === 'morning' && isMorningExpiredForDate(d)) {
                    setTimeMode(null);
                    setPricing([]);
                  }
                  setSelectedSlot(null);
                  setSelectedDuration(null);
                  setSlots([]);
                }
              }}
              disabled={(d) => d < minDate || d > maxDate}
              className="rounded-xl"
            />
          </CardContent>
        </Card>

        {/* STEP 2: Time Mode Selection - Show only after date selected */}
        {date && (
          <Card className="border-2 rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                اختر الفترة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => !morningExpired && handleTimeModeChange('morning')}
                  disabled={morningExpired}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    morningExpired
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : timeMode === 'morning'
                        ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                        : 'border-border bg-white hover:border-yellow-300'
                  }`}
                >
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${
                    morningExpired 
                      ? 'bg-gray-400' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500'
                  } text-white`}>
                    Happy Hour
                  </Badge>
                  <div className="flex items-center justify-center gap-3">
                    <Sun className={`h-8 w-8 ${morningExpired ? 'text-gray-400' : 'text-yellow-500'}`} />
                    <div className="text-right">
                      <div className={`font-heading text-2xl font-bold ${morningExpired ? 'text-gray-400' : ''}`}>صباحي</div>
                      <div className="text-sm text-muted-foreground">10 صباحاً - 2 ظهراً</div>
                      {morningExpired ? (
                        <div className="text-sm text-red-500 mt-1">غير متاح اليوم (انتهى وقت الفترة الصباحية)</div>
                      ) : (
                        <div className="text-lg font-bold text-yellow-600 mt-1">3.5 دينار/ساعة</div>
                      )}
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTimeModeChange('afternoon')}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    timeMode === 'afternoon'
                      ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                      : 'border-border bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Moon className="h-8 w-8 text-indigo-500" />
                    <div className="text-right">
                      <div className="font-heading text-2xl font-bold">مسائي</div>
                      <div className="text-sm text-muted-foreground">2 ظهراً - منتصف الليل</div>
                      <div className="text-lg font-bold text-indigo-600 mt-1">7-13 دينار</div>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Duration Selection - Show only after timeMode selected */}
        {date && timeMode && (
          <Card className="border-2 rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                اختر مدة اللعب
              </CardTitle>
              <CardDescription className="text-sm">{extraHourText}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricing.map((option) => (
                  <button
                    key={option.hours}
                    onClick={() => {
                      setSelectedDuration(option.hours);
                      setSelectedSlot(null);
                    }}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      selectedDuration === option.hours
                        ? timeMode === 'morning' 
                          ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                          : 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    {option.best_value && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        أفضل قيمة
                      </Badge>
                    )}
                    <div className="text-center">
                      <div className="font-heading text-3xl font-bold mb-2">{option.label_ar}</div>
                      <div className={`text-2xl font-bold mb-1 ${timeMode === 'morning' ? 'text-yellow-600' : 'text-primary'}`}>
                        {option.price} دينار
                      </div>
                      <div className="text-sm text-muted-foreground">{option.price} JD</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Time Slots - Show only after duration selected, lazy load */}
        {timeMode && date && selectedDuration && (
          <Card className="border-2 rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
                <Clock className="h-5 w-5 text-primary" />
                الأوقات المتاحة - {format(date, 'MMMM d, yyyy')}
              </CardTitle>
              <CardDescription>
                {timeMode === 'morning' 
                  ? 'الفترة الصباحية: 10:00 ص - 2:00 م' 
                  : 'الفترة المسائية: 2:00 م - منتصف الليل'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slotsLoading ? (
                <div>
                  <p className="text-center text-muted-foreground mb-4">جاري تحميل الأوقات...</p>
                  <SlotsSkeleton />
                </div>
              ) : slotsError ? (
                <div className="text-center py-12 text-destructive">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{slotsError}</p>
                </div>
              ) : slots.filter(s => s.is_available).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أوقات متاحة لهذه الفترة والمدة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {slots.filter(s => s.is_available).map((slot) => {
                    const endTime = getEndTime(slot.start_time, selectedDuration);
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          selectedSlot?.id === slot.id
                            ? timeMode === 'morning'
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 bg-white'
                        }`}
                      >
                        <div className="font-heading font-semibold text-lg">
                          {slot.start_time} → {endTime}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4" />
                          {slot.available_spots} متاح
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Booking Summary */}
        {isAuthenticated && selectedSlot && (
          <Card className="border-2 rounded-3xl mt-8">
            <CardHeader>
              <CardTitle className="font-heading">أكمل حجزك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label className="block text-sm font-medium mb-2">اختر الأطفال</Label>
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
                      <div className="space-y-2">
                        {children.map((child) => (
                          <label 
                            key={child.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedChildren.includes(child.id) 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedChildren.includes(child.id)}
                              onChange={() => toggleChildSelection(child.id)}
                              className="w-5 h-5 rounded accent-primary"
                            />
                            <span className="font-medium">{child.name}</span>
                          </label>
                        ))}
                        {selectedChildren.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            تم اختيار {selectedChildren.length} طفل
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">الوقت المختار</Label>
                    <div className="p-3 rounded-xl bg-muted">
                      <span className="font-semibold">
                        {format(date, 'MMM d')} في {selectedSlot.start_time}
                      </span>
                      <div className="text-sm text-muted-foreground mt-1">
                        {timeMode === 'morning' ? '☀️ فترة صباحية' : '🌙 فترة مسائية'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">المدة والسعر</Label>
                    <div className={`p-3 rounded-xl border-2 ${
                      timeMode === 'morning' 
                        ? 'bg-yellow-50 border-yellow-500' 
                        : 'bg-primary/10 border-primary'
                    }`}>
                      <div className={`font-bold text-lg ${
                        timeMode === 'morning' ? 'text-yellow-700' : 'text-primary'
                      }`}>
                        {selectedDuration} ساعة - {getSelectedPrice()} دينار
                      </div>
                      {timeMode === 'morning' && (
                        <div className="text-xs text-yellow-600 mt-1">عرض الصباح الخاص</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-notes" className="block text-sm font-medium mb-2">
                    ملاحظات / طلب خاص (اختياري)
                  </Label>
                  <Textarea
                    id="custom-notes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="أي ملاحظات أو طلبات خاصة..."
                    className="rounded-xl resize-none"
                    rows={3}
                  />
                </div>

                {/* Payment Method Selection */}
                <div className="pt-4 border-t">
                  <PaymentMethodSelector 
                    value={paymentMethod} 
                    onChange={setPaymentMethod} 
                  />
                </div>

                {/* Booking Summary */}
                {paymentMethod && (
                  <div className={`p-4 rounded-xl border ${
                    timeMode === 'morning' ? 'bg-yellow-50/50' : 'bg-muted/50'
                  }`}>
                    <p className="text-sm text-muted-foreground mb-1">ملخص الحجز</p>
                    <p className="font-bold">
                      {selectedDuration} ساعة × {selectedChildren.length || 1} طفل = {getSelectedPrice()} دينار
                    </p>
                    <p className="text-sm mt-1">
                      الفترة: <span className="font-bold">{timeMode === 'morning' ? 'صباحية' : 'مسائية'}</span>
                      {' | '}
                      طريقة الدفع: <span className="font-bold">
                        {paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'بطاقة' : 'CliQ'}
                      </span>
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedSlot || selectedChildren.length === 0 || loading}
                    className={`w-full md:w-auto px-8 rounded-full h-12 text-lg ${
                      timeMode === 'morning' 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : 'btn-playful'
                    }`}
                    aria-label={`احجز وادفع ${getSelectedPrice()} دينار - يقبل بطاقات فيزا وماستركارد`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <PaymentCardIcons />
                        <span>{`احجز وادفع - ${getSelectedPrice()} دينار`}</span>
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuthenticated && (
          <Card className="border-2 rounded-3xl mt-8 bg-primary/5">
            <CardContent className="py-8 text-center">
              <p className="text-lg mb-4">الرجاء تسجيل الدخول أو إنشاء حساب للحجز</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                  تسجيل الدخول
                </Button>
                <Button onClick={() => navigate('/register')} className="rounded-full btn-playful">
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
