declare module 'lucide-react/icons/*' {
  import { LucideProps } from 'lucide-react';
  import { ReactElement } from 'react';
  interface LucideIcon {
    (props: LucideProps): ReactElement | null;
    displayName?: string;
  }
  const Icon: LucideIcon;
  export default Icon;
}
