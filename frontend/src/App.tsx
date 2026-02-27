import { Routes, Route, Navigate } from "react-router-dom";
import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/teacher" />} />
      <Route path="/teacher" element={<TeacherPage />} />
      <Route path="/student" element={<StudentPage />} />
    </Routes>
  );
}

export default App;