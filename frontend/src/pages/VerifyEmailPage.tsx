import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/http";

type Status = "loading" | "success" | "error";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("No verification token found in the link.");
      setStatus("error");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        const msg =
          err &&
          typeof err === "object" &&
          "response" in err &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message
            ? (err as { response: { data: { message: string } } }).response.data.message
            : "Verification failed. The link may have expired.";
        setErrorMsg(msg);
        setStatus("error");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-10 w-full max-w-sm text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin mx-auto" />
            <p className="mt-4 text-stone-500 text-sm">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-stone-900 mt-4 tracking-tight">Email verified!</h1>
            <p className="text-stone-500 text-sm mt-2">Your account is now active. You can sign in.</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
            >
              Sign in
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-stone-900 mt-4 tracking-tight">Verification failed</h1>
            <p className="text-stone-500 text-sm mt-2">{errorMsg}</p>
            <button
              onClick={() => navigate("/register")}
              className="mt-6 w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-full transition-colors text-sm"
            >
              Back to register
            </button>
          </>
        )}
      </div>
    </div>
  );
};
