import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee_id?: string;
  assignee?: { id: string; full_name: string };
  project_id?: string;
  project?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'quality_check' | 'completed' | 'on_hold';
  progress: number;
  assignee_id?: string;
  assignee?: { id: string; full_name: string };
  deadline?: string;
  unit_price?: number;
  quantity_in_stock?: number;
  created_at: string;
}

export interface FinancialOperation {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  category: string;
  description?: string;
  date: string;
  account_id?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  category?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  delivery_time?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AppState {
  user: User | null;
  tasks: Task[];
  projects: Project[];
  clients: Client[];
  products: Product[];
  financialOperations: FinancialOperation[];
  suppliers: Supplier[];
}

interface AppContextType extends AppState {
  setUser: (user: User | null) => void;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  addClient: (client: Omit<Client, 'id' | 'created_at'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  addFinancialOperation: (operation: Omit<FinancialOperation, 'id' | 'created_at'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at'>) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock data generator
const generateMockData = (): AppState => {
  const now = new Date().toISOString();
  
  return {
    user: null,
    tasks: [
      {
        id: '1',
        title: 'Complete project proposal',
        description: 'Finish the Q4 project proposal document',
        status: 'in_progress',
        priority: 'high',
        due_date: '2025-10-15',
        created_at: now,
        updated_at: now,
      },
      {
        id: '2',
        title: 'Review code changes',
        status: 'todo',
        priority: 'medium',
        created_at: now,
        updated_at: now,
      },
    ],
    projects: [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        status: 'active',
        budget: 50000,
        start_date: '2025-10-01',
        created_at: now,
      },
    ],
    clients: [
      {
        id: '1',
        name: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        status: 'active',
        created_at: now,
      },
    ],
    products: [
      {
        id: '1',
        name: 'Premium Widget',
        sku: 'WDG-001',
        description: 'High-quality widget for industrial use',
        status: 'in_progress',
        progress: 60,
        unit_price: 299.99,
        quantity_in_stock: 150,
        created_at: now,
      },
    ],
    financialOperations: [
      {
        id: '1',
        type: 'income',
        amount: 5000,
        currency: 'RUB',
        category: 'Sales',
        description: 'Product sale',
        date: now,
        created_at: now,
      },
    ],
    suppliers: [
      {
        id: '1',
        name: 'Global Supply Co',
        email: 'orders@globalsupply.com',
        phone: '+1987654321',
        status: 'active',
        created_at: now,
      },
    ],
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  console.log('🏗️ AppProvider initializing - ULTRA CLEAN MODE');
  
  const [state, setState] = useState<AppState>(() => {
    // ULTRA AGGRESSIVE CLEANING
    console.log('🧹 ULTRA CLEANING: Clearing ALL storage and cache');
    
    // Clear all possible storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Unregister service worker if it exists
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          console.log('🚫 Unregistering Service Worker:', registration.scope);
          registration.unregister();
        });
      });
    }
    
