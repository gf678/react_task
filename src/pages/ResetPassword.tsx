import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useTranslation } from "react-i18next";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = params.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !password.trim()) {
      setMessage(t("resetPassword.invalid"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/api/auth/reset-password", {
        token,
        password: password.trim(),
      });

      alert(t("resetPassword.success"));

      navigate("/login", { replace: true });

    } catch (err: any) {
      setMessage(t("resetPassword.failed"));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="mx-auto mt-20 max-w-md rounded-2xl bg-white p-6 shadow">

      <h1 className="text-2xl font-bold">
        {t("resetPassword.title")}
      </h1>


      <form onSubmit={handleSubmit} className="mt-6 space-y-4">

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("resetPassword.placeholder")}
          className="w-full rounded-xl border px-4 py-3"
        />


        {message && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}


        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-white"
        >
          {loading
            ? t("resetPassword.changing")
            : t("resetPassword.submit")}
        </button>

      </form>

    </div>
  );
};

export default ResetPassword;