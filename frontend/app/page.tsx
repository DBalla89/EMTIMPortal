// frontend/app/page.tsx
// Homepage — hero section con CTA alla bacheca
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Home | Project Work EMTIM XVIII Portal',
  description:
    'Benvenuto nel portale del Project Work EMTIM XVIII. Pubblica proposte, candidati e collabora con i tuoi colleghi.',
};

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-white via-surface-muted to-brand-50 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-100
                        text-brand-700 text-sm font-medium mb-6 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          Edizione XVIII — ora attiva
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink mb-6 animate-fade-in
                       leading-tight max-w-3xl">
          Project Work{' '}
          <span className="text-brand-500">EMTIM XVIII</span>
          <br />
          Portal
        </h1>

        <p className="text-lg sm:text-xl text-ink-muted max-w-2xl mb-10 animate-fade-in leading-relaxed">
          Proponi le tue idee, candidati ai progetti dei tuoi colleghi e costruisci
          il tuo Project Work in modo strutturato e professionale.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
          <Link
            href="/bacheca"
            className="btn-primary px-8 py-3.5 text-base shadow-md hover:shadow-lg"
          >
            Esplora la bacheca
          </Link>
          <Link
            href="/auth/registrati"
            className="btn-secondary px-8 py-3.5 text-base"
          >
            Crea il tuo account
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20">
        <div className="grid sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-6 flex flex-col gap-3 hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-2xl">
                {f.icon}
              </div>
              <h2 className="font-semibold text-ink">{f.title}</h2>
              <p className="text-sm text-ink-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border bg-surface py-6 px-4 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Project Work EMTIM XVIII Portal. Tutti i diritti riservati.
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: '💡',
    title: 'Pubblica la tua proposta',
    desc: 'Presenta la tua idea con un titolo, una descrizione dettagliata e un documento PDF di presentazione.',
  },
  {
    icon: '🙋',
    title: 'Candidati ai progetti',
    desc: 'Sfoglia la bacheca, trova i progetti che ti interessano e invia la tua candidatura con un messaggio personale.',
  },
  {
    icon: '✅',
    title: 'Gestisci il tuo team',
    desc: 'Accetta i candidati migliori per il tuo progetto. Il sistema gestisce automaticamente le candidature multiple.',
  },
];
