"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { 
  Ticket, ArrowLeft, RefreshCw, QrCode, Copy, Clock, ReceiptText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  
  const [voucherCode, setVoucherCode] = useState("");
  const [qrString, setQrString] = useState("");
  const [invoice, setInvoice] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State Harga dari Backend
  const [finalGrossAmount, setFinalGrossAmount] = useState(0);
  const [finalNetAmount, setFinalNetAmount] = useState(0);

  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const defaultGrossAmount = 35000;

  // Efek Countdown Timer
  useEffect(() => {
    if (!expiryTime) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryTime - now;
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("KEDALUWARSA");
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  // Efek Polling Cek Status Pembayaran
  useEffect(() => {
    if (!invoice || !qrString) return;
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/checkout/status/${invoice}`);
        const data = await res.json();

        if (data.success && data.payment_status === "success") {
          toast.success("PEMBAYARAN BERHASIL!", {
            description: "Mengarahkan ke pemilihan frame...",
            duration: 2000,
          });
          // Redirect ke halaman pilih frame
          setTimeout(() => {
             router.push("/frame-selection"); 
          }, 2000); 
        }
      } catch (error) {
        console.error("Gagal mengecek status:", error);
      }
    };
    const intervalId = setInterval(checkPaymentStatus, 3000);
    return () => clearInterval(intervalId);
  }, [invoice, qrString, router]);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          gross_amount: defaultGrossAmount,
          voucher_code: voucherCode || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat transaksi.");

      setInvoice(data.data.invoice_number);
      // Tangkap harga asli dan harga diskon dari backend
      setFinalGrossAmount(data.data.gross_amount);
      setFinalNetAmount(data.data.net_amount);

      if (data.data.qr_string) {
        setQrString(data.data.qr_string);
        setExpiryTime(new Date().getTime() + 60 * 60 * 1000);
        toast.success("SIAP PINDAI!", { description: "Silakan bayar menggunakan M-Banking/E-Wallet Anda." });
      } else {
        toast.success("GRATIS!", { description: "Kupon 100% aktif!" });
        setTimeout(() => router.push("/frame-selection"), 2000);
      }
    } catch (err: unknown) {
      toast.error("TRANSAKSI GAGAL", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrString);
    toast.success("TEKS DISALIN!", { description: "Silakan paste di Simulator DOKU." });
  };

  const handleReset = () => {
    setQrString(""); setVoucherCode(""); setInvoice("");
    setExpiryTime(null); setTimeLeft("");
  };

  const discountAmount = finalGrossAmount - finalNetAmount;

  return (
    <div className="min-h-screen bg-[#EFE9DB] flex items-center justify-center p-4 font-sans text-retro-charcoal relative">
      <Toaster position="top-center" richColors />
      <Link href="/" className="absolute top-6 left-6">
        <Button variant="outline" size="icon" className="h-12 w-12 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] hover:bg-white">
          <ArrowLeft size={24} strokeWidth={3} />
        </Button>
      </Link>

      <div className="w-full max-w-lg bg-white border-[4px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] p-8 flex flex-col items-center">
        <h1 className="text-4xl font-black font-serif uppercase tracking-tight mb-2 text-center">PEMBAYARAN</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-retro-charcoal/60 mb-8 border-b-[4px] border-retro-charcoal pb-4 w-full text-center">
          Sesi Stitched Booth
        </p>

        {!qrString ? (
          <div className="w-full space-y-6">
            <div className="flex justify-between items-end border-b-[2px] border-dashed border-retro-charcoal pb-4">
              <span className="font-bold uppercase tracking-widest">Total Bayar:</span>
              <span className="text-4xl font-black text-[#FF0000]">Rp {defaultGrossAmount.toLocaleString("id-ID")}</span>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Ticket size={16} /> Kode Kupon (Opsional)
              </label>
              <Input
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="border-[3px] border-retro-charcoal h-14 text-center font-black tracking-[0.2em] text-lg uppercase focus-visible:ring-[#FF0000]"
                placeholder="MASUKKAN KODE..."
              />
            </div>
            <Button
              onClick={handleCheckout} disabled={loading}
              className="w-full h-16 text-lg bg-retro-charcoal hover:bg-[#FF0000] text-white border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] font-black uppercase tracking-widest transition-transform active:translate-y-1 active:shadow-none mt-4"
            >
              {loading ? <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={20} /> MEMPROSES...</span> : "BUAT QRIS SEKARANG"}
            </Button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2 text-[#FF0000] font-black text-xl mb-4 tracking-widest bg-red-100 px-4 py-2 border-[2px] border-[#FF0000] rounded-full">
              <Clock size={24} /> {timeLeft}
            </div>

            <div className="bg-white p-6 border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] mb-6 flex flex-col items-center gap-4 relative w-full">
              <div className="flex items-center justify-center gap-2 font-black tracking-widest uppercase text-xl border-b-[3px] border-retro-charcoal pb-2 w-full text-center">
                <QrCode size={24} /> QRIS
              </div>
              <QRCodeSVG value={qrString} size={240} level={"H"} includeMargin={true} />
              <Button onClick={handleCopyQR} variant="secondary" size="sm" className="w-full font-bold uppercase tracking-wider border-[2px] border-retro-charcoal hover:bg-gray-200">
                <Copy size={16} className="mr-2" /> Salin Teks QR (Simulator)
              </Button>
            </div>

            {/* DETAIL PEMBAYARAN DINAMIS */}
            <div className="w-full bg-[#EFE9DB] border-[3px] border-retro-charcoal p-4 mb-6 text-sm font-bold tracking-wide">
              <div className="flex items-center gap-2 mb-2 border-b-[2px] border-dashed border-retro-charcoal pb-2 uppercase">
                <ReceiptText size={18} /> Detail Pembayaran
              </div>
              <div className="flex justify-between mb-1 text-retro-charcoal/80">
                <span>INVOICE</span><span>{invoice}</span>
              </div>
              <div className="flex justify-between mb-1 text-retro-charcoal/80">
                <span>HARGA AWAL</span><span>Rp {finalGrossAmount.toLocaleString("id-ID")}</span>
              </div>
              
              {/* Akan muncul HANYA jika ada diskon voucher */}
              {discountAmount > 0 && (
                <div className="flex justify-between mb-1 text-[#FF0000]">
                  <span>DISKON KUPON</span><span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}
              
              <div className="flex justify-between mt-2 pt-2 border-t-[2px] border-dashed border-retro-charcoal text-lg font-black text-retro-charcoal">
                <span>TOTAL BAYAR</span><span>Rp {finalNetAmount.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full h-14 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] font-black uppercase tracking-widest hover:bg-[#EFE9DB]">
              Batal & Ulangi
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}