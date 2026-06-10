import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { Camera, TrendingUp } from "lucide-react";

export default function Progress({ session }) {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const { data: analysesData } = await supabase
      .from("body_analyses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    const analysesWithImages = await Promise.all(
      (analysesData || []).map(async (item) => {
        if (!item.photo_url) return item;

        const { data } = await supabase.storage
          .from("body-analysis")
          .createSignedUrl(item.photo_url, 60 * 60);

        return {
          ...item,
          signedPhotoUrl: data?.signedUrl || null,
        };
      })
    );

    setProfile(profileData);
    setAnalyses(analysesWithImages);
    setLoading(false);
  }

  const latest = analyses[0];

  return (
    <AppLayout profile={profile}>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-violet-300 font-medium">Evolução</p>
            <h1 className="text-4xl font-black mt-2">Histórico corporal</h1>
            <p className="text-zinc-400 mt-2">
              Acompanhe suas fotos, Shape Score e evolução visual.
            </p>
          </div>

          <button
            onClick={() => navigate("/body-analysis")}
            className="rounded-xl bg-violet-500 px-5 py-3 font-bold hover:bg-violet-400 transition"
          >
            Nova análise
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-8">
            Carregando evolução...
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900 p-10 text-center">
            <Camera className="mx-auto text-violet-300 mb-4" size={48} />
            <h2 className="text-2xl font-bold">Nenhuma análise ainda</h2>
            <p className="text-zinc-400 mt-2">
              Envie sua primeira foto para gerar seu Shape Score inicial.
            </p>

            <button
              onClick={() => navigate("/body-analysis")}
              className="mt-6 rounded-xl bg-violet-500 px-5 py-3 font-bold"
            >
              Começar agora
            </button>
          </div>
        ) : (
          <>
            {latest && (
              <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-zinc-900 p-6 mb-8">
                <div className="grid lg:grid-cols-4 gap-4">
                  <Metric label="Shape Score" value={`${latest.shape_score}/100`} />
                  <Metric label="Músculo" value={`${latest.muscle_score}/100`} />
                  <Metric label="Simetria" value={`${latest.symmetry_score}/100`} />
                  <Metric
                    label="Peso"
                    value={latest.weight_kg ? `${latest.weight_kg}kg` : "--"}
                  />
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {analyses.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-zinc-900 overflow-hidden"
                >
                  <div className="h-80 bg-zinc-950">
                    {item.signedPhotoUrl ? (
                      <img
                        src={item.signedPhotoUrl}
                        alt="Análise corporal"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-600">
                        Sem foto
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-zinc-400">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </p>

                      <div className="flex items-center gap-1 text-violet-300 text-sm">
                        <TrendingUp size={16} />
                        {item.shape_score}/100
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mt-3">
                      Shape Score {item.shape_score}
                    </h3>

                    <p className="text-sm text-zinc-400 mt-2">
                      {item.ai_feedback}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SmallStat label="Músculo" value={item.muscle_score} />
                      <SmallStat label="Simetria" value={item.symmetry_score} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-bold">{value || "--"}/100</p>
    </div>
  );
}