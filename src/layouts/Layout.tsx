import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { AmbientLayer } from '../components/AmbientLayer';
import type { Page } from '../App';

export function Layout({
  page,
  navigate,
  children,
}: {
  page: Page;
  navigate: (to: Page) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Global ambient atmosphere: film grain, bokeh, stars */}
      <AmbientLayer />
      <NavBar page={page} navigate={navigate} />
      {/* Only a tiny offset below the fixed NavBar; pages manage their own inner spacing. */}
      <main className="flex-1 relative z-10">
        {children}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
