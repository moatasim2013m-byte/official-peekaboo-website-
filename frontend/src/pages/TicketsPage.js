import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar } from '../components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { Clock, Users, Loader2, AlertCircle } from 'lucide-react';

export default function TicketsPage() {
  const { isAuthenticated, api, user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedChild, setSelectedChild] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
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

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await api.get(`/slots/available?date=${dateStr}&slot_type=hourly`);
      setSlots(response.data.slots || []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to book');
      navigate('/login');
      return;
    }

    if (!selectedSlot || !selectedChild) {
      toast.error('Please select a slot and child');
      return;
    }

    setLoading(true);
    try {
      // Create checkout session
      const response = await api.post('/payments/create-checkout', {
        type: 'hourly',
        reference_id: selectedSlot.id,
        child_id: selectedChild,
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = response.data.url;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate booking');
      setLoading(false);
    }
  };

  const minDate = new Date();
  const maxDate = addDays(new Date(), 30);

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="tickets-title">
            Book Hourly Play
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select a date and time slot for your child's play session. Each session is 60 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="border-2 rounded-3xl">
            <CardHeader>
              <CardTitle className="font-heading">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d < minDate || d > maxDate}
                className="rounded-xl"
                data-testid="tickets-calendar"
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="border-2 rounded-3xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Available Slots for {format(date, 'MMMM d, yyyy')}
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
                  <p>No slots available for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((slot) => (
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
                      data-testid={`slot-${slot.start_time}`}
                    >
                      <div className="font-heading font-semibold text-lg">{slot.start_time}</div>
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-1">
                        <Users className="h-4 w-4" />
                        {slot.available_spots} spots
                      </div>
                      {slot.is_past && (
                        <div className="text-xs text-destructive mt-1">Past</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Summary */}
        {isAuthenticated && (
          <Card className="border-2 rounded-3xl mt-8">
            <CardHeader>
              <CardTitle className="font-heading">Complete Your Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <SelectTrigger className="rounded-xl" data-testid="child-select">
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

                <div>
                  <label className="block text-sm font-medium mb-2">Selected Slot</label>
                  <div className="p-3 rounded-xl bg-muted">
                    {selectedSlot ? (
                      <span className="font-semibold">
                        {format(date, 'MMM d')} at {selectedSlot.start_time}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No slot selected</span>
                    )}
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleBooking}
                    disabled={!selectedSlot || !selectedChild || loading}
                    className="w-full rounded-full h-12 btn-playful"
                    data-testid="book-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Book & Pay'
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
              <p className="text-lg mb-4">Please login or create an account to book</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => navigate('/login')} variant="outline" className="rounded-full">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} className="rounded-full btn-playful">
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
