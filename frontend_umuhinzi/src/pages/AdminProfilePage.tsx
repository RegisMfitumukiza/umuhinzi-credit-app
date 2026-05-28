import { useEffect, useState } from "react";

export const AdminProfilePage = () => {
  const [profile, setProfile] = useState<any>({ fullName: "Platform Admin", email: "admin@umuhinzi.test", avatar: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("umuhinzi_user");
      if (raw) {
        const u = JSON.parse(raw);
        setProfile((p: any) => ({ ...p, fullName: u.fullName || p.fullName, email: u.email || p.email, avatar: u.avatar || "" }));
      }
    } catch (e) {}
  }, []);

  const handleSave = () => {
    const updated = { ...profile };
    localStorage.setItem("umuhinzi_user", JSON.stringify(updated));
    alert("Profile saved");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p: any) => ({ ...p, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-8">
      <div className="mx-auto max-w-[800px]">
        <h1 className="text-2xl font-semibold text-stone-900">Profile</h1>
        <p className="mt-1 text-sm text-stone-500">Edit your admin profile.</p>

        <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="h-28 w-28 overflow-hidden rounded-full bg-stone-100">
                {profile.avatar ? <img src={profile.avatar} alt="avatar" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl text-stone-500">A</div>}
              </div>
              <input type="file" accept="image/*" onChange={handleFile} className="mt-3 text-sm" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-stone-600">Full name</label>
              <input value={profile.fullName} onChange={(e) => setProfile((p: any) => ({ ...p, fullName: e.target.value }))} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" />

              <label className="mt-4 block text-sm text-stone-600">Email</label>
              <input value={profile.email} onChange={(e) => setProfile((p: any) => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" />

              <div className="mt-6 flex gap-3">
                <button onClick={handleSave} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">Save Profile</button>
                <button onClick={() => { setProfile({ fullName: "Platform Admin", email: "admin@umuhinzi.test", avatar: profile.avatar }); }} className="rounded-full border border-stone-200 px-4 py-2 text-sm">Reset</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
