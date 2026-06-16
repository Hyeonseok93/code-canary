import { Unlock } from 'lucide-react';
import Button from '../common/Button';

interface StuckJobReleaseButtonProps {
  visible: boolean;
  isReleasing: boolean;
  onRelease: () => void;
}

const StuckJobReleaseButton = ({
  visible,
  isReleasing,
  onRelease,
}: StuckJobReleaseButtonProps) => {
  if (!visible) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onRelease}
      disabled={isReleasing}
      className="gap-2 py-2.5 px-4 text-[10px] font-black uppercase tracking-[0.14em] border-red-500/30 text-red-200 hover:border-red-400/50 hover:text-red-100"
    >
      <Unlock size={14} />
      {isReleasing ? 'Releasing…' : 'Release stuck job'}
    </Button>
  );
};

export default StuckJobReleaseButton;
