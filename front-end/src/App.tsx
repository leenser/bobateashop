import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CustomerInterface } from './pages/CustomerInterface';
import { CashierInterface } from './pages/CashierInterface';
import { ManagerInterface } from './pages/ManagerInterface';
import { AdminButton } from './components/AdminButton';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer/Self service interface is the default */}
        <Route path="/" element={<CustomerInterface />} />
        <Route path="/customer" element={<CustomerInterface />} />
        {/* Admin views no protection needed for development -> Make sure to add passcode next spring - LS*/}
        <Route path="/cashier" element={<CashierInterface />} />
        <Route path="/manager" element={<ManagerInterface />} />
      </Routes>
      {/* Admin button always visible in bottom left */}
      <AdminButton />
    </BrowserRouter>
  );
}

export default App;
