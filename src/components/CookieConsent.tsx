import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setShow(true);
  }, []);

  const accept = (analytics: boolean) => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ analytics, timestamp: new Date().toISOString() })
    );
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md px-6 py-4">
      <div className="mx-auto flex max-w-[960px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use necessary cookies for site functionality. With your consent, we also use analytics cookies.{" "}
          <Link to="/datenschutz" className="text-primary underline">Mehr erfahren</Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => accept(false)}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Necessary Only
          </button>
          <button
            onClick={() => accept(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
