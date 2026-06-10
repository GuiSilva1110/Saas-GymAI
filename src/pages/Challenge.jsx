import AppLayout from "../components/AppLayout";

export default function Challenge() {
  return (
    <AppLayout>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-violet-300 font-medium">Desafio 90 Dias</p>
        <h1 className="text-4xl font-black mt-2">Sua transformação começa agora</h1>

        <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-8">
          <h2 className="text-2xl font-bold">Dia 1 de 90</h2>
          <p className="text-zinc-400 mt-2">
            Aqui vamos acompanhar peso, fotos, treino, dieta e progresso diário.
          </p>
        </div>
      </section>
    </AppLayout>
  );
}