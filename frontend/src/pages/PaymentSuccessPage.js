import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const FINALIZED_KEY = 'pk_finalized_sessions';
const PENDING_CHECKOUT_KEY = 'pk_pending_checkout';

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { api, loading: authLoading, isAuthenticated } = useAuth();
  const orderId = useMemo(() => searchParams.get('orderId') || searchParams.get('session_id'), [searchParams]);
  const [finalizing, setFinalizing] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      setFinalizing(false);
      return;
    }

    if (!orderId) {
      setFinalizing(false);
      return;
    }

    const finalizedSessions = readJson(FINALIZED_KEY, []);
    if (Array.isArray(finalizedSessions) && finalizedSessions.includes(orderId)) {
      setFinalizing(false);
      return;
    }

    const pendingCheckout = readJson(PENDING_CHECKOUT_KEY, null);
    if (!pendingCheckout || pendingCheckout.sessionId !== orderId) {
      setFinalizing(false);
      return;
    }

    const finalizePayment = async () => {
      try {
        const { type, payload } = pendingCheckout;
        let response;

        if (type === 'hourly') {
          response = await api.post('/bookings/hourly', {
            ...payload,
            payment_id: orderId
          });
        } else if (type === 'birthday') {
          response = await api.post('/bookings/birthday', {
            ...payload,
            payment_id: orderId
          });
        } else if (type === 'subscription') {
          response = await api.post('/subscriptions/purchase', {
            ...payload,
            payment_id: orderId
          });
        }

        if (response) {
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
          localStorage.setItem(FINALIZED_KEY, JSON.stringify([...new Set([...(finalizedSessions || []), orderId])].slice(-20)));
          toast.success('تم تأكيد الحجز بنجاح');
        }
      } catch (error) {
        const message = error?.response?.data?.error || 'تم الدفع ولكن تعذر تأكيد الحجز تلقائياً. تواصل معنا بالدعم.';
        toast.error(message);
      } finally {
        setFinalizing(false);
      }
    };

    finalizePayment();
  }, [api, authLoading, isAuthenticated, orderId]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-5">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold text-green-700">تم الدفع بنجاح</h1>
            <p className="text-lg text-green-700">Payment Successful</p>
          </div>

          {finalizing ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تأكيد الحجز...
            </div>
          ) : null}

          <div className="bg-white/80 border border-green-200 rounded-xl py-3 px-4">
            <p className="text-sm text-muted-foreground">رقم الطلب / Order ID</p>
            <p className="font-semibold text-base break-all">{orderId || '—'}</p>
          </div>

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            حجوزاتي / My Bookings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
