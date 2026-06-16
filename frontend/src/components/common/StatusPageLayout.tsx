import MainLayout from '../../layouts/MainLayout';
import Button from './Button';

interface StatusPageLayoutProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  actionClassName?: string;
}

const StatusPageLayout = ({
  imageSrc,
  imageAlt,
  title,
  description,
  actionLabel,
  onAction,
  actionClassName = 'px-8 py-2.5 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white border-neutral-800 hover:border-neutral-700 transition-all',
}: StatusPageLayoutProps) => (
  <MainLayout>
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-6 relative z-10 text-center">
      <div className="max-w-[400px] space-y-6 animate-reveal">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full max-w-[280px] mx-auto opacity-85 object-contain animate-glitch"
        />
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-neutral-500 font-medium leading-relaxed">{description}</p>
          )}
        </div>
        <div>
          <Button variant="outline" onClick={onAction} className={actionClassName}>
            {actionLabel}
          </Button>
        </div>
      </div>
    </div>
  </MainLayout>
);

export default StatusPageLayout;
