import { Navigate, Route, Routes } from "react-router-dom";
import PropertyFormPage from "./pages/PropertyFormPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<PropertyFormPage />} />
      <Route path="/properties/:id/edit" element={<PropertyFormPage />} />
      <Route path="/properties/:id" element={<PropertyDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
