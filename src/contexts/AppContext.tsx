import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assignee_id?: string;
  project_id?: string;
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
  email?: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  unit_price: number;
  quantity_in_stock: number;
  created_at: string;
}

export interface FinancialOperation {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  account_id?: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
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
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('appState');
    return saved ? JSON.parse(saved) : generateMockData();
  });

  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify(state));
  }, [state]);

  const setUser = (user: User | null) => {
    setState(prev => ({ ...prev, user }));
  };

  const signIn = async (email: string, password: string) => {
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 500));
    const user: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    setUser(user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const user: User = {
      id: '1',
      email,
      name,
      role: 'member',
      created_at: new Date().toISOString(),
    };
    setUser(user);
  };

  const signOut = () => {
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
