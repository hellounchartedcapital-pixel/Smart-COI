import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';

export function Settings({ onClose }) {
  const [settings, setSettings] = useState({
    generalLiability: 1000000,
    autoLiability: 1000000,
    workersComp: 'Statutory',
    employersLiability: 500000,
    additionalRequirements: [
      'Property physical address must be on COI',
      '30 days notice for policy cancellation',
      'Certificate holder must be listed'
    ]
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newRequirement, setNewRequirement] = useState('');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (data) {
        setSettings({
          generalLiability: data.general_liability || 1000000,
          autoLiability: data.auto_liability || 1000000,
          workersComp: data.workers_comp || 'Statutory',
          employersLiability: data.employers_liability || 500000,
          additionalRequirements: data.additional_requirements || []
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settingsData = {
        user_id: user.id,
        general_liability: settings.generalLiability,
        auto_liability: settings.autoLiability,
        workers_comp: settings.workersComp,
        employers_liability: settings.employersLiability,
        additional_requirements: settings.additionalRequirements
      };

      // Upsert (update or insert)
      const { error } = await supabase
        .from('settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setSettings({
        ...settings,
        additionalRequirements: [...settings.additionalRequirements, newRequirement.trim()]
      });
      setNewRequirement('');
    }
  };

  const removeRequirement = (index) => {
    setSettings({
      ...settings,
      additionalRequirements: settings.additionalRequirements.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Vendor Requirements Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Success Message */}
          {saveSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
              <CheckCircle className="text-green-500" size={20} />
              <p className="text-green-800 font-medium">Settings saved successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Coverage Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Minimum Coverage Requirements</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Liability
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={settings.generalLiability}
                    onChange={(e) => setSettings({...settings, generalLiability: parseInt(e.target.value) || 0})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    step="100000"
                  />
                  <span className="text-gray-600 font-medium min-w-[120px]">
                    {formatCurrency(settings.generalLiability)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Liability
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={settings.autoLiability}
                    onChange={(e) => setSettings({...settings, autoLiability: parseInt(e.target.value) || 0})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    step="100000"
                  />
                  <span className="text-gray-600 font-medium min-w-[120px]">
                    {formatCurrency(settings.autoLiability)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workers Compensation
                </label>
                <input
                  type="text"
                  value={settings.workersComp}
                  onChange={(e) => setSettings({...settings, workersComp: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Statutory"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employers Liability
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={settings.employersLiability}
                    onChange={(e) => setSettings({...settings, employersLiability: parseInt(e.target.value) || 0})}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    step="100000"
                  />
                  <span className="text-gray-600 font-medium min-w-[120px]">
                    {formatCurrency(settings.employersLiability)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Requirements</h3>
            
            {/* Existing Requirements */}
            <div className="space-y-2 mb-4">
              {settings.additionalRequirements.map((req, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-1 text-gray-900">{req}</span>
                  <button
                    onClick={() => removeRequirement(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Requirement */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                placeholder="Add a new requirement..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button
                onClick={addRequirement}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These requirements will be used to automatically check compliance when new COIs are uploaded.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium flex items-center space-x-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
