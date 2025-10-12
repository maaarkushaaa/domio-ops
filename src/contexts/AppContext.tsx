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
  isLoadingAuth: boolean;
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

// Initialize with empty data - all data comes from Supabase
const getInitialState = (): AppState => {
  return {
    user: null,
    tasks: [],
    projects: [],
    clients: [],
    products: [],
    financialOperations: [],
    suppliers: [],
  };
};

export function AppProvider({ children }: { children: ReactNode }) {
  console.log('🏗️ AppProvider initializing - Supabase Auth Only');
  
  const [state, setState] = useState<AppState>(getInitialState);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Initialize user from Supabase session
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Set a minimal user immediately to avoid UI hanging
          const baseUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || '',
            role: 'member',
            created_at: session.user.created_at,
          };
          setUser(baseUser);

          // Fetch profile and role in background and update when ready
          (async () => {
            try {
          // @ts-ignore - Types will be regenerated after migration
          const { data: profile } = await supabase
            // @ts-ignore
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          // @ts-ignore - Types will be regenerated after migration
          const { data: userRole } = await supabase
            // @ts-ignore
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

              const hydratedUser: User = {
                ...baseUser,
            // @ts-ignore
                name: (profile && profile.full_name) || baseUser.name,
            // @ts-ignore
                role: ((userRole && userRole.role) as any) || baseUser.role,
              };
              console.log('✅ User initialized from Supabase session:', hydratedUser.email, 'Role:', hydratedUser.role);
              setUser(hydratedUser);
            } catch (innerError) {
              console.error('Error hydrating user profile/role:', innerError);
            } finally {
              setIsLoadingAuth(false);
            }
          })();
        } else {
          setIsLoadingAuth(false);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        setIsLoadingAuth(false);
      }
    };

    initializeUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Set minimal user immediately
          const baseUser: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || '',
            role: 'member',
            created_at: session.user.created_at,
          };
          setUser(baseUser);

          // Hydrate with profile and role in background
          (async () => {
            try {
          // @ts-ignore - Types will be regenerated after migration
          const { data: profile } = await supabase
            // @ts-ignore
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          // @ts-ignore - Types will be regenerated after migration
          const { data: userRole } = await supabase
            // @ts-ignore
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

              const hydratedUser: User = {
                ...baseUser,
            // @ts-ignore
                name: (profile && profile.full_name) || baseUser.name,
            // @ts-ignore
                role: ((userRole && userRole.role) as any) || baseUser.role,
              };
              console.log('✅ User signed in:', hydratedUser.email, 'Role:', hydratedUser.role);
              setUser(hydratedUser);
            } catch (innerError) {
              console.error('Error getting user data on sign in:', innerError);
            }
          })();
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
    console.log('👤 Setting user:', user ? `${user.email} (${user.role})` : 'null');
    setState(prev => ({ ...prev, user }));
  };

  const signIn = async (email: string, password: string) => {
    if (!password || password.trim().length === 0) {
      throw new Error('Пароль не может быть пустым');
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('❌ Login failed:', authError.message);
      throw new Error('Неверный email или пароль');
    }

    if (!authData.user) {
      throw new Error('Ошибка аутентификации');
    }

    // Auth state change listener will handle setting the user
    console.log('✅ Login successful');
  };

  const signUp = async (email: string, password: string, name: string) => {
    if (!email || !password || !name) {
      throw new Error('Все поля обязательны для заполнения');
    }

    if (password.length < 6) {
      throw new Error('Пароль должен быть не менее 6 символов');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (authError) {
      console.error('❌ Signup failed:', authError.message);
      throw new Error(authError.message === 'User already registered' 
        ? 'Пользователь с таким email уже зарегистрирован'
        : 'Ошибка регистрации');
    }

    if (!authData.user) {
      throw new Error('Ошибка создания пользователя');
    }

    // Role assignment is handled by the database trigger automatically
    console.log('✅ Registration successful');
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
        isLoadingAuth,
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
