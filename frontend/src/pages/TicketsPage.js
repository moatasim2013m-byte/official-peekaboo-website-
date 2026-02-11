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
import { format, addDays } from 'date-fns';
import { Clock, Users, Loader2, AlertCircle, Star, Sun, Moon } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';

// Morning pricing constant
const MORNING_PRICE_PER_HOUR = 3.5;

// Check if morning period has expired for a given date
const isMorningExpiredForDate = (selectedDate) => {
  if (!selectedDate) return false;
  
  // Check if selected date is today (in Amman timezone)
  const now = new Date();
  const ammanFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Amman',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayInAmman = ammanFormatter.format(now); // YYYY-MM-DD format
  
  // Format selected date as YYYY-MM-DD for comparison
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  // If selected date is not today in Amman, morning is available
  if (selectedDateStr !== todayInAmman) return false;
  
  // Get current hour in Asia/Amman timezone
  const hourFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Amman',
    hour: 'numeric',
    hour12: false
  });
  const ammanHour = parseInt(hourFormatter.format(now), 10);
  
  // Morning ends at 14:00 (2 PM) Amman time
  return ammanHour >= 14;
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
  const [timeMode, setTimeMode] = useState('morning'); // 'morning' or 'afternoon'
  const [customNotes, setCustomNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState([]);
  const [extraHourText, setExtraHourText] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'احجز وقت اللعب | بيكابو';
  }, []);

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
      setSelectedDuration(null);
      setSelectedSlot(null);
      setSlots([]);
      setPricing([]);
    }
  };

  const fetchPricing = async () => {
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

  // Filter slots based on selected duration AND time mode
  const getFilteredSlots = () => {
    return slots.filter(slot => {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (selectedDuration * 60);
      
      // Must not pass midnight (00:00)
      if (endMinutes > 1440) return false;
      
      // Filter by time mode
      if (timeMode === 'morning') {
        // Morning (Happy Hour): 10:00 to 13:59
        return hours >= 10 && hours < 14;
      } else {
        // Afternoon: 14:00 onwards
        return hours >= 14;
      }
    });
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
      // Calculate amount using Happy Hour logic
      const amount = selectedSlot 
        ? parseFloat(getSlotTotalPrice(selectedSlot.start_time)) * Math.max(1, selectedChildren.length)
        : getSelectedPrice();
      
      if (paymentMethod === 'card') {
        // Stripe checkout flow
        const response = await api.post('/payments/create-checkout', {
          type: 'hourly',
          reference_id: selectedSlot.id,
          child_ids: selectedChildren,
          duration_hours: selectedDuration,
          slot_start_time: selectedSlot.start_time, // Pass slot time for Happy Hour calculation
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
          slot_start_time: selectedSlot.start_time, // Pass slot time for Happy Hour calculation
          custom_notes: customNotes.trim(),
          payment_method: paymentMethod
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

  // Helper function for Happy Hour pricing (10:00-14:00)
  const getSlotPrice = (startTime) => {
    if (!startTime) return null;
    
    // Parse the time string (format: "HH:mm")
    const [hours] = startTime.split(':').map(Number);
    
    // Happy Hour: 10:00 to 13:59 (before 14:00)
    const isHappyHour = hours >= 10 && hours < 14;
    
    if (isHappyHour) {
      return 3.5; // Happy Hour price per hour
    }
    
    // Normal price from pricing data
    const selected = pricing.find(p => p.hours === selectedDuration);
    return selected ? selected.price / selected.hours : null;
  };

  const getSlotTotalPrice = (startTime) => {
    const pricePerHour = getSlotPrice(startTime);
    if (!pricePerHour) return null;
    return (pricePerHour * selectedDuration).toFixed(1);
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
    <div className="min-h-screen py-8 md:py-12" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            احجز وقت اللعب
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            اختر التاريخ، الفترة، المدة، ثم الوقت المناسب
          </p>
          
          {/* Progress Indicator */}
          <div className="booking-progress mt-6 inline-flex">
            <div className={`booking-progress-step ${date ? 'complete' : 'active'}`}></div>
            <div className={`booking-progress-step ${timeMode ? 'complete' : date ? 'active' : ''}`}></div>
            <div className={`booking-progress-step ${selectedDuration ? 'complete' : timeMode ? 'active' : ''}`}></div>
            <div className={`booking-progress-step ${selectedSlot ? 'complete' : selectedDuration ? 'active' : ''}`}></div>
            <span className="text-sm mr-2">
              {!date ? '1/4' : !timeMode ? '2/4' : !selectedDuration ? '3/4' : !selectedSlot ? '4/4' : '✓'}
            </span>
          </div>
        </div>

        {/* STEP 1: Date Selection */}
        <Card className="booking-card mb-6">
          <CardHeader className="booking-card-header">
            <CardTitle className="booking-card-title">
              <span className={`step-badge ${date ? 'step-badge-complete' : ''}`}>1</span>
              اختر التاريخ
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d) {
                  setDate(d);
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

        {/* STEP 2: Time Mode Selection */}
        {date && (
          <Card className="booking-card mb-6">
            <CardHeader className="booking-card-header">
              <CardTitle className="booking-card-title">
                <span className={`step-badge ${timeMode ? 'step-badge-complete' : ''}`}>2</span>
                اختر الفترة
              </CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => !morningExpired && handleTimeModeChange('morning')}
                  disabled={morningExpired}
                  className={`option-btn ${timeMode === 'morning' ? 'selected-yellow' : ''} ${morningExpired ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 ${morningExpired ? 'bg-gray-400' : 'bg-gradient-to-r from-yellow-400 to-orange-500'} text-white text-xs`}>
                    Happy Hour
                  </Badge>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Sun className={`h-8 w-8 ${morningExpired ? 'text-gray-400' : 'text-yellow-500'}`} />
                    <div className="text-right">
                      <div className={`font-heading text-xl font-bold ${morningExpired ? 'text-gray-400' : ''}`}>صباحي</div>
                      <div className="text-sm text-muted-foreground">10 ص - 2 م</div>
                      {morningExpired ? (
                        <div className="text-xs text-red-500 mt-1">غير متاح اليوم</div>
                      ) : (
                        <div className="text-base font-bold text-yellow-600 mt-1">3.5 د/ساعة</div>
                      )}
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleTimeModeChange('afternoon')}
                  className={`option-btn ${timeMode === 'afternoon' ? 'selected' : ''}`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Moon className="h-8 w-8 text-indigo-500" />
                    <div className="text-right">
                      <div className="font-heading text-xl font-bold">مسائي</div>
                      <div className="text-sm text-muted-foreground">2 م - 12 ص</div>
                      <div className="text-base font-bold text-indigo-600 mt-1">7-13 دينار</div>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Duration Selection */}
        {date && timeMode && (
          <Card className="booking-card mb-6">
            <CardHeader className="booking-card-header">
              <CardTitle className="booking-card-title">
                <span className={`step-badge ${selectedDuration ? 'step-badge-complete' : ''}`}>3</span>
                اختر مدة اللعب
              </CardTitle>
              {extraHourText && <CardDescription className="text-sm mt-1 mr-10">{extraHourText}</CardDescription>}
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {pricing.map((option) => (
                  <button
                    key={option.hours}
                    onClick={() => {
                      setSelectedDuration(option.hours);
                      setSelectedSlot(null);
                    }}
                    className={`option-btn ${selectedDuration === option.hours ? (timeMode === 'morning' ? 'selected-yellow' : 'selected') : ''}`}
                  >
                    {option.best_value && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs">
                        <Star className="h-3 w-3 ml-1" />
                        أفضل قيمة
                      </Badge>
                    )}
                    <div className="pt-1">
                      <div className="font-heading text-2xl font-bold mb-1">{option.label_ar}</div>
                      <div className={`text-xl font-bold ${timeMode === 'morning' ? 'text-yellow-600' : 'text-primary'}`}>
                        {option.price} دينار
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Time Slots */}
        {timeMode && date && selectedDuration && (
          <Card className="booking-card mb-6">
            <CardHeader className="booking-card-header">
              <CardTitle className="booking-card-title">
                <span className={`step-badge ${selectedSlot ? 'step-badge-complete' : ''}`}>4</span>
                <Clock className="h-5 w-5 text-primary" />
                الأوقات المتاحة
              </CardTitle>
              <CardDescription className="mr-10 text-sm">
                {format(date, 'MMMM d')} • {timeMode === 'morning' ? '10 ص - 2 م' : '2 م - 12 ص'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-6">
              {slotsLoading ? (
                <div>
                  <p className="text-center text-muted-foreground mb-4">جاري تحميل الأوقات...</p>
                  <SlotsSkeleton />
                </div>
              ) : slotsError ? (
                <div className="text-center py-8 text-destructive">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>{slotsError}</p>
                </div>
              ) : slots.filter(s => s.is_available).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>لا توجد أوقات متاحة لهذه الفترة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.filter(s => s.is_available).map((slot) => {
                    const endTime = getEndTime(slot.start_time, selectedDuration);
                    const pricePerHour = getSlotPrice(slot.start_time);
                    const totalPrice = getSlotTotalPrice(slot.start_time);
                    const isHappyHour = pricePerHour === 3.5;
                    
                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-btn ${selectedSlot?.id === slot.id ? (timeMode === 'morning' ? 'selected-yellow' : 'selected') : ''}`}
                      >
                        <div className="font-heading font-semibold">
                          {slot.start_time} → {endTime}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3" />
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
          <Card className="booking-card">
            <CardHeader className="booking-card-header">
              <CardTitle className="booking-card-title">أكمل حجزك</CardTitle>
            </CardHeader>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label className="block text-sm font-medium mb-2">اختر الأطفال</Label>
                    {children.length === 0 ? (
                      <div className="text-muted-foreground">
                        <p className="mb-2 text-sm">لم يتم إضافة أطفال بعد</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="rounded-full">
                          إضافة طفل
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {children.map((child) => (
                          <label 
                            key={child.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedChildren.includes(child.id) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
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
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">الوقت المختار</Label>
                    <div className="p-3 rounded-xl bg-muted text-sm">
                      <span className="font-semibold">{format(date, 'MMM d')} في {selectedSlot.start_time}</span>
                      <div className="text-muted-foreground mt-1">
                        {timeMode === 'morning' ? '☀️ صباحية' : '🌙 مسائية'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">المدة والسعر</Label>
                    <div className={`p-3 rounded-xl border-2 ${timeMode === 'morning' ? 'bg-yellow-50 border-yellow-400' : 'bg-primary/10 border-primary'}`}>
                      <div className={`font-bold text-lg ${timeMode === 'morning' ? 'text-yellow-700' : 'text-primary'}`}>
                        {selectedDuration} ساعة - {getSelectedPrice()} د
                      </div>
                      {timeMode === 'morning' && <div className="text-xs text-yellow-600 mt-1">عرض الصباح</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="custom-notes" className="block text-sm font-medium mb-2">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="custom-notes"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="أي ملاحظات أو طلبات خاصة..."
                    className="rounded-xl resize-none"
                    rows={2}
                  />
                </div>

                <div className="pt-4 border-t">
                  <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />
                </div>

                {paymentMethod && (
                  <div className="booking-summary">
                    <p className="text-sm text-muted-foreground mb-1">ملخص الحجز</p>
                    <p className="font-bold">
                      {selectedSlot 
                        ? `${selectedDuration} ساعة × ${selectedChildren.length || 1} طفل = ${(parseFloat(getSlotTotalPrice(selectedSlot.start_time)) * Math.max(1, selectedChildren.length)).toFixed(1)} دينار`
                        : `${selectedDuration} ساعة × ${selectedChildren.length || 1} طفل = ${getSelectedPrice()} دينار`
                      }
                    </p>
                  </div>
                )}

                {/* Sticky CTA Container */}
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg p-4 -mx-6 -mb-6 mt-6 z-50">
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedSlot || selectedChildren.length === 0 || loading}
                    className={`w-full md:w-auto px-8 rounded-full h-12 text-base ${timeMode === 'morning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'btn-playful'}`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <span>احجز - {getSelectedPrice()} د</span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isAuthenticated && (
          <Card className="booking-card bg-primary/5">
            <CardContent className="py-8 text-center">
              <p className="text-lg mb-4">سجّل الدخول أو أنشئ حساب للحجز</p>
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
