import { Outlet } from "react-router-dom";
import { Toast } from "../components/Toast";
import { CooperativeSidebar } from "../components/CooperativeSidebar";
import { CooperativeHeader } from "../components/CooperativeHeader";

export const CooperativeLayout = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#eef5ef_100%)] text-stone-900">
      <Toast />
      <div className="flex min-h-screen">
        <CooperativeSidebar />
        <div className="flex flex-1 flex-col">
          <CooperativeHeader />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
