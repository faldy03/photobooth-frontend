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
  const [isSuccessRedirecting, setIsSuccessRedirecting] = useState(false);
  
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
    if (!invoice || !qrString || isSuccessRedirecting) return;
    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/checkout/status/${invoice}`));
        const data = await res.json();

        if (data.success && data.payment_status === "success") {
          setIsSuccessRedirecting(true);
          
          const finalTxId = data.id || transactionDbId;
          if (finalTxId !== null) {
            localStorage.setItem("transaction_id", String(finalTxId));
          }
          localStorage.setItem("session_start_time", String(Date.now()));

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
  }, [invoice, qrString, router, transactionDbId, isSuccessRedirecting]);

  // 4. PROSES CHECKOUT & REQUEST QRIS
  const handleCheckout = async () => {
    setLoading(true);
    setShowKeyboard(false); // Tutup keyboard saat loading
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
        localStorage.setItem("session_start_time", String(Date.now()));
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
    setIsSuccessRedirecting(false);
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
      <div className="min-h-screen bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex flex-col items-center justify-center font-sans text-[#4A4A4A]">
        <RefreshCw size={48} className="animate-spin text-[#4A4A4A] mb-4" strokeWidth={2} />
        <h2 className="text-xl font-normal tracking-widest animate-pulse">Menghubungkan ke Server...</h2>
      </div>
    );
  }

  return (
    <>
      {/* 🚨 INJEKSI CSS KUSTOM UNTUK TEMA MINIMAL KEYBOARD */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hg-theme-default.custom-keyboard {
          background-color: transparent !important;
          padding: 0 !important;
        }
        .hg-theme-default.custom-keyboard .hg-row {
          margin-bottom: 8px !important;
        }
        .hg-theme-default.custom-keyboard .hg-button {
          border-radius: 4px !important;
          border: 1px solid #4A4A4A !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
          font-family: inherit !important;
          font-weight: 500 !important;
          font-size: 0.95rem !important;
          color: #4A4A4A !important;
          background: white !important;
          height: 46px !important;
          transition: all 0.2s !important;
        }
        .hg-theme-default.custom-keyboard .hg-button:active {
          background-color: #F5F2EC !important;
          transform: translateY(1px) !important;
        }
        .hg-theme-default.custom-keyboard .hg-button-bksp {
          background-color: #4A4A4A !important;
          color: white !important;
        }
        .hg-theme-default.custom-keyboard .hg-button-close {
          background-color: #FAF9F6 !important;
          font-weight: bold !important;
        }
        `
      }} />

      <div className="min-h-screen bg-[#FAF9F6] bg-[radial-gradient(#FAF9F6_60%,#F5F2EC_100%)] flex items-center justify-center p-6 font-sans text-[#4A4A4A] relative">
        <Toaster position="top-center" richColors />
        
        {/* Mengimpor Font Premium Cormorant Garamond */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&display=swap" 
          rel="stylesheet" 
        />

        <Link href="/" className="absolute top-6 left-6 z-10">
          <Button variant="outline" size="icon" className="h-12 w-12 border border-[#4A4A4A]/20 bg-white hover:bg-[#FAF9F6] transition-all rounded-full shadow-sm hover:shadow">
            <ArrowLeft size={20} className="text-[#4A4A4A]" />
          </Button>
        </Link>

        <div className="w-full max-w-lg bg-white border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col relative overflow-hidden rounded-xl">
          
          <div className="p-8 pb-6 text-center border-b border-[#4A4A4A]/10 bg-[#FAF9F6]">
            <h1 
              className="text-3xl font-normal uppercase tracking-[0.1em] text-[#4A4A4A] flex items-center justify-center gap-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              LOKET KASIR
            </h1>
            <p 
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#7A7A7A] mt-2 opacity-80"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              HELLO.PICTA • PEMBAYARAN MANDIRI
            </p>
          </div>

          <div className="p-8 flex flex-col items-center w-full">
            {!qrString ? (
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="bg-[#FAF9F6] border border-[#4A4A4A]/10 p-6 flex flex-col items-center justify-center relative rounded-lg">
                  <span className="absolute -top-3 bg-[#4A4A4A] text-[#FAF9F6] px-4 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded-full">Tarif Sesi Foto</span>
                  <span className="text-4xl font-normal text-[#4A4A4A] mt-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    <span className="text-lg align-top mr-1">Rp</span>
                    {basePrice.toLocaleString("id-ID")}
                  </span>
                </div>

                <div className="space-y-3 w-full">
                  <label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#7A7A7A]">
                    <Ticket size={14} className="text-[#4A4A4A]" /> Punya Kode Kupon?
                  </label>
                  <div className="relative">
                    <Input
                      value={voucherCode}
                      onChange={onPhysicalInputChange}
                      onFocus={() => setShowKeyboard(true)}
                      inputMode="none" 
                      maxLength={15}
                      className="pl-4 pr-12 h-12 border border-[#4A4A4A]/20 text-center font-bold tracking-[0.2em] text-base uppercase focus-visible:ring-[#4A4A4A] focus-visible:ring-1 rounded-lg cursor-pointer bg-white"
                      placeholder="SENTUH DI SINI..."
                    />
                    {voucherCode && <ShieldCheck size={18} className="absolute right-4 top-3.5 text-green-600" />}
                  </div>

                  {/* 🚨 TAMPILAN REACT-SIMPLE-KEYBOARD */}
                  {showKeyboard && (
                    <div className="w-full bg-[#FAF9F6] border border-[#4A4A4A]/10 p-3 mt-2 shadow-sm rounded-lg animate-in fade-in slide-in-from-top-2">
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
                  className="w-full h-14 text-sm bg-[#4A4A4A] hover:bg-[#333] text-white font-bold uppercase tracking-widest transition-all rounded-lg mt-4 disabled:opacity-70 shadow-sm"
                >
                  {loading ? <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={18} /> MEMPROSES...</span> : "LANJUT BAYAR"}
                </Button>
              </div>

            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                
                <div className={`flex items-center gap-2 font-bold text-sm mb-6 tracking-widest px-6 py-2 rounded-full border border-[#4A4A4A]/10 bg-[#4A4A4A] text-white`}>
                  <Clock size={16} className="animate-pulse" /> {timeLeft}
                </div>

                <div className="bg-white p-6 border border-[#4A4A4A]/10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-6 w-full flex flex-col items-center relative rounded-lg">
                  <div className="flex items-center justify-center gap-2 font-black tracking-widest uppercase text-xs border-b border-[#4A4A4A]/10 pb-4 mb-4 w-full text-center text-[#7A7A7A]">
                    <QrCode size={16} className="text-[#4A4A4A]" /> SCAN QRIS
                  </div>
                  
                  <div className="border border-[#4A4A4A]/10 p-2 mb-4 bg-white rounded-lg">
                    <QRCodeSVG value={qrString} size={200} level={"H"} includeMargin={false} />
                  </div>
                  
                  <div className="w-full mt-4 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#7A7A7A] mb-4">
                      Dapat dibayar dengan E-Wallet & M-Banking apa saja:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 px-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/qris.svg" alt="QRIS" style={{ height: '24px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/gopay.svg" alt="GoPay" style={{ height: '14px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/ovo.svg" alt="OVO" style={{ height: '16px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/dana.svg" alt="DANA" style={{ height: '16px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/shopee-pay.svg" alt="ShopeePay" style={{ height: '16px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/linkaja.svg" alt="LinkAja" style={{ height: '18px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/bca.svg" alt="BCA" style={{ height: '14px' }} className="w-auto object-contain" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="https://cdn.jsdelivr.net/gh/hafidznoor/idn-finlogos@master/icons/mandiri.svg" alt="Mandiri" style={{ height: '12px' }} className="w-auto object-contain" />
                    </div>
                  </div>
                </div>

                <div className="w-full bg-[#FAF9F6] border border-[#4A4A4A]/10 p-5 text-xs font-bold tracking-wide relative rounded-lg">
                  <div className="flex items-center gap-2 mb-3 border-b border-[#4A4A4A]/10 pb-3 uppercase font-bold text-[#4A4A4A]/80">
                    <ReceiptText size={16} /> RINCIAN TAGIHAN
                  </div>
                  
                  <div className="flex justify-between mb-2 text-[#4A4A4A]">
                    <span className="uppercase text-[9px] tracking-widest font-bold">Nomor Tiket</span>
                    <span className="bg-white border border-[#4A4A4A]/10 px-2 py-0.5 rounded-sm">{invoice}</span>
                  </div>
                  
                  <div className="flex justify-between mb-2 text-[#4A4A4A]/80">
                    <span className="uppercase text-[9px] tracking-widest">Harga Normal</span>
                    <span>Rp {finalGrossAmount.toLocaleString("id-ID")}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between mb-2 text-green-600">
                      <span className="uppercase text-[9px] tracking-widest">Potongan Kupon</span>
                      <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between mt-4 pt-3 border-t border-[#4A4A4A]/10 text-base font-bold text-[#4A4A4A]">
                    <span className="uppercase tracking-widest">TOTAL</span>
                    <span className="text-lg">Rp {finalNetAmount.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full h-12 mt-6 border border-[#4A4A4A]/20 bg-white font-bold uppercase tracking-widest hover:bg-[#FAF9F6] transition-all text-[#7A7A7A] hover:text-[#4A4A4A] rounded-lg">
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