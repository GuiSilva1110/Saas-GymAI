import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import BodyAnalysis from "./pages/BodyAnalysis";
import Workouts from "./pages/Workouts";
import Nutrition from "./pages/Nutrition";
import Challenge from "./pages/Challenge";
import Coach from "./pages/Coach";
import Progress from "./pages/Progress";
import Auth from "./pages/Auth";
import Upgrade from "./pages/Upgrade";
import Dashboard from "./pages/Dashboard";

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Carregando ShapeForge AI...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
        }
      />

      <Route
  path="/upgrade"
  element={
    <ProtectedRoute session={session}>
      <Upgrade session={session} />
    </ProtectedRoute>
  }
/>

      <Route
  path="/body-analysis"
  element={
    <ProtectedRoute session={session}>
      <BodyAnalysis session={session} />
    </ProtectedRoute>
  }
/>

<Route
  path="/progress"
  element={
    <ProtectedRoute session={session}>
      <Progress session={session} />
    </ProtectedRoute>
  }
/>

<Route
  path="/workouts"
  element={
    <ProtectedRoute session={session}>
      <Workouts session={session} />
    </ProtectedRoute>
  }
/>

<Route
  path="/nutrition"
  element={
    <ProtectedRoute session={session}>
      <Nutrition session={session} />
    </ProtectedRoute>
  }
/>

<Route
  path="/challenge"
  element={
    <ProtectedRoute session={session}>
      <Challenge session={session} />
    </ProtectedRoute>
  }
/>

<Route
  path="/coach"
  element={
    <ProtectedRoute session={session}>
      <Coach session={session} />
    </ProtectedRoute>
  }
/>

      <Route path="/auth" element={<Auth />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute session={session}>
            <Dashboard session={session} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}