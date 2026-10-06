'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Key, Eye, EyeOff, CheckCircle2, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

type Step = 'EMAIL' | 'OTP' | 'SUCCESS';

export default function ForgotPasswordModal({ isOpen, initialEmail = '', onClose, onSuccess }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('EMAIL');
  const [email, setEmail] = useState(initialEmail);
  
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep('EMAIL');
      setEmail(initialEmail);
      setOtpDigits(Array(6).fill(''));
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setCooldown(0);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  if (!isOpen) return null;

  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ message?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() })
      });
      if (res.success) {
        setStep('OTP');
        setCooldown(60);
      } else {
        setError(res.error || 'Failed to send reset code.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<{ message?: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword: newPassword.trim() })
      });
      if (res.success) {
        setStep('SUCCESS');
      } else {
        setError(res.error || 'Invalid OTP or failed to reset password.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'A network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    if (!cleanValue) {
      const newOtp = [...otpDigits];
      newOtp[index] = '';
      setOtpDigits(newOtp);
      return;
    }

    // Handle mobile autofill (multi-character injection)
    if (cleanValue.length > 1) {
      const newOtp = [...otpDigits];
      for (let i = 0; i < cleanValue.length && index + i < 6; i++) {
        newOtp[index + i] = cleanValue[i];
      }
      setOtpDigits(newOtp);
      const nextEmptyIndex = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otpDigits];
    newOtp[index] = cleanValue;
    setOtpDigits(newOtp);

    if (index < 5 && cleanValue) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpDigits(newOtp);
    otpRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto max-h-[calc(100dvh-2rem)] flex flex-col bg-brand-surface rounded-2xl sm:rounded-3xl shadow-2xl overflow-y-auto overscroll-contain">
        
        {/* Header */}
        <div className="relative px-6 py-8 sm:px-8 text-center bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-accent shrink-0">
          <button 
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {step === 'EMAIL' && 'Recover Account'}
            {step === 'OTP' && 'Reset Password'}
            {step === 'SUCCESS' && 'Password Updated'}
          </h2>
          <p className="text-white/80 text-sm">
            {step === 'EMAIL' && 'Enter your email to receive a secure reset code.'}
            {step === 'OTP' && 'Verify your identity to create a new password.'}
            {step === 'SUCCESS' && 'Your credentials have been securely updated.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          {step === 'EMAIL' && (
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-text mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-brand-bg/60 border border-brand-muted/30 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-primary hover:bg-brand-accent text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Send Reset Code'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-sm font-medium text-brand-muted hover:text-brand-text py-2 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </form>
          )}

          {step === 'OTP' && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-brand-bg/60 border border-brand-muted/30 rounded-lg">
                <span className="text-sm font-medium text-brand-text truncate pr-2">{email}</span>
                <button type="button" onClick={() => setStep('EMAIL')} className="text-xs font-bold text-brand-primary shrink-0 cursor-pointer">
                  CHANGE
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-text mb-3 text-center">Enter 6-Digit Code</label>
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { otpRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      maxLength={6} // Allows multi-digit paste/autofill
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 h-12 sm:w-12 sm:h-14 bg-brand-bg/60 border border-brand-muted/30 text-brand-text text-center text-xl font-bold rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                    />
                  ))}
                </div>
                <div className="text-center mt-3">
                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={() => handleSendCode()}
                    className="text-xs font-medium text-brand-primary disabled:text-brand-muted transition-colors cursor-pointer"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive it? Resend"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-brand-bg/60 border border-brand-muted/30 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm transition-all"
                    placeholder="New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-text cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-brand-bg/60 border border-brand-muted/30 text-brand-text rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary text-base sm:text-sm transition-all"
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-brand-muted hover:text-brand-text cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-brand-primary hover:bg-brand-accent text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-brand-text mb-2">Password Reset Complete</h3>
              <p className="text-brand-muted text-sm mb-8">
                Your password has been successfully updated. You can now use your new credentials to log in.
              </p>
              <button
                type="button"
                onClick={() => onSuccess(email)}
                className="w-full h-12 bg-brand-primary hover:bg-brand-accent text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
