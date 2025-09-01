"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";

type Merchant = {
  id: number;
  name: string;
  email: string;
  password?: string;
  logo?: string | null;
  logo_path?: string | null;
  created_at: string;
};

export default function ProfilePage() {
  const { user, setUser } = useUser(); // ✅ context dipakai untuk sync header/sidebar
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 🔑 state untuk cek perubahan
  const [isDirty, setIsDirty] = useState(false);

  // ambil data merchant
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data, error } = await supabase
        .from("merchants")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error(error);
        setErr(error.message);
        return;
      }
      setMerchant(data);
      setName(data.name || "");
      setEmail(data.email || "");
    })();
  }, [user?.id]);

  // preview gambar
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // cek perubahan form
  useEffect(() => {
    if (!merchant) return;
    const changed =
      name !== merchant.name ||
      email !== merchant.email ||
      file !== null;
    setIsDirty(changed);
  }, [name, email, file, merchant]);

  const handleSave = async () => {
    if (!merchant || !isDirty) return;
    setLoading(true);
    setErr(null);

    let logoUrl = merchant.logo;
    let newPath = merchant.logo_path;

    // upload file baru
    if (file) {
      if (merchant.logo_path) {
          await supabase.storage
            .from("merchant-logos")
            .remove([merchant.logo_path]);
        }

        // 2. Generate nama file baru
        const fileExt = file.name.split(".").pop();
        const fileName = `${merchant.id}-${Date.now()}.${fileExt}`;
        newPath = `logos/${fileName}`;

        // 3. Upload file baru
        const { error: uploadError } = await supabase.storage
          .from("merchant-logos")
          .upload(newPath, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

      logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/merchant-logos/${newPath}`;
    }

    const updates: any = {
      name,
      email,
      logo: logoUrl ?? null,
      logo_path: newPath ?? merchant.logo_path ?? null,
    };

    const { data, error: updError } = await supabase
      .from("merchants")
      .update(updates)
      .eq("id", merchant.id)
      .select()
      .single();

    setLoading(false);

    if (updError) {
      console.error("Update failed:", updError.message);
      setErr(updError.message);
      return;
    }

    if (data) {
      // ✅ update state di halaman profile
      setMerchant(data);

      // ✅ update context & localStorage
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // reset form & tutup modal
      setIsEditing(false);
      setFile(null);
      setPreview(null);
    }
  };

  if (!merchant) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="rounded-2xl border p-6 bg-white dark:bg-gray-900 dark:border-gray-800 shadow">
        <div className="flex flex-col items-center gap-4">
          {merchant.logo ? (
            <Image
              src={merchant.logo}
              alt={merchant.name}
              width={112}
              height={112}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
              {merchant.name?.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="text-center">
            <div className="text-lg font-semibold">{merchant.name}</div>
            <div className="text-sm text-gray-500">{merchant.email}</div>
            <div className="text-xs text-gray-400">
              Joined {new Date(merchant.created_at).toLocaleDateString()}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Modal Edit */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Edit Merchant</h3>

            {err && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                {err}
              </div>
            )}

            <div className="space-y-3">
              <input
                className="w-full p-2 rounded border"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="w-full p-2 rounded border"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />

              {(preview || merchant.logo) && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-16 h-16 relative rounded-full overflow-hidden border">
                    <Image
                      src={preview ?? merchant.logo ?? "/placeholder.png"}
                      alt="preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-sm text-gray-500">Preview</div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFile(null);
                    setPreview(null);
                    setName(merchant.name);
                    setEmail(merchant.email);
                    setErr(null);
                  }}
                  className="px-4 py-2 rounded border bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !isDirty}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
