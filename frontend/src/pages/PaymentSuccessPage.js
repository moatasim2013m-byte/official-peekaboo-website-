import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { api, isAuthenticated, loading: authLoading } = useAuth();
  const orderId = useMemo(() => searchParams.get('orderId') || searchParams.get('session_id') || '', [searchParams]);

  const [isFinalizing, setIsFinalizing] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (!orderId) {
      setIsFinalizing(false);
      setErrorMessage('رقم العملية غير متوفر.');
      return;
    }

    let cancelled = false;
    const finalize = async () => {
      setIsFinalizing(true);
      setErrorMessage('');

      for (let attempt = 0; attempt < 6; attempt += 1) {
        try {
          const response = await api.post(`/payments/finalize/${encodeURIComponent(orderId)}`);
          if (cancelled) return;

          const result = response.data || {};
          const bookingType = result.resourceType || 'hourly';
          const firstHourlyBooking = result.bookings?.[0];
          const confirmationData = {
            bookingId: result.booking?.id || result.subscription?.id || firstHourlyBooking?.id,
            bookingCode:
              result.booking?.booking_code ||
              firstHourlyBooking?.booking_code ||
              (result.subscription?.id ? `PK-SUB-${result.subscription.id.slice(-6).toUpperCase()}` : ''),
            bookingType,
            paymentMethod: 'card',
            amount: firstHourlyBooking?.amount || result.booking?.amount || result.subscription?.amount
          };

          localStorage.setItem('pk_last_confirmation', JSON.stringify(confirmationData));
          navigate('/booking-confirmation', { replace: true, state: confirmationData });
          return;
        } catch (error) {
          if (cancelled) return;
          if (error?.response?.status === 202 || error?.response?.status === 409) {
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
          const message = error?.response?.data?.error || 'تعذر تأكيد الحجز بعد الدفع. تواصل معنا مع رقم الطلب.';
          setErrorMessage(message);
          setIsFinalizing(false);
          return;
        }
      }

      if (!cancelled) {
        setErrorMessage('ما زلنا نؤكد الدفع. يمكنك المحاولة مرة أخرى بعد لحظات.');
        setIsFinalizing(false);
      }
    };

    finalize();

    return () => {
      cancelled = true;
    };
  }, [api, authLoading, isAuthenticated, navigate, orderId]);

  const handleRetry = async () => {
    toast.info('جاري إعادة المحاولة...');
    setErrorMessage('');
    setIsFinalizing(true);
    try {
      await api.post(`/payments/finalize/${encodeURIComponent(orderId)}`);
      window.location.reload();
    } catch (_error) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-5">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            {isFinalizing ? <Loader2 className="h-12 w-12 text-green-600 animate-spin" /> : <CheckCircle2 className="h-12 w-12 text-green-600" />}
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold text-green-700">تم استلام عملية الدفع</h1>
            <p className="text-base text-green-700">{isFinalizing ? 'جاري تأكيد الحجز تلقائياً...' : 'Payment received'}</p>
          </div>

          <div className="bg-white/80 border border-green-200 rounded-xl py-3 px-4">
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-semibold text-base break-all">{orderId || '—'}</p>
          </div>

          {errorMessage ? (
            <div className="space-y-3">
              <p className="text-red-600 text-sm">{errorMessage}</p>
              <Button onClick={handleRetry} className="rounded-full btn-playful">إعادة المحاولة</Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">يرجى عدم إغلاق الصفحة حتى يكتمل التأكيد.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
