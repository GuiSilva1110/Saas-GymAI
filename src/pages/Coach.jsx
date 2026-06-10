import AppLayout from "../components/AppLayout";

export default function Coach() {
  return (
    <AppLayout>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-violet-300 font-medium">AI Coach</p>
        <h1 className="text-4xl font-black mt-2">Seu coach inteligente</h1>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-8">
          <h2 className="text-2xl font-bold">Coach em construção</h2>
          <p className="text-zinc-400 mt-2">
            Em breve a IA vai gerar plano de treino, dieta e ajustes semanais.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}