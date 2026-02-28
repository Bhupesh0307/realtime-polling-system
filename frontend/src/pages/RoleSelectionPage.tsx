import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoleCard } from "../components/RoleCard";

type Role = "student" | "teacher";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("student");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selectedRole) return;
    navigate(selectedRole === "student" ? "/student" : "/teacher");
  };

  return (
    
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex w-full max-w-3xl flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          
          {/* Updated Badge to match original image */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-[#5c35d5] px-4 py-1.5 text-sm font-medium text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="white"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
            </svg>
            Intervue Poll
          </div>
          
          {/* Updated Heading with bold text */}
          <h1 className="mb-3 text-center text-3xl text-slate-900 md:text-4xl">
            Welcome to the <strong className="font-bold">Live Polling System</strong>
          </h1>
          
          {/* Updated Subtitle with exact break */}
          <p className="max-w-xl text-center text-base leading-relaxed text-slate-500">
            Please select the role that best describes you to begin using the live polling
            <br className="hidden md:block" /> system
          </p>
        </div>

        <div className="mb-10 flex w-full flex-col items-center justify-center gap-5 md:flex-row">
          <RoleCard
            title="I’m a Student"
            description="submit your answers, participate in live polls, and see how your responses compare with your classmates"
            selected={selectedRole === "student"}
            onClick={() => setSelectedRole("student")}
          />
          <RoleCard
            title="I’m a Teacher"
            description="Submit answers and view live poll results in real-time."
            selected={selectedRole === "teacher"}
            onClick={() => setSelectedRole("teacher")}
          />
        </div>

        {/* Updated Button styling */}
        <button
          type="button"
          onClick={handleContinue}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#745ae3] to-[#5a6ee6] px-12 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}