import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Download, Upload, Globe, Lock, Play } from 'lucide-react';
import { AuthService } from '../../services/authService';

export default function ScenarioRepository({ onSelectScenario }) {
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingScenario, setEditingScenario] = useState(null);
    const [showSeedButton, setShowSeedButton] = useState(false);

    useEffect(() => {
        loadScenarios();
        // Check if admin to show seed button
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setShowSeedButton(user.role === 'admin');
    }, []);

    const loadScenarios = async () => {
        try {
            const token = AuthService.getToken();
            const res = await fetch('http://localhost:3000/api/scenarios', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setScenarios(data.scenarios || []);
        } catch (error) {
            console.error('Failed to load scenarios:', error);
        } finally {
            setLoading(false);
        }
    };

    const seedScenarios = async () => {
        if (!confirm('Seed default scenarios? This will add 6 pre-built scenarios to the repository.')) return;
        
        try {
            const token = AuthService.getToken();
            const res = await fetch('http://localhost:3000/api/scenarios/seed', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            alert(data.message);
            loadScenarios();
        } catch (error) {
            console.error('Failed to seed scenarios:', error);
            alert('Failed to seed scenarios');
        }
    };

    const deleteScenario = async (id) => {
        if (!confirm('Delete this scenario?')) return;
        
        try {
            const token = AuthService.getToken();
            await fetch(`http://localhost:3000/api/scenarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadScenarios();
        } catch (error) {
            console.error('Failed to delete scenario:', error);
            alert('Failed to delete scenario');
        }
    };

    const formatDuration = (minutes) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    if (loading) {
        return <div className="text-center py-8 text-neutral-500">Loading scenarios...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Scenario Repository</h3>
                    <p className="text-xs text-neutral-500 mt-1">
                        Reusable scenario templates for case creation
                    </p>
                </div>
                <div className="flex gap-2">
                    {showSeedButton && scenarios.length === 0 && (
                        <button
                            onClick={seedScenarios}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-bold"
                        >
                            <Download className="w-4 h-4 inline mr-2" />
                            Seed Defaults
                        </button>
                    )}
                    <button
                        onClick={() => setEditingScenario({ 
                            name: '', 
                            description: '', 
                            duration_minutes: 30, 
                            category: 'General',
                            timeline: [],
                            is_public: true 
                        })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold"
                    >
                        <Plus className="w-4 h-4 inline mr-2" />
                        New Scenario
                    </button>
                </div>
            </div>

            {scenarios.length === 0 ? (
                <div className="text-center py-12 bg-neutral-800/50 rounded-lg border border-dashed border-neutral-700">
                    <p className="text-neutral-500">No scenarios yet</p>
                    {showSeedButton && (
                        <button
                            onClick={seedScenarios}
                            className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-500 rounded font-bold"
                        >
                            Seed Default Scenarios
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {scenarios.map(scenario => (
                        <div key={scenario.id} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 hover:border-neutral-600 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-white font-bold">{scenario.name}</h4>
                                        {scenario.is_public ? (
                                            <Globe className="w-4 h-4 text-green-400" title="Public" />
                                        ) : (
                                            <Lock className="w-4 h-4 text-yellow-400" title="Private" />
                                        )}
                                        {scenario.category && (
                                            <span className="px-2 py-0.5 bg-blue-900 text-blue-200 text-xs rounded">
                                                {scenario.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-400 mb-2">{scenario.description}</p>
                                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                                        <span>⏱️ {formatDuration(scenario.duration_minutes)}</span>
                                        <span>📋 {scenario.timeline?.length || 0} steps</span>
                                        {scenario.created_by_username && (
                                            <span>👤 {scenario.created_by_username}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {onSelectScenario && (
                                        <button
                                            onClick={() => onSelectScenario(scenario)}
                                            className="p-2 bg-green-700 hover:bg-green-600 rounded text-xs"
                                            title="Use in case"
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingScenario(scenario)}
                                        className="p-2 bg-blue-700 hover:bg-blue-600 rounded text-xs"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteScenario(scenario.id)}
                                        className="p-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded text-xs"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TODO: Add editing modal for creating/editing scenarios */}
            {editingScenario && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {editingScenario.id ? 'Edit Scenario' : 'New Scenario'}
                        </h3>
                        <p className="text-neutral-400 text-sm mb-4">
                            Note: For now, scenarios must be created via JSON. Visual editor coming soon!
                        </p>
                        <button
                            onClick={() => setEditingScenario(null)}
                            className="w-full py-2 bg-neutral-700 hover:bg-neutral-600 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
