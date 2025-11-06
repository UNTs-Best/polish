"use client";
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded px-8 py-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to your Dashboard</h1>
        <p className="mb-4">This is a placeholder dashboard page. In the future it will show your recent activity and stats.</p>
        <nav className="flex flex-col space-y-2">
          <Link href="/" className="text-blue-500 hover:underline">Home</Link>
          <Link href="/signin" className="text-blue-500 hover:underline">Sign In</Link>
          <Link href="/signup" className="text-blue-500 hover:underline">Sign Up</Link>
        </nav>
      </div>
    </div>
  );
}
