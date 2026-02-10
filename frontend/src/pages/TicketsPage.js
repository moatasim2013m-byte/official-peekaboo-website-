import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { Clock, Users, Loader2, AlertCircle, Star, Sun, Moon } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentCardIcons } from '../components/PaymentCardIcons';

export default function TicketsPage() {
  const { isAuthenticated, api, user } = useAuth();
  const navigate = useNavigate();
  
  // Step 1: Time mode (morning/evening)
  const [timeMode, setTimeMode] = useState(null); // 'morning' or 'evening'
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

  // Fetch pricing and children on mount
  useEffect(() => {
    fetchPricing();
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

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
    
    // Fetch slots
    fetchSlots(dateStr, cacheKey);
  }, [timeMode, date, selectedDuration]);

  // Reset slot selection when duration changes
  useEffect(() => {
    if (selectedSlot && slots.length > 0) {
      const filtered = getFilteredSlots();
      if (!filtered.find(s => s.id === selectedSlot.id)) {
        setSelectedSlot(null);
      }
    }
  }, [selectedDuration, slots]);

  const fetchPricing = async () => {
    try {
      const response = await api.get('/payments/hourly-pricing');
      setPricing(response.data.pricing || []);
      setExtraHourText(response.data.extra_hour_text || '');
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
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
      const response = await api.get(`/slots/available?date=${dateStr}&slot_type=hourly`);
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

  // Filter slots based on selected duration and time mode
  const getFilteredSlots = () => {
    return slots.filter(slot => {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + (selectedDuration * 60);
      
      // Filter by time mode
      if (timeMode === 'morning') {
        // Morning/Happy Hour: before 4 PM (16:00 = 960 minutes)
        if (hours >= 16) return false;
      } else if (timeMode === 'evening') {
        // Evening: 4 PM and after
        if (hours < 16) return false;
      }
      
      // Must not pass midnight (00:00 = 1440 minutes)
      return endMinutes <= 1440;
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
      const amount = getSelectedPrice();
      
      if (paymentMethod === 'card') {
        // Stripe checkout flow
        const response = await api.post('/payments/create-checkout', {
          type: 'hourly',
          reference_id: selectedSlot.id,
          child_ids: selectedChildren,
          duration_hours: selectedDuration,
          custom_notes: customNotes.trim(),
          origin_url: window.location.origin
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
          amount
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
            اختر الفترة، التاريخ، المدة، ثم الوقت المناسب
          </p>
        </div>

        {/* STEP 1: Time Mode Selection */}
        <Card className="border-2 rounded-3xl mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
              اختر الفترة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setTimeMode('morning')}
                className={`relative p-6 rounded-2xl border-2 transition-all ${
                  timeMode === 'morning'
                    ? 'border-yellow-500 bg-yellow-50 shadow-lg'
                    : 'border-border bg-white hover:border-yellow-300'
                }`}
              >
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  Happy Hour
                </Badge>
                <div className="flex items-center justify-center gap-3">
                  <Sun className="h-8 w-8 text-yellow-500" />
                  <div className="text-right">
                    <div className="font-heading text-2xl font-bold">صباحي</div>
                    <div className="text-sm text-muted-foreground">قبل 4 عصراً - أسعار مخفضة</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setTimeMode('evening')}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  timeMode === 'evening'
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                    : 'border-border bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <Moon className="h-8 w-8 text-indigo-500" />
                  <div className="text-right">
                    <div className="font-heading text-2xl font-bold">مسائي</div>
                    <div className="text-sm text-muted-foreground">4 عصراً فما بعد</div>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2: Date Selection - Show only after timeMode selected */}
        {timeMode && (
          <Card className="border-2 rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                اختر التاريخ
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d < minDate || d > maxDate}
                className="rounded-xl"
              />
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Duration Selection - Show only after date selected */}
        {timeMode && date && (
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
                    onClick={() => setSelectedDuration(option.hours)}
                    className={`relative p-6 rounded-2xl border-2 transition-all ${
                      selectedDuration === option.hours
                        ? 'border-primary bg-primary/10 shadow-lg'
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
                      <div className="text-2xl font-bold text-primary mb-1">{option.price} دينار</div>
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
              ) : getFilteredSlots().length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أوقات متاحة لهذه الفترة والمدة</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getFilteredSlots().map((slot) => {
                    const endTime = getEndTime(slot.start_time, selectedDuration);
                    return (
                      <button
                        key={slot.id}
                        onClick={() => slot.is_available && setSelectedSlot(slot)}
                        disabled={!slot.is_available}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          selectedSlot?.id === slot.id
                            ? 'border-primary bg-primary/10'
                            : slot.is_available
                            ? 'border-border hover:border-primary/50 bg-white'
                            : 'border-border bg-muted opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="font-heading font-semibold text-lg">
                          {slot.start_time} → {endTime}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4" />
                          {slot.available_spots} متاح
                        </div>
                        {slot.is_past && (
                          <div className="text-xs text-destructive mt-1">منتهي</div>
                        )}
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
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">المدة والسعر</Label>
                    <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary">
                      <div className="font-bold text-lg text-primary">
                        {selectedDuration} ساعة - {getSelectedPrice()} دينار
                      </div>
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
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-sm text-muted-foreground mb-1">ملخص الحجز</p>
                    <p className="font-bold">
                      {selectedDuration} ساعة × {selectedChildren.length || 1} طفل = {getSelectedPrice()} دينار
                    </p>
                    <p className="text-sm mt-1">
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
                    className="w-full md:w-auto px-8 rounded-full h-12 btn-playful text-lg"
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
