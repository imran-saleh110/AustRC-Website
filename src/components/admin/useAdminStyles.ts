/**
 * useAdminStyles — shared design-token hook for all admin editors.
 * Follows the same pattern as useTokens() from CONTRIBUTING.md.
 * Since AdminPage forces `dark` mode, dark token values are always used.
 */
import { useTokens } from '@/tokens/useTokens';

export function useAdminStyles() {
  const t = useTokens();

  /* ── input helpers (use with onFocus/onBlur) ── */
  const inputBase: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    background: t.pageBgAlt,
    border: `1px solid ${t.borderDefault}`,
    borderRadius: 12,
    padding: '11px 16px',
    color: t.textPrimary,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.15s',
  };
  const inputFocus: React.CSSProperties = { borderColor: t.brandGreen };
  const inputBlur: React.CSSProperties  = { borderColor: t.borderDefault };

  return {
    t,

    /* ── page wrapper ── */
    page: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 24,
    },

    /* ── section card (wraps full editor body) ── */
    sectionCard: {
      background: t.surfaceCard,
      border: `1px solid ${t.borderDefault}`,
      borderRadius: 20,
      padding: '28px 28px',
    } as React.CSSProperties,

    /* ── list item card ── */
    card: {
      background: t.surfaceCard,
      border: `1px solid ${t.borderDefault}`,
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'space-between',
      transition: 'border-color 0.2s',
    } as React.CSSProperties,

    /* ── modal overlay ── */
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      background: t.surfaceOverlay,
      backdropFilter: 'blur(8px)',
    } as React.CSSProperties,

    /* ── modal dialog card ── */
    modal: {
      background: t.surfaceCardHover,
      border: `1px solid ${t.borderBrand}`,
      borderRadius: 20,
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto' as const,
      position: 'relative' as const,
      boxShadow: `0 0 60px rgba(46,204,113,0.06)`,
    } as React.CSSProperties,

    /* ── modal header ── */
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px',
      borderBottom: `1px solid ${t.borderDefault}`,
      position: 'sticky' as const,
      top: 0,
      background: t.surfaceCardHover,
      zIndex: 10,
    } as React.CSSProperties,

    /* ── modal body ── */
    modalBody: {
      padding: '24px 24px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 20,
    } as React.CSSProperties,

    /* ── section divider inside modal ── */
    divider: {
      borderTop: `1px solid ${t.borderSubtle}`,
      paddingTop: 20,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 16,
    } as React.CSSProperties,

    /* ── form input / textarea ── */
    inputBase,
    inputFocus,
    inputBlur,

    /* ── form label ── */
    label: {
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: t.textMutedMid,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      marginBottom: 6,
    } as React.CSSProperties,

    /* ── search bar wrapper ── */
    searchWrap: {
      position: 'relative' as const,
      maxWidth: 400,
    } as React.CSSProperties,

    /* ── card body ── */
    cardBody: {
      padding: '16px 16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 8,
      flex: 1,
    } as React.CSSProperties,

    /* ── card footer ── */
    cardFooter: {
      padding: '12px 16px',
      borderTop: `1px solid ${t.borderSubtle}`,
      display: 'flex',
      gap: 8,
    } as React.CSSProperties,

    /* ── tag / badge ── */
    tag: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 10px',
      background: 'rgba(46,204,113,0.08)',
      border: `1px solid rgba(46,204,113,0.2)`,
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 700,
      color: t.brandGreen,
    } as React.CSSProperties,

    /* ── empty state ── */
    empty: {
      textAlign: 'center' as const,
      padding: '56px 24px',
      border: `1px dashed ${t.borderDefault}`,
      borderRadius: 16,
      color: t.textMuted,
      fontSize: 14,
    } as React.CSSProperties,

    /* ── modal footer buttons row ── */
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: 10,
      paddingTop: 20,
      borderTop: `1px solid ${t.borderDefault}`,
    } as React.CSSProperties,

    /* ── primary button ── */
    btnPrimary: {
      background: `linear-gradient(135deg, ${t.brandGreen}, ${t.brandGreenDark})`,
      color: '#000',
      fontWeight: 700,
      fontSize: 14,
      border: 'none',
      borderRadius: 12,
      padding: '10px 24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      minWidth: 100,
      justifyContent: 'center',
    } as React.CSSProperties,

    /* ── ghost button ── */
    btnGhost: {
      background: 'transparent',
      color: t.textSecondary,
      fontWeight: 600,
      fontSize: 14,
      border: `1px solid ${t.borderDefault}`,
      borderRadius: 12,
      padding: '10px 20px',
      cursor: 'pointer',
    } as React.CSSProperties,

    /* ── danger button ── */
    btnDanger: {
      background: 'rgba(239,68,68,0.12)',
      color: '#f87171',
      fontWeight: 600,
      fontSize: 13,
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 10,
      padding: '8px 12px',
      cursor: 'pointer',
    } as React.CSSProperties,

    /* ── edit button ── */
    btnEdit: {
      background: 'transparent',
      color: t.textSecondary,
      fontWeight: 600,
      fontSize: 13,
      border: `1px solid ${t.borderDefault}`,
      borderRadius: 10,
      padding: '8px 12px',
      cursor: 'pointer',
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    } as React.CSSProperties,
  };
}
