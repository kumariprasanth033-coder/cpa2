import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Smartphone,
  Laptop,
  Trash2,
  Sliders,
  History,
  Lock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  BiometricCredential,
  BiometricAuditEntry,
  BiometricSecurityPolicies,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  detectPlatformAuthenticatorName,
  getSavedBiometricCredentials,
  getBiometricPolicies,
  saveBiometricPolicies,
  getBiometricAuditLogs,
  registerBiometricCredential,
  authenticateBiometric,
  saveBiometricCredentials,
} from '../../lib/biometrics';
import { useApp } from '../../context/AppContext';

export const BiometricSecurityCard: React.FC = () => {
  const { currentUser } = useApp();
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [policies, setPolicies] = useState<BiometricSecurityPolicies>(getBiometricPolicies());
  const [auditLogs, setAuditLogs] = useState<BiometricAuditEntry[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [hasPlatformAuth, setHasPlatformAuth] = useState<boolean>(false);
  const [authenticatorName, setAuthenticatorName] = useState<string>('Touch ID / Face ID');

  // Scanner Modal state
  const [isScanningModalOpen, setIsScanningModalOpen] = useState(false);
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [activeOperation, setActiveOperation] = useState<{
    name: string;
    description: string;
    amountPaise?: number;
    targetIcon: 'FINGERPRINT' | 'FACE' | 'SHIELD';
  } | null>(null);
  const [lastVerificationProof, setLastVerificationProof] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    setIsSupported(isWebAuthnSupported());
    setAuthenticatorName(detectPlatformAuthenticatorName());
    isPlatformAuthenticatorAvailable().then(setHasPlatformAuth);
    setCredentials(getSavedBiometricCredentials());
    setAuditLogs(getBiometricAuditLogs());
  }, []);

  const handleEnrollDevice = async () => {
    setIsEnrolling(true);
    setErrorMessage(null);
    try {
      const res = await registerBiometricCredential({
        id: currentUser?.id || 'usr_cpa_default',
        name: currentUser?.fullName || 'CPA Account Holder',
        email: currentUser?.email || 'user@cpaproject.in',
      });

      if (res.success && res.credential) {
        setCredentials(getSavedBiometricCredentials());
        setAuditLogs(getBiometricAuditLogs());
      } else {
        setErrorMessage(res.error || 'Failed to enroll biometric credential');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Biometric enrollment cancelled');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveCredential = (id: string) => {
    const updated = credentials.filter((c) => c.id !== id);
    setCredentials(updated);
    saveBiometricCredentials(updated);
  };

  const handlePolicyToggle = (key: keyof BiometricSecurityPolicies) => {
    const updated = {
      ...policies,
      [key]: !policies[key],
    };
    setPolicies(updated);
    saveBiometricPolicies(updated);
  };

  const startBiometricVerification = (op: {
    name: string;
    description: string;
    amountPaise?: number;
    targetIcon: 'FINGERPRINT' | 'FACE' | 'SHIELD';
  }) => {
    setActiveOperation(op);
    setScanState('SCANNING');
    setErrorMessage(null);
    setLastVerificationProof(null);
    setIsScanningModalOpen(true);

    // Simulate sensor delay for realistic biometric verification experience
    setTimeout(async () => {
      try {
        const result = await authenticateBiometric({
          operationName: op.name,
          amountPaise: op.amountPaise,
          credentialId: credentials[0]?.id,
        });

        if (result.success) {
          setScanState('SUCCESS');
          setLastVerificationProof(result);
          setCredentials(getSavedBiometricCredentials());
          setAuditLogs(getBiometricAuditLogs());
        } else {
          setScanState('ERROR');
          setErrorMessage(result.error || 'Biometric signature rejected');
        }
      } catch (err: any) {
        setScanState('ERROR');
        setErrorMessage(err?.message || 'Biometric scan failed or timed out');
      }
    }, 1200);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
            <Fingerprint className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Biometric Security & WebAuthn Layer</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FIDO2 / PASSKEYS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographic hardware-bound authentication (Touch ID, Face ID, Windows Hello) for sensitive CPA operations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleEnrollDevice}
          disabled={isEnrolling}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
        >
          {isEnrolling ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanFace className="h-4 w-4" />
          )}
          <span>{credentials.length > 0 ? 'Add Another Authenticator' : 'Enroll Biometric Passkey'}</span>
        </button>
      </div>

      {/* Hardware Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Detected Sensor</span>
            <Laptop className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <p className="font-semibold text-white text-xs">{authenticatorName}</p>
          <p className="text-[10px] text-slate-500">
            {hasPlatformAuth ? 'Hardware platform sensor verified' : 'Secure WebAuthn sandbox ready'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Registered Passkeys</span>
            <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="font-semibold text-emerald-400 text-xs">
            {credentials.length} Active {credentials.length === 1 ? 'Key' : 'Keys'}
          </p>
          <p className="text-[10px] text-slate-500">
            {credentials.length > 0 ? `Last used: ${new Date(credentials[0]?.lastUsedAt || Date.now()).toLocaleTimeString()}` : 'No authenticators enrolled yet'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Signature Algorithm</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <p className="font-semibold text-purple-300 text-xs">ECDSA with SHA-256 (ES256)</p>
          <p className="text-[10px] text-slate-500">Zero-knowledge proof verification</p>
        </div>
      </div>

      {/* Registered Passkeys List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
          <span>Active Enrolled Authenticators</span>
        </h3>

        {credentials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-5 text-center space-y-2">
            <Fingerprint className="h-8 w-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-300">No Biometric Authenticator Enrolled</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Enroll your Touch ID, Face ID, or Windows Hello passkey to enforce biometric verification on withdrawals and high-value approvals.
            </p>
            <button
              type="button"
              onClick={handleEnrollDevice}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <ScanFace className="h-3.5 w-3.5" />
              <span>Enroll This Device Now</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                    {cred.authenticatorType === 'Face ID' ? (
                      <ScanFace className="h-5 w-5" />
                    ) : (
                      <Fingerprint className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{cred.deviceLabel}</span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400 border border-slate-700">
                        {cred.algorithm}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Credential: {cred.id.slice(0, 16)}...</span>
                      <span>• Created: {new Date(cred.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      startBiometricVerification({
                        name: 'Sensor Health Check',
                        description: 'Verifying hardware biometric cryptographic signature response',
                        targetIcon: 'FINGERPRINT',
                      })
                    }
                    className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    Test Sensor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveCredential(cred.id)}
                    title="Revoke Credential"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sensitive Operations Test Playground */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Sensitive Financial Operations Simulator</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Click any sensitive action below to test biometric authorization using the Web Authentication API layer:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              startBiometricVerification({
                name: 'High-Value Withdrawal',
                description: 'Authorizing withdrawal of ₹25,000 from Centralized Pocket Account to external bank',
                amountPaise: 2500000,
                targetIcon: 'FINGERPRINT',
              })
            }
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/40 hover:bg-cyan-950/10 text-left transition-all cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center justify-between">
                <span>Authorize ₹25,000 Withdrawal</span>
                <ArrowRight className="h-3.5 w-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Requires Touch ID / Face ID before disbursing funds from the authoritative ledger.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              startBiometricVerification({
                name: 'Multi-Signature Approval',
                description: 'Signing off as second approver on ₹4,200 peer withdrawal request',
                amountPaise: 420000,
                targetIcon: 'SHIELD',
              })
            }
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/40 hover:bg-emerald-950/10 text-left transition-all cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center justify-between">
                <span>Sign Multi-Sig Approval</span>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Binds cryptographic biometric signature to the approval record in the audit trail.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              startBiometricVerification({
                name: 'Emergency Pocket Freeze',
                description: 'Executing kill-switch lock on all outgoing group transactions',
                targetIcon: 'SHIELD',
              })
            }
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-rose-500/40 hover:bg-rose-950/10 text-left transition-all cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center justify-between">
                <span>Emergency Account Freeze</span>
                <ArrowRight className="h-3.5 w-3.5 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Mandates biometric confirmation to halt spending in case of suspected fraud.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              startBiometricVerification({
                name: 'Export Accounting Ledger',
                description: 'Decryption and download of full double-entry cryptographic audit records',
                targetIcon: 'FACE',
              })
            }
            className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-purple-500/40 hover:bg-purple-950/10 text-left transition-all cursor-pointer group"
          >
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ScanFace className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center justify-between">
                <span>Export Cryptographic Ledger</span>
                <ArrowRight className="h-3.5 w-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Protects sensitive financial export files with user biometric verification.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Enforcement Policies Toggles */}
      <div className="space-y-3 pt-2 border-t border-slate-800">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-amber-400" />
          <span>Biometric Governance Policies</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div
            onClick={() => handlePolicyToggle('requireForWithdrawals')}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 transition"
          >
            <div>
              <p className="font-semibold text-white">Require Biometrics for Withdrawals</p>
              <p className="text-[10px] text-slate-500">Prompts Touch ID / Face ID on any withdrawal &gt; ₹500</p>
            </div>
            <div
              className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 ${
                policies.requireForWithdrawals ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="h-4 w-4 rounded-full bg-white shadow" />
            </div>
          </div>

          <div
            onClick={() => handlePolicyToggle('requireForApprovals')}
            className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/60 cursor-pointer hover:border-slate-700 transition"
          >
            <div>
              <p className="font-semibold text-white">Require Biometrics for Approvals</p>
              <p className="text-[10px] text-slate-500">Sign off peer withdrawal requests with biometric proof</p>
            </div>
            <div
              className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 ${
                policies.requireForApprovals ? 'bg-emerald-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="h-4 w-4 rounded-full bg-white shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* Biometric Verification Audit Log */}
      {auditLogs.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-slate-400" />
            <span>Biometric Security Event Log</span>
          </h3>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 text-[11px]"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200">{log.operation}</span>
                    <p className="text-[10px] text-slate-500">{log.detail}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-300">
                    {log.authenticatorType}
                  </span>
                  <span className="block text-[9px] text-slate-500 mt-0.5">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Biometric Verification Modal */}
      {isScanningModalOpen && activeOperation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 text-center space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            {/* Sensor Visual Animation */}
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              {scanState === 'SCANNING' && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
                  <div className="absolute inset-2 rounded-full border border-cyan-400/50 animate-spin" />
                </>
              )}

              {scanState === 'SUCCESS' && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 animate-pulse" />
              )}

              <div
                className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border transition-all ${
                  scanState === 'SCANNING'
                    ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-400'
                    : scanState === 'SUCCESS'
                    ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
                    : 'border-rose-500/50 bg-rose-950/40 text-rose-400'
                }`}
              >
                {scanState === 'SUCCESS' ? (
                  <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                ) : scanState === 'ERROR' ? (
                  <XCircle className="h-10 w-10 text-rose-400" />
                ) : activeOperation.targetIcon === 'FACE' ? (
                  <ScanFace className="h-10 w-10 text-cyan-400 animate-pulse" />
                ) : (
                  <Fingerprint className="h-10 w-10 text-cyan-400 animate-pulse" />
                )}
              </div>
            </div>

            {/* Status Text */}
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {scanState === 'SCANNING' && `Touch Sensor for ${authenticatorName}`}
                {scanState === 'SUCCESS' && 'Biometric Identity Verified'}
                {scanState === 'ERROR' && 'Authentication Rejected'}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {scanState === 'SCANNING' && activeOperation.description}
                {scanState === 'SUCCESS' && 'Cryptographic WebAuthn assertion generated and validated successfully.'}
                {scanState === 'ERROR' && (errorMessage || 'Biometric check failed. Please try again.')}
              </p>
            </div>

            {/* Cryptographic Proof Details on Success */}
            {scanState === 'SUCCESS' && lastVerificationProof && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-left space-y-1 font-mono text-[10px] text-emerald-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Operation:</span>
                  <span className="font-bold text-emerald-200">{lastVerificationProof.operation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Authenticator:</span>
                  <span>{lastVerificationProof.authenticatorType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Signature Alg:</span>
                  <span>{lastVerificationProof.algorithm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Assertion ID:</span>
                  <span className="truncate max-w-[160px]">{lastVerificationProof.credentialId}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {scanState === 'SUCCESS' ? (
                <button
                  type="button"
                  onClick={() => setIsScanningModalOpen(false)}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white transition cursor-pointer"
                >
                  Done
                </button>
              ) : scanState === 'ERROR' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsScanningModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => startBiometricVerification(activeOperation)}
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Retry Scan
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsScanningModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
                >
                  Cancel Authentication
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
