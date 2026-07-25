import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { sendOTP, verifyOTP, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOTP(email.trim());
      setStep(2);
      setResendTimer(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'OTP bhejne me dikkat aayi. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 8).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 8) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 7);
      otpRefs.current[nextIdx]?.focus();
      if (newOtp.every(d => d !== '')) handleVerify(newOtp.join(''));
      return;
    }
    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 7) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '')) handleVerify(newOtp.join(''));
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = useCallback(async (code) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await verifyOTP(email.trim(), code);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
    } catch (err) {
      setError(err.message || 'Wrong OTP. Dobara try karo.');
      setOtp(['', '', '', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [email, loading, navigate, verifyOTP]);

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setLoading(true);
    try {
      await sendOTP(email.trim());
      setResendTimer(60);
      setOtp(['', '', '', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Resend failed. Dobara try karo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--cream)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px]"
      >
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center text-center mb-10 group">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.1 }}
            className="w-16 h-16 rounded-full bg-[var(--ink)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
          >
            <span className="font-display text-[var(--cream)] text-3xl italic font-bold">B</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--ink)] font-display">BillBuddy</h1>
          <p className="text-[var(--ink)]/55 text-sm mt-2">Group expenses ka sabse asaan solution</p>
        </Link>

        {/* Card */}
        <div
          className="rounded-3xl p-7 sm:p-9"
          style={{
            background: 'var(--cream-2)',
            boxShadow: '0 24px 60px -16px rgba(58,44,92,.28), 0 4px 16px -4px rgba(58,44,92,.12)',
          }}
        >
          <div className="flex flex-col gap-7">
            {/* Step indicator */}
            {!success && (
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: step === 1 ? 28 : 14, background: step === 1 ? 'var(--crimson)' : 'rgba(58,44,92,.15)' }}
                />
                <span
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{ width: step === 2 ? 28 : 14, background: step === 2 ? 'var(--pumpkin)' : 'rgba(58,44,92,.15)' }}
                />
              </div>
            )}

            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  className="flex flex-col items-center text-center py-3"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'var(--mint)' }}
                  >
                    <i className="ti ti-check text-3xl text-[var(--ink)]" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-[var(--ink)] font-display mb-2">Welcome!</h2>
                  <p className="text-[var(--ink)]/60 text-sm">Dashboard pe redirect ho raha hai...</p>
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="flex flex-col gap-7"
                >
                  <div>
                    <h2 className="text-xl font-bold text-[var(--ink)] font-display">Login / Sign Up</h2>
                    <p className="text-[var(--ink)]/60 text-sm mt-1.5">Email daalo, OTP bhejenge</p>
                  </div>

                  <form onSubmit={handleSendOTP} className="flex flex-col gap-5">
                    <div className="input-icon-wrap">
                      <i className="ti ti-mail input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tumhara@email.com"
                        required
                        autoFocus
                        className="input"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="btn-crimson w-full py-3.5 text-base font-semibold flex-shrink-0"
                    >
                      {loading ? (
                        <i className="ti ti-loader animate-spin text-lg" />
                      ) : (
                        <>
                          OTP Bhejo
                          <i className="ti ti-arrow-right text-lg" />
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="flex flex-col gap-6"
                >
                  <div>
                    <button
                      onClick={() => {                       setStep(1); setOtp(['', '', '', '', '', '', '', '']); setError(''); }}
                      className="flex items-center gap-1 text-[var(--ink)]/50 hover:text-[var(--ink)] text-sm mb-3 cursor-pointer transition-colors"
                    >
                      <i className="ti ti-arrow-left text-base" /> Back
                    </button>
                    <h2 className="text-xl font-bold text-[var(--ink)] font-display">OTP Verify Karo</h2>
                    <p className="text-[var(--ink)]/60 text-sm mt-1.5">
                      <span className="text-[var(--pumpkin)] font-medium">{email}</span> pe 8-digit code bheja hai
                    </p>
                  </div>

                  {/* OTP Boxes */}
                  <div className="flex gap-2 sm:gap-2.5 justify-center flex-wrap">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={8}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onFocus={(e) => e.target.select()}
                        className="w-9 h-12 sm:w-11 sm:h-14 rounded-lg border-2 text-center text-lg sm:text-xl font-bold text-[var(--ink)] focus:outline-none transition-all font-display flex-shrink-0"
                        style={{
                          background: 'var(--cream)',
                          borderColor: digit ? 'var(--pumpkin)' : 'rgba(58,44,92,0.15)',
                          boxShadow: digit ? '3px 3px 0 var(--ink)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center gap-2">
                      <i className="ti ti-loader animate-spin text-[var(--pumpkin)] text-lg" />
                      <span className="text-[var(--pumpkin)] text-sm">Verifying...</span>
                    </div>
                  )}

                  <div className="text-center">
                    {resendTimer > 0 ? (
                      <p className="text-[var(--ink)]/50 text-sm">
                        Resend in <span className="font-mono">{resendTimer}s</span>
                      </p>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={loading}
                        className="text-[var(--pumpkin)] hover:text-[var(--crimson)] text-sm cursor-pointer transition-colors disabled:opacity-50"
                      >
                        Dobara OTP Bhejo
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm border-2 border-[var(--crimson)]/30 flex-shrink-0"
                  style={{ background: 'rgba(194,61,61,0.08)', color: 'var(--crimson)' }}
                >
                  <i className="ti ti-alert-circle text-lg shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            <p className="text-center text-[var(--ink)]/40 text-xs flex-shrink-0">
              Login karne se tum BillBuddy ki terms se agree karte ho
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
