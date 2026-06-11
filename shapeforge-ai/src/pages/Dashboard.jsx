import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Activity,
  Brain,
  Camera,
  Dumbbell,
  Flame,
  LogOut,
  Target,
  Utensils,
  Droplets,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(data);
    }

    loadProfile();
  }, [session.user.id]);

  const analysis = useMemo(() => {
    if (!profile?.height_cm || !profile?.current_weight_kg) return null;

    const heightM = Number(profile.height_cm) / 100;
    const weight = Number(profile.current_weight_kg);
    const goalWeight = Number(profile.goal_weight_kg);

    const bmi = weight / (heightM * heightM);
    const weightDiff = goalWeight - weight;
    const weeklyChange = weightDiff / 12;

    let bmiLabel = "Normal";
    if (bmi < 18.5) bmiLabel = "Abaixo do peso";
    if (bmi >= 25) bmiLabel = "Sobrepeso";
    if (bmi >= 30) bmiLabel = "Obesidade";

    const baseCalories = Math.round(weight * 30);

    let targetCalories = baseCalories;

    if (profile.goal === "Perder gordura") {
      targetCalories = baseCalories - 400;
    }

    if (profile.goal === "Ganhar massa muscular") {
      targetCalories = baseCalories + 300;
    }

    if (profile.goal === "Definir o corpo") {
      targetCalories = baseCalories - 200;
    }

    return {
      bmi: bmi.toFixed(1),
      bmiLabel,
      weightDiff: weightDiff.toFixed(1),
      weeklyChange: weeklyChange.toFixed(2),
      baseCalories,
      targetCalories,
      protein: Math.round(weight * 2),
      water: (weight * 0.035).toFixed(1),
    };
  }, [profile]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">
              ShapeForge <span className="text-violet-400">AI</span>
            </h1>
            <p className="text-sm text-zinc-400">
              Bem-vindo, {profile?.name || session.user.email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 via-zinc-900 to-zinc-950 p-6 md:p-8 mb-8 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-64 w-64 bg-violet-500/20 blur-3xl rounded-full" />

          <div className="relative max-w-3xl">
            <p className="text-violet-200 font-medium mb-3">
              Sua análise inicial
            </p>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              Seu plano de evolução para os próximos 90 dias está pronto.
            </h2>

            <p className="mt-4 text-zinc-300">
              Baseado no seu peso, altura, objetivo e nível de atividade.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="rounded-xl bg-violet-500 px-5 py-3 font-bold hover:bg-violet-400 transition">
                Gerar plano com IA
              </button>

              <button
  onClick={() => window.location.href = "/body-analysis"}
  className="rounded-xl border border-white/10 px-5 py-3 font-bold hover:bg-white/5 transition"
>
  Enviar foto corporal
</button>
            </div>
          </div>
        </div>

        {analysis && (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard
                icon={<Target />}
                label="Objetivo"
                value={profile?.goal || "Definir"}
              />

              <MetricCard
                icon={<Activity />}
                label="IMC"
                value={analysis.bmi}
                sub={analysis.bmiLabel}
              />

              <MetricCard
                icon={<Flame />}
                label="Calorias alvo"
                value={`${analysis.targetCalories} kcal`}
                sub={`Manutenção: ${analysis.baseCalories} kcal`}
              />

              <MetricCard
                icon={<Droplets />}
                label="Água diária"
                value={`${analysis.water} L`}
                sub="Estimativa inicial"
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mb-8">
              <AnalysisCard
                icon={
                  Number(analysis.weightDiff) < 0 ? (
                    <TrendingDown />
                  ) : (
                    <TrendingUp />
                  )
                }
                title="Projeção de peso"
                value={`${profile.current_weight_kg}kg → ${profile.goal_weight_kg}kg`}
                text={`Mudança estimada de ${analysis.weeklyChange}kg por semana durante 12 semanas.`}
              />

              <AnalysisCard
                icon={<Utensils />}
                title="Meta de proteína"
                value={`${analysis.protein}g/dia`}
                text="Estimativa para preservar ou ganhar massa muscular durante o plano."
              />

              <AnalysisCard
                icon={<Brain />}
                title="Shape Score inicial"
                value="Em breve"
                text="Envie uma foto para receber análise visual, pontos fortes e prioridades."
              />
            </div>
          </>
        )}

        <div className="grid lg:grid-cols-3 gap-4">
          <FeatureCard
            icon={<Camera />}
            title="Análise corporal"
            description="Envie uma foto e receba um Shape Score com feedback da IA."
            cta="Começar análise"
          />

          <FeatureCard
            icon={<Dumbbell />}
            title="Treino inteligente"
            description="Receba um plano de treino baseado no seu objetivo e rotina."
            cta="Criar treino"
          />

          <FeatureCard
            icon={<Utensils />}
            title="Nutrição personalizada"
            description="Monte refeições, acompanhe macros e escaneie pratos com IA."
            cta="Montar dieta"
          />
        </div>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="h-10 w-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function AnalysisCard({ icon, title, value, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
      <div className="h-11 w-11 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{text}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, cta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6 hover:border-violet-400/40 transition">
      <div className="h-12 w-12 rounded-2xl bg-violet-500 text-white flex items-center justify-center mb-5">
        {icon}
      </div>

      <h3 className="text-xl font-bold">{title}</h3>

      <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
        {description}
      </p>

      <button className="mt-5 rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition">
        {cta}
      </button>
    </div>
  );
}