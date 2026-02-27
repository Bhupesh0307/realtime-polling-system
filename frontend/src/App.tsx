import { Routes, Route } from "react-router-dom";
//import StudentPage from "./pages/StudentWaitingPage";  
import TeacherPage from "./pages/TeacherPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
//import StudentWaitingPage from "./pages/StudentPage";
import StudentPage from "./pages/StudentPage";
function App() {
  return (
    
    <Routes>
      <Route path="/" element={<RoleSelectionPage />} />
      <Route path="/teacher" element={<TeacherPage />} />
      <Route path="/student" element={<StudentPage  />} />
    </Routes>
  );
}

export default App;