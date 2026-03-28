import ParticleBackground from "@/components/ParticleBackground";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="w-full h-screen overflow-hidden relative bg-[#050510]">
      <ParticleBackground />
      <Dashboard />
    </main>
  );
}
