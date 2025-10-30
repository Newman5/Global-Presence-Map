
// page with a form to add a new member
'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

type Member = { name: string; city: string };

export default function AddMemberPage() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [message, setMessage] = useState("");
    const [members, setMembers] = useState<Member[]>([]);

    // Fetch existing members when the page loads
    useEffect(() => {
        async function fetchMembers() {
            const res = await fetch("/api/add-member");
            const data = await res.json();
            setMembers(data.members || []);
        }
        fetchMembers();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/add-member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, city }),
        });

        const data = await res.json();
        setMessage(data.message);
        setName("");
        setCity("");

        // Refresh the member list
        const updated = await fetch("/api/add-member");
        const updatedData = await updated.json();
        setMembers(updatedData.members || []);
    }

    return (
        <div className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Add Member</h1>
            <form onSubmit={handleSubmit} className="space-y-3 mb-6">
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border p-2 w-full rounded"
                />
                <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="border p-2 w-full rounded"
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Member
                </button>
            </form>

            {message && <p className="mb-4 text-green-600">{message}</p>}

            <h2 className="text-xl font-semibold mb-2">Current Members</h2>
            {members.length === 0 && <p>No members yet.</p>}
            <ul className="space-y-1">
                {members.map((m, i) => (
                    <li key={i} className="border-b pb-1">
                        <span className="font-medium">{m.name}</span> – {m.city}
                    </li>
                ))}
            </ul>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8 mt-8">
                <Link
                    className="flex max-w-xs flex-col gap-4 rounded-xl bg-gray-500 p-4 hover:bg-white/20"
                    href="/globe"
                >
                    <h3 className="text-2xl font-bold">View Globe →</h3>

                </Link>
                <Link
                    className="flex max-w-xs flex-col gap-4 rounded-xl bg-gray-500 p-4 hover:bg-white/20"
                    href="/add-member"
                >
                    <h3 className="text-2xl font-bold">Add Members →</h3>

                </Link>
            </div>
        </div>
        
    );
}
