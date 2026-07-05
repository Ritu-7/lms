import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../../components/students/Footer";
import Loading from "../../components/students/Loading";
import { AppContext } from "../../context/AppContext";

const VerifyCertificate = () => {
  const { verificationCode } = useParams();
  const { backendURL } = useContext(AppContext);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const { data } = await axios.get(`${backendURL}/api/certificates/verify/${verificationCode}`);
        if (data.success) {
          setResult(data.certificate);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [backendURL, verificationCode]);

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Certificate Verification</p>
              <h1 className="mt-2 text-3xl font-bold text-gray-900">{result?.studentName || "Certificate"}</h1>
              <p className="mt-2 text-gray-600">{result?.courseTitle || "Course"}</p>
            </div>
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-sm font-bold text-gray-400">
                QR
              </div>
              <p className="mt-3 text-xs text-gray-500">QR verification placeholder</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Certificate ID</p>
              <p className="mt-2 font-semibold text-gray-900">{result?.certificateId}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Issue Date</p>
              <p className="mt-2 font-semibold text-gray-900">{result?.issueDate ? new Date(result.issueDate).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Verification Code</p>
              <p className="mt-2 break-all font-semibold text-gray-900">{verificationCode}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-5">
              <p className="text-sm text-gray-500">Status</p>
              <p className="mt-2 font-semibold text-gray-900">{result?.status === "active" ? "Verified" : "Revoked"}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={result?.downloadUrl || "#"} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" target="_blank" rel="noreferrer">Download PDF</a>
            <a href={result?.verificationUrl || "#"} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" target="_blank" rel="noreferrer">Verification Link</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyCertificate;
