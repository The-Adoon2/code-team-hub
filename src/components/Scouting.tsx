import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScoutingData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Eye, BarChart3, Target, Zap, Shield, Trash2 } from 'lucide-react';

const Scouting: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'form' | 'data'>('form');
  const [scoutingData, setScoutingData] = useState<ScoutingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutingForm, setScoutingForm] = useState({
    teamNumber: '',
    matchNumber: '',
    auto: {
      pointsScored: 0,
      notes: ''
    },
    teleop: {
      pointsScored: 0,
      climbed: false,
      parked: false,
      notes: ''
    },
    overall: {
      defense: 3,
      driverSkill: 3,
      robotReliability: 3,
      generalNotes: ''
    }
  });

  useEffect(() => {
    if (activeTab === 'data') {
      loadScoutingData();
    }
  }, [activeTab]);

  const loadScoutingData = async () => {
    try {
      const { data, error } = await supabase
        .from('scouting_data' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScoutingData((data || []) as ScoutingData[]);
    } catch (error) {
      console.error('Error loading scouting data:', error);
      toast({
        title: "Error Loading Data",
        description: "Could not load scouting data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scoutingForm.teamNumber || !scoutingForm.matchNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in team number and match number.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scouting_data' as any)
        .insert([{
          team_number: scoutingForm.teamNumber,
          match_number: scoutingForm.matchNumber,
          scouted_by: user?.name || 'Unknown',
          auto_points_scored: scoutingForm.auto.pointsScored,
          teleop_points_scored: scoutingForm.teleop.pointsScored,
          climbed: scoutingForm.teleop.climbed,
          parked: scoutingForm.teleop.parked,
          auto_notes: scoutingForm.auto.notes,
          teleop_notes: scoutingForm.teleop.notes,
          defense_rating: scoutingForm.overall.defense,
          driver_skill_rating: scoutingForm.overall.driverSkill,
          robot_reliability_rating: scoutingForm.overall.robotReliability,
          general_notes: scoutingForm.overall.generalNotes
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Scouting Data Saved",
        description: `Data for Team ${scoutingForm.teamNumber} in Match ${scoutingForm.matchNumber} has been recorded.`,
      });

      // Reset form
      setScoutingForm({
        teamNumber: '',
        matchNumber: '',
        auto: {
          pointsScored: 0,
          notes: ''
        },
        teleop: {
          pointsScored: 0,
          climbed: false,
          parked: false,
          notes: ''
        },
        overall: {
          defense: 3,
          driverSkill: 3,
          robotReliability: 3,
          generalNotes: ''
        }
      });
    } catch (error) {
      console.error('Error saving scouting data:', error);
      toast({
        title: "Error",
        description: "Could not save scouting data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScoutingData = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scouting data?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scouting_data' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setScoutingData(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Scouting Data Deleted",
        description: "Scouting data has been removed successfully.",
      });
    } catch (error) {
      console.error('Error deleting scouting data:', error);
      toast({
        title: "Error",
        description: "Could not delete scouting data.",
        variant: "destructive",
      });
    }
  };

  const updateFormField = (section: 'auto' | 'teleop' | 'overall', field: string, value: any) => {
    setScoutingForm(prev => {
      if (section === 'auto') {
        return {
          ...prev,
          auto: {
            ...prev.auto,
            [field]: value
          }
        };
      } else if (section === 'teleop') {
        return {
          ...prev,
          teleop: {
            ...prev.teleop,
            [field]: value
          }
        };
      } else if (section === 'overall') {
        return {
          ...prev,
          overall: {
            ...prev.overall,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted/30 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('form')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'form'
              ? 'bg-frc-blue text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Scout Team
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'data'
              ? 'bg-frc-blue text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          View Data
        </button>
      </div>

      {activeTab === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Match Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="teamNumber">Team Number</Label>
                <Input
                  id="teamNumber"
                  value={scoutingForm.teamNumber}
                  onChange={(e) => setScoutingForm(prev => ({ ...prev, teamNumber: e.target.value }))}
                  placeholder="e.g. 1234"
                />
              </div>
              <div>
                <Label htmlFor="matchNumber">Match Number</Label>
                <Input
                  id="matchNumber"
                  value={scoutingForm.matchNumber}
                  onChange={(e) => setScoutingForm(prev => ({ ...prev, matchNumber: e.target.value }))}
                  placeholder="e.g. Q1, SF2, F1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Autonomous Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Autonomous Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="autoPoints">Points Scored in Autonomous</Label>
                <Input
                  id="autoPoints"
                  type="number"
                  min="0"
                  value={scoutingForm.auto.pointsScored}
                  onChange={(e) => updateFormField('auto', 'pointsScored', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="autoNotes">Autonomous Notes</Label>
                <Textarea
                  id="autoNotes"
                  value={scoutingForm.auto.notes}
                  onChange={(e) => updateFormField('auto', 'notes', e.target.value)}
                  placeholder="Additional observations during autonomous..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Teleoperated Period */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Teleoperated Period
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teleopPoints">Points Scored in Teleop</Label>
                <Input
                  id="teleopPoints"
                  type="number"
                  min="0"
                  value={scoutingForm.teleop.pointsScored}
                  onChange={(e) => updateFormField('teleop', 'pointsScored', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="flex space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="climbed"
                    checked={scoutingForm.teleop.climbed}
                    onCheckedChange={(checked) => updateFormField('teleop', 'climbed', checked)}
                  />
                  <Label htmlFor="climbed">Successfully Climbed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="parked"
                    checked={scoutingForm.teleop.parked}
                    onCheckedChange={(checked) => updateFormField('teleop', 'parked', checked)}
                  />
                  <Label htmlFor="parked">Parked in Stage</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="teleopNotes">Teleop Notes</Label>
                <Textarea
                  id="teleopNotes"
                  value={scoutingForm.teleop.notes}
                  onChange={(e) => updateFormField('teleop', 'notes', e.target.value)}
                  placeholder="Additional observations during teleop..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Overall Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defense">Defense (1-5)</Label>
                  <Input
                    id="defense"
                    type="number"
                    min="1"
                    max="5"
                    value={scoutingForm.overall.defense}
                    onChange={(e) => updateFormField('overall', 'defense', parseInt(e.target.value) || 3)}
                  />
                </div>
                <div>
                  <Label htmlFor="driverSkill">Driver Skill (1-5)</Label>
                  <Input
                    id="driverSkill"
                    type="number"
                    min="1"
                    max="5"
                    value={scoutingForm.overall.driverSkill}
                    onChange={(e) => updateFormField('overall', 'driverSkill', parseInt(e.target.value) || 3)}
                  />
                </div>
                <div>
                  <Label htmlFor="reliability">Robot Reliability (1-5)</Label>
                  <Input
                    id="reliability"
                    type="number"
                    min="1"
                    max="5"
                    value={scoutingForm.overall.robotReliability}
                    onChange={(e) => updateFormField('overall', 'robotReliability', parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="generalNotes">General Notes</Label>
                <Textarea
                  id="generalNotes"
                  value={scoutingForm.overall.generalNotes}
                  onChange={(e) => updateFormField('overall', 'generalNotes', e.target.value)}
                  placeholder="Overall observations, alliance potential, weaknesses, strengths..."
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full frc-button text-white font-semibold py-3">
            Submit Scouting Data
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Data View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Scouting Database ({scoutingData.length} entries)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search teams..."
                    className="w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-frc-blue mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading scouting data...</p>
                </div>
              ) : scoutingData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scouting data available yet.</p>
                  <p className="text-sm">Start scouting teams to see data here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scoutingData.map((data) => (
                    <div key={data.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">Team {data.team_number}</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Match {data.match_number}</span>
                            <span>•</span>
                            <span>{new Date(data.created_at).toLocaleDateString()}</span>
                          </div>
                          {user?.isAdmin && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteScoutingData(data.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2 text-frc-blue">Autonomous</h4>
                          <p>Points: {data.auto_points_scored}</p>
                          {data.auto_notes && <p className="text-xs text-muted-foreground mt-1">{data.auto_notes}</p>}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-frc-orange">Teleop</h4>
                          <p>Points: {data.teleop_points_scored}</p>
                          <p>Climb: {data.climbed ? 'Yes' : 'No'} | Park: {data.parked ? 'Yes' : 'No'}</p>
                          {data.teleop_notes && <p className="text-xs text-muted-foreground mt-1">{data.teleop_notes}</p>}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-green-500">Ratings</h4>
                          <p>Defense: {data.defense_rating}/5</p>
                          <p>Driver: {data.driver_skill_rating}/5</p>
                          <p>Reliability: {data.robot_reliability_rating}/5</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Scouted by:</strong> {data.scouted_by}
                        </p>
                        {data.general_notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Notes:</strong> {data.general_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Scouting;
