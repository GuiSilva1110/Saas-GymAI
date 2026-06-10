import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { Dumbbell, Plus, Sparkles } from "lucide-react";

export default function Workouts({ session }) {
  const [profile, setProfile] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [workoutDays, setWorkoutDays] = useState([]);
const [availableTemplates, setAvailableTemplates] = useState([]);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("Hipertrofia");
  const [level, setLevel] = useState("Intermediário");
  const [location, setLocation] = useState("Academia");
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const [loading, setLoading] = useState(false);

  const [editingPlan, setEditingPlan] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    goal: "Hipertrofia",
    days_per_week: 5,
  });
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const { data: plansData } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    setProfile(profileData);
setPlans(plansData || []);

const { data: templatesData } = await supabase
  .from("workout_templates")
  .select("goal, level, location, days_per_week")
  .order("goal", { ascending: true });

setAvailableTemplates(templatesData || []);
}

  async function loadPlanDetails(plan) {
    setSelectedPlan(plan);

    const { data: daysData, error: daysError } = await supabase
      .from("workout_days")
      .select("*")
      .eq("workout_plan_id", plan.id)
      .order("day_order", { ascending: true });

    if (daysError) {
      alert(daysError.message);
      return;
    }

    const daysWithExercises = await Promise.all(
      (daysData || []).map(async (day) => {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_day_id", day.id)
          .order("created_at", { ascending: true });

        if (exercisesError) {
          console.error(exercisesError);
        }

        return {
          ...day,
          exercises: exercisesData || [],
        };
      })
    );

    setWorkoutDays(daysWithExercises);
  }

  async function createManualPlan(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("workout_plans").insert({
      user_id: session.user.id,
      title,
      goal,
      days_per_week: Number(daysPerWeek),
      ai_generated: false,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    await loadData();
  }

  async function deletePlan(planId) {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir este treino?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("workout_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    if (selectedPlan?.id === planId) {
      setSelectedPlan(null);
      setWorkoutDays([]);
    }

    await loadData();
  }

  function openEditModal(plan) {
    setEditingPlan(plan);
    setEditMessage("");

    setEditForm({
      title: plan.title || "",
      goal: plan.goal || "Hipertrofia",
      days_per_week: plan.days_per_week || 5,
    });
  }

  async function saveEditedPlan(e) {
    e.preventDefault();
    setEditMessage("");

    if (!editingPlan?.id) {
      setEditMessage("Treino inválido.");
      return;
    }

    const { data, error } = await supabase
      .from("workout_plans")
      .update({
        title: editForm.title,
        goal: editForm.goal,
        days_per_week: Number(editForm.days_per_week),
      })
      .eq("id", editingPlan.id)
      .eq("user_id", session.user.id)
      .select();

    if (error) {
      setEditMessage(error.message);
      return;
    }

    if (!data || data.length === 0) {
      setEditMessage(
        "Nenhum treino foi atualizado. Verifique as policies de UPDATE no Supabase."
      );
      return;
    }

    setEditingPlan(null);
    await loadData();

    if (selectedPlan?.id === editingPlan.id) {
      setSelectedPlan(data[0]);
    }
  }

  async function generateSmartWorkout() {
  setLoading(true);

  try {
    const { data: library, error: libraryError } = await supabase
  .from("exercise_library")
  .select("*")
  .or(`location.eq.${location},location.eq.Casa`)
  .eq("training_style", goal);

    if (libraryError) throw libraryError;

    if (!library || library.length === 0) {
      alert("Biblioteca de exercícios vazia.");
      setLoading(false);
      return;
    }

    const split = buildWorkoutSplit(goal, Number(daysPerWeek));

    const { data: plan, error: planError } = await supabase
      .from("workout_plans")
      .insert({
        user_id: session.user.id,
        title: `${goal} ${level} ${daysPerWeek}x`,
        goal,
        days_per_week: Number(daysPerWeek),
        ai_generated: true,
      })
      .select()
      .single();

    if (planError) throw planError;

    for (let i = 0; i < split.length; i++) {
      const day = split[i];

      const { data: workoutDay, error: dayError } = await supabase
        .from("workout_days")
        .insert({
          workout_plan_id: plan.id,
          title: day.title,
          day_order: i + 1,
          muscle_groups: day.groups,
        })
        .select()
        .single();

      if (dayError) throw dayError;

      const exerciseRows = buildExercisesForDay({
        library,
        groups: day.groups,
        level,
        goal,
        workoutDayId: workoutDay.id,
      });

      const { error: exercisesError } = await supabase
        .from("exercises")
        .insert(exerciseRows);

      if (exercisesError) throw exercisesError;
    }

    await loadData();
    await loadPlanDetails(plan);
  } catch (error) {
    alert(error.message || "Erro ao gerar treino inteligente.");
  } finally {
    setLoading(false);
  }
}
function buildWorkoutSplit(goal, days) {
  if (goal === "Condicionamento") {
    return Array.from({ length: days }, (_, index) => ({
      title: `Circuito ${index + 1}`,
      groups: ["Full Body", "Cardio", "Abdômen", "Pernas"],
    }));
  }

  if (goal === "Emagrecimento") {
    return Array.from({ length: days }, (_, index) => ({
      title: `Metabólico ${index + 1}`,
      groups: ["Full Body", "Cardio", "Pernas", "Abdômen"],
    }));
  }

  if (goal === "Calistenia") {
    return Array.from({ length: days }, (_, index) => ({
      title: `Calistenia ${index + 1}`,
      groups: ["Peito", "Costas", "Pernas", "Abdômen", "Ombros", "Tríceps"],
    }));
  }

  if (goal === "Força") {
    return [
      { title: "Força A - Agachamento/Supino", groups: ["Pernas", "Peito", "Costas"] },
      { title: "Força B - Terra/Ombros", groups: ["Full Body", "Ombros", "Costas"] },
      { title: "Força C - Inferior", groups: ["Pernas", "Full Body", "Abdômen"] },
      { title: "Força D - Superior", groups: ["Peito", "Costas", "Ombros"] },
    ].slice(0, days);
  }

  if (days <= 3) {
    return [
      { title: "Treino A - Superiores", groups: ["Peito", "Costas", "Ombros", "Tríceps"] },
      { title: "Treino B - Inferiores", groups: ["Pernas", "Abdômen"] },
      { title: "Treino C - Full Body", groups: ["Peito", "Costas", "Pernas", "Bíceps"] },
    ].slice(0, days);
  }

  if (days === 4) {
    return [
      { title: "Treino A - Peito e Tríceps", groups: ["Peito", "Tríceps", "Abdômen"] },
      { title: "Treino B - Costas e Bíceps", groups: ["Costas", "Bíceps"] },
      { title: "Treino C - Pernas", groups: ["Pernas", "Abdômen"] },
      { title: "Treino D - Ombros e Braços", groups: ["Ombros", "Bíceps", "Tríceps"] },
    ];
  }

  return [
    { title: "Treino A - Peito", groups: ["Peito", "Tríceps"] },
    { title: "Treino B - Costas", groups: ["Costas", "Bíceps"] },
    { title: "Treino C - Pernas", groups: ["Pernas", "Abdômen"] },
    { title: "Treino D - Ombros", groups: ["Ombros", "Abdômen"] },
    { title: "Treino E - Braços", groups: ["Bíceps", "Tríceps"] },
  ].slice(0, days);
}
function buildExercisesForDay({ library, groups, level, goal, workoutDayId }) {
  const minExercises =
    level === "Iniciante" ? 4 : level === "Intermediário" ? 5 : 6;

  const sets =
    goal === "Condicionamento" || goal === "Emagrecimento"
      ? 3
      : level === "Iniciante"
      ? 3
      : level === "Intermediário"
      ? 4
      : 5;

  const reps =
    goal === "Força"
      ? "4-6"
      : goal === "Condicionamento"
      ? "30-45s"
      : goal === "Emagrecimento"
      ? "12-20"
      : goal === "Calistenia"
      ? "8-15"
      : "8-12";

  const rest =
    goal === "Força"
      ? 120
      : goal === "Condicionamento" || goal === "Emagrecimento"
      ? 30
      : 60;

  let selected = [];

  groups.forEach((group) => {
    const candidates = library
      .filter((exercise) => exercise.muscle_group === group)
      .sort(() => Math.random() - 0.5);

    selected.push(...candidates.slice(0, 2));
  });

  if (selected.length < minExercises) {
    const extra = library
      .filter((exercise) => !selected.some((item) => item.id === exercise.id))
      .sort(() => Math.random() - 0.5)
      .slice(0, minExercises - selected.length);

    selected.push(...extra);
  }

  selected = selected.slice(0, minExercises);

  return selected.map((exercise) => ({
    workout_day_id: workoutDayId,
    name: exercise.name,
    sets,
    reps,
    rest_seconds: rest,
    notes: `${goal} · ${exercise.muscle_group} · ${exercise.equipment || ""}`,
  }));
}
  return (
    <AppLayout profile={profile}>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-violet-300 font-medium">Treinos</p>
        <h1 className="text-4xl font-black mt-2">Treino inteligente</h1>
        <p className="text-zinc-400 mt-2">
          Gere um plano automaticamente com base no seu objetivo, nível e rotina.
        </p>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="space-y-6">
            <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-zinc-900 p-6">
              <h2 className="text-2xl font-bold mb-5 flex items-center gap-2">
                <Sparkles className="text-violet-300" />
                Gerar com IA
              </h2>

              <Select label="Objetivo" value={goal} setValue={setGoal}>
                <option>Hipertrofia</option>
  <option>Emagrecimento</option>
  <option>Definição</option>
  <option>Força</option>
  <option>Condicionamento</option>
  <option>Funcional</option>
  <option>Calistenia</option>
</Select>

              <Select label="Nível" value={level} setValue={setLevel}>
                <option>Iniciante</option>
                <option>Intermediário</option>
                <option>Avançado</option>
              </Select>

              <Select label="Local" value={location} setValue={setLocation}>
                <option>Academia</option>
                <option>Casa</option>
              </Select>

              <label className="block mb-5">
                <span className="text-sm text-zinc-300">Dias por semana</span>
                <input
                  className="input mt-2"
                  type="number"
                  min="1"
                  max="7"
                  value={daysPerWeek}
                  onChange={(e) => setDaysPerWeek(e.target.value)}
                />
              </label>

              <button
                onClick={generateSmartWorkout}
                disabled={loading}
                className="w-full rounded-xl bg-violet-500 hover:bg-violet-400 px-5 py-3 font-bold disabled:opacity-60"
              >
                {loading ? "Gerando..." : "Gerar treino inteligente"}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
  <p className="text-sm font-bold text-zinc-300 mb-3">
    Combinações disponíveis
  </p>

  <div className="space-y-2">
    {availableTemplates.map((template, index) => (
      <button
        key={index}
        onClick={() => {
          setGoal(template.goal);
          setLevel(template.level);
          setLocation(template.location);
          setDaysPerWeek(template.days_per_week);
        }}
        className="w-full rounded-xl bg-white/[0.03] px-3 py-2 text-left text-xs text-zinc-300 hover:bg-white/[0.08]"
      >
        {template.goal} · {template.level} · {template.location} ·{" "}
        {template.days_per_week}x/semana
      </button>
    ))}
  </div>
</div>

            <form
              onSubmit={createManualPlan}
              className="rounded-3xl border border-white/10 bg-zinc-900 p-6"
            >
              <h2 className="text-2xl font-bold mb-5">Plano manual</h2>

              <label className="block mb-4">
                <span className="text-sm text-zinc-300">Nome do treino</span>
                <input
                  className="input mt-2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Meu treino"
                  required
                />
              </label>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 px-5 py-3 font-bold flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Criar manual
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
              <h2 className="text-2xl font-bold mb-5">Meus planos</h2>

              {plans.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center">
                  <Dumbbell className="mx-auto text-violet-300 mb-4" size={44} />
                  <h3 className="text-xl font-bold">Nenhum treino criado</h3>
                  <p className="text-zinc-400 mt-2">
                    Gere seu primeiro treino inteligente.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="rounded-2xl border border-white/10 bg-zinc-950 p-5 hover:border-violet-400/50 transition"
                    >
                      <button
                        onClick={() => loadPlanDetails(plan)}
                        className="w-full text-left"
                      >
                        <h3 className="text-xl font-bold">{plan.title}</h3>

                        <p className="text-sm text-zinc-400 mt-1">
                          {plan.goal}
                        </p>

                        <p className="text-xs text-violet-300 mt-3">
                          {plan.ai_generated ? "Gerado inteligente" : "Manual"}
                        </p>
                      </button>

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="flex-1 rounded-xl bg-white text-zinc-950 px-4 py-2 text-sm font-bold hover:bg-zinc-200 transition"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 px-4 py-2 text-sm font-bold hover:bg-red-500/20 transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedPlan && (
              <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <h2 className="text-2xl font-bold">{selectedPlan.title}</h2>

                <div className="mt-5 space-y-4">
                  {workoutDays.map((day) => (
                    <div
                      key={day.id}
                      className="rounded-2xl border border-white/10 bg-zinc-950 p-5"
                    >
                      <h3 className="text-xl font-bold capitalize">
                        {day.title}
                      </h3>

                      <div className="mt-4 space-y-3">
                        {day.exercises?.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="rounded-xl bg-white/[0.03] p-4"
                          >
                            <p className="font-bold">{exercise.name}</p>
                            <p className="text-sm text-zinc-400">
                              {exercise.sets} séries · {exercise.reps} reps
                              {exercise.rest_seconds
                                ? ` · ${exercise.rest_seconds}s descanso`
                                : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <form
              onSubmit={saveEditedPlan}
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-5">Editar treino</h2>

              <label className="block mb-4">
                <span className="text-sm text-zinc-300">Nome do treino</span>
                <input
                  className="input mt-2"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="block mb-4">
                <span className="text-sm text-zinc-300">Objetivo</span>
                <select
                  className="input mt-2"
                  value={editForm.goal}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      goal: e.target.value,
                    }))
                  }
                >
                  <option>Hipertrofia</option>
  <option>Emagrecimento</option>
  <option>Definição</option>
  <option>Força</option>
  <option>Condicionamento</option>
  <option>Funcional</option>
  <option>Calistenia</option>
</select>
              </label>

              <label className="block mb-6">
                <span className="text-sm text-zinc-300">Dias por semana</span>
                <input
                  className="input mt-2"
                  type="number"
                  min="1"
                  max="7"
                  value={editForm.days_per_week}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      days_per_week: e.target.value,
                    }))
                  }
                />
              </label>

              {editMessage && (
                <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {editMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="flex-1 rounded-xl border border-white/10 px-4 py-3 font-bold hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-violet-500 px-4 py-3 font-bold hover:bg-violet-400"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

function Select({ label, value, setValue, children }) {
  return (
    <label className="block mb-4">
      <span className="text-sm text-zinc-300">{label}</span>
      <select
        className="input mt-2"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {children}
      </select>
    </label>
  );
}