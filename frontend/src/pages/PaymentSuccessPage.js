import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { api, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId || !isAuthenticated) {
      setStatus('error');
      return;
    }

    const pollStatus = async () => {
      try {
        const response = await api.get(`/payments/status/${sessionId}`);
        const data = response.data;
        setPaymentData(data);

        if (data.payment_status === 'paid') {
          setStatus('success');
          
          // Create the actual booking based on type
          const { type, child_id } = data.metadata;
          
          if (type === 'hourly') {
            await api.post('/bookings/hourly', {
              slot_id: data.metadata.slot_id,
              child_id,
              payment_id: data.payment_id,
              amount: 10.00 // Will be fetched from settings in production
            });
          } else if (type === 'birthday') {
            await api.post('/bookings/birthday', {
              slot_id: data.metadata.slot_id,
              child_id,
              theme_id: data.metadata.theme_id,
              payment_id: data.payment_id,
              amount: 100.00 // Will be fetched from theme in production
            });
          } else if (type === 'subscription') {
            await api.post('/subscriptions/purchase', {
              plan_id: data.metadata.plan_id,
              child_id,
              payment_id: data.payment_id
            });
          }
        } else if (data.status === 'expired') {
          setStatus('expired');
        } else if (attempts < 5) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Payment status check error:', error);
        if (attempts < 5) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setStatus('error');
        }
      }
    };

    pollStatus();
  }, [sessionId, isAuthenticated, api, attempts]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4">
      <Card className="w-full max-w-md border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-bold mb-2">Processing Payment...</h2>
              <p className="text-muted-foreground">Please wait while we confirm your payment</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2 text-green-600">Payment Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your booking has been confirmed. Check your email for details.
              </p>
              <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful" data-testid="go-to-profile">
                View My Bookings
              </Button>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-yellow-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2 text-yellow-600">Session Expired</h2>
              <p className="text-muted-foreground mb-6">
                Your payment session has expired. Please try booking again.
              </p>
              <Button onClick={() => navigate('/tickets')} className="rounded-full" data-testid="try-again">
                Book Again
              </Button>
            </>
          )}

          {status === 'pending' && (
            <>
              <Loader2 className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="font-heading text-2xl font-bold mb-2">Payment Pending</h2>
              <p className="text-muted-foreground mb-6">
                We're still processing your payment. Please check back in a moment.
              </p>
              <Button onClick={() => navigate('/profile')} variant="outline" className="rounded-full">
                Go to Profile
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2 text-red-600">Something Went Wrong</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't verify your payment. Please contact support if you were charged.
              </p>
              <Button onClick={() => navigate('/')} className="rounded-full">
                Go Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
