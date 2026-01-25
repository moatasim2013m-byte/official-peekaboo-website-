import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { QrCode, Clock, Star, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';

export default function ReceptionPage() {
  const { api } = useAuth();
  const [bookingCode, setBookingCode] = useState('');
  const [childId, setChildId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleHourlyCheckin = async (e) => {
    e.preventDefault();
    if (!bookingCode) {
      toast.error('Please enter a booking code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/bookings/hourly/checkin', {
        booking_code: bookingCode.toUpperCase()
      });
      
      setResult({
        type: 'hourly',
        success: true,
        data: response.data
      });
      toast.success('Check-in successful! Session started.');
      setBookingCode('');
    } catch (error) {
      setResult({
        type: 'hourly',
        success: false,
        error: error.response?.data?.error || 'Check-in failed'
      });
      toast.error(error.response?.data?.error || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionConsume = async (e) => {
    e.preventDefault();
    if (!childId) {
      toast.error('Please enter a child ID');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/subscriptions/consume', {
        child_id: childId
      });
      
      setResult({
        type: 'subscription',
        success: true,
        data: response.data
      });
      toast.success('Visit consumed successfully!');
      setChildId('');
    } catch (error) {
      setResult({
        type: 'subscription',
        success: false,
        error: error.response?.data?.error || 'Failed to consume visit'
      });
      toast.error(error.response?.data?.error || 'Failed to consume visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4" data-testid="reception-title">
            <QrCode className="inline-block h-10 w-10 text-primary mr-2" />
            Reception Check-in
          </h1>
          <p className="text-muted-foreground text-lg">
            Scan tickets and manage subscriptions
          </p>
        </div>

        <Tabs defaultValue="hourly" className="space-y-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 rounded-full p-1 bg-white border-2">
            <TabsTrigger value="hourly" className="rounded-full gap-2" data-testid="tab-hourly-checkin">
              <Clock className="h-4 w-4" /> Hourly Check-in
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-full gap-2" data-testid="tab-subscription-checkin">
              <Star className="h-4 w-4" /> Subscription
            </TabsTrigger>
          </TabsList>

          {/* Hourly Check-in */}
          <TabsContent value="hourly">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">Hourly Ticket Check-in</CardTitle>
                <CardDescription>
                  Enter the booking code from the parent's QR code to start their session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleHourlyCheckin} className="space-y-6">
                  <div>
                    <Label htmlFor="bookingCode">Booking Code</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="bookingCode"
                        value={bookingCode}
                        onChange={(e) => setBookingCode(e.target.value)}
                        placeholder="PK-H-XXXXXXXX"
                        className="pl-10 rounded-xl h-14 text-lg uppercase"
                        data-testid="booking-code-input"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !bookingCode}
                    className="w-full rounded-full h-14 text-lg btn-playful"
                    data-testid="checkin-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Checking in...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Check In & Start Session
                      </>
                    )}
                  </Button>
                </form>

                {/* Result Display */}
                {result && result.type === 'hourly' && (
                  <div className={`mt-6 p-6 rounded-2xl ${result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                    {result.success ? (
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl font-bold text-green-700 mb-2">
                          Check-in Successful!
                        </h3>
                        <p className="text-green-600 mb-4">
                          Session started for {result.data.booking?.child_id?.name || 'Guest'}
                        </p>
                        <div className="bg-white rounded-xl p-4">
                          <p className="text-sm text-muted-foreground">Session ends at</p>
                          <p className="text-2xl font-heading font-bold">
                            {new Date(result.data.session_end_time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl font-bold text-red-700 mb-2">
                          Check-in Failed
                        </h3>
                        <p className="text-red-600">{result.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Consume */}
          <TabsContent value="subscription">
            <Card className="border-2 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-heading">Subscription Visit</CardTitle>
                <CardDescription>
                  Enter the child's ID to consume a subscription visit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubscriptionConsume} className="space-y-6">
                  <div>
                    <Label htmlFor="childId">Child ID</Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="childId"
                        value={childId}
                        onChange={(e) => setChildId(e.target.value)}
                        placeholder="Enter child ID"
                        className="pl-10 rounded-xl h-14 text-lg"
                        data-testid="child-id-input"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading || !childId}
                    className="w-full rounded-full h-14 text-lg btn-playful bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    data-testid="consume-btn"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Star className="mr-2 h-5 w-5" />
                        Consume Visit
                      </>
                    )}
                  </Button>
                </form>

                {/* Result Display */}
                {result && result.type === 'subscription' && (
                  <div className={`mt-6 p-6 rounded-2xl ${result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                    {result.success ? (
                      <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl font-bold text-green-700 mb-2">
                          Visit Consumed!
                        </h3>
                        <div className="bg-white rounded-xl p-4 mt-4">
                          <p className="text-sm text-muted-foreground">Remaining visits</p>
                          <p className="text-3xl font-heading font-bold text-secondary">
                            {result.data.subscription?.remaining_visits}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                        <h3 className="font-heading text-xl font-bold text-red-700 mb-2">
                          Failed
                        </h3>
                        <p className="text-red-600">{result.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
