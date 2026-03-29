import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={2500}
      toastOptions={{
        style: {
          background: 'rgba(36, 43, 61, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid #333A4D',
          borderRadius: '12px',
          padding: '12px 20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: '#F0EDE8',
          fontFamily: "'Plus Jakarta Sans', 'SUIT', sans-serif",
          fontSize: '14px',
        },
        classNames: {
          toast: "group toast",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!border-[rgba(138,154,123,0.4)]",
          error: "!border-[rgba(232,168,124,0.4)]",
        },
      }}
      icons={{
        success: <span style={{ color: '#C9A96E', fontSize: '16px', marginRight: '4px' }}>✓</span>,
        error: <span style={{ color: '#E8A87C', fontSize: '16px', marginRight: '4px' }}>⚠</span>,
        info: <span style={{ color: '#87CEEB', fontSize: '16px', marginRight: '4px' }}>ℹ</span>,
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
