import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Phone, MessageCircle, Copy, CheckCircle, Building2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CliqInfoModal({ open, onClose, bookingCode, amount }) {
  const [copied, setCopied] = useState(false);
  
  const CLIQ_ALIAS = 'peekaboo1';
  const BANK_NAME = 'Housing Bank';
  const WHATSAPP_NUMBER = '962777775652';
  const PHONE_NUMBER = '0777775652';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('تم النسخ!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2 text-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
            تم الحجز بنجاح!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Booking Code */}
          {bookingCode && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-sm text-green-700 mb-1">رقم الحجز</p>
              <p className="font-heading font-bold text-xl text-green-800">{bookingCode}</p>
            </div>
          )}
          
          {/* Amount */}
          {amount && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-700 mb-1">المبلغ المطلوب</p>
              <p className="font-heading font-bold text-2xl text-blue-800">{amount} دينار</p>
            </div>
          )}

          {/* CliQ Transfer Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <h4 className="font-heading font-bold text-purple-800 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات التحويل عبر CliQ
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-700">البنك:</span>
                <span className="font-bold text-purple-900">{BANK_NAME}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-700">اسم المستخدم (CliQ Alias):</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-900">{CLIQ_ALIAS}</span>
                  <button 
                    onClick={() => copyToClipboard(CLIQ_ALIAS)}
                    className="p-1 hover:bg-purple-200 rounded"
                  >
                    {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-purple-600" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-center">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ بعد التحويل، أرسل صورة الإيصال عبر واتساب لتأكيد الحجز
            </p>
          </div>

          {/* Contact Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a 
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=مرحباً، أريد تأكيد حجزي رقم: ${bookingCode || 'N/A'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button className="w-full rounded-full bg-green-500 hover:bg-green-600 text-white gap-2">
                <MessageCircle className="h-5 w-5" />
                واتساب
              </Button>
            </a>
            <a href={`tel:${PHONE_NUMBER}`} className="flex-1">
              <Button variant="outline" className="w-full rounded-full gap-2">
                <Phone className="h-5 w-5" />
                {PHONE_NUMBER}
              </Button>
            </a>
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose} 
            className="w-full rounded-full mt-2"
            variant="outline"
          >
            حسناً، فهمت
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
