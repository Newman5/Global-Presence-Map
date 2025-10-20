
// page with a form to add a new member
'use client';

import { useState } from "react";

export default function AddMemberPage() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [message, setMessage] = useState("");

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
    }

    return (
        <div className="max-w-md mx-auto p-8">
            <h1 className="text-2xl font-semibold mb-4">Add Member</h1>
            <form onSubmit={handleSubmit} className="space-y-3">
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
            {message && <p className="mt-3 text-green-600">{message}</p>}
        </div>
    );
}
