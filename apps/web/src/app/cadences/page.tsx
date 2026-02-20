'use client';
import CadenceList from '../../components/CadenceList';

export default function CadencesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Cadences</h1>
        <p className="text-gray-500 mt-1">Create and manage your email cadences</p>
      </div>

      {/* Cadences List */}
      <div className="animate-fade-in">
        <CadenceList />
      </div>
    </div>
  );
}

