import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const getCsrfToken = () => {
  const existing = sessionStorage.getItem('pk_cb_csrf_token');
  if (existing && existing.length >= 16) return existing;
  const generated = `${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem('pk_cb_csrf_token', generated);
  return generated;
};

export default function CapitalBankCheckoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');

  const csrfToken = useMemo(() => getCsrfToken(), []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sessionId) {
      toast.error('معرّف الطلب غير صالح');
      return;
    }

    if (!cardNumber || !expMonth || !expYear || !cvv) {
      toast.error('الرجاء إدخال بيانات البطاقة كاملة');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/payments/capital-bank/initiate', {
        orderId: sessionId,
        card: {
          number: cardNumber,
          expirationMonth: expMonth,
          expirationYear: expYear,
          securityCode: cvv
        }
      }, {
        headers: {
          'x-csrf-token': csrfToken
        }
      });

      const decision = String(response?.data?.decision || '').toUpperCase();
      if (decision === 'ACCEPT') {
        navigate(`/payment/success?orderId=${encodeURIComponent(sessionId)}`);
        return;
      }
      if (decision === 'REVIEW' || decision === 'PENDING') {
        navigate(`/payment/pending?orderId=${encodeURIComponent(sessionId)}`);
        return;
      }

      const reason = response?.data?.reason_code || 'declined';
      navigate(`/payment/failed?reason=${encodeURIComponent(reason)}`);
    } catch (error) {
      const decision = String(error?.response?.data?.decision || '').toUpperCase();
      const reason = error?.response?.data?.reason_code || error?.response?.data?.error || 'declined';

      if (decision === 'REVIEW' || decision === 'PENDING') {
        navigate(`/payment/pending?orderId=${encodeURIComponent(sessionId)}`);
        return;
      }

      navigate(`/payment/failed?reason=${encodeURIComponent(reason)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-2xl border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">إتمام الدفع - كابيتال بنك</CardTitle>
          <CardDescription>
            أدخل بيانات البطاقة لإتمام العملية بشكل آمن.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="order-id">رقم الطلب</Label>
              <Input id="order-id" value={sessionId || ''} readOnly className="text-left" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-number">رقم البطاقة</Label>
              <Input
                id="card-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                inputMode="numeric"
                placeholder="4111111111111111"
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="exp-month">شهر الانتهاء (MM)</Label>
                <Input id="exp-month" value={expMonth} onChange={(e) => setExpMonth(e.target.value)} placeholder="12" className="text-left" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-year">سنة الانتهاء (YYYY)</Label>
                <Input id="exp-year" value={expYear} onChange={(e) => setExpYear(e.target.value)} placeholder="2030" className="text-left" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="123" className="text-left" dir="ltr" />
              </div>
            </div>

            <Button type="submit" className="w-full rounded-full btn-playful" disabled={submitting}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري معالجة الدفع...</> : 'ادفع الآن'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
