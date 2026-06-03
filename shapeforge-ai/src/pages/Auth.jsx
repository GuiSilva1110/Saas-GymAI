import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Dumbbell, Mail, Lock, Sparkles } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              full_name: name,
            },
          },
        });

        if (error) throw error;

        setMessage("Cadastro criado. Verifique seu e-mail se a confirmação estiver ativa.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error) {
      setMessage(error.message || "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#312e81,transparent_35%),#09090b] text-white flex items-center justify-center px-4">
      <section className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={16} />
            Seu shape em 90 dias com IA
          </div>

          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              ShapeForge
              <span className="block text-violet-400">AI</span>
            </h1>

            <p className="mt-6 text-lg text-zinc-300 max-w-xl">
              Treino, nutrição, análise corporal e evolução visual em uma única plataforma.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">90</p>
              <p className="text-sm text-zinc-400">dias de desafio</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">IA</p>
              <p className="text-sm text-zinc-400">coach pessoal</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold">Pro</p>
              <p className="text-sm text-zinc-400">evolução real</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleAuth}
          className="rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-violet-500 flex items-center justify-center">
              <Dumbbell />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </h2>
              <p className="text-sm text-zinc-400">
                Comece sua evolução agora.
              </p>
            </div>
          </div>

          {mode === "register" && (
            <div className="mb-4">
              <label className="text-sm text-zinc-300">Nome</label>
              <input
                className="mt-2 w-full rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 outline-none focus:border-violet-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm text-zinc-300">E-mail</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 focus-within:border-violet-400">
              <Mail size={18} className="text-zinc-500" />
              <input
                className="w-full bg-transparent outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="voce@email.com"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="text-sm text-zinc-300">Senha</label>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-zinc-950 border border-white/10 px-4 py-3 focus-within:border-violet-400">
              <Lock size={18} className="text-zinc-500" />
              <input
                className="w-full bg-transparent outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {message && (
            <p className="mb-4 text-sm text-amber-300">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-500 hover:bg-violet-400 transition px-4 py-3 font-bold disabled:opacity-60"
          >
            {loading
              ? "Carregando..."
              : mode === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-3 w-full rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 transition px-4 py-3 font-bold"
          >
            Entrar com Google
          </button>

          <p className="mt-6 text-center text-sm text-zinc-400">
            {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-violet-300 font-semibold"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}