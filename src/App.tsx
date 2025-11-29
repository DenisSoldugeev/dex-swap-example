import {FC} from 'react';
import SimpleSwapForm from './features/Swap/SimpleSwapForm';
import TerminalLayout from './layout/TerminalLayout';

const App: FC = () => (
  <TerminalLayout>
    <SimpleSwapForm />
  </TerminalLayout>
);

export default App;
