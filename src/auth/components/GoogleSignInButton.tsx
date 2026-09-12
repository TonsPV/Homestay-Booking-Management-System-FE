import { useEffect, useRef, useState } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (configuration: {
        auto_select?: boolean;
        callback: (response: GoogleCredentialResponse) => void;
        client_id: string;
        context?: "signin" | "signup" | "use";
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          locale?: string;
          shape?: "pill" | "rectangular" | "circle" | "square";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          theme?: "outline" | "filled_blue" | "filled_black";
          width?: number;
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const GOOGLE_SCRIPT_ID = "google-identity-services-script";
const GOOGLE_SCRIPT_URL = "https://accounts.google.com/gsi/client";

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (credential: string) => void;
}

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts.id) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);

  if (existingScript instanceof HTMLScriptElement) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Identity Services could not load.")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Google Identity Services could not load."));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({
  clientId,
  onCredential,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let active = true;

    void loadGoogleScript()
      .then(() => {
        if (!active || !buttonRef.current || !window.google) {
          return;
        }

        buttonRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          auto_select: false,
          callback: ({ credential }) => onCredentialRef.current(credential),
          client_id: clientId,
          context: "signin",
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          locale: "vi",
          shape: "rectangular",
          size: "large",
          text: "continue_with",
          theme: "outline",
          width: 280,
        });
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  return (
    <div className="grid gap-2">
      <div
        aria-label="Đăng nhập bằng Google"
        className="flex min-h-11 justify-center"
        ref={buttonRef}
      />
      {error ? (
        <p className="text-center text-xs text-muted" role="status">
          Không thể tải nút Google. Vui lòng thử lại sau.
        </p>
      ) : null}
    </div>
  );
}
