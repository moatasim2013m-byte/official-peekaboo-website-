import { XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardContent className="py-12 text-center space-y-5">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold text-red-700">فشل الدفع</h1>
            <p className="text-lg text-red-700">Payment Failed</p>
          </div>

          {reason ? (
            <div className="bg-white/80 border border-red-200 rounded-xl py-3 px-4">
              <p className="text-sm text-muted-foreground">سبب الفشل / Failure reason</p>
              <p className="font-semibold text-base break-all">{reason}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/tickets')} variant="outline" className="rounded-full">
              إعادة المحاولة / Try Again
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
