import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import {
    LogIn,
    User,
    Lock,
    AlertCircle,
    KeyRound,
    Eye,
    EyeOff,
    ShieldCheck,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
    Check,
    Sparkles
} from 'lucide-react';

/**
 * Turn a sign-in failure into a sentence in the user's own language.
 */
export function translateLoginError(err, t) {
    const code = err?.code || err?.body?.code || '';
    const status = err?.status;
    const raw = typeof err?.message === 'string' ? err.message.trim() : '';

    if (code === 'account_disabled' || raw === 'This account is not active. Contact an administrator.') {
        return t('error_account_disabled');
    }

    const locked = /^Account locked\. Try again in (\d+) minute/i.exec(raw);
    if (locked) return t('error_account_locked', { minutes: Number(locked[1]) });

    if (raw === 'Invalid username or password' || (status === 401 && !raw)) {
        return t('error_invalid_credentials');
    }
    if (raw === 'Username and password are required') return t('error_credentials_required');
    if (status === 429 || /^Too many /i.test(raw)) return t('error_too_many_attempts');
    if (raw.startsWith('Cannot connect to server')) return t('error_cannot_connect');
    if (raw.startsWith('Server returned empty response') || raw.startsWith('Invalid server response')) {
        return t('error_bad_server_response');
    }
    if (!raw || raw === 'Login failed') return t('login_failed');
    return t('login_failed_detail', { detail: raw });
}

/**
 * The 5 platform role profiles with their hierarchy, permissions and quick credentials.
 */
const ROLES = [
    {
        id: 'student',
        rank: 1,
        title: 'Student / Trainee',
        badge: 'Rank 1',
        icon: GraduationCap,
        color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        username: 'student',
        defaultPass: 'student123',
        description: 'Run sessions, talk to the patient (text or voice), order labs / radiology / treatments, examine, view own session history.',
        descriptionPt: 'Executa simulações, conversa com o paciente (voz/texto), solicita exames laboratoriais, radiologia/PACS, condutas e exame físico.'
    },
    {
        id: 'reviewer',
        rank: 2,
        title: 'Reviewer / QA',
        badge: 'Rank 2',
        icon: ClipboardCheck,
        color: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-300',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        username: 'reviewer',
        defaultPass: 'reviewer123',
        description: 'Read-only analytics + catalog access. Useful for QA reviewers without authoring rights.',
        descriptionPt: 'Acesso somente-leitura a análises pedagógicas e catálogo de casos. Ideal para revisores de qualidade sem direito de edição.'
    },
    {
        id: 'educator',
        rank: 3,
        title: 'Educator / Docente',
        badge: 'Rank 3',
        icon: BookOpen,
        color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        username: 'educator',
        defaultPass: 'educator123',
        description: 'Trainee-level + create / edit cases, scenarios, agents, lab catalogs. Cannot touch platform settings, users, or audit logs.',
        descriptionPt: 'Nível estudante + criar/editar casos clínicos, cenários, agentes e catálogos laboratoriais. Sem acesso a configurações globais.'
    },
    {
        id: 'admin',
        rank: 4,
        title: 'Admin / Coordenador',
        badge: 'Rank 4',
        icon: ShieldCheck,
        color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        username: 'admin',
        defaultPass: 'admin123',
        description: 'Full authoring + user management, agent persona editor, platform settings, audit logs + system_audit_log, soft-delete + purge endpoints.',
        descriptionPt: 'Acesso irrestrito: gestão de turmas e usuários, editor de personas, configurações globais da plataforma, logs de auditoria e purga.'
    }
];

