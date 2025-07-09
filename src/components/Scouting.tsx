
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScoutingData } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Eye, BarChart3, Target, Zap, Shield } from 'lucide-react';

const Scouting: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'form' | 'data'>('form');
  const [scoutingForm, setScoutingForm] = useState({
    teamNumber: '',
    matchNumber: '',
    auto: {
      mobility: false,
      speakerScored: 0,
      ampScored: 0,
      notes: ''
    },
    teleop: {
      speakerScored: 0,
      ampScored: 0,
      trapScored: 0,
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

  const [scoutingData] = useState<ScoutingData[]>([
    {
      id: '1',
      teamNumber: '1234',
      matchNumber: 'Q1',
      scoutedBy: 'John Smith',
      timestamp: new Date('2024-01-15T10:30:00'),
      auto: {
        mobility: true,
        speakerScored: 2,
        ampScored: 1,
        notes: 'Consistent autonomous performance'
      },
      teleop: {
        speakerScored: 8,
        ampScored: 3,
        trapScored: 1,
        climbed: true,
        parked: false,
        notes: 'Strong shooter, good climbing ability'
      },
      overall: {
        defense: 4,
        driverSkill: 5,
        robotReliability: 4,
        generalNotes: 'Well-rounded team with excellent drivers'
      }
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scoutingForm.teamNumber || !scoutingForm.matchNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in team number and match number.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Scouting Data Saved",
      description: `Data for Team ${scoutingForm.teamNumber} in Match ${scoutingForm.matchNumber} has been recorded.`,
    });

    // Reset form
    setScoutingForm({
      teamNumber: '',
      matchNumber: '',
      auto: {
        mobility: false,
        speakerScored: 0,
        ampScored: 0,
        notes: ''
      },
      teleop: {
        speakerScored: 0,
        ampScored: 0,
        trapScored: 0,
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
  };

  const updateFormField = (section: string, field: string, value: any) => {
    setScoutingForm(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
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
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobility"
                  checked={scoutingForm.auto.mobility}
                  onCheckedChange={(checked) => updateFormField('auto', 'mobility', checked)}
                />
                <Label htmlFor="mobility">Left Starting Zone (Mobility)</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="autoSpeaker">Speaker Scored</Label>
                  <Input
                    id="autoSpeaker"
                    type="number"
                    min="0"
                    value={scoutingForm.auto.speakerScored}
                    onChange={(e) => updateFormField('auto', 'speakerScored', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="autoAmp">Amp Scored</Label>
                  <Input
                    id="autoAmp"
                    type="number"
                    min="0"
                    value={scoutingForm.auto.ampScored}
                    onChange={(e) => updateFormField('auto', 'ampScored', parseInt(e.target.value) || 0)}
                  />
                </div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="teleopSpeaker">Speaker Scored</Label>
                  <Input
                    id="teleopSpeaker"
                    type="number"
                    min="0"
                    value={scoutingForm.teleop.speakerScored}
                    onChange={(e) => updateFormField('teleop', 'speakerScored', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="teleopAmp">Amp Scored</Label>
                  <Input
                    id="teleopAmp"
                    type="number"
                    min="0"
                    value={scoutingForm.teleop.ampScored}
                    onChange={(e) => updateFormField('teleop', 'ampScored', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="teleopTrap">Trap Scored</Label>
                  <Input
                    id="teleopTrap"
                    type="number"
                    min="0"
                    value={scoutingForm.teleop.trapScored}
                    onChange={(e) => updateFormField('teleop', 'trapScored', parseInt(e.target.value) || 0)}
                  />
                </div>
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
                  Scouting Database
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
              {scoutingData.length === 0 ? (
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
                        <h3 className="font-semibold text-lg">Team {data.teamNumber}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Match {data.matchNumber}</span>
                          <span>•</span>
                          <span>{data.timestamp.toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2 text-frc-blue">Autonomous</h4>
                          <p>Speaker: {data.auto.speakerScored} | Amp: {data.auto.ampScored}</p>
                          <p>Mobility: {data.auto.mobility ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-frc-orange">Teleop</h4>
                          <p>Speaker: {data.teleop.speakerScored} | Amp: {data.teleop.ampScored}</p>
                          <p>Climb: {data.teleop.climbed ? 'Yes' : 'No'} | Park: {data.teleop.parked ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-green-500">Ratings</h4>
                          <p>Defense: {data.overall.defense}/5</p>
                          <p>Driver: {data.overall.driverSkill}/5</p>
                          <p>Reliability: {data.overall.robotReliability}/5</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          <strong>Scouted by:</strong> {data.scoutedBy}
                        </p>
                        {data.overall.generalNotes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Notes:</strong> {data.overall.generalNotes}
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
