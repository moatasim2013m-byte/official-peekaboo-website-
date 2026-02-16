import { useMemo, useState } from "react";

const QUICK_QUESTIONS = ["الأسعار", "الموقع", "ساعات الدوام", "الحجز", "سياسة الاسترجاع"];

const RAW_API_URL = (process.env.REACT_APP_BACKEND_URL || "").trim();

const normalizeBackendOrigin = (rawUrl) => {
  if (!rawUrl || rawUrl === "undefined" || rawUrl === "null") return "";
  const sanitized = rawUrl.replace(/\/+$/, "");
  return sanitized.replace(/\/api$/i, "");
};

export default function FaqBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "مرحبًا 👋 أنا مساعد بيكابو. اختر سؤالًا سريعًا وسأجاوبك فورًا." }
  ]);
  const [loading, setLoading] = useState(false);

  const apiBase = useMemo(() => {
    const origin = normalizeBackendOrigin(RAW_API_URL);
    return origin ? `${origin}/api` : "/api";
  }, []);

  const askQuestion = async (question) => {
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/bot/faq?q=${encodeURIComponent(question)}`);
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "bot", text: data.answer || "ما قدرت ألقى جواب الآن." }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: "حصل خطأ بسيط. حاول مرة ثانية بعد قليل." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1100 }} dir="rtl">
      {open && (
        <div
          style={{
            width: "320px",
            maxHeight: "420px",
            background: "#fff",
            borderRadius: "14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
            overflow: "hidden",
            marginBottom: "10px",
            border: "1px solid #eee"
          }}
        >
          <div style={{ background: "#6d28d9", color: "#fff", padding: "12px", fontWeight: 700 }}>مساعد الأسئلة السريعة</div>

          <div style={{ padding: "12px", maxHeight: "230px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  alignSelf: message.role === "user" ? "flex-start" : "flex-end",
                  background: message.role === "user" ? "#ede9fe" : "#f3f4f6",
                  color: "#111827",
                  borderRadius: "10px",
                  padding: "8px 10px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  maxWidth: "85%"
                }}
              >
                {message.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: "13px", color: "#6b7280" }}>جاري تجهيز الرد...</div>}
          </div>

          <div style={{ padding: "10px", borderTop: "1px solid #f0f0f0", display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {QUICK_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => askQuestion(question)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "999px",
                  background: "#fff",
                  cursor: "pointer",
                  padding: "6px 10px",
                  fontSize: "13px"
                }}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          border: "none",
          background: "#6d28d9",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(109,40,217,0.35)"
        }}
        aria-label="فتح مساعد الأسئلة"
        title="مساعد الأسئلة"
      >
        ؟
      </button>
    </div>
  );
}
