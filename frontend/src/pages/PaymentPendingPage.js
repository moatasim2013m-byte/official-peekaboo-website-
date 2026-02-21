import { Clock3 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function PaymentPendingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || searchParams.get('session_id');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-5">
          <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Clock3 className="h-12 w-12 text-yellow-600" />
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold text-yellow-700">الدفع قيد المراجعة</h1>
            <p className="text-lg text-yellow-700">Payment Under Review</p>
          </div>

          <p className="text-muted-foreground">
            سيتم إشعارك فور تحديث حالة الدفع. / We will notify you once the payment status is updated.
          </p>


          {sessionId ? (
            <div className="bg-white/80 border border-yellow-200 rounded-xl py-3 px-4">
              <p className="text-sm text-muted-foreground">رقم العملية / Session ID</p>
              <p className="font-semibold text-base break-all">{sessionId}</p>
            </div>
          ) : null}

          <Button onClick={() => navigate('/profile')} className="rounded-full btn-playful">
            حجوزاتي / My Bookings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
