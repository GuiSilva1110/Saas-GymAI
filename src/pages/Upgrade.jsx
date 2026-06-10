import AppLayout from "../components/AppLayout";
import { Check, Crown, Sparkles } from "lucide-react";

const CHECKOUT_URL = "https://pay.kiwify.com.br/SEU-LINK-AQUI";

export default function Upgrade() {
  return (
    <AppLayout>
      <section className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-amber-300 font-medium">ShapeForge AI Premium</p>

        <h1 className="text-4xl md:text-6xl font-black mt-3">
          Desbloqueie sua evolução completa
        </h1>

        <p className="text-zinc-400 mt-4 max-w-2xl">
          Acesso vitalício ao ShapeForge AI com treinos inteligentes, nutrição,
          análise corporal e atualizações futuras.
        </p>

        <div className="grid lg:grid-cols-2 gap-6 mt-10">
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">
            <h2 className="text-2xl font-bold">Plano Free</h2>
            <p className="text-zinc-400 mt-2">Para testar a plataforma.</p>

            <div className="mt-6 space-y-3 text-zinc-300">
              <Item>Dashboard inicial</Item>
              <Item>Recursos limitados</Item>
              <Item>Teste do app</Item>
            </div>

            <p className="mt-8 text-3xl font-black">R$0</p>
          </div>

          <div className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-zinc-900 p-8 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-56 w-56 bg-amber-400/20 blur-3xl rounded-full" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-zinc-950 px-4 py-2 text-sm font-black mb-5">
                <Crown size={16} />
                Founder Pass
              </div>

              <h2 className="text-3xl font-black">Acesso Vitalício</h2>
              <p className="text-zinc-300 mt-2">
                Oferta de lançamento para os primeiros usuários.
              </p>

              <div className="mt-6 space-y-3 text-zinc-200">
                <Item>Treinos inteligentes ilimitados</Item>
                <Item>Nutrição personalizada</Item>
                <Item>Análise corporal com Shape Score</Item>
                <Item>Histórico de evolução</Item>
                <Item>Scanner de refeições</Item>
                <Item>Atualizações futuras inclusas</Item>
              </div>

              <div className="mt-8">
                <p className="text-zinc-500 line-through">De R$297</p>
                <p className="text-5xl font-black">R$47</p>
                <p className="text-sm text-zinc-400 mt-1">pagamento único</p>
              </div>

              <a
                href={CHECKOUT_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-8 w-full rounded-xl bg-amber-400 px-5 py-4 font-black text-zinc-950 hover:bg-amber-300 transition flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Quero desbloquear agora
              </a>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function Item({ children }) {
  return (
    <p className="flex items-center gap-2">
      <Check size={18} className="text-emerald-400" />
      {children}
    </p>
  );
}