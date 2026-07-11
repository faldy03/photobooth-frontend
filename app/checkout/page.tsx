"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { 
  Ticket, ArrowLeft, RefreshCw, QrCode, Copy, Clock, ReceiptText, ShieldCheck, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "sonner";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

// 🚨 IMPORT REACT-SIMPLE-KEYBOARD
import Keyboard, { SimpleKeyboard } from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

export default function CheckoutPage() {
  const router = useRouter();
  
  const [voucherCode, setVoucherCode] = useState("");
  const [qrString, setQrString] = useState("");
  const [invoice, setInvoice] = useState("");
  const [transactionDbId, setTransactionDbId] = useState<number | null>(null);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [isFetchingSettings, setIsFetchingSettings] = useState(true);
  
  // State Harga Dinamis
  const [basePrice, setBasePrice] = useState(0);
  const [finalGrossAmount, setFinalGrossAmount] = useState(0);
  const [finalNetAmount, setFinalNetAmount] = useState(0);

  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  // 🚨 STATE & REF UNTUK KEYBOARD VIRTUAL
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<SimpleKeyboard | null>(null);

  // 1. MENGAMBIL HARGA DARI SYSTEM SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(getApiUrl("/api/kiosk/settings"));
        const json = await res.json();
        if (json.success && json.data) {
          setBasePrice(Number(json.data.price_per_session) || 35000);
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi harga:", error);
        setBasePrice(35000);
      } finally {
        setIsFetchingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. EFEK COUNTDOWN TIMER QRIS
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

  // 3. POLLING CEK STATUS PEMBAYARAN
  useEffect(() => {
    if (!invoice || !qrString) return;
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/checkout/status/${invoice}`));
        const data = await res.json();

        if (data.success && data.payment_status === "success") {
          if (transactionDbId !== null) {
            localStorage.setItem("transaction_id", String(transactionDbId));
          }

          toast.success("PEMBAYARAN BERHASIL!", {
            description: "Mengarahkan ke pemilihan bingkai...",
            duration: 2000,
          });
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
  }, [invoice, qrString, router, transactionDbId]);

  // 4. PROSES CHECKOUT & REQUEST QRIS
  const handleCheckout = async () => {
    setLoading(true);
    setShowKeyboard(false); // Tutup keyboard saat loading
    if (voucherCode !== "SOFTOPENING") { 
      toast.error("PEMBAYARAN OTOMATIS OFFLINE", { 
        description: "Silakan scan QRIS di meja dan panggil Admin untuk melanjutkan." 
      });
      return; // Hentikan proses, jangan tembak API DOKU
    }

    setLoading(true);
    setShowKeyboard(false);
    try {
      const res = await fetch(getApiUrl("/api/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          gross_amount: basePrice, 
          voucher_code: voucherCode || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat transaksi.");

      setInvoice(data.data.invoice_number);
      setFinalGrossAmount(data.data.gross_amount);
      setFinalNetAmount(data.data.net_amount);
      setTransactionDbId(data.data.id);

      if (data.data.qr_string) {
        setQrString(data.data.qr_string);
        setExpiryTime(new Date().getTime() + 60 * 60 * 1000); 
        toast.success("SIAP PINDAI!", { description: "Silakan bayar menggunakan M-Banking/E-Wallet Anda." });
      } else {
        localStorage.setItem("transaction_id", String(data.data.id));
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
    setTransactionDbId(null);
    localStorage.removeItem("transaction_id");
    // Reset keyboard internal state
    if (keyboardRef.current) {
      keyboardRef.current.setInput("");
    }
  };

  // 🚨 FUNGSI HANDLER KEYBOARD VIRTUAL
  const onChangeVirtualKeyboard = (input: string) => {
    const upperInput = input.toUpperCase();
    setVoucherCode(upperInput);
  };

  const onKeyPressVirtualKeyboard = (button: string) => {
    if (button === "{close}") {
      setShowKeyboard(false);
    }
  };

  const onPhysicalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setVoucherCode(val);
    // Sinkronkan input fisik dengan keyboard virtual
    if (keyboardRef.current) {
      keyboardRef.current.setInput(val);
    }
  };

  const discountAmount = finalGrossAmount - finalNetAmount;

  if (isFetchingSettings) {
    return (
      <div className="min-h-screen bg-[#EFE9DB] flex flex-col items-center justify-center font-sans text-retro-charcoal">
        <RefreshCw size={48} className="animate-spin text-[#FF0000] mb-4" strokeWidth={2} />
        <h2 className="text-xl font-black uppercase tracking-widest animate-pulse">Menghubungkan ke Server...</h2>
      </div>
    );
  }

  return (
    <>
      {/* 🚨 INJEKSI CSS KUSTOM UNTUK TEMA BRUTALIST KEYBOARD */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hg-theme-default.custom-keyboard {
          background-color: transparent !important;
          padding: 0 !important;
        }
        .hg-theme-default.custom-keyboard .hg-row {
          margin-bottom: 6px !important;
        }
        .hg-theme-default.custom-keyboard .hg-button {
          border-radius: 0 !important;
          border: 2px solid #262626 !important;
          box-shadow: 2px 2px 0 0 #262626 !important;
          font-family: inherit !important;
          font-weight: 900 !important;
          font-size: 1.1rem !important;
          color: #262626 !important;
          background: white !important;
          height: 48px !important;
          transition: all 0.1s !important;
        }
        .hg-theme-default.custom-keyboard .hg-button:active {
          box-shadow: none !important;
          transform: translate(2px, 2px) !important;
        }
        .hg-theme-default.custom-keyboard .hg-button-bksp {
          background-color: #FF0000 !important;
          color: white !important;
        }
        .hg-theme-default.custom-keyboard .hg-button-close {
          background-color: #EFE9DB !important;
        }
        `
      }} />

      <div className="min-h-screen bg-[#EFE9DB] flex items-center justify-center p-6 font-sans text-retro-charcoal relative">
        <Toaster position="top-center" richColors />
        
        <Link href="/" className="absolute top-6 left-6 z-10">
          <Button variant="outline" size="icon" className="h-14 w-14 border-[4px] border-retro-charcoal bg-white shadow-[6px_6px_0_0_#262626] hover:bg-[#EFE9DB] hover:-translate-y-1 transition-all active:translate-y-1 active:shadow-none">
            <ArrowLeft size={28} strokeWidth={3} />
          </Button>
        </Link>

        <div className="w-full max-w-lg bg-white border-[4px] border-retro-charcoal shadow-[12px_12px_0_0_#262626] flex flex-col relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF0000] border-b-[4px] border-l-[4px] border-retro-charcoal transform translate-x-8 -translate-y-8 rotate-45"></div>

          <div className="p-8 pb-6 text-center border-b-[4px] border-dashed border-retro-charcoal bg-[#EFE9DB]/30">
            <h1 className="text-4xl font-black font-serif uppercase tracking-tight text-retro-charcoal flex items-center justify-center gap-3">
              <CreditCard size={36} className="text-[#FF0000]" /> LOKET KASIR
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-retro-charcoal/60 mt-2">
              Booth Flow • Pembayaran Mandiri
            </p>
          </div>

          <div className="p-8 flex flex-col items-center w-full">
            {!qrString ? (
              <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="bg-[#EFE9DB] border-[3px] border-retro-charcoal p-6 flex flex-col items-center justify-center relative shadow-[inset_4px_4px_0_0_rgba(0,0,0,0.05)]">
                  <span className="absolute -top-3 bg-retro-charcoal text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest">Tarif Sesi Foto</span>
                  <span className="text-5xl font-black text-[#FF0000] drop-shadow-sm mt-2">
                    <span className="text-2xl text-retro-charcoal align-top mr-1">Rp</span>
                    {basePrice.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-3 w-full">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-retro-charcoal">
                    <Ticket size={16} className="text-[#FF0000]" strokeWidth={3} /> Punya Kode Kupon?
                  </label>
                  <div className="relative">
                    <Input
                      value={voucherCode}
                      onChange={onPhysicalInputChange}
                      onFocus={() => setShowKeyboard(true)}
                      inputMode="none" // 🚨 Mencegah keyboard sistem operasi (Android/Windows) muncul
                      maxLength={15}
                      className="pl-4 pr-12 h-14 border-[3px] border-retro-charcoal text-center font-black tracking-[0.2em] text-lg uppercase focus-visible:ring-[#FF0000] focus-visible:ring-2 shadow-[4px_4px_0_0_#262626] rounded-none cursor-pointer"
                      placeholder="SENTUH DI SINI..."
                    />
                    {voucherCode && <ShieldCheck size={20} className="absolute right-4 top-4 text-green-600" />}
                  </div>

                  {/* 🚨 TAMPILAN REACT-SIMPLE-KEYBOARD */}
                  {showKeyboard && (
                    <div className="w-full bg-[#EFE9DB] border-[3px] border-retro-charcoal p-3 mt-2 shadow-[4px_4px_0_0_#262626] animate-in fade-in slide-in-from-top-2">
                      <Keyboard
                        keyboardRef={(r) => (keyboardRef.current = r)}
                        onChange={onChangeVirtualKeyboard}
                        onKeyPress={onKeyPressVirtualKeyboard}
                        maxLength={15}
                        layout={{
                          default: [
                            "1 2 3 4 5 6 7 8 9 0",
                            "Q W E R T Y U I O P",
                            "A S D F G H J K L",
                            "Z X C V B N M {bksp}",
                            "{close}"
                          ]
                        }}
                        display={{
                          "{bksp}": "⌫ DEL",
                          "{close}": "TUTUP KEYBOARD"
                        }}
                        theme={"hg-theme-default custom-keyboard"}
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCheckout} disabled={loading}
                  className="w-full h-16 text-xl bg-[#FF0000] hover:bg-[#d9383a] text-white border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] font-black uppercase tracking-widest transition-all active:translate-y-1 active:translate-x-1 active:shadow-none mt-4 disabled:opacity-70"
                >
                  {loading ? <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={24} /> MEMPROSES...</span> : "LANJUT BAYAR"}
                </Button>
              </div>

            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                
                <div className={`flex items-center gap-2 font-black text-xl mb-6 tracking-widest px-6 py-2 border-[3px] border-retro-charcoal shadow-[4px_4px_0_0_#262626] ${timeLeft === "KEDALUWARSA" ? "bg-retro-charcoal text-white" : "bg-[#FF0000] text-white"}`}>
                  <Clock size={24} strokeWidth={3} /> {timeLeft}
                </div>

                <div className="bg-white p-4 border-[4px] border-retro-charcoal shadow-[6px_6px_0_0_#262626] mb-8 w-full flex flex-col items-center relative">
                  <div className="flex items-center justify-center gap-2 font-black tracking-widest uppercase text-xl border-b-[3px] border-dashed border-retro-charcoal pb-4 mb-4 w-full text-center">
                    <QrCode size={24} className="text-[#FF0000]" strokeWidth={3} /> SCAN QRIS
                  </div>
                  
                  <div className="border-[4px] border-retro-charcoal p-2 mb-4 bg-white">
                    <QRCodeSVG value={qrString} size={220} level={"H"} includeMargin={false} />
                  </div>
                  
                  <Button onClick={handleCopyQR} variant="secondary" className="w-full h-12 font-black uppercase tracking-widest border-[3px] border-retro-charcoal hover:bg-[#EFE9DB] shadow-[4px_4px_0_0_#262626] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                    <Copy size={18} className="mr-2" strokeWidth={3} /> Salin Kode DOKU
                  </Button>
                </div>

                <div className="w-full bg-[#EFE9DB] border-[3px] border-retro-charcoal p-5 text-sm font-bold tracking-wide relative">
                  <div className="absolute -top-1 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBvbHlnb24gcG9pbnRzPSIwLDEwIDUsMCAxMCwxMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] repeat-x"></div>

                  <div className="flex items-center gap-2 mb-3 border-b-[2px] border-dashed border-retro-charcoal pb-3 uppercase font-black text-retro-charcoal/80">
                    <ReceiptText size={18} strokeWidth={3} /> RINCIAN TAGIHAN
                  </div>
                  
                  <div className="flex justify-between mb-2 text-retro-charcoal">
                    <span className="uppercase text-xs tracking-widest font-black">Nomor Tiket</span>
                    <span className="bg-white border-[2px] border-retro-charcoal px-2 py-0.5">{invoice}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2 text-retro-charcoal/80">
                    <span className="uppercase text-xs tracking-widest">Harga Normal</span>
                    <span>Rp {finalGrossAmount.toLocaleString("id-ID")}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-[#FF0000]">
                      <span className="uppercase text-xs tracking-widest">Potongan Kupon</span>
                      <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-4 pt-3 border-t-[3px] border-retro-charcoal text-xl font-black text-retro-charcoal">
                    <span className="uppercase tracking-widest">TOTAL</span>
                    <span className="text-[#FF0000]">Rp {finalNetAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full h-14 mt-6 border-[3px] border-retro-charcoal bg-white shadow-[4px_4px_0_0_#262626] font-black uppercase tracking-widest hover:bg-[#EFE9DB] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all text-retro-charcoal/60 hover:text-retro-charcoal">
                  Batal & Ulangi Transaksi
                </Button>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}