export default function LoginPage({ onSwitchToRegister, onSwitchToInvite, policy }) {
    const { t, i18n } = useTranslation('auth');
    const isPt = (i18n?.language || 'pt').startsWith('pt');

    const [selectedRole, setSelectedRole] = useState(ROLES[0]);
    const [username, setUsername] = useState(ROLES[0].username);
    const [password, setPassword] = useState(ROLES[0].defaultPass);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const inviteOnly = Boolean(policy?.invite_required);

    const handleSelectRole = (role) => {
        setSelectedRole(role);
        setUsername(role.username);
        setPassword(role.defaultPass);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(translateLoginError(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="osiris-glass-card p-6 lg:p-8 shadow-[0_24px_60px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                    {t('welcome_back', { defaultValue: 'Entrar no Lukas 1.0' })}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> by Jvps
                </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
                {isPt
                    ? 'Selecione um perfil de acesso (Role) ou entre com suas credenciais:'
                    : 'Select an access profile (Role) or sign in with your credentials:'}
            </p>

            {/* Role selection ladder */}
            <div className="mb-5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>{isPt ? 'Perfis de Usuário (Roles)' : 'User Roles & Ranks'}</span>
                    <span className="text-[10px] text-teal-300 font-normal">
                        {isPt ? 'Clique para preencher' : 'Click to select'}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => {
                        const Icon = r.icon;
                        const isSelected = selectedRole?.id === r.id;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => handleSelectRole(r)}
                                className={`p-2.5 rounded-xl text-left border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                                    isSelected
                                        ? `bg-gradient-to-br ${r.color} shadow-lg ring-1 ring-white/30 scale-[1.02]`
                                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-slate-300'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="text-xs font-bold text-white truncate">{r.title.split('/')[0]}</span>
                                    </div>
                                    <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${r.badgeColor}`}>
                                        {r.badge}
                                    </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                    user: <span className="text-slate-200 font-semibold">{r.username}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Selected Role Description Box */}
                {selectedRole && (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md mt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <selectedRole.icon className="w-3.5 h-3.5 text-teal-300 shrink-0" />
                            <span className="text-xs font-bold text-white">{selectedRole.title} ({selectedRole.badge})</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            {isPt ? selectedRole.descriptionPt : selectedRole.description}
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-200 text-xs backdrop-blur-md shadow-sm"
                >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" aria-hidden="true" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Username */}
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        {t('username', { defaultValue: 'Usuário' })}
                    </label>
                    <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            placeholder={t('enter_username', { defaultValue: 'Digite o usuário' })}
                            autoComplete="username"
                            className="w-full osiris-glass-input pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-500 disabled:opacity-50"
                            required
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        {t('password', { defaultValue: 'Senha' })}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder={t('enter_password', { defaultValue: 'Digite a senha' })}
                            autoComplete="current-password"
                            className="w-full osiris-glass-input pl-10 pr-12 py-2.5 text-sm placeholder:text-slate-500 disabled:opacity-50"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? t('hide_password') : t('show_password')}
                            tabIndex={-1}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full osiris-btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{t('signing_in', { defaultValue: 'Entrando…' })}</span>
                        </>
                    ) : (
                        <>
                            <LogIn className="w-4 h-4" />
                            <span>{t('sign_in', { defaultValue: 'Entrar' })}</span>
                        </>
                    )}
                </button>
            </form>

            {/* Other actions */}
            <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
                {onSwitchToRegister ? (
                    <>
                        {!inviteOnly && (
                            <p className="text-slate-400 text-xs text-center">
                                {t('no_account_prompt', { defaultValue: 'Não possui uma conta?' })}{' '}
                                <button
                                    onClick={onSwitchToRegister}
                                    className="text-teal-300 hover:text-teal-200 font-semibold transition-colors underline-offset-4 hover:underline"
                                >
                                    {t('create_account', { defaultValue: 'Criar conta' })}
                                </button>
                            </p>
                        )}
                        {onSwitchToInvite && (
                            <button
                                type="button"
                                onClick={onSwitchToInvite}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold transition-all active:scale-[0.98]"
                            >
                                <KeyRound className="w-3.5 h-3.5 text-teal-300" />
                                {t('register_with_invite', { defaultValue: 'Registrar com código de convite' })}
                            </button>
                        )}
                    </>
                ) : (
                    <p className="text-slate-500 text-xs text-center font-medium">
                        {policy?.message || t('registration_closed_hint', { defaultValue: 'Registro gerenciado pelo administrador.' })}
                    </p>
                )}
            </div>
        </div>
    );
}