    // Force reload if demo user detected
    const saved = localStorage.getItem('appState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.user && (parsed.user.email === 'mknev@domio.ops' || parsed.user.id === 'admin-1')) {
          console.log('🚨 DEMO USER DETECTED - FORCING RELOAD');
          localStorage.clear();
          window.location.reload();
        }
      } catch (e) {
        localStorage.clear();
      }
    }
    
    // Always start with clean state
    const initialState = generateMockData();
    initialState.user = null;
    
    console.log('📊 ULTRA CLEAN Initial state:', initialState.user ? `User logged in: ${initialState.user.email} (${initialState.user.role})` : 'No user');
    return initialState;
  });

  useEffect(() => {
    // ULTRA AGGRESSIVE: Block saving demo users
    if (state.user && (state.user.email === 'mknev@domio.ops' || state.user.id === 'admin-1')) {
      console.log('🚨 BLOCKING SAVE OF DEMO USER:', state.user.email, state.user.id);
      return;
    }
    
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  // Initialize user from Supabase session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('🔄 ULTRA CLEAN: Initializing user from Supabase only');
        
        // ULTRA CLEAN: Clear any demo user data
        const saved = localStorage.getItem('appState');
        if (saved) {
          const parsedState = JSON.parse(saved);
          if (parsedState.user && (parsedState.user.id === 'admin-1' || parsedState.user.email === 'mknev@domio.ops')) {
            console.log('🚨 DEMO USER DETECTED IN INIT - CLEARING');
            localStorage.clear();
            setUser(null);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('🔍 Found Supabase session for:', session.user.email);
          
          // Get user profile and role from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.email?.split('@')[0] || '',
            role: userRole?.role || 'user',
            created_at: session.user.created_at,
          };

          console.log('✅ ULTRA CLEAN: User initialized from Supabase session:', user.email, 'Role:', user.role);
          setUser(user);
        } else {
          console.log('ℹ️ ULTRA CLEAN: No Supabase session found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ ULTRA CLEAN: Error initializing user:', error);
        setUser(null);
      }
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Get user profile and role from database
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const { data: userRole } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

          const user: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.email?.split('@')[0] || '',
            role: userRole?.role || 'user',
            created_at: session.user.created_at,
          };

          console.log('✅ User signed in:', user.email, 'Role:', user.role);
          setUser(user);
        } catch (error) {
          console.error('Error getting user data on sign in:', error);
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUser = (user: User | null) => {
    // ULTRA AGGRESSIVE: Block demo users
    if (user && (user.email === 'mknev@domio.ops' || user.id === 'admin-1')) {
      console.log('🚨 BLOCKING DEMO USER:', user.email, user.id);
      console.log('🧹 FORCING CLEAR AND RELOAD');
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
      return;
    }
    
    console.log('👤 Setting user:', user ? `${user.email} (${user.role})` : 'null');
    setState(prev => ({ ...prev, user }));
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Supabase authentication only
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.includes('@') ? email : `${email}@domio-group.ru`, // Handle username login
        password: password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error(authError.message);
      }

      if (authData.user) {
        // Get user profile and role from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          name: profile?.full_name || authData.user.email?.split('@')[0] || email,
          role: userRole?.role || 'user',
          created_at: authData.user.created_at,
        };

        console.log('✅ Supabase login successful:', user.email, 'Role:', user.role);
        setUser(user);
        return;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error; // Re-throw error to show in UI
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Supabase registration only
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (authError) {
        console.error('Supabase signup error:', authError);
        throw new Error(authError.message);
      }

      if (authData.user) {
        // User will be created automatically by trigger
        // Assign default role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'user'
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
        }

        const user: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          name: name,
          role: 'user',
          created_at: authData.user.created_at,
        };
        
        console.log('✅ Supabase registration successful:', user.email);
        setUser(user);
        return;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Re-throw error to show in UI
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Supabase signout error:', error);
    }
    
    // Clear local state
    setUser(null);
  };

  const addTask = (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      created_at: now,
      updated_at: now,
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === id ? { ...task, ...updates, updated_at: new Date().toISOString() } : task
      ),
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== id),
    }));
  };

  const addProject = (project: Omit<Project, 'id' | 'created_at'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(project =>
        project.id === id ? { ...project, ...updates } : project
      ),
    }));
  };

  const addClient = (client: Omit<Client, 'id' | 'created_at'>) => {
    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, clients: [...prev.clients, newClient] }));
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(client =>
        client.id === id ? { ...client, ...updates } : client
      ),
    }));
  };

  const addProduct = (product: Omit<Product, 'id' | 'created_at'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, products: [...prev.products, newProduct] }));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setState(prev => ({
      ...prev,
      products: prev.products.map(product =>
        product.id === id ? { ...product, ...updates } : product
      ),
    }));
  };

  const addFinancialOperation = (operation: Omit<FinancialOperation, 'id' | 'created_at'>) => {
    const newOperation: FinancialOperation = {
      ...operation,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      financialOperations: [...prev.financialOperations, newOperation],
    }));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'created_at'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, suppliers: [...prev.suppliers, newSupplier] }));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUser,
        addTask,
        updateTask,
        deleteTask,
        addProject,
        updateProject,
        addClient,
        updateClient,
        addProduct,
        updateProduct,
        addFinancialOperation,
        addSupplier,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
