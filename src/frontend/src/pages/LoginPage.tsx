import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const session = login(email.trim(), password);
    setLoading(false);
    if (!session) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #361e14 0%, #5c3520 40%, #fdbc0c 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <Card
          className="border-0 rounded-2xl overflow-hidden"
          style={{
            boxShadow:
              "0 25px 60px rgba(54,30,20,0.4), 0 0 40px rgba(253,188,12,0.15)",
            background: "white",
          }}
        >
          <CardHeader className="pb-0 pt-8 flex flex-col items-center gap-3">
            <div
              style={{
                height: "4px",
                background: "linear-gradient(90deg, #361e14, #fdbc0c)",
                borderRadius: "2px",
                width: "100%",
                marginBottom: "8px",
              }}
            />
            <div className="w-[250px] h-[250px] flex items-center justify-center flex-shrink-0">
              {!logoError ? (
                <img
                  src="/assets/uploads/Logo_Dashboard-1.png"
                  alt="Oho Shawarma Logo"
                  width={250}
                  height={250}
                  style={{ display: "block" }}
                  className="w-[250px] h-[250px] object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-[250px] h-[250px] rounded-2xl bg-[#361e14] flex items-center justify-center">
                  <span className="text-[#fdbc0c] font-bold text-5xl">OS</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <h1
                className="font-display font-bold text-2xl"
                style={{ color: "#361e14" }}
              >
                Oho Shawarma
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Oho Shawarma Auditing Dashboard
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-6 pb-8 px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  data-ocid="login.input"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  data-ocid="login.input"
                  className="h-10"
                />
              </div>

              {error && (
                <div
                  data-ocid="login.error_state"
                  className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                data-ocid="login.submit_button"
                className="w-full h-10 font-semibold"
                style={{
                  background: "linear-gradient(90deg, #361e14, #5c3520)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(54,30,20,0.3)",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(253,188,12,0.8)" }}
        >
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100 transition-opacity"
            style={{ color: "#fdbc0c" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
