export interface TrackItem {
  id: string;
  order: number;
  speaker: 'A' | 'B';
  label: string;
  filename: string;
  durationMs: number;
}

export interface Interview {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  date: string;
  icon: string;
  color: string;
  ambientDescription: string;
  tracks: TrackItem[];
  speakerA: { name: string; role: string };
  speakerB: { name: string; role: string };
}

export const interviews: Interview[] = [
  {
    id: 'interview_1',
    title: 'The Urban Soundscape',
    subtitle: 'City noise & architecture',
    location: 'Warsaw, Poland',
    date: '2024-03-15',
    icon: '🏙️',
    color: '#6366f1',
    ambientDescription: 'Busy intersection, tram bells, distant construction',
    speakerA: { name: 'Maria Kowalska', role: 'Journalist' },
    speakerB: { name: 'Prof. Jan Nowak', role: 'Acoustic Architect' },
    tracks: [
      { id: '1-1', order: 1, speaker: 'A', label: 'Opening question about urban noise', filename: '01_A_opening.wav', durationMs: 8000 },
      { id: '1-2', order: 2, speaker: 'B', label: 'Response on city acoustics', filename: '02_B_acoustics.wav', durationMs: 12000 },
      { id: '1-3', order: 3, speaker: 'A', label: 'Follow-up on health impacts', filename: '03_A_health.wav', durationMs: 6000 },
      { id: '1-4', order: 4, speaker: 'B', label: 'Studies and findings', filename: '04_B_studies.wav', durationMs: 15000 },
      { id: '1-5', order: 5, speaker: 'A', label: 'Solutions for the future', filename: '05_A_solutions.wav', durationMs: 7000 },
      { id: '1-6', order: 6, speaker: 'B', label: 'Closing thoughts on design', filename: '06_B_closing.wav', durationMs: 10000 },
    ],
  },
  {
    id: 'interview_2',
    title: 'Forest Whispers',
    subtitle: 'Bioacoustics & ecology',
    location: 'Białowieża Forest',
    date: '2024-04-22',
    icon: '🌲',
    color: '#22c55e',
    ambientDescription: 'Dense forest, birdsong, wind through canopy, distant stream',
    speakerA: { name: 'Tomasz Wiśniewski', role: 'Journalist' },
    speakerB: { name: 'Dr. Anna Leśna', role: 'Ecologist' },
    tracks: [
      { id: '2-1', order: 1, speaker: 'A', label: 'Why bioacoustics matters', filename: '01_A_intro.wav', durationMs: 9000 },
      { id: '2-2', order: 2, speaker: 'B', label: 'The language of the forest', filename: '02_B_language.wav', durationMs: 14000 },
      { id: '2-3', order: 3, speaker: 'A', label: 'Recording techniques used', filename: '03_A_techniques.wav', durationMs: 7000 },
      { id: '2-4', order: 4, speaker: 'B', label: 'Species identification by sound', filename: '04_B_species.wav', durationMs: 11000 },
      { id: '2-5', order: 5, speaker: 'A', label: 'Climate change effects', filename: '05_A_climate.wav', durationMs: 8000 },
      { id: '2-6', order: 6, speaker: 'B', label: 'Conservation through listening', filename: '06_B_conservation.wav', durationMs: 13000 },
      { id: '2-7', order: 7, speaker: 'A', label: 'Final reflections', filename: '07_A_final.wav', durationMs: 6000 },
    ],
  },
  {
    id: 'interview_3',
    title: 'Harbor Frequencies',
    subtitle: 'Maritime sound worlds',
    location: 'Gdańsk Port',
    date: '2024-05-10',
    icon: '⚓',
    color: '#0ea5e9',
    ambientDescription: 'Harbor ambience, ship horns, seagulls, waves, cranes',
    speakerA: { name: 'Karol Morski', role: 'Journalist' },
    speakerB: { name: 'Cap. Ewa Portowa', role: 'Harbor Master' },
    tracks: [
      { id: '3-1', order: 1, speaker: 'A', label: 'Life at the harbor', filename: '01_A_harbor_life.wav', durationMs: 7000 },
      { id: '3-2', order: 2, speaker: 'B', label: 'Daily routines and sounds', filename: '02_B_routines.wav', durationMs: 16000 },
      { id: '3-3', order: 3, speaker: 'A', label: 'Navigational acoustics', filename: '03_A_navigation.wav', durationMs: 8000 },
      { id: '3-4', order: 4, speaker: 'B', label: 'Safety through sound signals', filename: '04_B_safety.wav', durationMs: 12000 },
      { id: '3-5', order: 5, speaker: 'A', label: 'Future of the port', filename: '05_A_future.wav', durationMs: 9000 },
    ],
  },
  {
    id: 'interview_4',
    title: 'Underground Reverb',
    subtitle: 'Metro station acoustics',
    location: 'Metro Centrum, Warsaw',
    date: '2024-06-02',
    icon: '🚇',
    color: '#f59e0b',
    ambientDescription: 'Metro station, train arrivals, announcements, crowd murmur',
    speakerA: { name: 'Ola Miejska', role: 'Journalist' },
    speakerB: { name: 'Ing. Piotr Tunel', role: 'Transport Engineer' },
    tracks: [
      { id: '4-1', order: 1, speaker: 'A', label: 'Design of underground spaces', filename: '01_A_design.wav', durationMs: 8000 },
      { id: '4-2', order: 2, speaker: 'B', label: 'Acoustic challenges below ground', filename: '02_B_challenges.wav', durationMs: 13000 },
      { id: '4-3', order: 3, speaker: 'A', label: 'Passenger experience', filename: '03_A_experience.wav', durationMs: 7000 },
      { id: '4-4', order: 4, speaker: 'B', label: 'Sound dampening solutions', filename: '04_B_dampening.wav', durationMs: 11000 },
      { id: '4-5', order: 5, speaker: 'A', label: 'Music in the metro', filename: '05_A_music.wav', durationMs: 6000 },
      { id: '4-6', order: 6, speaker: 'B', label: 'Visions for quieter transit', filename: '06_B_visions.wav', durationMs: 14000 },
      { id: '4-7', order: 7, speaker: 'A', label: 'Closing remarks', filename: '07_A_closing.wav', durationMs: 5000 },
      { id: '4-8', order: 8, speaker: 'B', label: 'Final word', filename: '08_B_final.wav', durationMs: 9000 },
    ],
  },
  {
    id: 'interview_5',
    title: 'Cathedral Resonance',
    subtitle: 'Sacred space acoustics',
    location: 'St. Mary\'s Basilica, Kraków',
    date: '2024-07-18',
    icon: '⛪',
    color: '#ec4899',
    ambientDescription: 'Cathedral interior, organ drone, footsteps, whispered prayers',
    speakerA: { name: 'Zofia Duchowa', role: 'Journalist' },
    speakerB: { name: 'Fr. Marek Kościelny', role: 'Church Historian' },
    tracks: [
      { id: '5-1', order: 1, speaker: 'A', label: 'Sacred sound traditions', filename: '01_A_traditions.wav', durationMs: 9000 },
      { id: '5-2', order: 2, speaker: 'B', label: 'Centuries of acoustic design', filename: '02_B_centuries.wav', durationMs: 15000 },
      { id: '5-3', order: 3, speaker: 'A', label: 'The role of organ music', filename: '03_A_organ.wav', durationMs: 7000 },
      { id: '5-4', order: 4, speaker: 'B', label: 'Architecture serving sound', filename: '04_B_architecture.wav', durationMs: 12000 },
      { id: '5-5', order: 5, speaker: 'A', label: 'Modern challenges to preservation', filename: '05_A_preservation.wav', durationMs: 8000 },
      { id: '5-6', order: 6, speaker: 'B', label: 'Spiritual dimension of listening', filename: '06_B_spiritual.wav', durationMs: 10000 },
    ],
  },
];
