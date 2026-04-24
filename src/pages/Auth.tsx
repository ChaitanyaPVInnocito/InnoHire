import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth, type AppRole } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import innohireLogo from '@/assets/innohire-logo.jpeg';
import { Loader2 } from 'lucide-react';

const roleLabels: Record<string, string> = {
  'hiring-manager': 'Hiring Manager',
  'lob-head': 'LOB Head',
  'tag-manager': 'TAG'
};

interface InvitationData {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  secondary_role: AppRole | null;
  token: string;
  used: boolean;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!inviteToken) return;

    const fetchInvitation = async () => {
      const { data, error } = await supabase.
      from('invitations').
      select('*').
      eq('token', inviteToken).
      eq('used', false).
      single();

      if (error || !data) {
        setInviteError('This invitation link is invalid or has already been used.');
      } else {
        const inv = data as unknown as InvitationData;
        setInvitation(inv);
        setEmail(inv.email);
        setFullName(inv.full_name);
      }
      setInviteLoading(false);
    };

    fetchInvitation();
  }, [inviteToken]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Sign in failed', description: error, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    setSubmitting(true);

    // Collect all roles from invitation
    const roles: AppRole[] = [invitation.role];
    if (invitation.secondary_role) {
      roles.push(invitation.secondary_role);
    }

    const { error } = await signUp(email, password, fullName, roles);
    if (error) {
      toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    // Mark invitation as used
    await supabase.
    from('invitations').
    update({ used: true }).
    eq('id', invitation.id);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Check your email', description: 'We sent you a verification link. Please verify your email before signing in.' });
    }
    setSubmitting(false);
  };

  const getInvitationRoleLabels = () => {
    if (!invitation) return '';
    const labels = [roleLabels[invitation.role]];
    if (invitation.secondary_role) labels.push(roleLabels[invitation.secondary_role]);
    return labels;
  };

  if (inviteToken) {
    if (inviteLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>);

    }

    if (inviteError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-sm sm:max-w-md">
            <CardHeader className="text-center px-4 sm:px-6">
              <img src={innohireLogo} alt="InnoHire Logo" className="h-10 sm:h-14 w-auto mx-auto mb-3" />
              <CardTitle className="text-xl sm:text-2xl">Invalid Invitation</CardTitle>
              <CardDescription>{inviteError}</CardDescription>
            </CardHeader>
            <CardContent className="text-center px-4 sm:px-6">
              <Button variant="outline" onClick={() => window.location.href = '/auth'}>
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>);

    }

    const roleLabelsArray = getInvitationRoleLabels();

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm sm:max-w-md">
          <CardHeader className="text-center px-4 sm:px-6">
            <img src={innohireLogo} alt="InnoHire Logo" className="h-10 sm:h-14 w-auto mx-auto mb-3" />
            <CardTitle className="text-xl sm:text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              You've been invited to join InnoHire
            </CardDescription>
          </CardHeader>

          <CardContent className="px-4 sm:px-6">
            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {Array.isArray(roleLabelsArray) && roleLabelsArray.length > 1 ? 'Your assigned roles:' : 'Your assigned role:'}
              </span>
              <div className="flex gap-1">
                {Array.isArray(roleLabelsArray) && roleLabelsArray.map((label, i) =>
                <Badge key={i} variant="secondary">{label}</Badge>
                )}
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="h-11 sm:h-10" />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="bg-muted h-11 sm:h-10" />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11 sm:h-10" />
                
              </div>

              <Button type="submit" className="w-full h-11 sm:h-10" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm sm:max-w-md">
        <CardHeader className="text-center px-4 sm:px-6">
          <img src={innohireLogo} alt="InnoHire Logo" className="h-10 sm:h-14 w-auto mx-auto mb-3" />
          <CardTitle className="text-xl sm:text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to your InnoHire account</CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}

                required
                className="h-11 sm:h-10" placeholder="You@Innocito.com" />
              
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="h-11 sm:h-10" />
              
            </div>

            <Button type="submit" className="w-full h-11 sm:h-10" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Sign In
            </Button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>);

}