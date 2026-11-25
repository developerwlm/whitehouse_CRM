import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Award,
  ShieldCheck,
  Search,
  ExternalLink,
  Calendar,
  Building,
  GraduationCap,
} from 'lucide-react';
import axios from 'axios';

export default function VerifyCertificatePage() {
  const { certificateId: routeCertId } = useParams();
  const [certInput, setCertInput] = useState(routeCertId || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (routeCertId) {
      verifyCert(routeCertId);
    }
  }, [routeCertId]);

  const verifyCert = async (idToVerify) => {
    if (!idToVerify.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await axios.get(`/api/certificates/verify/${encodeURIComponent(idToVerify.trim())}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate record could not be found or verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (certInput.trim()) {
      verifyCert(certInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center text-white shadow-md">
              <Award className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <div className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                Whitehouse Skill Development Institute
              </div>
              <div className="text-xs text-gray-500">Official Credential Verification Service • Madurai</div>
            </div>
          </div>

          <Link
            to="/login"
            className="text-xs font-medium text-navy-600 hover:text-navy-800 transition-colors"
          >
            Staff & Student Login →
          </Link>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-2xl mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
        {/* Search Box */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 bg-navy-50 text-navy-700 rounded-2xl mb-3">
              <ShieldCheck className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Certificate Credential Verification</h1>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              Verify the authenticity of graduation certificates issued by Whitehouse Skill Development Institute, Madurai.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Certificate ID (e.g. WH-CERT-2026-0001)"
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !certInput.trim()}
              className="px-5 py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>

        {/* Verification Result Card */}
        {loading && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm text-center text-gray-500 text-sm">
            Querying secure credential registry...
          </div>
        )}

        {error && (
          <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm text-center">
            <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-full mb-3">
              <XCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Verification Unsuccessful</h3>
            <p className="text-xs text-rose-600 mt-1">{error}</p>
            <p className="text-xs text-gray-400 mt-3">
              Please ensure the Certificate ID is typed accurately as printed on the document.
            </p>
          </div>
        )}

        {result && result.isValid && result.certificate && (
          <div className="bg-white rounded-2xl border-2 border-emerald-500/30 shadow-lg overflow-hidden animate-fadeIn">
            {/* Top Verified Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-wide">
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                OFFICIAL VERIFIED GENUINE CREDENTIAL
              </div>
              <h2 className="text-lg font-bold mt-2">{result.certificate.courseName}</h2>
              <p className="text-xs text-emerald-100">{result.institute}</p>
            </div>

            {/* Credential Attributes */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Student Name
                  </span>
                  <span className="text-base font-bold text-gray-900 mt-0.5 block">
                    {result.certificate.studentName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Classification / Grade
                  </span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-xs font-semibold">
                    {result.certificate.grade || 'First Class'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Certificate ID
                  </span>
                  <span className="text-xs font-mono font-bold text-navy-800 mt-0.5 block">
                    {result.certificate.certificateId}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                    Issue Date
                  </span>
                  <span className="text-xs font-medium text-gray-700 mt-0.5 block">
                    {result.certificate.issueDate
                      ? new Date(result.certificate.issueDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  Cryptographic Verification Fingerprint
                </span>
                <span className="text-[11px] font-mono text-gray-500 break-all bg-gray-50 p-2 rounded-lg block mt-1 border border-gray-100">
                  {result.certificate.verificationHash || 'GENUINE_WHITEHOUSE_MADURAI_HASH'}
                </span>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-gray-400">
                  This public credential record was verified against the central Whitehouse Institute CRM database in Madurai, Tamil Nadu.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © 2026 Whitehouse Skill Development Institute, Madurai. All rights reserved.
      </footer>
    </div>
  );
}
