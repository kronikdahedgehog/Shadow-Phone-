/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  MessageSquare, 
  Camera, 
  FileText, 
  Settings, 
  ChevronLeft, 
  Plus, 
  Trash2,
  Clock,
  Wifi,
  Battery,
  User,
  ShieldAlert,
  Fingerprint,
  Scan,
  CheckCircle2,
  AlertCircle,
  Phone,
  Search,
  Image as ImageIcon,
  Download,
  Upload
} from 'lucide-react';
import { ProfileType, PhoneState, ProfileData, Note, Photo, Message, Contact } from './types';

const PUBLIC_PASS = '1234';
const HIDDEN_PASS = '0000';

const STORAGE_KEYS = {
  public: '_sp_p_data',
  hidden: '_sp_h_data',
  lastProfile: '_sp_last_profile',
};

const INITIAL_DATA: ProfileData = {
  notes: [],
  photos: [],
  messages: [],
  contacts: [
    { id: '1', name: 'Mom', number: '555-0123', avatar: 'https://i.pravatar.cc/150?u=mom' },
    { id: '2', name: 'Pizza Place', number: '555-9999', avatar: 'https://i.pravatar.cc/150?u=pizza' }
  ],
  wallpaper: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
  biometricsEnabled: { fingerprint: false, faceId: false },
};

const HIDDEN_INITIAL_DATA: ProfileData = {
  notes: [{ id: '1', title: 'Top Secret', content: 'The hidden side is active.', timestamp: Date.now() }],
  photos: [],
  messages: [],
  contacts: [
    { id: 'h1', name: 'The Handler', number: '000-0000', avatar: 'https://i.pravatar.cc/150?u=handler' }
  ],
  wallpaper: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop',
  biometricsEnabled: { fingerprint: false, faceId: false },
};

