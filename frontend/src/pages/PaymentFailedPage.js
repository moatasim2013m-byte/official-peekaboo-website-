import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function PaymentFailedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-4">
          <div className="text-6xl" aria-hidden="true">
            ❌
          </div>

          <h1 className="font-heading text-3xl font-bold text-red-600">تم رفض الدفع</h1>
          <p className="text-lg text-red-600">Your payment was declined</p>

          {reason ? (
            <div className="bg-red-50 border border-red-200 rounded-xl py-3 px-4">
              <p className="text-sm text-muted-foreground">سبب الرفض / Decline Reason</p>
              <p className="font-semibold text-base">{reason}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/tickets')} variant="outline" className="rounded-full">
              التذاكر / Tickets
            </Button>
            <Button onClick={() => navigate('/')} className="rounded-full btn-playful">
              الصفحة الرئيسية / Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
