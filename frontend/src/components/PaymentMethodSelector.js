import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Banknote, CreditCard, Building2, MessageCircle, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  {
    id: 'cash',
    label: 'الدفع نقداً',
    labelEn: 'Cash',
    icon: Banknote,
    color: 'bg-green-500'
  },
  {
    id: 'card',
    label: 'بطاقة',
    labelEn: 'Credit/Debit Card',
    icon: CreditCard,
    color: 'bg-blue-500'
  },
  {
    id: 'cliq',
    label: 'CliQ - تحويل بنكي',
    labelEn: 'CliQ Transfer',
    icon: Building2,
    color: 'bg-purple-500'
  }
];

export function PaymentMethodSelector({ value, onChange, showCliqInfo = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('تم النسخ!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Label className="block text-base font-bold mb-2">طريقة الدفع</Label>
      
      <div className="rounded-2xl border border-border bg-white p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`relative p-2 rounded-lg border transition-all text-right ${
                value === method.id
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className={`${method.color} w-7 h-7 rounded-md flex items-center justify-center`}>
                  <method.icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-xs sm:text-sm leading-tight">{method.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{method.labelEn}</p>
                </div>
              </div>
              {value === method.id && (
                <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-2 w-2 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CliQ Info Box */}
      {value === 'cliq' && showCliqInfo && (
        <Card className="mt-4 border-2 border-purple-200 bg-purple-50 rounded-2xl">
          <CardContent className="p-5">
            <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              معلومات التحويل البنكي
            </h4>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                <div>
                  <p className="text-muted-foreground">التحويل إلى</p>
                  <p className="font-bold">بنك الإسكان</p>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                <div>
                  <p className="text-muted-foreground">CliQ Alias</p>
                  <p className="font-bold text-lg">Peekaboo1</p>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy('Peekaboo1')}
                  className="rounded-full"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                <div>
                  <p className="text-muted-foreground">رقم الهاتف</p>
                  <p className="font-bold ltr-text" dir="ltr">0777775652</p>
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleCopy('0777775652')}
                  className="rounded-full"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-xl">
              <p className="text-sm text-yellow-800">
                <strong>ملاحظة:</strong> بعد التحويل، يرجى إرسال صورة الإيصال على واتساب لتأكيد الحجز.
              </p>
            </div>

            <a 
              href="https://wa.me/962777775652" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 block"
            >
              <Button 
                type="button"
                className="w-full rounded-full gap-2 bg-[#25D366] hover:bg-[#20BD5A] h-12"
              >
                <MessageCircle className="h-5 w-5" />
                إرسال الإيصال على واتساب
              </Button>
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