export default function App() {
  const [state, setState] = useState<PhoneState>(() => {
    const lastProfile = localStorage.getItem(STORAGE_KEYS.lastProfile) as ProfileType | null;
    return {
      currentProfile: null,
      isLocked: true,
      activeData: null,
      lastUsedProfile: lastProfile || 'public',
    };
  });

  const [passcode, setPasscode] = useState('');
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-lock on window blur (e.g. switching tabs)
  useEffect(() => {
    const handleBlur = () => {
      if (!state.isLocked) {
        lockPhone();
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lockPhone();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isLocked]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save data only when active and unlocked
  useEffect(() => {
    if (!state.isLocked && state.currentProfile && state.activeData) {
      localStorage.setItem(STORAGE_KEYS[state.currentProfile], JSON.stringify(state.activeData));
      localStorage.setItem(STORAGE_KEYS.lastProfile, state.currentProfile);
    }
  }, [state.activeData, state.isLocked, state.currentProfile]);

  const handleUnlock = (code: string) => {
    if (code.length < 4) return;

    let profile: ProfileType | null = null;
    if (code === PUBLIC_PASS) profile = 'public';
    else if (code === HIDDEN_PASS) profile = 'hidden';

    if (profile) {
      const savedData = localStorage.getItem(STORAGE_KEYS[profile]);
      const data = savedData ? JSON.parse(savedData) : (profile === 'public' ? INITIAL_DATA : HIDDEN_INITIAL_DATA);
      
      setState(prev => ({
        ...prev,
        currentProfile: profile,
        isLocked: false,
        activeData: data,
        lastUsedProfile: profile,
      }));
    }
    
    // Always clear passcode immediately
    setPasscode('');
  };

  const handleBiometricUnlock = (type: 'fingerprint' | 'faceId') => {
    // In a real app, this would call WebAuthn or similar.
    // For this simulator, we check if the last used profile has it enabled.
    const profileToUnlock = state.lastUsedProfile || 'public';
    const savedData = localStorage.getItem(STORAGE_KEYS[profileToUnlock]);
    const data: ProfileData = savedData ? JSON.parse(savedData) : (profileToUnlock === 'public' ? INITIAL_DATA : HIDDEN_INITIAL_DATA);

    if (data.biometricsEnabled[type]) {
      setState(prev => ({
        ...prev,
        currentProfile: profileToUnlock,
        isLocked: false,
        activeData: data,
      }));
    }
  };

  const lockPhone = () => {
    setState(prev => ({
      ...prev,
      currentProfile: null,
      isLocked: true,
      activeData: null, // Wipe sensitive data from memory
    }));
    setActiveApp(null);
    setPasscode('');
  };

  const updateProfileData = (newData: Partial<ProfileData>) => {
    if (!state.activeData) return;
    setState(prev => ({
      ...prev,
      activeData: {
        ...prev.activeData!,
        ...newData,
      },
    }));
  };

  const currentData = state.activeData;

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 p-4 font-sans">
      {/* Phone Frame */}
      <div className="relative phone-container bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col ring-4 ring-zinc-900/50">
        
        {/* Status Bar */}
        <div className="h-12 flex items-center justify-between px-8 z-50 text-white/90">
          <div className="text-sm font-semibold">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-2">
            <Wifi size={14} />
            <Battery size={14} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {state.isLocked ? (
            <LockScreen 
              key="lock" 
              passcode={passcode} 
              setPasscode={(val) => {
                setPasscode(val);
                handleUnlock(val);
              }} 
              onBiometric={handleBiometricUnlock}
              lastUsedProfile={state.lastUsedProfile}
            />
          ) : (
            <HomeScreen 
              key="home" 
              profile={state.currentProfile!} 
              data={currentData!}
              activeApp={activeApp}
              setActiveApp={setActiveApp}
              lockPhone={lockPhone}
              updateData={updateProfileData}
            />
          )}
        </AnimatePresence>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/30 rounded-full z-50" />
      </div>
    </div>
  );
}

function LockScreen({ passcode, setPasscode, onBiometric, lastUsedProfile }: { key?: string, passcode: string, setPasscode: (v: string) => void, onBiometric: (type: 'fingerprint' | 'faceId') => void, lastUsedProfile: ProfileType | null }) {
  const [isScanning, setIsScanning] = useState<'fingerprint' | 'faceId' | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'fail'>('idle');

  const handleKey = (num: string) => {
    if (passcode.length < 4) {
      setPasscode(passcode + num);
    }
  };

  const triggerBiometric = (type: 'fingerprint' | 'faceId') => {
    setIsScanning(type);
    setScanStatus('scanning');
    
    // Simulate scan duration
    setTimeout(() => {
      // Check if enabled for the last used profile
      const savedData = localStorage.getItem(STORAGE_KEYS[lastUsedProfile || 'public']);
      const data: ProfileData = savedData ? JSON.parse(savedData) : (lastUsedProfile === 'hidden' ? HIDDEN_INITIAL_DATA : INITIAL_DATA);

      if (data.biometricsEnabled[type]) {
        setScanStatus('success');
        setTimeout(() => {
          onBiometric(type);
          setIsScanning(null);
          setScanStatus('idle');
        }, 500);
      } else {
        setScanStatus('fail');
        setTimeout(() => {
          setIsScanning(null);
          setScanStatus('idle');
        }, 1500);
      }
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-xl relative"
    >
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              {isScanning === 'fingerprint' ? (
                <Fingerprint size={80} className={`${scanStatus === 'scanning' ? 'text-blue-500 animate-pulse' : scanStatus === 'success' ? 'text-green-500' : 'text-red-500'}`} />
              ) : (
                <Scan size={80} className={`${scanStatus === 'scanning' ? 'text-blue-500 animate-pulse' : scanStatus === 'success' ? 'text-green-500' : 'text-red-500'}`} />
              )}
              {scanStatus === 'scanning' && (
                <motion.div 
                  className="absolute inset-0 border-2 border-blue-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-medium text-white">
                {scanStatus === 'scanning' ? `Scanning ${isScanning === 'fingerprint' ? 'Fingerprint' : 'Face'}...` : 
                 scanStatus === 'success' ? 'Authenticated' : 'Biometric Not Enrolled'}
              </h3>
              {scanStatus === 'fail' && <p className="text-sm text-zinc-400 mt-2">Please use passcode</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Lock className="text-white/60 mb-2" size={32} />
          <h2 className="text-2xl font-light text-white">Enter Passcode</h2>
        </div>

        <div className="flex gap-4">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3.5 h-3.5 rounded-full border border-white/40 transition-all duration-200 ${passcode.length > i ? 'bg-white' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 mt-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKey(num.toString())}
              className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-2xl text-white font-medium backdrop-blur-md border border-white/5"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => triggerBiometric('faceId')}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white/60 backdrop-blur-md border border-white/5"
          >
            <Scan size={24} />
          </button>
          <button
            onClick={() => handleKey('0')}
            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-2xl text-white font-medium backdrop-blur-md border border-white/5"
          >
            0
          </button>
          <button
            onClick={() => triggerBiometric('fingerprint')}
            className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white/60 backdrop-blur-md border border-white/5"
          >
            <Fingerprint size={24} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function HomeScreen({ 
  profile, 
  data, 
  activeApp, 
  setActiveApp, 
  lockPhone,
  updateData
}: { 
  key?: string,
  profile: ProfileType, 
  data: ProfileData,
  activeApp: string | null,
  setActiveApp: (app: string | null) => void,
  lockPhone: () => void,
  updateData: (d: Partial<ProfileData>) => void
}) {
  const apps = [
    { id: 'phone', name: 'Phone', icon: Phone, color: 'bg-green-500' },
    { id: 'messages', name: 'Messages', icon: MessageSquare, color: 'bg-blue-500' },
    { id: 'photos', name: 'Photos', icon: Camera, color: 'bg-purple-500' },
    { id: 'notes', name: 'Notes', icon: FileText, color: 'bg-amber-500' },
    { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-zinc-500' },
  ];

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={data.wallpaper} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 p-8 grid grid-cols-4 gap-y-8 gap-x-4">
        {apps.map(app => (
          <button
            key={app.id}
            onClick={() => setActiveApp(app.id)}
            className="flex flex-col items-center gap-2 group"
          >
            <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg group-active:scale-90 transition-transform`}>
              <app.icon className="text-white" size={28} />
            </div>
            <span className="text-[10px] font-medium text-white drop-shadow-md">{app.name}</span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeApp && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-40 bg-zinc-950 flex flex-col pt-12"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
              <button 
                onClick={() => setActiveApp(null)}
                className="p-2 -ml-2 text-blue-500 flex items-center gap-1"
              >
                <ChevronLeft size={20} />
                <span className="text-sm">Home</span>
              </button>
              <h3 className="text-sm font-semibold capitalize">{activeApp}</h3>
              <div className="w-10" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {activeApp === 'phone' && <ContactsApp contacts={data.contacts} setContacts={(c) => updateData({ contacts: c })} />}
              {activeApp === 'notes' && <NotesApp notes={data.notes} setNotes={(n) => updateData({ notes: n })} />}
              {activeApp === 'photos' && <PhotosApp photos={data.photos} setPhotos={(p) => updateData({ photos: p })} />}
              {activeApp === 'messages' && <MessagesApp messages={data.messages} setMessages={(m) => updateData({ messages: m })} />}
              {activeApp === 'settings' && <SettingsApp profile={profile} lockPhone={lockPhone} data={data} updateData={updateData} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="absolute bottom-8 left-4 right-4 h-20 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-around px-4 border border-white/10">
        {apps.slice(0, 4).map(app => (
          <button 
            key={app.id} 
            onClick={() => setActiveApp(app.id)}
            className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-transform`}
          >
            <app.icon className="text-white" size={24} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactsApp({ contacts, setContacts }: { contacts: Contact[], setContacts: (c: Contact[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', number: '' });
  const [search, setSearch] = useState('');

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const add = () => {
    if (!newContact.name) return;
    const id = Math.random().toString();
    setContacts([...contacts, { ...newContact, id, avatar: `https://i.pravatar.cc/150?u=${id}` }]);
    setNewContact({ name: '', number: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <button onClick={() => setIsAdding(true)} className="p-2 bg-green-500 rounded-full text-white">
          <Plus size={20} />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-green-500"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="bg-zinc-900 p-4 rounded-xl space-y-3 border border-zinc-800">
          <input 
            placeholder="Name"
            className="w-full bg-transparent border-none outline-none text-lg font-semibold"
            value={newContact.name}
            onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
          />
          <input 
            placeholder="Phone Number"
            className="w-full bg-transparent border-none outline-none text-sm"
            value={newContact.number}
            onChange={e => setNewContact(prev => ({ ...prev, number: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-zinc-400">Cancel</button>
            <button onClick={add} className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg">Add</button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {filtered.map(contact => (
          <div key={contact.id} className="flex items-center gap-4 p-3 hover:bg-zinc-900 rounded-xl transition-colors group">
            <img src={contact.avatar} className="w-12 h-12 rounded-full bg-zinc-800" referrerPolicy="no-referrer" />
            <div className="flex-1">
              <h3 className="font-semibold">{contact.name}</h3>
              <p className="text-xs text-zinc-500">{contact.number}</p>
            </div>
            <button className="p-2 bg-green-500/10 text-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Phone size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesApp({ notes, setNotes }: { notes: Note[], setNotes: (n: Note[]) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  const addNote = () => {
    if (!newNote.title) return;
    setNotes([{ id: Math.random().toString(), ...newNote, timestamp: Date.now() }, ...notes]);
    setNewNote({ title: '', content: '' });
    setIsAdding(false);
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Notes</h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-amber-500 rounded-full text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      {isAdding && (
        <div className="bg-zinc-900 p-4 rounded-xl space-y-3 border border-zinc-800">
          <input 
            placeholder="Title"
            className="w-full bg-transparent border-none outline-none text-lg font-semibold"
            value={newNote.title}
            onChange={e => setNewNote(prev => ({ ...prev, title: e.target.value }))}
          />
          <textarea 
            placeholder="Content"
            className="w-full bg-transparent border-none outline-none text-sm min-h-[100px] resize-none"
            value={newNote.content}
            onChange={e => setNewNote(prev => ({ ...prev, content: e.target.value }))}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-zinc-400">Cancel</button>
            <button onClick={addNote} className="px-3 py-1 text-sm bg-amber-500 text-white rounded-lg">Save</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notes.map(note => (
          <div key={note.id} className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 group">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{note.title}</h3>
              <button onClick={() => deleteNote(note.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{note.content}</p>
            <p className="text-[10px] text-zinc-600 mt-2">{new Date(note.timestamp).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotosApp({ photos, setPhotos }: { photos: Photo[], setPhotos: (p: Photo[]) => void }) {
  const addPhoto = () => {
    const id = Math.random().toString();
    const url = `https://picsum.photos/seed/${id}/400/400`;
    setPhotos([{ id, url, timestamp: Date.now() }, ...photos]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Photos</h1>
        <button onClick={addPhoto} className="p-2 bg-blue-500 rounded-full text-white">
          <Plus size={20} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {photos.map(photo => (
          <div key={photo.id} className="aspect-square bg-zinc-900 overflow-hidden">
            <img src={photo.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    </div>
  );
}

function MessagesApp({ messages, setMessages }: { messages: Message[], setMessages: (m: Message[]) => void }) {
  const [text, setText] = useState('');

  const send = () => {
    if (!text) return;
    setMessages([{ id: Math.random().toString(), sender: 'Me', text, timestamp: Date.now() }, ...messages]);
    setText('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'Me' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'Me' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-100 rounded-tl-none'}`}>
              {msg.text}
            </div>
            <span className="text-[10px] text-zinc-600 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pb-4">
        <input 
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-blue-500"
          placeholder="Message..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
          <ChevronLeft className="rotate-180" size={20} />
        </button>
      </div>
    </div>
  );
}

function SettingsApp({ profile, lockPhone, data, updateData }: { profile: ProfileType, lockPhone: () => void, data: ProfileData, updateData: (d: Partial<ProfileData>) => void }) {
  const toggleBiometric = (type: 'fingerprint' | 'faceId') => {
    updateData({
      biometricsEnabled: {
        ...data.biometricsEnabled,
        [type]: !data.biometricsEnabled[type]
      }
    });
  };

  const wallpapers = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2670&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2574&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1627163439134-7a8c47ee8020?q=80&w=2664&auto=format&fit=crop'
  ];

  const handleBackup = () => {
    const backupData = JSON.stringify(data, null, 2);
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowphone_${profile}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        // Basic validation
        if (importedData.notes && importedData.contacts && importedData.photos) {
          updateData(importedData);
          alert('Profile data restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      <div className="space-y-2">
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${profile === 'hidden' ? 'bg-purple-500' : 'bg-blue-500'}`}>
            <User className="text-white" size={24} />
          </div>
          <div>
            <h3 className="font-semibold capitalize">{profile} Profile</h3>
            <p className="text-xs text-zinc-500">Active and isolated</p>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase px-2 mb-2">Data Management</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          <button 
            onClick={handleBackup}
            className="w-full p-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download size={18} className="text-zinc-400" />
              <span className="text-sm">Backup Profile Data</span>
            </div>
            <span className="text-xs text-zinc-500">JSON Export</span>
          </button>
          <label className="w-full p-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Upload size={18} className="text-zinc-400" />
              <span className="text-sm">Restore Profile Data</span>
            </div>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleRestore}
            />
            <span className="text-xs text-zinc-500">JSON Import</span>
          </label>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase px-2 mb-2">Wallpaper</h2>
        <div className="grid grid-cols-2 gap-2">
          {wallpapers.map((url, i) => (
            <button 
              key={i}
              onClick={() => updateData({ wallpaper: url })}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${data.wallpaper === url ? 'border-blue-500 scale-95' : 'border-transparent'}`}
            >
              <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase px-2 mb-2">Biometrics</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Fingerprint size={18} className="text-zinc-400" />
              <span className="text-sm">Fingerprint Unlock</span>
            </div>
            <button 
              onClick={() => toggleBiometric('fingerprint')}
              className={`w-10 h-6 rounded-full transition-colors relative ${data.biometricsEnabled.fingerprint ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.biometricsEnabled.fingerprint ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Scan size={18} className="text-zinc-400" />
              <span className="text-sm">Face ID</span>
            </div>
            <button 
              onClick={() => toggleBiometric('faceId')}
              className={`w-10 h-6 rounded-full transition-colors relative ${data.biometricsEnabled.faceId ? 'bg-blue-600' : 'bg-zinc-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.biometricsEnabled.faceId ? 'left-5' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase px-2 mb-2">Security</h2>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          <div className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="text-zinc-400" />
              <span className="text-sm">Hidden Space</span>
            </div>
            <span className="text-xs text-zinc-500">{profile === 'hidden' ? 'Visible' : 'Encrypted'}</span>
          </div>
          <button 
            onClick={lockPhone}
            className="w-full p-4 flex justify-between items-center text-red-500 hover:bg-red-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Unlock size={18} />
              <span className="text-sm">Lock Phone</span>
            </div>
          </button>
        </div>
      </div>

      <div className="p-4 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
        <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
          ShadowPhone uses dual-partition simulation. Data in this profile is stored independently in your browser's local storage and is inaccessible from the other profile.
        </p>
      </div>
    </div>
  );
}
