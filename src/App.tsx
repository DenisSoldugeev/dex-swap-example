import type { FC } from 'react';
import TerminalLayout from './layout/TerminalLayout';
import SimpleSwapForm from './features/Swap/SimpleSwapForm';

const App: FC = () => (
  <TerminalLayout>
    <SimpleSwapForm />
  </TerminalLayout>
);

export default App;
