import { useState, useEffect } from 'react';
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
import { Clock, Users, Loader2, AlertCircle, Star } from 'lucide-react';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { PaymentCardIcons } from '../components/PaymentCardIcons';

export default function TicketsPage() {
  const { isAuthenticated, api, user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [selectedDuration, setSelectedDuration] = useState(2); // Default 2 hours
  const [timeMode, setTimeMode] = useState('morning'); // 'morning' or 'afternoon'
  const [customNotes, setCustomNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [pricing, setPricing] = useState([]);
  const [extraHourText, setExtraHourText] = useState('');

  useEffect(() => {
    fetchPricing();
    if (isAuthenticated) {
      fetchChildren();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSlots();
    setSelectedSlot(null); // Reset selection when date changes
  }, [date]);

  useEffect(() => {
    // Reset selected slot when duration changes (might filter it out)
    if (selectedSlot) {
      const filtered = getFilteredSlots();
      if (!filtered.find(s => s.id === selectedSlot.id)) {
        setSelectedSlot(null);
      }
    }
  }, [selectedDuration]);

  useEffect(() => {
    // Clear selected slot when time mode changes
    setSelectedSlot(null);
  }, [timeMode]);

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

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/slots/available?date=${dateStr}&slot_type=hourly`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('فشل تحميل الأوقات المتاحة');
    } finally {
      setLoadingSlots(false);
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
          origin_url: window.location.origin
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

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            احجز وقت اللعب بالساعة
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            اختر التاريخ والوقت والمدة لجلسة لعب طفلك
          </p>
        </div>

        {/* Duration Selection - BEFORE slot selection */}
        <Card className="border-2 rounded-3xl mb-8">
          <CardHeader>
            <CardTitle className="font-heading text-xl">اختر فترة اللعب</CardTitle>
            <CardDescription className="text-sm">اختر الفترة الصباحية للاستفادة من عرض Happy Hour</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Mode Toggle */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setTimeMode('morning')}
                disabled={(() => {
                  const now = new Date();
                  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                  return isToday && now.getHours() >= 14;
                })()}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-right ${
                  timeMode === 'morning'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 bg-white hover:border-yellow-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-bold text-lg mb-1">☀️ صباحي (Happy Hour)</div>
                <div className="text-sm text-muted-foreground">10:00 ص - 2:00 م</div>
                <div className="text-primary font-bold mt-1">3.5 دينار/ساعة</div>
                {(() => {
                  const now = new Date();
                  const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
                  return isToday && now.getHours() >= 14 && (
                    <div className="text-xs text-destructive mt-1">انتهى وقت العرض اليوم</div>
                  );
                })()}
              </button>
              
              <button
                onClick={() => setTimeMode('afternoon')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-right ${
                  timeMode === 'afternoon'
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 bg-white hover:border-primary/50'
                }`}
              >
                <div className="font-bold text-lg mb-1">🌙 مسائي</div>
                <div className="text-sm text-muted-foreground">بعد 2:00 م</div>
                <div className="text-muted-foreground font-bold mt-1">الأسعار العادية</div>
              </button>
            </div>

            {/* Note based on mode */}
            {timeMode === 'morning' && (
              <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>متاح فقط قبل الساعة 2:00 ظهراً</span>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-heading text-lg mb-4">اختر مدة اللعب</h3>
              <div className="text-sm text-muted-foreground mb-4">{extraHourText}</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pricing.map((option) => {
                  // Calculate price based on time mode
                  const displayPrice = timeMode === 'morning' 
                    ? (3.5 * option.hours).toFixed(1)
                    : option.price;
                  
                  return (
                    <button
                      key={option.hours}
                      onClick={() => setSelectedDuration(option.hours)}
                      className={`relative p-6 rounded-2xl border-2 transition-all ${
                        selectedDuration === option.hours
                          ? 'border-primary bg-primary/10 shadow-lg'
                          : 'border-border bg-white hover:border-primary/50'
                      }`}
                    >
                      {option.best_value && timeMode !== 'morning' && (
                        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          أفضل قيمة
                        </Badge>
                      )}
                      <div className="text-center">
                        <div className="font-heading text-3xl font-bold mb-2">{option.label_ar}</div>
                        <div className="text-2xl font-bold text-primary mb-1">{displayPrice} دينار</div>
                        {timeMode === 'morning' && (
                          <div className="text-xs text-yellow-600">Happy Hour</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="border-2 rounded-3xl">
            <CardHeader>
              <CardTitle className="font-heading">اختر التاريخ</CardTitle>
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

          {/* Time Slots */}
          <Card className="border-2 rounded-3xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                الأوقات المتاحة - {format(date, 'MMMM d, yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد أوقات متاحة لهذا التاريخ</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {getFilteredSlots().map((slot) => {
                    const endTime = getEndTime(slot.start_time, selectedDuration);
                    const pricePerHour = getSlotPrice(slot.start_time);
                    const totalPrice = getSlotTotalPrice(slot.start_time);
                    const isHappyHour = pricePerHour === 3.5;
                    
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
                          {endTime} ← {slot.start_time}
                        </div>
                        {totalPrice && (
                          <div className="text-primary font-bold mt-1">
                            {totalPrice} دينار
                            {isHappyHour && (
                              <span className="block text-xs text-yellow-600">⏰ Happy Hour</span>
                            )}
                          </div>
                        )}
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
        </div>

        {/* Booking Summary */}
        {isAuthenticated && (
          <Card className="border-2 rounded-3xl mt-8">
            <CardHeader>
              <CardTitle className="font-heading">أكمل حجزك</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 pb-24">{/* Added pb-24 for sticky button space */}
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
                      {selectedSlot ? (
                        <span className="font-semibold">
                          {format(date, 'MMM d')} في {selectedSlot.start_time}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">لم يتم اختيار الوقت</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="block text-sm font-medium mb-2">المدة والسعر</Label>
                    <div className="p-3 rounded-xl bg-primary/10 border-2 border-primary">
                      <div className="font-bold text-lg text-primary">
                        {selectedSlot && selectedDuration 
                          ? `${selectedDuration} ساعة - ${(parseFloat(getSlotTotalPrice(selectedSlot.start_time)) * Math.max(1, selectedChildren.length)).toFixed(1)} دينار`
                          : `${selectedDuration} ساعة - ${getSelectedPrice()} دينار`
                        }
                      </div>
                      {selectedSlot && getSlotPrice(selectedSlot.start_time) === 3.5 && (
                        <div className="text-sm text-yellow-600 mt-1">⏰ Happy Hour Price</div>
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
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-sm text-muted-foreground mb-1">ملخص الحجز</p>
                    <p className="font-bold">
                      {selectedSlot 
                        ? `${selectedDuration} ساعة × ${selectedChildren.length || 1} طفل = ${(parseFloat(getSlotTotalPrice(selectedSlot.start_time)) * Math.max(1, selectedChildren.length)).toFixed(1)} دينار`
                        : `${selectedDuration} ساعة × ${selectedChildren.length || 1} طفل = ${getSelectedPrice()} دينار`
                      }
                    </p>
                    {selectedSlot && getSlotPrice(selectedSlot.start_time) === 3.5 && (
                      <p className="text-sm text-yellow-600 mt-1">⏰ Happy Hour Price (3.5 JD/hour)</p>
                    )}
                    <p className="text-sm mt-1">
                      طريقة الدفع: <span className="font-bold">
                        {paymentMethod === 'cash' ? 'نقداً' : paymentMethod === 'card' ? 'بطاقة' : 'CliQ'}
                      </span>
                    </p>
                  </div>
                )}

                {/* Sticky CTA Container */}
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg p-4 -mx-6 -mb-6 mt-6 z-50">
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedSlot || selectedChildren.length === 0 || loading}
                    className="w-full px-8 rounded-full h-14 btn-playful text-lg"
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
