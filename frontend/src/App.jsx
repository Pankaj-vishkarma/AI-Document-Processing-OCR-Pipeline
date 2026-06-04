import AppRoutes from "./routes/AppRoutes";
import AppErrorBoundary from "./components/common/ErrorBoundary";
import { UploadQueueProvider } from "./context/UploadQueueContext";

function App() {
  return (
    <AppErrorBoundary>
      <UploadQueueProvider>
        <AppRoutes />
      </UploadQueueProvider>
    </AppErrorBoundary>
  );
}

export default App;