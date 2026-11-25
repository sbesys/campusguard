import { Layout } from './components/Layout';
import { CampusProvider, useCampus } from './context/CampusContext';
import { AlertsPage } from './pages/AlertsPage';
import { DashboardPage } from './pages/DashboardPage';
import { MapPage } from './pages/MapPage';
import { NetworkPage } from './pages/NetworkPage';
import { RecoveryPage } from './pages/RecoveryPage';
import { SimulationPage } from './pages/SimulationPage';

function CampusRouter() {
  const { activePage } = useCampus();

  switch (activePage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'network':
      return <NetworkPage />;
    case 'simulation':
      return <SimulationPage />;
    case 'recovery':
      return <RecoveryPage />;
    case 'map':
      return <MapPage />;
    case 'alerts':
      return <AlertsPage />;
  }
}

export function App() {
  return (
    <CampusProvider>
      <Layout>
        <CampusRouter />
      </Layout>
    </CampusProvider>
  );
}

export default App;
