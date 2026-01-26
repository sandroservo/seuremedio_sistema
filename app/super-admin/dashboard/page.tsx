'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { usePharmacies, Pharmacy } from '@/hooks/use-pharmacies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Plus,
  Users,
  Package,
  ShoppingCart,
  Edit,
  Trash2,
  Power,
  Loader2,
  X,
  LogOut,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PharmacyUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { pharmacies, isLoading, createPharmacy, updatePharmacy, deletePharmacy, toggleActive, refetch } = usePharmacies();
  
  const [showForm, setShowForm] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Pharmacy | null>(null);

  const [managingPharmacy, setManagingPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacyUsers, setPharmacyUsers] = useState<PharmacyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN' as 'ADMIN' | 'DELIVERY',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.replace('/super-admin/login');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPharmacy) {
        await updatePharmacy(editingPharmacy.id, formData);
        setFeedback({ type: 'success', message: 'Farmácia atualizada com sucesso!' });
      } else {
        await createPharmacy(formData);
        setFeedback({ type: 'success', message: 'Farmácia criada com sucesso!' });
      }
      resetForm();
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao salvar farmácia' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', address: '', phone: '', email: '' });
    setEditingPharmacy(null);
    setShowForm(false);
  };

  const handleEdit = (pharmacy: Pharmacy) => {
    setEditingPharmacy(pharmacy);
    setFormData({
      name: pharmacy.name,
      description: pharmacy.description || '',
      address: pharmacy.address || '',
      phone: pharmacy.phone || '',
      email: pharmacy.email || '',
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePharmacy(deleteConfirm.id);
      setFeedback({ type: 'success', message: 'Farmácia excluída com sucesso!' });
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao excluir farmácia' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleActive = async (pharmacy: Pharmacy) => {
    try {
      await toggleActive(pharmacy.id, !pharmacy.active);
      setFeedback({ 
        type: 'success', 
        message: pharmacy.active ? 'Farmácia desativada' : 'Farmácia ativada' 
      });
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao alterar status' });
    }
  };

  const handleManageUsers = async (pharmacy: Pharmacy) => {
    setManagingPharmacy(pharmacy);
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/pharmacies/${pharmacy.id}/users`);
      if (res.ok) {
        const data = await res.json();
        setPharmacyUsers(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingPharmacy) return;
    
    setAddingUser(true);
    try {
      const res = await fetch(`/api/pharmacies/${managingPharmacy.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData),
      });
      
      if (res.ok) {
        const data = await res.json();
        setPharmacyUsers([...pharmacyUsers, data]);
        setNewUserData({ name: '', email: '', password: '', role: 'ADMIN', phone: '' });
        setShowAddUser(false);
        setFeedback({ type: 'success', message: 'Usuário adicionado com sucesso!' });
        refetch();
      } else {
        const error = await res.json();
        setFeedback({ type: 'error', message: error.error || 'Erro ao adicionar usuário' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao adicionar usuário' });
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!managingPharmacy) return;
    try {
      const res = await fetch(`/api/pharmacies/${managingPharmacy.id}/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPharmacyUsers(pharmacyUsers.filter(u => u.id !== userId));
        setFeedback({ type: 'success', message: 'Usuário removido da farmácia' });
        refetch();
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao remover usuário' });
    }
  };

  const totalStats = pharmacies.reduce(
    (acc, p) => ({
      users: acc.users + (p._count?.users || 0),
      medications: acc.medications + (p._count?.medications || 0),
      orders: acc.orders + (p._count?.orders || 0),
    }),
    { users: 0, medications: 0, orders: 0 }
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-r from-purple-900 to-indigo-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-white/80 text-sm font-medium">| Super Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/80 text-sm">{user.name}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Painel do Gerenciador</h1>
            <p className="text-muted-foreground">Gerencie todas as farmácias do sistema</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Farmácia
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pharmacies.length}</p>
                  <p className="text-sm text-muted-foreground">Farmácias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.users}</p>
                  <p className="text-sm text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.medications}</p>
                  <p className="text-sm text-muted-foreground">Medicamentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalStats.orders}</p>
                  <p className="text-sm text-muted-foreground">Pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPharmacy ? 'Editar Farmácia' : 'Nova Farmácia'}</CardTitle>
              <CardDescription>
                {editingPharmacy 
                  ? 'Atualize os dados da farmácia' 
                  : 'Preencha os dados para criar uma nova farmácia'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nome *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nome da farmácia"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@farmacia.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição da farmácia"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endereço</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Telefone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingPharmacy ? 'Atualizar' : 'Criar Farmácia'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Farmácias Cadastradas</CardTitle>
            <CardDescription>Lista de todas as farmácias do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pharmacies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma farmácia cadastrada</p>
                <p className="text-sm">Clique em "Nova Farmácia" para adicionar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pharmacies.map((pharmacy) => (
                  <div
                    key={pharmacy.id}
                    className={`border rounded-lg p-4 ${!pharmacy.active ? 'bg-gray-50 opacity-75' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{pharmacy.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              pharmacy.active 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pharmacy.active ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{pharmacy.slug}</p>
                          {pharmacy.description && (
                            <p className="text-sm text-muted-foreground mt-1">{pharmacy.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {pharmacy._count?.users || 0} usuários
                            </span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {pharmacy._count?.medications || 0} medicamentos
                            </span>
                            <span className="flex items-center gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              {pharmacy._count?.orders || 0} pedidos
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageUsers(pharmacy)}
                          title="Gerenciar Usuários"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(pharmacy)}
                          title={pharmacy.active ? 'Desativar' : 'Ativar'}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pharmacy)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteConfirm(pharmacy)}
                          className="text-red-600 hover:text-red-700"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {feedback && (
        <AlertDialog open={!!feedback} onOpenChange={() => setFeedback(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className={feedback.type === 'error' ? 'text-red-600' : 'text-green-600'}>
                {feedback.type === 'error' ? 'Erro' : 'Sucesso'}
              </AlertDialogTitle>
              <AlertDialogDescription>{feedback.message}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Farmácia</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a farmácia "{deleteConfirm?.name}"? 
              Esta ação não pode ser desfeita e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!managingPharmacy} onOpenChange={() => { setManagingPharmacy(null); setShowAddUser(false); }}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários - {managingPharmacy?.name}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Gerencie os administradores e entregadores desta farmácia
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            {!showAddUser && (
              <Button onClick={() => setShowAddUser(true)} className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Usuário
              </Button>
            )}

            {showAddUser && (
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Novo Usuário</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nome *</label>
                        <Input
                          value={newUserData.name}
                          onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          type="email"
                          value={newUserData.email}
                          onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                          placeholder="email@exemplo.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Senha *</label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={newUserData.password}
                            onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Telefone</label>
                        <Input
                          value={newUserData.phone}
                          onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Função *</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="ADMIN"
                            checked={newUserData.role === 'ADMIN'}
                            onChange={() => setNewUserData({ ...newUserData, role: 'ADMIN' })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Administrador</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="role"
                            value="DELIVERY"
                            checked={newUserData.role === 'DELIVERY'}
                            onChange={() => setNewUserData({ ...newUserData, role: 'DELIVERY' })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Entregador</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={addingUser}>
                        {addingUser && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Adicionar
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loadingUsers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : pharmacyUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Nenhum usuário associado a esta farmácia</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pharmacyUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        u.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role === 'ADMIN' ? 'Admin' : 'Entregador'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(u.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
