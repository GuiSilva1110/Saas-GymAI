import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Camera, Upload, Sparkles } from "lucide-react";

export default function BodyAnalysis({ session }) {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleFileChange(e) {
    const selected = e.target.files?.[0];

    if (!selected) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(selected.type)) {
      setMessage("Use uma imagem JPG, PNG ou WEBP.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setMessage("A imagem precisa ter no máximo 5MB.");
      return;
    }

    setMessage("");
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!session?.user?.id) {
      setMessage("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!file) {
      setMessage("Selecione uma foto para continuar.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${session.user.id}/body-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("body-analysis")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const shapeScore = Math.floor(Math.random() * (88 - 62 + 1)) + 62;
      const muscleScore = Math.floor(Math.random() * (86 - 58 + 1)) + 58;
      const symmetryScore = Math.floor(Math.random() * (90 - 60 + 1)) + 60;

      const { error: insertError } = await supabase
        .from("body_analyses")
        .insert({
          user_id: session.user.id,
          photo_url: filePath,
          weight_kg: weight ? Number(weight) : null,
          body_fat_estimate: null,
          muscle_score: muscleScore,
          symmetry_score: symmetryScore,
          shape_score: shapeScore,
          strengths: ["Boa base inicial", "Potencial de evolução em 90 dias"],
          weaknesses: ["Consistência semanal", "Ajuste de dieta e treino"],
          ai_feedback:
            "Sua análise inicial foi registrada. Para uma evolução mais precisa, envie novas fotos a cada 15 dias e acompanhe treino, alimentação e peso.",
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      navigate("/progress");
    } catch (error) {
      setMessage(error.message || "Erro ao gerar análise corporal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <section className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Voltar ao dashboard
        </button>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200 mb-5">
              <Sparkles size={16} />
              Shape Score inicial
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Envie sua foto e gere sua primeira análise corporal.
            </h1>

            <p className="mt-4 text-zinc-400 leading-relaxed">
              Essa análise cria uma base visual para acompanhar sua evolução no
              desafio de 90 dias. A versão atual gera uma avaliação inicial
              simulada; a próxima etapa conecta IA real.
            </p>

            <div className="mt-8 rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="text-xl font-bold mb-4">O que será salvo</h2>

              <div className="space-y-3 text-sm text-zinc-300">
                <p>• Foto corporal no Storage</p>
                <p>• Shape Score inicial</p>
                <p>• Score de músculo e simetria</p>
                <p>• Peso atual informado</p>
                <p>• Histórico para comparação futura</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-zinc-900 p-6"
          >
            <label className="block">
              <span className="text-sm text-zinc-300">Foto corporal</span>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
  <label className="block">
    <span className="sr-only">Escolher imagem</span>
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleFileChange}
      className="hidden"
      id="gallery-upload"
    />

    <label
      htmlFor="gallery-upload"
      className="flex cursor-pointer items-center justify-center rounded-xl bg-white text-zinc-950 px-4 py-3 text-sm font-bold hover:bg-zinc-200 transition"
    >
      Escolher da galeria
    </label>
  </label>

  <label className="block">
    <span className="sr-only">Tirar foto</span>
    <input
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileChange}
      className="hidden"
      id="camera-upload"
    />

    <label
      htmlFor="camera-upload"
      className="flex cursor-pointer items-center justify-center rounded-xl bg-violet-500 text-white px-4 py-3 text-sm font-bold hover:bg-violet-400 transition"
    >
      Tirar foto agora
    </label>
  </label>
</div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="mt-4 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:font-bold file:text-white"
              />
            </label>

            <label className="block mt-5">
              <span className="text-sm text-zinc-300">Peso atual</span>
              <input
                className="input mt-2"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 82.5"
              />
            </label>

            {message && (
              <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-violet-500 hover:bg-violet-400 transition px-5 py-4 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Upload size={18} />
              {loading ? "Gerando análise..." : "Gerar análise corporal"}
            </button>
          </form>
        </div>
      </section>
    </AppLayout>
  );
}