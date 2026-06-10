import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Activity,
  ArrowLeft,
  Brain,
  Camera,
  Dumbbell,
  Home,
  LogOut,
  Target,
  Utensils,
} from "lucide-react";

export default function AppLayout({ children, profile }) {
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/auth");
  }

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { to: "/body-analysis", label: "Análise corporal", icon: <Camera size={18} /> },
    { to: "/progress", label: "Evolução", icon: <Activity size={18} /> },
    { to: "/workouts", label: "Treinos", icon: <Dumbbell size={18} /> },
    { to: "/nutrition", label: "Nutrição", icon: <Utensils size={18} /> },
    { to: "/challenge", label: "Desafio 90 dias", icon: <Target size={18} /> },
    { to: "/coach", label: "AI Coach", icon: <Brain size={18} /> },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex">
      <aside className="hidden lg:flex w-72 border-r border-white/10 bg-zinc-950/90 p-5 flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">
            ShapeForge <span className="text-violet-400">AI</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Evolução física com IA
          </p>
        </div>

        <nav className="space-y-2 flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-violet-500 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-5">
          <p className="text-sm font-bold">{profile?.name || "Usuário"}</p>
          <p className="text-xs text-zinc-500">{profile?.plan || "free"}</p>

          <button
            onClick={handleLogout}
            className="mt-4 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <section className="flex-1 min-w-0">
        <div className="lg:hidden border-b border-white/10 p-4 flex items-center justify-between">
          <h1 className="font-black">
            ShapeForge <span className="text-violet-400">AI</span>
          </h1>

          <button onClick={handleLogout} className="text-sm text-zinc-400">
            Sair
          </button>
        </div>

        {location.pathname !== "/dashboard" && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
          </div>
        )}

        {children}
      </section>
    </main>
  );
}