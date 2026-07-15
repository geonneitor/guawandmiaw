// Tokens de diseño basados en la nueva identidad Pastel
export const colors = {
  brand:     'var(--brand, #FFB7C5)',
  brandDark: 'var(--brand-dark, #FF9EAF)',
  danger:    'var(--status-error, #EF4444)',

  surface: {
    base:     'var(--bg-main, #FFF9FA)',
    card:     'var(--bg-card, #FFFFFF)',
    hover:    'var(--bg-hover, rgba(255,183,197,0.08))',
  },
  border: {
    subtle:   'var(--border-subtle, rgba(0,0,0,0.04))',
    accent:   'var(--border-accent, rgba(255,183,197,0.2))',
  },
  text: {
    primary:   'var(--text-main, #4A4A4A)',
    secondary: 'var(--text-muted, #8E8E8E)',
    inverse:   '#FFFFFF',
  },
  status: {
    success: 'var(--status-success, #10B981)',
    warning: 'var(--status-warning, #F59E0B)',
    error:   'var(--status-error, #EF4444)',
    info:    'var(--status-info, #3B82F6)',
  },
}

export const animations = {
  fast:   '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
}
