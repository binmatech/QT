import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../lib/AuthContext";
import { CATEGORIES } from "../constants";
import { createArticle, getArticles, deleteArticle } from "../services/articleService";
import { getEvents, createEvent, deleteEvent } from "../services/eventService";
import { getExperts, createExpert, deleteExpert } from "../services/expertService";
import { getSpotlightStories, createSpotlightStory, deleteSpotlightStory } from "../services/spotlightService";
import { Article, NewsEvent, Expert, SpotlightStory } from "../types";
import { LayoutDashboard, FilePlus, LogOut, CheckCircle, AlertCircle, ArrowLeft, Upload, Image as ImageIcon, Loader2, Trash2, Calendar, Users, Twitter, Linkedin, ExternalLink, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, auth, getFirebaseStatus, db, signInWithGoogle } from "../lib/firebase";
import { withTimeout } from "../lib/firestoreUtils";

import RichTextEditor from "../components/RichTextEditor";

const ADMIN_EMAIL = "subairnurudeen20@gmail.com";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [spotlights, setSpotlights] = useState<SpotlightStory[]>([]);
  const [view, setView] = useState<'create' | 'manage' | 'manage-events' | 'create-event' | 'manage-experts' | 'create-expert' | 'manage-spotlight' | 'create-spotlight'>('create');

  useEffect(() => {
    if (view === 'manage') {
      fetchArticles();
    } else if (view === 'manage-events') {
      fetchEvents();
    } else if (view === 'manage-experts') {
      fetchExperts();
    } else if (view === 'manage-spotlight') {
      fetchSpotlights();
    }
  }, [view]);

  const fetchArticles = async () => {
    const data = await getArticles();
    setArticles(data);
  };

  const fetchEvents = async () => {
    const data = await getEvents();
    setEvents(data);
  };

  const fetchExperts = async () => {
    const data = await getExperts();
    setExperts(data);
  };

  const fetchSpotlights = async () => {
    const data = await getSpotlightStories();
    setSpotlights(data);
  };

  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [deletingEventIds, setDeletingEventIds] = useState<string[]>([]);
  const [deletingExpertIds, setDeletingExpertIds] = useState<string[]>([]);
  const [deletingSpotlightIds, setDeletingSpotlightIds] = useState<string[]>([]);

  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [expertToDelete, setExpertToDelete] = useState<string | null>(null);
  const [spotlightToDelete, setSpotlightToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingIds(prev => [...prev, id]);
    const success = await deleteArticle(id);
    if (success) {
      setArticles(prev => prev.filter(a => a.id !== id));
      setArticleToDelete(null);
    } else {
      setError("Failed to delete article. Check your permissions.");
    }
    setDeletingIds(prev => prev.filter(did => did !== id));
  };

  const handleEventDelete = async (id: string) => {
    setDeletingEventIds(prev => [...prev, id]);
    const success = await deleteEvent(id);
    if (success) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setEventToDelete(null);
    } else {
      setError("Failed to delete event. Check your permissions.");
    }
    setDeletingEventIds(prev => prev.filter(did => did !== id));
  };

  const handleExpertDelete = async (id: string) => {
    setDeletingExpertIds(prev => [...prev, id]);
    const success = await deleteExpert(id);
    if (success) {
      setExperts(prev => prev.filter(e => e.id !== id));
      setExpertToDelete(null);
    } else {
      setError("Failed to delete expert profile. Check your permissions.");
    }
    setDeletingExpertIds(prev => prev.filter(did => did !== id));
  };

  const handleSpotlightDelete = async (id: string) => {
    setDeletingSpotlightIds(prev => [...prev, id]);
    const success = await deleteSpotlightStory(id);
    if (success) {
      setSpotlights(prev => prev.filter(s => s.id !== id));
      setSpotlightToDelete(null);
    } else {
      setError("Failed to delete spotlight story. Check your permissions.");
    }
    setDeletingSpotlightIds(prev => prev.filter(did => did !== id));
  };

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: CATEGORIES[0].name,
    author: user?.displayName || "Admin",
    authorDesignation: "Contributor",
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    readTime: "5 min",
    image: "",
    featured: false,
    content: ""
  });

  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    image: "",
    registrationLink: ""
  });

  const [expertFormData, setExpertFormData] = useState({
    name: "",
    title: "",
    bio: "",
    image: "",
    twitter: "",
    linkedin: "",
    website: "",
    contributionsCount: 0
  });

  const uploadImage = async (file: File): Promise<string> => {
    console.log("Starting upload for file:", file.name, "Size:", file.size);
    if (!auth.currentUser) {
      throw new Error("You must be logged in to upload images.");
    }

    if (!storage.app.options.storageBucket) {
      throw new Error("ERROR: Storage bucket not configured.");
    }
    
    try {
      const storageRef = ref(storage, `articles/${Date.now()}_${file.name}`);
      console.log("Storage reference created:", storageRef.fullPath);
      
      return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload progress:", progress, "%", "State:", snapshot.state);
            setUploadProgress(progress);
          },
          (err) => {
            console.error("Storage Error Detail:", err);
            if (err.code === 'storage/unauthorized') {
              reject(new Error("Firebase Storage permissions denied. Check your Storage rules."));
            } else {
              reject(err);
            }
          },
          async () => {
            console.log("Upload completed successfully!");
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (urlErr) {
              console.error("Error getting download URL:", urlErr);
              reject(new Error("Failed to retrieve image URL after upload."));
            }
          }
        );
      });
    } catch (err: any) {
      console.error("Outer upload error catch:", err);
      throw err;
    }
  };

  const [spotlightFormData, setSpotlightFormData] = useState({
    founderName: "",
    companyName: "",
    title: "",
    story: "",
    image: "",
    link: ""
  });

  if (!user || user.email !== ADMIN_EMAIL) {
    const isErrorPopupBlocked = error === "POPUP_BLOCKED";
    const isErrorInternal = error === "FIREBASE_INTERNAL_ERROR";

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 border border-slate-200 text-center shadow-xl">
          <AlertCircle size={48} className={`mx-auto mb-6 ${!user ? 'text-amber-500' : 'text-red-500'}`} />
          <h1 className="text-2xl font-editorial font-bold mb-4">
            {!user ? "Authentication Required" : "Access Denied"}
          </h1>
          
          <div className="text-slate-500 mb-8 space-y-3">
            <p>
              {!user 
                ? "You must be signed in with an admin account to access the dashboard." 
                : `You are signed in as ${user.email}, but this account does not have admin privileges.`
              }
            </p>
            
            {(isErrorPopupBlocked || isErrorInternal) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs text-left animate-in fade-in slide-in-from-top-1">
                <span className="font-bold flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Browser Restriction Detected
                </span>
                {isErrorPopupBlocked 
                  ? "Your browser blocked the login popup. This often happens inside the preview pane."
                  : "An internal security error occurred. This is common when connecting to Google Auth inside an iframe."
                }
                <p className="mt-2 font-bold underline">
                  Click the "Open in new tab" icon (↗) at the top right of the preview to fix this.
                </p>
              </div>
            )}
            
            {error && !isErrorPopupBlocked && !isErrorInternal && (
              <p className="p-3 bg-red-50 border border-red-100 rounded text-red-600 text-xs text-left">
                <strong>Error:</strong> {error}
              </p>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            {!user && (
              <button 
                onClick={async () => {
                  setError(null);
                  try {
                    await signInWithGoogle();
                  } catch (err: any) {
                    setError(err.message);
                  }
                }}
                className="bg-black text-white px-6 py-4 hover:bg-brand-accent transition-all font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 group shadow-lg hover:shadow-brand-accent/20"
              >
                Sign In with Google
                <Sparkles size={14} className="group-hover:scale-125 transition-transform" />
              </button>
            )}
            
            <Link to="/" className="inline-flex items-center justify-center gap-2 text-slate-400 hover:text-black font-bold uppercase tracking-widest text-[10px] transition-colors">
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setImageFile(file);
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);

    try {
      let imageUrl = formData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        throw new Error("Please provide an image for the article.");
      }

      await createArticle({
        ...formData,
        image: imageUrl,
        authorId: user.uid
      } as any);
      setSuccess(true);
      setFormData({
        ...formData,
        title: "",
        excerpt: "",
        authorDesignation: "Contributor",
        image: "",
        content: "",
        featured: false
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      let errorMessage = err.message || "Failed to create article";
      
      // Try to parse JSON error from firestore handler
      try {
        if (errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error || errorMessage;
        }
      } catch (e) {
        // Fallback to original message
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = eventFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800"; // Default
      }

      await createEvent({
        ...eventFormData,
        image: imageUrl
      });
      setSuccess(true);
      setEventFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        time: "",
        image: "",
        registrationLink: ""
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      let errorMessage = err.message || "Failed to create event";
      try {
        if (errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error || errorMessage;
        }
      } catch (e) {}
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleExpertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = expertFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800"; // Default avatar
      }

      await createExpert({
        ...expertFormData,
        image: imageUrl
      });
      setSuccess(true);
      setExpertFormData({
        name: "",
        title: "",
        bio: "",
        image: "",
        twitter: "",
        linkedin: "",
        website: "",
        contributionsCount: 0
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      let errorMessage = err.message || "Failed to add expert";
      try {
        if (errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error || errorMessage;
        }
      } catch (e) {}
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleSpotlightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = spotlightFormData.image;

      if (imageFile) {
        setUploading(true);
        try {
          imageUrl = await uploadImage(imageFile);
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        imageUrl = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800"; // Default tech/office
      }

      await createSpotlightStory({
        ...spotlightFormData,
        image: imageUrl
      });
      setSuccess(true);
      setSpotlightFormData({
        founderName: "",
        companyName: "",
        title: "",
        story: "",
        image: "",
        link: ""
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      let errorMessage = err.message || "Failed to create spotlight story";
      try {
        if (errorMessage.startsWith('{')) {
          const parsed = JSON.parse(errorMessage);
          errorMessage = parsed.error || errorMessage;
        }
      } catch (e) {}
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black text-white p-8 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-1 mb-12">
          <span className="font-editorial font-black text-2xl tracking-tighter uppercase">Quotients Africa<span className="text-brand-accent">.</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setView('create')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <FilePlus size={18} />
            Publish
          </button>
          <button 
            onClick={() => setView('manage')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            Manage feed
          </button>
          
          <div className="pt-4 pb-2 px-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Events Management</p>
          </div>

          <button 
            onClick={() => setView('create-event')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-event' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Calendar size={18} />
            Post Event
          </button>
          <button 
            onClick={() => setView('manage-events')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-events' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            Manage events
          </button>

          <div className="pt-4 pb-2 px-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Experts Network</p>
          </div>

          <button 
            onClick={() => setView('create-expert')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-expert' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Users size={18} />
            Add Expert
          </button>
          <button 
            onClick={() => setView('manage-experts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-experts' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            Manage Experts
          </button>

          <div className="pt-4 pb-2 px-4">
             <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Spotlight Stories</p>
          </div>

          <button 
            onClick={() => setView('create-spotlight')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'create-spotlight' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <Sparkles size={18} />
            Add Spotlight
          </button>
          <button 
            onClick={() => setView('manage-spotlight')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-bold uppercase tracking-wider transition-colors ${view === 'manage-spotlight' ? 'bg-white/10 text-brand-accent' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <LayoutDashboard size={18} />
            Manage Spotlight
          </button>
        </nav>

        <Link to="/" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded text-sm font-bold uppercase tracking-wider text-slate-400 transition-colors mt-auto">
          <ArrowLeft size={18} />
          Site Home
        </Link>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-editorial font-bold mb-2">Editor-in-Chief Dashboard</h1>
            <p className="text-slate-500">
              Welcome back, {user.displayName}. 
              {view === 'create' ? ' Create a new story.' : 
               view === 'manage' ? ' Manage your feed.' : 
               view === 'create-event' ? ' Post an upcoming event.' : 
               view === 'manage-events' ? ' Manage scheduled events.' :
               view === 'create-expert' ? ' Add a new expert to the network.' :
               view === 'manage-experts' ? ' Edit expert profiles.' :
               view === 'create-spotlight' ? ' Feature a new founder story.' :
               ' Edit spotlights.'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={async () => {
                setLoading(true);
                setError(null);
                const status = getFirebaseStatus();
                console.log("Firebase Status Log:", status);
                
                try {
                  const { doc, setDoc, deleteDoc, getDoc } = await import("firebase/firestore");
                  
                  const diagInfo = [
                    `Project: ${status.projectId}`,
                    `Configured: ${status.isConfigured}`,
                    `Using local config: ${status.isLocalConfig}`,
                    `Missing Vars: ${status.missingVars.join(', ') || 'None'}`
                  ].join('\n');
                  
                  console.log("Diagnostic Info:\n" + diagInfo);
                  
                  const testRef = doc(db, "test", "connection_debug_" + Date.now());
                  
                  // Step 1: Write
                  console.log("Testing write...");
                  await withTimeout(setDoc(testRef, { test: true, time: Date.now() }), 30000);
                  
                  // Step 2: Read
                  console.log("Testing read...");
                  await withTimeout(getDoc(testRef), 30000);
                  
                  // Step 3: Delete
                  console.log("Testing delete...");
                  await withTimeout(deleteDoc(testRef), 30000);
                  
                  alert("Firestore Connection Success! Read/Write operations are working.\n\n" + diagInfo);
                } catch (err: any) {
                  const errMsg = err.message || String(err);
                  console.error("Debug Test Failed:", err);
                  
                  let detailedError = "Firestore Test Failed: " + errMsg;
                  if (errMsg.includes("timed out")) {
                    detailedError += "\n\nTROUBLESHOOTING:\n1. If on Vercel, ensure ALL environment variables are set and VITE_ prefixed.\n2. Ensure your IP is not blocked by a firewall.\n3. Verify your Firestore rules allow write access.\n4. Check if your Firebase project is active.";
                  }
                  setError(detailedError);
                  alert(detailedError);
                } finally {
                  setLoading(false);
                }
              }}
              className="editorial-label text-blue-400 hover:text-blue-600 transition-colors"
            >
              Debug Connection
            </button>
            <button 
              onClick={() => {
                if (user?.uid) {
                  import("../services/articleService").then(m => m.seedDatabase(user.uid));
                }
              }}
              className="editorial-label text-slate-400 hover:text-brand-accent transition-colors"
            >
              Seed Initial Content
            </button>
            <button 
              onClick={() => auth.signOut()}
              className="editorial-label text-red-400 hover:text-red-600 transition-colors flex items-center gap-2"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </header>

        {getFirebaseStatus().missingVars.length > 0 && (
          <div className="mb-12 p-6 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                <AlertCircle size={28} />
              </div>
              <div className="flex-1">
                <h3 className="font-editorial text-xl font-bold text-amber-900 mb-1 leading-tight">Vercel Deployment Sync Required</h3>
                <p className="text-sm text-amber-700 mb-6 max-w-2xl">
                  Your app works here because of a local config file, but <span className="font-bold underline">Vercel requires environment variables</span> to be set manually. Without these, your live site will be blank.
                </p>
                
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800">Connection Checklist</p>
                    <div className="space-y-2">
                      {Object.entries(getFirebaseStatus().vars).map(([name, exists]) => (
                        <div key={name} className={`flex items-center justify-between p-2 rounded border text-[11px] font-mono ${exists ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-amber-200 text-amber-600'}`}>
                          <span>{name}</span>
                          <span className="flex items-center gap-1 font-bold">
                            {exists ? <><CheckCircle size={12} /> Stored</> : <><AlertCircle size={12} /> MISSING</>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/60 p-4 rounded border border-amber-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-3">Copy to Vercel Dashboard</p>
                    <p className="text-[11px] text-amber-700 mb-4 italic">
                      Go to Vercel {">"} Settings {">"} Environment Variables and add these:
                    </p>
                    <div className="space-y-1 font-mono text-[10px] text-amber-900 p-3 bg-white/40 rounded break-all select-all border border-amber-100">
                      <p>VITE_FIREBASE_API_KEY=your_key</p>
                      <p>VITE_FIREBASE_AUTH_DOMAIN={getFirebaseStatus().projectId}.firebaseapp.com</p>
                      <p>VITE_FIREBASE_PROJECT_ID={getFirebaseStatus().projectId}</p>
                      <p>VITE_FIREBASE_STORAGE_BUCKET={getFirebaseStatus().projectId}.firebasestorage.app</p>
                      <p>VITE_FIREBASE_APP_ID=your_app_id</p>
                    </div>
                    <p className="mt-4 text-[10px] text-amber-600 leading-relaxed font-medium">
                      * After adding these in Vercel, you must <span className="underline">Trigger a New Deployment</span> for changes to take effect.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-amber-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-800 mb-3">Fix Missing Images (CORS Setup)</p>
                  <p className="text-[11px] text-amber-700 mb-3">If images upload but don't show, paste this JSON into Google Cloud Console CORS Settings:</p>
                  <pre className="text-[9px] font-mono text-amber-900 bg-white/30 p-2 rounded overflow-x-auto select-all border border-amber-100">
{`{
  "cors": [
    {
      "origin": ["*"],
      "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
      "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
      "maxAgeSeconds": 3600
    }
  ]
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'create' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Publish New Article
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Article successfully published to the live feed.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Article Headline</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="Enter a compelling title..."
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Topic / Category</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent uppercase text-xs font-bold tracking-widest"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      {CATEGORIES.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Author Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. John Doe"
                      value={formData.author}
                      onChange={e => setFormData({...formData, author: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Author Title / Designation</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. Senior Strategy Analyst"
                      value={formData.authorDesignation}
                      onChange={e => setFormData({...formData, authorDesignation: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Brief Excerpt (Subheadline)</label>
                  <textarea 
                    required
                    rows={2}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-slate-600 leading-relaxed"
                    placeholder="Summary for the preview cards..."
                    value={formData.excerpt}
                    onChange={e => setFormData({...formData, excerpt: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Featured Image</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden"
                    >
                      {imagePreview ? (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={32} />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="text-slate-300 mb-2" size={32} />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Click to upload story visual</p>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    {imageFile && !imagePreview && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">File selected: {imageFile.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Estimated Read Time</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. 5 min"
                      value={formData.readTime}
                      onChange={e => setFormData({...formData, readTime: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 w-fit">
                  <input 
                    type="checkbox" 
                    id="featured" 
                    className="w-4 h-4 text-brand-accent rounded border-slate-300"
                    checked={formData.featured}
                    onChange={e => setFormData({...formData, featured: e.target.checked})}
                  />
                  <label htmlFor="featured" className="text-xs font-bold uppercase tracking-widest cursor-pointer">
                    Feature on Hero Section
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Full Article Content (Rich Text)</label>
                  <RichTextEditor 
                    content={formData.content} 
                    onChange={(content) => setFormData({...formData, content})} 
                    placeholder="Write your story here... Use the toolbar for formatting."
                  />
                </div>

                 <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Preparing Visuals ({Math.round(uploadProgress)}%)...
                    </>
                  ) : loading ? (
                    "Publishing Dispatch..."
                  ) : (
                    "Release Story for Circulation"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-event' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Post New Event
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Event successfully posted to the network.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleEventSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="editorial-label">Event Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                    placeholder="e.g. Fintech Lagos 2026"
                    value={eventFormData.title}
                    onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Date</label>
                    <input 
                      required
                      type="date" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      value={eventFormData.date}
                      onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Time</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. 10:00 AM - 4:00 PM"
                      value={eventFormData.time}
                      onChange={e => setEventFormData({...eventFormData, time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Location</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. Landmark Centre, VI, Lagos"
                    value={eventFormData.location}
                    onChange={e => setEventFormData({...eventFormData, location: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Registration Link (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. https://eventbrite.com/..."
                    value={eventFormData.registrationLink}
                    onChange={e => setEventFormData({...eventFormData, registrationLink: e.target.value})}
                  />
                </div>

                 <div className="space-y-2">
                  <label className="editorial-label">Event Image</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Event Graphic</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  {imageFile && !imagePreview && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">File selected: {imageFile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Event Description</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent"
                    placeholder="Tell us more about the event..."
                    value={eventFormData.description}
                    onChange={e => setEventFormData({...eventFormData, description: e.target.value})}
                  />
                </div>

                 <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading Asset...
                    </>
                  ) : loading ? (
                    "Staging Event..."
                  ) : (
                    "Publish Event"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-expert' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Add Industry Expert
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Expert profile successfully created.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleExpertSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Expert Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="e.g. Dr. Jane Smith"
                      value={expertFormData.name}
                      onChange={e => setExpertFormData({...expertFormData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Professional Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. CEO, FinTech Innovations"
                      value={expertFormData.title}
                      onChange={e => setExpertFormData({...expertFormData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <Twitter size={14} /> Twitter (X)
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="@username"
                      value={expertFormData.twitter}
                      onChange={e => setExpertFormData({...expertFormData, twitter: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <Linkedin size={14} /> LinkedIn
                    </label>
                    <input 
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="linkedin.com/in/..."
                      value={expertFormData.linkedin}
                      onChange={e => setExpertFormData({...expertFormData, linkedin: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label flex items-center gap-2">
                      <ExternalLink size={14} /> Website
                    </label>
                    <input 
                      type="url" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="https://..."
                      value={expertFormData.website}
                      onChange={e => setExpertFormData({...expertFormData, website: e.target.value})}
                    />
                  </div>
                </div>

                 <div className="space-y-2">
                  <label className="editorial-label">Expert Headshot</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={20} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-1" size={24} />
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <p className="text-[10px] text-slate-400 mt-2">Recommended: Square aspect ratio, transparent or clean background.</p>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Biography & Expertise</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent"
                    placeholder="Short bio and notable contributions..."
                    value={expertFormData.bio}
                    onChange={e => setExpertFormData({...expertFormData, bio: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Article Contributions Count</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    value={expertFormData.contributionsCount}
                    onChange={e => setExpertFormData({...expertFormData, contributionsCount: parseInt(e.target.value) || 0})}
                  />
                </div>

                 <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Storing Image...
                    </>
                  ) : loading ? (
                    "Adding Expert..."
                  ) : (
                    "Confirm Expert Profile"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'create-spotlight' ? (
          <section className="max-w-4xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8">
                Feature Founder Story
              </h2>

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-emerald-50 text-emerald-700 flex items-center gap-3 text-sm font-bold border border-emerald-100"
                >
                  <CheckCircle size={20} />
                  Spotlight story successfully created.
                </motion.div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 text-red-700 flex items-center gap-3 text-sm font-bold border border-red-100">
                  <AlertCircle size={20} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSpotlightSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="editorial-label">Founder Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent font-serif text-lg"
                      placeholder="e.g. Aliko Dangote"
                      value={spotlightFormData.founderName}
                      onChange={e => setSpotlightFormData({...spotlightFormData, founderName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label">Company Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                      placeholder="e.g. Dangote Group"
                      value={spotlightFormData.companyName}
                      onChange={e => setSpotlightFormData({...spotlightFormData, companyName: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Spotlight Title (Headline)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="e.g. Redefining Industrialization in Africa"
                    value={spotlightFormData.title}
                    onChange={e => setSpotlightFormData({...spotlightFormData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Feature Link (Optional)</label>
                  <input 
                    type="url" 
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent text-sm"
                    placeholder="https://..."
                    value={spotlightFormData.link}
                    onChange={e => setSpotlightFormData({...spotlightFormData, link: e.target.value})}
                  />
                </div>

                 <div className="space-y-2">
                  <label className="editorial-label">Spotlight Visual</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-accent transition-colors relative overflow-hidden"
                  >
                    {imagePreview ? (
                      <>
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Upload className="text-white" size={32} />
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-300 mb-2" size={32} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Spotlight Image</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="editorial-label">Founder's Story / Summary</label>
                  <textarea 
                    required
                    rows={6}
                    className="w-full p-4 bg-slate-50 border border-slate-200 outline-hidden focus:border-brand-accent"
                    placeholder="The narrative of their journey..."
                    value={spotlightFormData.story}
                    onChange={e => setSpotlightFormData({...spotlightFormData, story: e.target.value})}
                  />
                </div>

                 <button 
                  disabled={loading || uploading}
                  type="submit"
                  className="w-full py-5 bg-black text-white font-bold uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors disabled:bg-slate-300 flex items-center justify-center gap-3"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Uploading Asset...
                    </>
                  ) : loading ? (
                    "Publishing Spotlight..."
                  ) : (
                    "Confirm Spotlight Feature"
                  )}
                </button>
              </form>
            </div>
          </section>
        ) : view === 'manage-spotlight' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Founder Spotlights
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {spotlights.map(story => (
                  <div key={story.id} className="border border-slate-100 hover:border-brand-accent/30 transition-all flex flex-col relative group">
                    <button 
                      onClick={() => setSpotlightToDelete(story.id)}
                      className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="h-40 overflow-hidden">
                      <img src={story.image} alt={story.founderName} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-2">{story.companyName}</p>
                      <h3 className="font-editorial font-bold text-xl mb-4 text-slate-900">{story.founderName}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{story.story}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {spotlights.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-serif italic">No spotlights featured yet.</p>
                </div>
              )}
            </div>
          </section>
        ) : view === 'manage-experts' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Expert Network
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {experts.map(expert => (
                  <div key={expert.id} className="p-6 border border-slate-100 hover:border-brand-accent/30 transition-all flex flex-col items-center text-center relative group">
                    <button 
                      onClick={() => setExpertToDelete(expert.id)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-slate-200 mb-4">
                      <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                    </div>
                    
                    <h3 className="font-serif font-bold text-slate-900">{expert.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">{expert.title}</p>
                    
                    <div className="flex gap-4 mb-4">
                      {expert.twitter && <Twitter size={14} className="text-slate-400" />}
                      {expert.linkedin && <Linkedin size={14} className="text-slate-400" />}
                    </div>

                    <div className="pt-4 border-t border-slate-50 w-full">
                       <p className="text-[10px] font-bold text-brand-accent">{expert.contributionsCount || 0} CONTRIBUTIONS</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {experts.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 font-serif italic">No experts registered in the network.</p>
                </div>
              )}
            </div>
          </section>
        ) : view === 'manage-events' ? (
          <section className="max-w-5xl">
            <div className="bg-white border border-slate-200 p-8 md:p-12">
              <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Scheduled Events
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 italic-editorial text-xs text-slate-400">
                      <th className="pb-4 font-normal">Event Title</th>
                      <th className="pb-4 font-normal">Date</th>
                      <th className="pb-4 font-normal">Location</th>
                      <th className="pb-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {events.map(event => (
                      <tr key={event.id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="py-6 pr-6">
                          <span className="font-serif font-bold text-slate-900 line-clamp-1">{event.title}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-xs text-slate-500 font-mono tracking-tight">{event.date}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-xs text-slate-500">{event.location}</span>
                        </td>
                        <td className="py-6 text-right">
                          <button 
                            disabled={deletingEventIds.includes(event.id)}
                            onClick={() => setEventToDelete(event.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete Event"
                          >
                            {deletingEventIds.includes(event.id) ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-serif italic">No events scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="max-w-5xl">
             <div className="bg-white border border-slate-200 p-8 md:p-12">
               <h2 className="text-2xl font-editorial font-bold mb-8 flex items-center gap-3 underline decoration-brand-accent underline-offset-8 text-black">
                Manage Circulation
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 italic-editorial text-xs text-slate-400">
                      <th className="pb-4 font-normal">Story Headline</th>
                      <th className="pb-4 font-normal">Category</th>
                      <th className="pb-4 font-normal">Date Published</th>
                      <th className="pb-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {articles.map(article => (
                      <tr key={article.id} className="group transition-colors hover:bg-slate-50/50">
                        <td className="py-6 pr-6">
                          <span className="font-serif font-bold text-slate-900 line-clamp-1">{article.title}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">{article.category}</span>
                        </td>
                        <td className="py-6">
                           <span className="text-xs text-slate-500 font-mono tracking-tight">{article.date}</span>
                        </td>
                        <td className="py-6 text-right">
                          <button 
                            disabled={deletingIds.includes(article.id)}
                            onClick={() => setArticleToDelete(article.id)}
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Delete Article"
                          >
                            {deletingIds.includes(article.id) ? (
                              <Loader2 className="animate-spin" size={18} />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {articles.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 font-serif italic">The feed is currently empty.</p>
                  </div>
                )}
              </div>
             </div>
          </section>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {(articleToDelete || eventToDelete || expertToDelete) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white max-w-md w-full p-8 border border-slate-200 shadow-2xl"
          >
            <h3 className="text-xl font-editorial font-bold mb-4">
              {articleToDelete ? "Cease Circulation?" : eventToDelete ? "Cancel Event?" : "Remove Expert?"}
            </h3>
            <p className="text-slate-500 mb-8 leading-relaxed">
              {articleToDelete 
                ? "This action will permanently remove this story from the public feed. It cannot be recovered."
                : eventToDelete
                ? "This action will permanently remove this event from the calendar. It cannot be recovered."
                : "This action will remove the expert profile and their linked credentials from the public network."
              }
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  setArticleToDelete(null);
                  setEventToDelete(null);
                  setExpertToDelete(null);
                }}
                className="flex-1 py-3 border border-slate-200 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-colors"
              >
                {articleToDelete ? "Retain Story" : eventToDelete ? "Keep Event" : "Retain Expert"}
              </button>
              <button 
                disabled={
                  articleToDelete ? deletingIds.includes(articleToDelete) : 
                  eventToDelete ? deletingEventIds.includes(eventToDelete!) :
                  deletingExpertIds.includes(expertToDelete!)
                }
                onClick={() => {
                  if (articleToDelete) handleDelete(articleToDelete);
                  else if (eventToDelete) handleEventDelete(eventToDelete);
                  else if (expertToDelete) handleExpertDelete(expertToDelete);
                }}
                className="flex-1 py-3 bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-red-700 transition-colors disabled:bg-slate-300"
              >
                {articleToDelete 
                  ? (deletingIds.includes(articleToDelete) ? "Decommissioning..." : "Confirm Deletion")
                  : eventToDelete
                  ? (deletingEventIds.includes(eventToDelete!) ? "Removing..." : "Confirm Cancellation")
                  : (deletingExpertIds.includes(expertToDelete!) ? "Removing..." : "Confirm Removal")
                }
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
