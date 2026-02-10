import { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Camera,
  Save,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';

export function ProfileSettings() {
  const { user } = useAuth();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const { toast } = useToast();
  
  const [empresaNome, setEmpresaNome] = useState(settings?.empresa_nome || '');
  const [whatsapp, setWhatsapp] = useState(settings?.whatsapp || '');
  const [saving, setSaving] = useState(false);

  // Update local state when settings load
  useState(() => {
    if (settings?.empresa_nome) setEmpresaNome(settings.empresa_nome);
    if (settings?.whatsapp) setWhatsapp(settings.whatsapp);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({
        empresa_nome: empresaNome,
        whatsapp: whatsapp,
      });
      toast({
        title: 'Configurações salvas!',
        description: 'Suas preferências foram atualizadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Perfil e Configurações
        </CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={settings?.empresa_logo_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full"
            >
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-sm text-muted-foreground">Membro desde o início</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="empresa" className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              Nome da Empresa
            </Label>
            <Input
              id="empresa"
              value={empresaNome}
              onChange={(e) => setEmpresaNome(e.target.value)}
              placeholder="Sua construtora ou empresa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              WhatsApp (Portal do Cliente)
            </Label>
            <Input
              id="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="5511999999999"
            />
            <p className="text-xs text-muted-foreground">
              Número com código do país (ex: 5511999999999). Aparece como botão no Portal do Cliente.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || isLoading}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
