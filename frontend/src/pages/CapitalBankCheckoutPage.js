import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const CARD_TYPES = [
  { value: '001', label: 'Visa' },
  { value: '002', label: 'Mastercard' },
  { value: '003', label: 'American Express' }
];

export default function CapitalBankCheckoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const orderId = useMemo(() => sessionId || '', [sessionId]);

  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvn, setCvn] = useState('');
  const [cardType, setCardType] = useState('001');
  const [isLoading, setIsLoading] = useState(false);

  const clearCardFields = () => {
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvn('');
    setCardType('001');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!orderId || isLoading) {
      navigate('/payment/failed?reason=invalid_session', { replace: true });
      return;
    }

    setIsLoading(true);
    const payload = {
      orderId,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvn,
      cardType
    };
    clearCardFields();

    try {
      const response = await fetch('/api/payments/capital-bank/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success) {
        navigate(`/payment/success?orderId=${encodeURIComponent(result.orderId || orderId)}`, { replace: true });
        return;
      }

      const reason = encodeURIComponent(result?.reason || result?.error || 'payment_declined');
      navigate(`/payment/failed?reason=${reason}`, { replace: true });
    } catch (_error) {
      navigate('/payment/failed?reason=network_error', { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-hero-gradient py-12 px-4" dir="rtl">
      <Card className="w-full max-w-xl border-2 rounded-3xl shadow-xl">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl">الدفع عبر البطاقة</CardTitle>
          <CardDescription>أدخل بيانات البطاقة لإتمام العملية بشكل آمن</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2 text-right">
              <label className="block text-sm font-medium">نوع البطاقة</label>
              <select
                className="w-full border rounded-xl p-3"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                disabled={isLoading}
                required
              >
                {CARD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-sm font-medium">رقم البطاقة</label>
              <input className="w-full border rounded-xl p-3" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 text-right">
                <label className="block text-sm font-medium">شهر الانتهاء</label>
                <input className="w-full border rounded-xl p-3" value={expiryMonth} onChange={(e) => setExpiryMonth(e.target.value)} required disabled={isLoading} />
              </div>
              <div className="space-y-2 text-right">
                <label className="block text-sm font-medium">سنة الانتهاء</label>
                <input className="w-full border rounded-xl p-3" value={expiryYear} onChange={(e) => setExpiryYear(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-sm font-medium">CVN</label>
              <input className="w-full border rounded-xl p-3" value={cvn} onChange={(e) => setCvn(e.target.value)} required disabled={isLoading} />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl p-3 bg-pink-600 text-white font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري معالجة الدفع...</> : 'ادفع الآن'}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
