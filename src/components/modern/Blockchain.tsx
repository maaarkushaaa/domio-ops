import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Lock, Check, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  type: 'contract' | 'payment' | 'document';
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  amount?: number;
}

export function Blockchain() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'contract',
      hash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [newTransaction, setNewTransaction] = useState('');
  const { toast } = useToast();

  const createTransaction = () => {
    if (!newTransaction.trim()) return;

    const tx: Transaction = {
      id: Date.now().toString(),
      type: 'document',
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    setTransactions([tx, ...transactions]);
    setNewTransaction('');

    setTimeout(() => {
      setTransactions(prev =>
        prev.map(t => (t.id === tx.id ? { ...t, status: 'confirmed' } : t))
      );
      toast({
        title: 'Транзакция подтверждена',
        description: 'Документ добавлен в blockchain',
      });
    }, 3000);
  };

  return (
    <Card className="glass-card hover-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Blockchain Записи
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Данные для записи..."
            value={newTransaction}
            onChange={(e) => setNewTransaction(e.target.value)}
            className="focus-elegant"
          />
          <Button onClick={createTransaction} className="hover-lift">
            <Lock className="h-4 w-4 mr-2" />
            Записать
          </Button>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-lg bg-muted/50 border border-border/50 animate-fade-in"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                    {tx.type}
                  </Badge>
                  {tx.status === 'confirmed' ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning animate-pulse" />
                  )}
                </div>
                <p className="text-xs font-mono truncate text-muted-foreground">
                  {tx.hash}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(tx.timestamp).toLocaleString('ru-RU')}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
