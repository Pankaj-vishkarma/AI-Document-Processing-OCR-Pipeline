import AppRoutes from "./routes/AppRoutes";
import AppErrorBoundary from "./components/common/ErrorBoundary";

function App() {

  return (
    <AppErrorBoundary>
      <AppRoutes />
    </AppErrorBoundary>
  );
}

export default App;