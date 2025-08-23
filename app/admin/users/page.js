// app/admin/users/page.js
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dirtyMap, setDirtyMap] = useState({}); // { [userId]: { full_name, role } }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // fetch session user’s metadata
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionUser(user);
    });
  }, []);

  // fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .order("full_name", { ascending: true });
    if (error) {
      setError(error.message);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // mark a field dirty
  const handleFieldChange = (id, field, value) => {
    setDirtyMap((m) => ({
      ...m,
      [id]: {
        ...(m[id] || {}),
        [field]: value,
      },
    }));
  };

  // commit all dirty rows via UPDATE
  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);

    try {
      for (const [id, changes] of Object.entries(dirtyMap)) {
        // normalize and optionally validate
        const payload = {};
        if (changes.full_name !== undefined) {
          payload.full_name = changes.full_name.trim();
        }
        if (changes.role !== undefined) {
          payload.role = changes.role.trim();
        }

        const { error: updateErr } = await supabase
          .from("users")
          .update(payload)
          .eq("id", id);

        if (updateErr) throw updateErr;
      }

      // reload users
      await fetchUsers();
      setDirtyMap({});
      alert("Changes saved!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-8">Loading users…</p>;
  if (error) return <p className="p-8 text-red-400">Error: {error}</p>;

  return (
    <div className="p-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-yellow-300 text-black rounded hover:bg-yellow-400"
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold text-yellow-300">
        User & Role Management
      </h1>
      {sessionUser && (
        <p>
          Logged in as:&nbsp;
          <strong>
            {users.find((u) => u.id === sessionUser.id)?.full_name ||
              sessionUser.user_metadata?.full_name ||
              sessionUser.email}
          </strong>
        </p>
      )}

      <table className="min-w-full bg-white/10 rounded-lg overflow-hidden">
        <thead className="bg-gray-800 text-left">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isMe = sessionUser?.id === u.id;
            const displayName =
              u.full_name || (isMe ? sessionUser.user_metadata?.full_name : "");
            const dirty = dirtyMap[u.id] || {};

            return (
              <tr key={u.id} className="border-b border-gray-700">
                {/* Name */}
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={dirty.full_name ?? displayName}
                    onChange={(e) =>
                      handleFieldChange(u.id, "full_name", e.target.value)
                    }
                    placeholder="(no name)"
                    className="w-full bg-gray-700 text-white placeholder-gray-400 px-2 py-1 rounded"
                  />
                </td>

                {/* Email (never editable) */}
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={u.email}
                    readOnly
                    className="w-full bg-gray-800 text-gray-400 px-2 py-1 rounded cursor-not-allowed"
                  />
                </td>

                {/* Role */}
                <td className="px-4 py-2">
                  <select
                    value={dirty.role ?? u.role}
                    onChange={(e) =>
                      handleFieldChange(u.id, "role", e.target.value)
                    }
                    disabled={isMe}
                    className={`px-2 py-1 rounded ${
                      isMe
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gray-700 text-white"
                    }`}
                  >
                    <option value="">user</option>
                    <option value="admin">admin</option>
                    {/* add more roles here if needed */}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pt-4 border-t border-white/20">
        <button
          onClick={handleSaveAll}
          disabled={saving || Object.keys(dirtyMap).length === 0}
          className={`px-6 py-2 rounded-lg font-semibold transition ${
            saving || !Object.keys(dirtyMap).length
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-300 hover:bg-yellow-400 text-black"
          }`}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
