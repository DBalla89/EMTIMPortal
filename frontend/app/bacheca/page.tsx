// app/bacheca/page.tsx
import type { Metadata } from 'next';
import BachecaClient from './BachecaClient';

export const metadata: Metadata = {
  title: 'Bacheca Proposte | PW EMTIM XVIII',
  description:
    'Sfoglia tutte le proposte pubblicate dai partecipanti al Project Work EMTIM XVIII. Filtra per categoria e candidati.',
};

export default function BachecaPage() {
  return <BachecaClient />;
}
