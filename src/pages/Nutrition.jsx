import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { supabase } from "../lib/supabase";
import { Plus, Utensils, Flame, Beef, Wheat, Droplet } from "lucide-react";

export default function Nutrition({ session }) {
  const [profile, setProfile] = useState(null);
  const [mealFile, setMealFile] = useState(null);
const [mealPreview, setMealPreview] = useState("");
const [aiLoading, setAiLoading] = useState(false);
  const [meals, setMeals] = useState([]);
  const [form, setForm] = useState({
    meal_type: "Almoço",
    food_name: "",
    quantity: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    const { data: mealsData } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", session.user.id)
      .order("consumed_at", { ascending: false });

    setProfile(profileData);
    setMeals(mealsData || []);
  }

  const todayMeals = useMemo(() => {
    const today = new Date().toDateString();

    return meals.filter((meal) => {
      return new Date(meal.consumed_at).toDateString() === today;
    });
  }, [meals]);

  const totals = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories || 0);
        acc.protein += Number(meal.protein_g || 0);
        acc.carbs += Number(meal.carbs_g || 0);
        acc.fat += Number(meal.fat_g || 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [todayMeals]);


  function handleMealPhoto(e) {
  const selected = e.target.files?.[0];

  if (!selected) return;

  setMealFile(selected);
  setMealPreview(URL.createObjectURL(selected));
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function estimateMealByPhoto() {
  if (!mealFile) {
    alert("Tire ou selecione uma foto da comida primeiro.");
    return;
  }

  setAiLoading(true);

  try {
    const imageBase64 = await fileToBase64(mealFile);

    const response = await fetch("/api/analyze-meal-photo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao analisar prato.");
    }

    setForm((prev) => ({
      ...prev,
      food_name: data.food_name || "Refeição analisada por IA",
      quantity: data.quantity || "1 porção",
      calories: data.calories || 0,
      protein_g: data.protein_g || 0,
      carbs_g: data.carbs_g || 0,
      fat_g: data.fat_g || 0,
    }));
  } catch (error) {
    alert(error.message);
  } finally {
    setAiLoading(false);
  }
}



  async function createMeal(e) {
    e.preventDefault();

    const { error } = await supabase.from("meals").insert({
      user_id: session.user.id,
      meal_type: form.meal_type,
      food_name: form.food_name,
      quantity: form.quantity,
      calories: Number(form.calories || 0),
      protein_g: Number(form.protein_g || 0),
      carbs_g: Number(form.carbs_g || 0),
      fat_g: Number(form.fat_g || 0),
      ai_detected: false,
    });

    if (!error) {
      setForm({
        meal_type: "Almoço",
        food_name: "",
        quantity: "",
        calories: "",
        protein_g: "",
        carbs_g: "",
        fat_g: "",
      });

      loadData();
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <AppLayout profile={profile}>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-violet-300 font-medium">Nutrição</p>
        <h1 className="text-4xl font-black mt-2">Nutrição personalizada</h1>
        <p className="text-zinc-400 mt-2">
          Registre refeições, acompanhe calorias e veja seus macros do dia.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <Metric icon={<Flame />} label="Calorias hoje" value={`${totals.calories} kcal`} />
          <Metric icon={<Beef />} label="Proteínas" value={`${totals.protein}g`} />
          <Metric icon={<Wheat />} label="Carboidratos" value={`${totals.carbs}g`} />
          <Metric icon={<Droplet />} label="Gorduras" value={`${totals.fat}g`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <form
            onSubmit={createMeal}
            className="rounded-3xl border border-white/10 bg-zinc-900 p-6"
          >
            <h2 className="text-2xl font-bold mb-5">Nova refeição</h2>

            <div className="mb-5">
  <span className="text-sm text-zinc-300">Scanner de prato</span>

  <div className="mt-3 rounded-3xl border-2 border-dashed border-white/10 bg-zinc-950 min-h-[220px] flex items-center justify-center overflow-hidden">
    {mealPreview ? (
      <img
        src={mealPreview}
        alt="Preview da refeição"
        className="w-full h-full object-cover max-h-[280px]"
      />
    ) : (
      <div className="text-center p-6">
        <Utensils className="mx-auto text-violet-300 mb-3" size={42} />
        <p className="font-bold">Tire uma foto do prato</p>
        <p className="text-sm text-zinc-500 mt-1">
          A IA vai estimar calorias e macros.
        </p>
      </div>
    )}
  </div>

  <div className="mt-3 grid sm:grid-cols-2 gap-3">
    <label
      htmlFor="meal-gallery"
      className="cursor-pointer rounded-xl bg-white text-zinc-950 px-4 py-3 text-center text-sm font-bold hover:bg-zinc-200 transition"
    >
      Escolher foto
    </label>

    <input
      id="meal-gallery"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      onChange={handleMealPhoto}
      className="hidden"
    />

    <label
      htmlFor="meal-camera"
      className="cursor-pointer rounded-xl bg-violet-500 text-white px-4 py-3 text-center text-sm font-bold hover:bg-violet-400 transition"
    >
      Tirar foto agora
    </label>

    <input
      id="meal-camera"
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleMealPhoto}
      className="hidden"
    />
  </div>

  <button
    type="button"
    onClick={estimateMealByPhoto}
    disabled={aiLoading}
    className="mt-3 w-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200 hover:bg-violet-500/20 transition disabled:opacity-60"
  >
    {aiLoading ? "Analisando prato..." : "Estimar macros pela foto"}
  </button>
</div>


            <label className="block mb-4">
              <span className="text-sm text-zinc-300">Tipo</span>
              <select
                className="input mt-2"
                value={form.meal_type}
                onChange={(e) => updateField("meal_type", e.target.value)}
              >
                <option>Café da manhã</option>
                <option>Almoço</option>
                <option>Jantar</option>
                <option>Lanche</option>
                <option>Pré-treino</option>
                <option>Pós-treino</option>
              </select>
            </label>

            <label className="block mb-4">
              <span className="text-sm text-zinc-300">Alimento</span>
              <input
                className="input mt-2"
                value={form.food_name}
                onChange={(e) => updateField("food_name", e.target.value)}
                placeholder="Ex: Arroz, frango e salada"
                required
              />
            </label>

            <label className="block mb-4">
              <span className="text-sm text-zinc-300">Quantidade</span>
              <input
                className="input mt-2"
                value={form.quantity}
                onChange={(e) => updateField("quantity", e.target.value)}
                placeholder="Ex: 250g"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Calorias" field="calories" form={form} updateField={updateField} />
              <Input label="Proteína" field="protein_g" form={form} updateField={updateField} />
              <Input label="Carbo" field="carbs_g" form={form} updateField={updateField} />
              <Input label="Gordura" field="fat_g" form={form} updateField={updateField} />
            </div>

            <button className="mt-6 w-full rounded-xl bg-violet-500 hover:bg-violet-400 transition px-5 py-3 font-bold flex items-center justify-center gap-2">
              <Plus size={18} />
              Adicionar refeição
            </button>
          </form>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="text-2xl font-bold mb-5">Refeições de hoje</h2>

            {todayMeals.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-8 text-center">
                <Utensils className="mx-auto text-violet-300 mb-4" size={44} />
                <h3 className="text-xl font-bold">Nenhuma refeição registrada</h3>
                <p className="text-zinc-400 mt-2">
                  Adicione sua primeira refeição do dia.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className="rounded-2xl border border-white/10 bg-zinc-950 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm text-violet-300">{meal.meal_type}</p>
                      <h3 className="text-xl font-bold">{meal.food_name}</h3>
                      <p className="text-sm text-zinc-500">{meal.quantity}</p>
                    </div>

                    <div className="grid grid-cols-4 gap-3 text-center">
                      <Small label="kcal" value={meal.calories} />
                      <Small label="prot" value={`${meal.protein_g}g`} />
                      <Small label="carb" value={`${meal.carbs_g}g`} />
                      <Small label="gord" value={`${meal.fat_g}g`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="h-10 w-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Input({ label, field, form, updateField }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-300">{label}</span>
      <input
        className="input mt-2"
        type="number"
        value={form[field]}
        onChange={(e) => updateField(field, e.target.value)}
        placeholder="0"
      />
    </label>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

async function estimateMealByPhoto() {
  if (!mealFile) {
    alert("Tire ou selecione uma foto da comida primeiro.");
    return;
  }

  setAiLoading(true);

  try {
    const imageBase64 = await fileToBase64(mealFile);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error("Faça login novamente.");
    }

    const response = await fetch("/api/analyze-meal-photo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ imageBase64 }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Erro ao analisar prato.");
    }

    setForm((prev) => ({
      ...prev,
      food_name: data.food_name || "Refeição analisada por IA",
      quantity: data.quantity || "1 porção",
      calories: data.calories || 0,
      protein_g: data.protein_g || 0,
      carbs_g: data.carbs_g || 0,
      fat_g: data.fat_g || 0,
    }));
  } catch (error) {
    alert(error.message);
  } finally {
    setAiLoading(false);
  }
}

function Small({ label, value }) {
  return (
    <div className="rounded-xl bg-white/[0.03] p-3 min-w-16">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-bold">{value || 0}</p>
    </div>
  );
}